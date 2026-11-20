import Link from "next/link";
import { requireSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { AiChatPanel } from "@/components/ai-chat-panel";

export const dynamic = "force-dynamic";

export default async function TeacherPage() {
  const session = await requireSession("/teacher");
  const preference = await prisma.teacherPreference.findUnique({ where: { userId: session.user.id } });
  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
      <header className="mb-6 flex items-center justify-between gap-4"><Link className="text-sm font-bold" href="/dashboard">← Dashboard</Link><span className="text-xs text-muted-foreground">Text chat · Groq</span></header>
      <AiChatPanel teacherName={preference?.teacherName ?? "Alex"} />
    </main>
  );
}
