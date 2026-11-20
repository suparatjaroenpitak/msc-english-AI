import Link from "next/link";
import { requireSession } from "@/lib/auth-guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export default async function PrivacyPage() { await requireSession("/settings/privacy"); return <main className="mx-auto max-w-2xl px-5 py-12"><Link className="text-sm font-bold" href="/dashboard">← Dashboard</Link><Card className="mt-8"><CardHeader><CardTitle>Privacy & data</CardTitle><CardDescription>ข้อมูลการเรียนเป็นข้อมูลของคุณและแยกตามบัญชี</CardDescription></CardHeader><CardContent className="space-y-4 text-sm leading-7"><p>คุณสามารถขอให้ลบบัญชีและข้อมูลการเรียนผ่าน API ฝั่ง server หลังยืนยันคำว่า DELETE_MY_ACCOUNT การลบเป็นแบบถาวรและข้อมูลที่ cascade แล้วกู้คืนไม่ได้</p><p className="text-muted-foreground">การจัดการปุ่มยืนยันใน UI จะเพิ่มก่อน production release ควรให้ผู้ใช้ยืนยันอีกครั้งและส่งอีเมลแจ้งผลตามนโยบายองค์กร</p></CardContent></Card></main>; }
