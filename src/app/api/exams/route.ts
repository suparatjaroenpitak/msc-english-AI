import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { generateExamQuestions } from "@/lib/exam-generator";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const examSchema = z.object({ category: z.enum(["CEFR", "TOEIC", "GOVERNMENT_EXAM", "TEACHER_ASSISTANT", "GRAMMAR", "VOCABULARY", "READING"]).default("CEFR"), level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).default("A1"), mode: z.enum(["PRACTICE", "EXAM"]).default("PRACTICE"), questionCount: z.number().int().min(1).max(20).default(5) });

function publicExam(exam: { id: string; title: string; category: string; level: string; mode: string; questionCount: number; timeLimitSeconds: number | null; questions: Array<{ id: string; order: number; prompt: string; options: unknown }> }) {
  return { id: exam.id, title: exam.title, category: exam.category, level: exam.level, mode: exam.mode, questionCount: exam.questionCount, timeLimitSeconds: exam.timeLimitSeconds, questions: exam.questions.map(({ id, order, prompt, options }) => ({ id, order, prompt, options })) };
}

export async function GET() {
  let session;
  try { session = await getServerSession(authOptions); } catch { return NextResponse.json({ error: "ระบบเข้าสู่ระบบยังตั้งค่าไม่ครบ" }, { status: 503 }); }
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนทำข้อสอบ" }, { status: 401 });
  const exams = await prisma.exam.findMany({ where: { status: "READY", OR: [{ userId: null }, { userId: session.user.id }] }, include: { questions: { orderBy: { order: "asc" }, select: { id: true, order: true, prompt: true, options: true } } }, orderBy: { createdAt: "desc" }, take: 10 });
  return NextResponse.json({ exams: exams.map(publicExam) });
}

export async function POST(request: Request) {
  let session;
  try { session = await getServerSession(authOptions); } catch { return NextResponse.json({ error: "ระบบเข้าสู่ระบบยังตั้งค่าไม่ครบ" }, { status: 503 }); }
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนสร้างข้อสอบ" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { body = {}; }
  const parsed = examSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "รูปแบบข้อสอบไม่ถูกต้อง" }, { status: 400 });
  const { category, level, mode, questionCount } = parsed.data;
  const { questions } = await generateExamQuestions({ category, level, count: questionCount });
  const exam = await prisma.exam.create({ data: { userId: session.user.id, title: `${category} ${level} Practice`, category, level, mode, questionCount, timeLimitSeconds: mode === "EXAM" ? questionCount * 90 : null, questions: { create: questions.map((question, index) => ({ order: index + 1, prompt: question.prompt, options: question.options, correctOption: question.correctOption, explanations: question.explanations })) } }, include: { questions: { orderBy: { order: "asc" }, select: { id: true, order: true, prompt: true, options: true } } } });
  return NextResponse.json({ exam: publicExam(exam) }, { status: 201 });
}
