import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <main className="mx-auto max-w-2xl space-y-5 px-5 py-16"><h1 className="text-3xl font-bold">ไม่พบหน้าที่ต้องการ</h1><p className="text-muted-foreground">ตรวจสอบที่อยู่ หรือกลับไปเริ่มต้นใหม่</p><Button asChild><Link href="/">กลับหน้าหลัก</Link></Button></main>;
}
