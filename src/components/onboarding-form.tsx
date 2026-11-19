"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const levels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
const accents = [
  { value: "AMERICAN", label: "American English" },
  { value: "BRITISH", label: "British English" },
] as const;

type OnboardingValues = {
  level: (typeof levels)[number];
  dailyStudyMinutes: number;
  teacherName: string;
  personality: string;
  accent: (typeof accents)[number]["value"];
  explanationMode: "ENGLISH_ONLY" | "ENGLISH_THAI";
};

export function OnboardingForm({ initialValues }: { initialValues: OnboardingValues }) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update<K extends keyof OnboardingValues>(key: K, value: OnboardingValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "บันทึกข้อมูลไม่สำเร็จ");
      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "บันทึกข้อมูลไม่สำเร็จ");
      setSaving(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="level">ระดับปัจจุบัน</label>
        <select id="level" value={values.level} onChange={(event) => update("level", event.target.value as OnboardingValues["level"])} className="h-11 w-full rounded-md border bg-background px-3 text-sm">
          {levels.map((level) => <option value={level} key={level}>{level}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="minutes">เวลาเรียนต่อวัน (นาที)</label>
        <input id="minutes" type="number" min={5} max={240} step={5} value={values.dailyStudyMinutes} onChange={(event) => update("dailyStudyMinutes", Number(event.target.value))} className="h-11 w-full rounded-md border bg-background px-3 text-sm" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="teacherName">ชื่อครู AI</label>
        <input id="teacherName" value={values.teacherName} maxLength={40} onChange={(event) => update("teacherName", event.target.value)} className="h-11 w-full rounded-md border bg-background px-3 text-sm" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="personality">บุคลิกครู</label>
        <select id="personality" value={values.personality} onChange={(event) => update("personality", event.target.value)} className="h-11 w-full rounded-md border bg-background px-3 text-sm">
          <option value="encouraging">ให้กำลังใจ</option>
          <option value="professional">มืออาชีพ</option>
          <option value="friendly">เป็นกันเอง</option>
        </select>
      </div>
      <fieldset><legend className="mb-2 text-sm font-medium">สำเนียง</legend><div className="grid gap-2 sm:grid-cols-2">{accents.map((accent) => <label key={accent.value} className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm"><input type="radio" name="accent" checked={values.accent === accent.value} onChange={() => update("accent", accent.value)} />{accent.label}</label>)}</div></fieldset>
      <fieldset><legend className="mb-2 text-sm font-medium">คำอธิบาย</legend><div className="grid gap-2 sm:grid-cols-2"><label className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm"><input type="radio" name="explanationMode" checked={values.explanationMode === "ENGLISH_THAI"} onChange={() => update("explanationMode", "ENGLISH_THAI")} />English + ไทย</label><label className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm"><input type="radio" name="explanationMode" checked={values.explanationMode === "ENGLISH_ONLY"} onChange={() => update("explanationMode", "ENGLISH_ONLY")} />English only</label></div></fieldset>
      {error ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={saving}>{saving ? "กำลังบันทึก…" : "เริ่มเส้นทางการเรียน"}</Button>
    </form>
  );
}
