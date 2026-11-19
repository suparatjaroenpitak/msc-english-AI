"use client";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto max-w-2xl space-y-5 px-5 py-16"><h1 className="text-3xl font-bold">ไม่สามารถแสดงหน้านี้ได้</h1><p role="alert" className="text-muted-foreground">โปรดลองอีกครั้ง หากยังพบปัญหาให้โหลดหน้าใหม่</p><Button onClick={reset}>ลองอีกครั้ง</Button></main>;
}
