import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getGroqClient, getGroqModel } from "@/lib/groq";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({ text: z.string().trim().min(1).max(2000) });
const responseSchema = z.object({
  correctedSentence: z.string(),
  explanationTh: z.string(),
  naturalExpression: z.string(),
  mistakes: z.array(z.object({ topic: z.string(), original: z.string(), correction: z.string(), explanation: z.string() })).default([]),
});

export async function POST(request: Request) {
  let session;
  try { session = await getServerSession(authOptions); } catch { return NextResponse.json({ error: "ระบบเข้าสู่ระบบยังตั้งค่าไม่ครบ" }, { status: 503 }); }
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนตรวจ Grammar" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "ข้อมูล JSON ไม่ถูกต้อง" }, { status: 400 }); }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "ข้อความต้องมีความยาว 1–2,000 ตัวอักษร" }, { status: 400 });
  const groq = getGroqClient();
  if (!groq) return NextResponse.json({ error: "AI ยังไม่ได้ตั้งค่า GROQ_API_KEY" }, { status: 503 });
  const requestId = randomUUID();
  try {
    const completion = await groq.chat.completions.create({
      model: getGroqModel("standard"),
      temperature: 0.1,
      max_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a grammar tutor for Thai learners. Return only valid JSON with keys correctedSentence, explanationTh, naturalExpression, mistakes. mistakes is an array of topic, original, correction, explanation. Be accurate and concise. Do not invent errors." },
        { role: "user", content: parsed.data.text },
      ],
    });
    const raw = completion.choices[0]?.message?.content ?? "{}";
    const result = responseSchema.parse(JSON.parse(raw));
    if (result.mistakes.length) {
      await prisma.$transaction(result.mistakes.map((mistake) => prisma.grammarMistake.create({ data: { userId: session.user.id, topic: mistake.topic, sourceText: mistake.original, correctedText: mistake.correction, explanationTh: mistake.explanation } })));
    }
    await prisma.aPIUsageLog.create({ data: { userId: session.user.id, model: getGroqModel("standard"), endpoint: "/api/ai/correct-grammar", requestId, statusCode: 200 } });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Grammar correction failed", { requestId, error: error instanceof Error ? error.message : "unknown" });
    await prisma.aPIUsageLog.create({ data: { userId: session.user.id, model: getGroqModel("standard"), endpoint: "/api/ai/correct-grammar", requestId, statusCode: 502, errorCode: "GRAMMAR_AI_FAILED" } }).catch(() => undefined);
    return NextResponse.json({ error: "ตรวจ Grammar ไม่สำเร็จ กรุณาลองใหม่" }, { status: 502 });
  }
}
