import Link from "next/link";
import { requireSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireSession();
  const [profile, completedLessons, vocabularyCount] = await Promise.all([
    prisma.learningProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.lessonProgress.count({ where: { userId: session.user.id, status: "COMPLETED" } }),
    prisma.userVocabulary.count({ where: { userId: session.user.id } }),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <header className="mb-10 flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center"><div><Link className="text-sm font-bold" href="/">AI English Tutor Academy</Link><p className="mt-2 text-sm text-muted-foreground">สวัสดี {session.user.name ?? "ผู้เรียน"}</p></div><SignOutButton /></header>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-semibold tracking-[0.18em] text-primary">YOUR PROGRESS</p><h1 className="text-3xl font-bold">แดชบอร์ดการเรียน</h1></div><Badge variant="secondary">ระดับ {profile?.level ?? "A1"}</Badge></div>
      <div className="grid gap-5 sm:grid-cols-3"><Card><CardHeader><CardDescription>Learning streak</CardDescription><CardTitle>{profile?.learningStreak ?? 0} วัน</CardTitle></CardHeader></Card><Card><CardHeader><CardDescription>บทเรียนที่เรียนจบ</CardDescription><CardTitle>{completedLessons}</CardTitle></CardHeader></Card><Card><CardHeader><CardDescription>คำศัพท์ในคลัง</CardDescription><CardTitle>{vocabularyCount}</CardTitle></CardHeader></Card></div>
      <Card className="mt-5"><CardHeader><CardTitle>พร้อมเริ่มหรือยัง?</CardTitle><CardDescription>คุยกับครู AI ฝึกเสียง หรือติดตามความก้าวหน้าของคุณ</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-3"><Button asChild><Link href="/teacher">คุยกับครู AI</Link></Button><Button variant="outline" asChild><Link href="/voice">ฝึกพูด</Link></Button><Button variant="outline" asChild><Link href="/progress">ดูความก้าวหน้า</Link></Button><Button variant="ghost" asChild><Link href="/onboarding">แก้ไขเป้าหมาย</Link></Button></CardContent></Card>
    </main>
  );
}
