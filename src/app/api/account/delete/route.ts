import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function DELETE(request: Request) {
  let session;
  try { session = await getServerSession(authOptions); } catch { return NextResponse.json({ error: "ระบบเข้าสู่ระบบยังตั้งค่าไม่ครบ" }, { status: 503 }); }
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "ต้องส่งคำยืนยัน" }, { status: 400 }); }
  const parsed = z.object({ confirmation: z.literal("DELETE_MY_ACCOUNT") }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "คำยืนยันไม่ถูกต้อง" }, { status: 400 });
  await prisma.user.delete({ where: { id: session.user.id } });
  return NextResponse.json({ ok: true });
}
