import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const onboardingSchema = z.object({
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  dailyStudyMinutes: z.number().int().min(5).max(240),
  teacherName: z.string().trim().min(1).max(40),
  personality: z.string().trim().min(1).max(40),
  accent: z.enum(["AMERICAN", "BRITISH"]),
  explanationMode: z.enum(["ENGLISH_ONLY", "ENGLISH_THAI"]),
});

export async function POST(request: Request) {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.error("Auth configuration is unavailable", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "ระบบเข้าสู่ระบบยังตั้งค่าไม่ครบ" }, { status: 503 });
  }
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ข้อมูลคำขอไม่ใช่ JSON ที่ถูกต้อง" }, { status: 400 });
  }

  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูล onboarding ไม่ถูกต้อง", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { level, dailyStudyMinutes, teacherName, personality, accent, explanationMode } = parsed.data;
  await prisma.$transaction([
    prisma.learningProfile.upsert({
      where: { userId: session.user.id },
      update: { level, dailyStudyMinutes, onboardingCompleted: true },
      create: { userId: session.user.id, level, dailyStudyMinutes, onboardingCompleted: true },
    }),
    prisma.teacherPreference.upsert({
      where: { userId: session.user.id },
      update: { teacherName, personality, accent, explanationMode },
      create: { userId: session.user.id, teacherName, personality, accent, explanationMode },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
