import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scoreExam } from "@/lib/exam-scoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const submissionSchema = z.object({ examId: z.string().cuid(), answers: z.array(z.object({ questionId: z.string().cuid(), selectedOption: z.number().int().min(0).max(3).nullable() })).max(50) });

export async function POST(request: Request) {
  let session;
  try { session = await getServerSession(authOptions); } catch { return NextResponse.json({ error: "ระบบเข้าสู่ระบบยังตั้งค่าไม่ครบ" }, { status: 503 }); }
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนส่งข้อสอบ" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "ข้อมูล JSON ไม่ถูกต้อง" }, { status: 400 }); }
  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "คำตอบข้อสอบไม่ถูกต้อง" }, { status: 400 });
  const exam = await prisma.exam.findFirst({ where: { id: parsed.data.examId, OR: [{ userId: null }, { userId: session.user.id }], status: "READY" }, include: { questions: { orderBy: { order: "asc" } } } });
  if (!exam) return NextResponse.json({ error: "ไม่พบข้อสอบนี้" }, { status: 404 });
  const validAnswers = parsed.data.answers.filter((answer) => exam.questions.some((question) => question.id === answer.questionId));
  const score = scoreExam(exam.questions, validAnswers);
  const attempt = await prisma.examAttempt.create({ data: { userId: session.user.id, examId: exam.id, score: score.correct, total: score.total, submittedAt: new Date(), answers: { create: validAnswers.map((answer) => ({ questionId: answer.questionId, selectedOption: answer.selectedOption, isCorrect: exam.questions.find((question) => question.id === answer.questionId)?.correctOption === answer.selectedOption })) } } });
  return NextResponse.json({ attemptId: attempt.id, score, explanations: exam.questions.map((question) => ({ questionId: question.id, correctOption: question.correctOption, explanations: question.explanations })) });
}
