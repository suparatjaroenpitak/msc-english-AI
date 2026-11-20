import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { put } from "@vercel/blob";
import { authOptions } from "@/lib/auth";
import { getGroqClient } from "@/lib/groq";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["audio/webm", "audio/ogg", "audio/wav", "audio/mpeg", "audio/mp4"]);

export async function POST(request: Request) {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch {
    return NextResponse.json({ error: "ระบบเข้าสู่ระบบยังตั้งค่าไม่ครบ" }, { status: 503 });
  }
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนอัดเสียง" }, { status: 401 });

  const form = await request.formData();
  const audio = form.get("audio");
  if (!(audio instanceof File)) return NextResponse.json({ error: "ไม่พบไฟล์เสียง" }, { status: 400 });
  if (audio.size === 0 || audio.size > MAX_AUDIO_BYTES) return NextResponse.json({ error: "ไฟล์เสียงต้องมีขนาดไม่เกิน 8 MB" }, { status: 413 });
  if (!ALLOWED_TYPES.has(audio.type)) return NextResponse.json({ error: "ชนิดไฟล์เสียงไม่รองรับ" }, { status: 415 });

  const groq = getGroqClient();
  if (!groq) return NextResponse.json({ error: "AI ยังไม่ได้ตั้งค่า GROQ_API_KEY" }, { status: 503 });
  const requestId = randomUUID();
  try {
    const result = await groq.audio.transcriptions.create({
      file: audio,
      model: process.env.GROQ_STT_MODEL || "whisper-large-v3-turbo",
      response_format: "json",
      language: "en",
    });
    const text = result.text.trim();
    let audioBlobPath: string | undefined;
    if (process.env.BLOB_READ_WRITE_TOKEN && process.env.BLOB_READ_WRITE_TOKEN !== "replace_me") {
      const blob = await put(`audio/${session.user.id}/${requestId}.webm`, audio, { access: "private", addRandomSuffix: false });
      audioBlobPath = blob.pathname;
    }
    await prisma.speakingSession.create({
      data: { userId: session.user.id, scenario: "Push-to-talk practice", transcript: text, audioBlobPath },
    });
    await prisma.aPIUsageLog.create({ data: { userId: session.user.id, provider: "groq", model: process.env.GROQ_STT_MODEL || "whisper-large-v3-turbo", endpoint: "/api/voice/transcribe", requestId, statusCode: 200 } });
    return NextResponse.json({ text, requestId, storedInBlob: Boolean(audioBlobPath) });
  } catch (error) {
    console.error("Whisper transcription failed", { requestId, error: error instanceof Error ? error.message : "unknown" });
    await prisma.aPIUsageLog.create({ data: { userId: session.user.id, provider: "groq", model: process.env.GROQ_STT_MODEL || "whisper-large-v3-turbo", endpoint: "/api/voice/transcribe", requestId, statusCode: 502, errorCode: "GROQ_STT_FAILED" } }).catch(() => undefined);
    return NextResponse.json({ error: "ไม่สามารถถอดเสียงได้ กรุณาลองใหม่อีกครั้ง" }, { status: 502 });
  }
}
