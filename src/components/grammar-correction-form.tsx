"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Result = { correctedSentence: string; explanationTh: string; naturalExpression: string; mistakes: Array<{ topic: string; original: string; correction: string; explanation: string }> };

export function GrammarCorrectionForm() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError(""); setResult(null);
    try { const response = await fetch("/api/ai/correct-grammar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error); setResult(body); } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "เกิดข้อผิดพลาด"); } finally { setLoading(false); }
  }
  return <div className="space-y-5"><form onSubmit={submit} className="space-y-3"><label className="text-sm font-medium" htmlFor="grammar-text">ประโยคภาษาอังกฤษ</label><textarea id="grammar-text" value={text} onChange={(event) => setText(event.target.value)} maxLength={2000} rows={5} placeholder="I go to work yesterday." className="w-full rounded-md border bg-background p-3 text-sm leading-7" /><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{text.length}/2,000</span><Button type="submit" disabled={loading || !text.trim()}>{loading ? "กำลังวิเคราะห์…" : "ตรวจ Grammar"}</Button></div></form>{error ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}{result ? <div className="space-y-4 rounded-md bg-secondary/50 p-4 text-sm leading-7"><div><p className="text-xs font-semibold text-primary">CORRECT SENTENCE</p><p className="font-medium">{result.correctedSentence}</p></div><div><p className="text-xs font-semibold text-primary">คำอธิบายภาษาไทย</p><p>{result.explanationTh}</p></div><div><p className="text-xs font-semibold text-primary">NATURAL EXPRESSION</p><p>{result.naturalExpression}</p></div>{result.mistakes.map((mistake, index) => <div key={`${mistake.topic}-${index}`} className="border-t pt-3"><p className="font-medium">{mistake.topic}</p><p>เดิม: {mistake.original}</p><p>แก้เป็น: {mistake.correction}</p><p className="text-muted-foreground">{mistake.explanation}</p></div>)}</div> : null}</div>;
}
