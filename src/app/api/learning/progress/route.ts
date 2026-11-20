import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let session;
  try { session = await getServerSession(authOptions); } catch { return NextResponse.json({ error: "ระบบเข้าสู่ระบบยังตั้งค่าไม่ครบ" }, { status: 503 }); }
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนดูความก้าวหน้า" }, { status: 401 });
  const userId = session.user.id;
  const [profile, lessonsCompleted, vocabularyCount, grammarMistakes, examAttempts, daily] = await Promise.all([
    prisma.learningProfile.findUnique({ where: { userId } }),
    prisma.lessonProgress.count({ where: { userId, status: "COMPLETED" } }),
    prisma.userVocabulary.count({ where: { userId } }),
    prisma.grammarMistake.count({ where: { userId, resolvedAt: null } }),
    prisma.examAttempt.findMany({ where: { userId, submittedAt: { not: null } }, orderBy: { submittedAt: "desc" }, take: 10, select: { score: true, total: true, submittedAt: true } }),
    prisma.dailyLearningProgress.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 14 }),
  ]);
  return NextResponse.json({ profile, lessonsCompleted, vocabularyCount, grammarMistakes, examAttempts, daily });
}
