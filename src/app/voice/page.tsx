import Link from "next/link";
import { requireSession } from "@/lib/auth-guard";
import { VoiceRecorder } from "@/components/voice-recorder";

export const dynamic = "force-dynamic";

export default async function VoicePage() {
  await requireSession("/voice");
  return <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8"><header className="mb-8 flex items-center justify-between"><Link className="text-sm font-bold" href="/dashboard">← Dashboard</Link><span className="text-xs text-muted-foreground">Push-to-Talk · Whisper</span></header><div className="mb-6"><p className="mb-2 text-xs font-semibold tracking-[0.18em] text-primary">SPEAKING PRACTICE</p><h1 className="text-3xl font-bold">ฝึกพูดกับไมโครโฟน</h1><p className="mt-2 text-muted-foreground">พูดภาษาอังกฤษสั้น ๆ แล้วให้ Whisper ถอดเสียงเพื่อใช้ฝึกต่อ</p></div><VoiceRecorder /></main>;
}
