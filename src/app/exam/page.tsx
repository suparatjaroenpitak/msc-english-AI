import Link from "next/link";
import { requireSession } from "@/lib/auth-guard";
import { ExamClient } from "@/components/exam-client";

export const dynamic = "force-dynamic";
export default async function ExamPage() { await requireSession("/exam"); return <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8"><Link className="text-sm font-bold" href="/dashboard">← Dashboard</Link><div className="my-8"><p className="mb-2 text-xs font-semibold tracking-[0.18em] text-primary">AI EXAM</p><h1 className="text-3xl font-bold">แบบทดสอบ CEFR</h1><p className="mt-2 text-muted-foreground">ตอบคำถาม แล้วระบบจะตรวจคะแนนและอธิบายเฉลยฝั่ง server</p></div><ExamClient /></main>; }
