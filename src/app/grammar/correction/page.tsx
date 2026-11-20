import Link from "next/link";
import { requireSession } from "@/lib/auth-guard";
import { GrammarCorrectionForm } from "@/components/grammar-correction-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export default async function GrammarCorrectionPage() { await requireSession("/grammar/correction"); return <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8"><Link className="text-sm font-bold" href="/dashboard">← Dashboard</Link><Card className="mt-8"><CardHeader><CardTitle>Grammar Coach</CardTitle><CardDescription>ส่งประโยคให้ AI แก้ไข พร้อมคำอธิบายภาษาไทย</CardDescription></CardHeader><CardContent><GrammarCorrectionForm /></CardContent></Card></main>; }
