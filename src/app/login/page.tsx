import Link from "next/link";
import { isGoogleConfigured } from "@/lib/auth";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function LoginPage({ searchParams }: { searchParams?: { callbackUrl?: string } }) {
  const callbackUrl = searchParams?.callbackUrl?.startsWith("/") ? searchParams.callbackUrl : "/dashboard";
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-12">
      <Card className="w-full">
        <CardHeader><Link className="mb-4 text-sm font-semibold text-primary" href="/">← กลับหน้าหลัก</Link><CardTitle>ยินดีต้อนรับกลับ</CardTitle><CardDescription>เข้าสู่ AI English Tutor Academy ด้วยบัญชี Google ของคุณ</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          {isGoogleConfigured ? <GoogleSignInButton callbackUrl={callbackUrl} /> : <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-7">ยังไม่ได้ตั้งค่า Google OAuth กรุณาเพิ่ม AUTH_GOOGLE_ID และ AUTH_GOOGLE_SECRET ในไฟล์ .env.local ตามคู่มือ Phase 04</div>}
          <p className="text-center text-xs leading-6 text-muted-foreground">เมื่อเข้าสู่ระบบ คุณยอมรับการเก็บประวัติการเรียนเพื่อปรับบทเรียนให้เหมาะกับคุณ</p>
        </CardContent>
      </Card>
    </main>
  );
}
