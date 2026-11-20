import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type Groq from "groq-sdk";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { buildTeacherSystemPrompt } from "@/lib/ai-prompts";
import { getGroqClient, getGroqModel } from "@/lib/groq";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const chatSchema = z.object({
  conversationId: z.string().cuid().optional(),
  message: z.string().trim().min(1, "ข้อความว่างไม่ได้").max(4000, "ข้อความยาวเกิน 4,000 ตัวอักษร"),
  model: z.enum(["standard", "advanced"]).default("standard"),
});

function errorResponse(message: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ error: message }, { status, headers });
}

export async function POST(request: Request) {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.error("Auth configuration is unavailable", error instanceof Error ? error.message : "unknown");
    return errorResponse("ระบบเข้าสู่ระบบยังตั้งค่าไม่ครบ กรุณาตั้งค่า AUTH_SECRET ก่อน", 503);
  }
  if (!session?.user?.id) return errorResponse("กรุณาเข้าสู่ระบบก่อนเริ่มสนทนา", 401);

  const rate = consumeRateLimit(`ai-chat:${session.user.id}`);
  if (!rate.allowed) {
    return errorResponse("ใช้คำขอครบชั่วคราวแล้ว กรุณารอสักครู่แล้วลองใหม่", 429, { "Retry-After": String(rate.retryAfterSeconds) });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("ข้อมูลคำขอไม่ใช่ JSON ที่ถูกต้อง", 400);
  }
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) return errorResponse("ข้อความสนทนาไม่ถูกต้อง", 400);

  const requestId = randomUUID();
  const { conversationId, message, model: modelVariant } = parsed.data;
  const conversation = conversationId
    ? await prisma.conversation.findFirst({ where: { id: conversationId, userId: session.user.id } })
    : await prisma.conversation.create({ data: { userId: session.user.id, mode: "TEXT" } });
  if (!conversation) return errorResponse("ไม่พบห้องสนทนานี้", 404);

  await prisma.chatMessage.create({ data: { conversationId: conversation.id, role: "USER", content: message } });

  const [profile, preference, history] = await Promise.all([
    prisma.learningProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.teacherPreference.findUnique({ where: { userId: session.user.id } }),
    prisma.chatMessage.findMany({ where: { conversationId: conversation.id }, orderBy: { createdAt: "desc" }, take: 12 }),
  ]);
  const groq = getGroqClient();
  if (!groq) {
    await prisma.aPIUsageLog.create({ data: { userId: session.user.id, model: getGroqModel(modelVariant), endpoint: "/api/ai/chat", requestId, statusCode: 503, errorCode: "GROQ_NOT_CONFIGURED" } });
    return errorResponse("AI ยังไม่ได้ตั้งค่า GROQ_API_KEY กรุณาเพิ่มค่าใน .env.local", 503);
  }

  const systemPrompt = buildTeacherSystemPrompt({
    level: profile?.level ?? "A1",
    teacherName: preference?.teacherName ?? "Alex",
    personality: preference?.personality ?? "encouraging",
    accent: preference?.accent ?? "AMERICAN",
    explanationMode: preference?.explanationMode ?? "ENGLISH_THAI",
    weakTopics: profile?.weakTopics ?? [],
  });
  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...history.reverse().map((item) => ({
      role: item.role === "ASSISTANT" ? "assistant" as const : item.role === "SYSTEM" ? "system" as const : "user" as const,
      content: item.content,
    })),
  ];

  let completion: Awaited<ReturnType<Groq["chat"]["completions"]["create"]>>;
  try {
    completion = await groq.chat.completions.create({
      model: getGroqModel(modelVariant),
      messages,
      temperature: 0.4,
      max_tokens: 700,
      stream: true,
    });
  } catch (error) {
    console.error("Groq request failed", { requestId, error: error instanceof Error ? error.message : "unknown" });
    const providerStatus = typeof error === "object" && error !== null && "status" in error ? Number(error.status) : 0;
    const status = providerStatus === 429 ? 429 : 502;
    const errorCode = providerStatus === 429 ? "GROQ_RATE_LIMITED" : "GROQ_REQUEST_FAILED";
    await prisma.aPIUsageLog.create({ data: { userId: session.user.id, model: getGroqModel(modelVariant), endpoint: "/api/ai/chat", requestId, statusCode: status, errorCode } });
    return errorResponse(
      providerStatus === 429
        ? "AI ใช้โควตาชั่วคราวครบแล้ว ข้อความของคุณถูกเก็บไว้ กรุณารอสักครู่แล้วลองใหม่"
        : "AI ยังตอบไม่ได้ในขณะนี้ ข้อความของคุณถูกเก็บไว้แล้ว กรุณาลองใหม่อีกครั้ง",
      status,
      providerStatus === 429 ? { "Retry-After": "30" } : undefined,
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let answer = "";
      try {
        for await (const chunk of completion as AsyncIterable<{ choices?: Array<{ delta?: { content?: string | null } }> }>) {
          const delta = chunk.choices?.[0]?.delta?.content ?? "";
          if (delta) {
            answer += delta;
            controller.enqueue(encoder.encode(delta));
          }
        }
        if (answer) await prisma.chatMessage.create({ data: { conversationId: conversation.id, role: "ASSISTANT", content: answer } });
        await prisma.aPIUsageLog.create({ data: { userId: session.user.id, model: getGroqModel(modelVariant), endpoint: "/api/ai/chat", requestId, statusCode: 200 } });
        controller.close();
      } catch (error) {
        console.error("Groq stream failed", { requestId, error: error instanceof Error ? error.message : "unknown" });
        await prisma.aPIUsageLog.create({ data: { userId: session.user.id, model: getGroqModel(modelVariant), endpoint: "/api/ai/chat", requestId, statusCode: 502, errorCode: "GROQ_STREAM_FAILED" } }).catch(() => undefined);
        controller.error(new Error("AI stream failed"));
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      "X-Conversation-Id": conversation.id,
      "X-RateLimit-Remaining": String(rate.remaining),
    },
  });
}
