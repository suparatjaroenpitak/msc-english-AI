"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

type Message = { role: "user" | "assistant"; content: string };

export function AiChatPanel({ teacherName }: { teacherName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();
    if (!message || loading) return;
    setInput("");
    setError("");
    setMessages((current) => [...current, { role: "user", content: message }, { role: "assistant", content: "" }]);
    setLoading(true);
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message, model: "standard" }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "AI ไม่สามารถตอบได้");
      }
      const nextConversationId = response.headers.get("X-Conversation-Id");
      if (nextConversationId) setConversationId(nextConversationId);
      if (!response.body) throw new Error("เบราว์เซอร์ไม่รองรับ streaming");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((current) => {
          const next = [...current];
          const last = next[next.length - 1];
          if (last?.role === "assistant") next[next.length - 1] = { ...last, content: last.content + chunk };
          return next;
        });
      }
    } catch (submitError) {
      setMessages((current) => current.at(-1)?.content ? current : current.slice(0, -1));
      setError(submitError instanceof Error ? submitError.message : "AI ไม่สามารถตอบได้");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[620px] flex-col rounded-lg border bg-card shadow-sm">
      <div className="border-b p-5"><p className="text-xs font-semibold tracking-[0.18em] text-primary">AI TEACHER</p><h1 className="mt-2 text-xl font-semibold">คุยกับ {teacherName}</h1><p className="mt-1 text-sm text-muted-foreground">พิมพ์ภาษาอังกฤษได้เลย ครูจะช่วยแก้และถามต่อ</p></div>
      <div className="flex-1 space-y-4 overflow-y-auto p-5" aria-live="polite">
        {messages.length === 0 ? <div className="rounded-md bg-secondary/60 p-4 text-sm leading-7"><p className="font-medium">Hello! What would you like to practice today?</p><p className="mt-1 text-muted-foreground">ลองพิมพ์: “I went to work yesterday.”</p></div> : null}
        {messages.map((message, index) => <div key={`${message.role}-${index}`} className={message.role === "user" ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm text-primary-foreground" : "max-w-[85%] rounded-2xl rounded-bl-sm bg-secondary px-4 py-3 text-sm leading-7"}>{message.content || (loading && index === messages.length - 1 ? "กำลังคิด…" : "")}</div>)}
        {error ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
      </div>
      <form className="border-t p-4" onSubmit={handleSubmit}><label className="sr-only" htmlFor="chat-message">ข้อความภาษาอังกฤษ</label><div className="flex gap-2"><input id="chat-message" value={input} onChange={(event) => setInput(event.target.value)} disabled={loading} maxLength={4000} placeholder="พิมพ์ข้อความภาษาอังกฤษ…" className="h-11 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm" /><Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="ส่งข้อความ"><Send aria-hidden="true" /></Button></div><p className="mt-2 text-xs text-muted-foreground">ข้อความจะถูกบันทึกในประวัติการเรียนของคุณ</p></form>
    </div>
  );
}
