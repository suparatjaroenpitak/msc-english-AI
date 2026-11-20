import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let session;
  try { session = await getServerSession(authOptions); } catch { return NextResponse.json({ error: "ระบบเข้าสู่ระบบยังตั้งค่าไม่ครบ" }, { status: 503 }); }
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนเปิดคลังคำศัพท์" }, { status: 401 });
  const items = await prisma.userVocabulary.findMany({ where: { userId: session.user.id }, include: { vocabulary: true }, orderBy: { dueAt: "asc" }, take: 100 });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  let session;
  try { session = await getServerSession(authOptions); } catch { return NextResponse.json({ error: "ระบบเข้าสู่ระบบยังตั้งค่าไม่ครบ" }, { status: 503 }); }
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนบันทึกคำศัพท์" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "ข้อมูล JSON ไม่ถูกต้อง" }, { status: 400 }); }
  const parsed = z.object({ vocabularyId: z.string().cuid() }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "ต้องระบุ vocabularyId ที่ถูกต้อง" }, { status: 400 });
  const vocabulary = await prisma.vocabulary.findUnique({ where: { id: parsed.data.vocabularyId } });
  if (!vocabulary) return NextResponse.json({ error: "ไม่พบคำศัพท์นี้" }, { status: 404 });
  const item = await prisma.userVocabulary.upsert({ where: { userId_vocabularyId: { userId: session.user.id, vocabularyId: vocabulary.id } }, update: {}, create: { userId: session.user.id, vocabularyId: vocabulary.id } });
  return NextResponse.json({ item }, { status: 201 });
}
