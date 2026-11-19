import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { OnboardingForm } from "@/components/onboarding-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await requireSession("/onboarding");
  const profile = await prisma.learningProfile.findUnique({ where: { userId: session.user.id } });
  const preference = await prisma.teacherPreference.findUnique({ where: { userId: session.user.id } });
  if (profile?.onboardingCompleted) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <Card><CardHeader><CardTitle>เริ่มต้นเส้นทางของคุณ</CardTitle><CardDescription>ตั้งค่าพื้นฐานเพื่อให้ครู AI ปรับบทเรียนได้เหมาะกับคุณ</CardDescription></CardHeader><CardContent><OnboardingForm initialValues={{ level: profile?.level ?? "A1", dailyStudyMinutes: profile?.dailyStudyMinutes ?? 15, teacherName: preference?.teacherName ?? "Alex", personality: preference?.personality ?? "encouraging", accent: preference?.accent ?? "AMERICAN", explanationMode: preference?.explanationMode ?? "ENGLISH_THAI" }} /></CardContent></Card>
    </main>
  );
}
