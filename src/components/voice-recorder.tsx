"use client";

import { useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VoiceRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("พร้อมอัดเสียง");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");

  async function startRecording() {
    setError("");
    setTranscript("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("เบราว์เซอร์นี้ไม่รองรับการอัดเสียง กรุณาใช้ช่องแชตข้อความแทน");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const form = new FormData();
        form.append("audio", blob, "practice.webm");
        setStatus("กำลังถอดเสียง…");
        try {
          const response = await fetch("/api/voice/transcribe", { method: "POST", body: form });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error ?? "ถอดเสียงไม่สำเร็จ");
          setTranscript(result.text);
          setStatus("ถอดเสียงแล้ว");
        } catch (requestError) {
          setError(requestError instanceof Error ? requestError.message : "ถอดเสียงไม่สำเร็จ");
          setStatus("เกิดข้อผิดพลาด");
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setStatus("กำลังฟัง… กดหยุดเมื่อพูดจบ");
    } catch (permissionError) {
      setError(permissionError instanceof DOMException && permissionError.name === "NotAllowedError" ? "กรุณาอนุญาตให้ใช้ไมโครโฟนแล้วลองใหม่" : "ไม่สามารถเปิดไมโครโฟนได้");
      setStatus("พร้อมอัดเสียง");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className="space-y-5 rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3"><Button type="button" size="lg" variant={recording ? "destructive" : "default"} onClick={recording ? stopRecording : startRecording}>{recording ? <Square aria-hidden="true" /> : <Mic aria-hidden="true" />}{recording ? "หยุดอัดเสียง" : "กดเพื่อพูด"}</Button><span role="status" className="text-sm text-muted-foreground">{status}</span></div>
      {error ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
      {transcript ? <div className="rounded-md bg-secondary/60 p-4"><p className="mb-2 text-xs font-semibold tracking-wide text-primary">TRANSCRIPT</p><p className="text-sm leading-7">{transcript}</p><p className="mt-3 text-xs text-muted-foreground">นี่คือข้อความที่ถอดเสียง ไม่ใช่คะแนนความแม่นยำระดับ phoneme</p></div> : null}
    </div>
  );
}
