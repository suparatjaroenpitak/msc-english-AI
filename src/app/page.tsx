import { ArrowUpRight, BookOpen, Headphones, Languages, MessageCircle, PenLine, Shapes } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const modules = [
  { title: "Speaking", description: "ฝึกสนทนาในสถานการณ์ที่พบได้จริง", icon: MessageCircle, href: "/academy/speaking" },
  { title: "Listening", description: "ฝึกฟัง จับใจความ และทบทวนตามจังหวะของคุณ", icon: Headphones, href: "/academy/listening" },
  { title: "Reading", description: "อ่านอย่างเข้าใจ พร้อมคำอธิบายภาษาไทย", icon: BookOpen, href: "/academy/reading" },
  { title: "Writing", description: "พัฒนาประโยค ย่อหน้า และงานเขียน", icon: PenLine, href: "/academy/writing" },
  { title: "Vocabulary", description: "เรียนคำศัพท์และทบทวนอย่างเป็นระบบ", icon: Languages, href: "/academy/vocabulary" },
  { title: "Grammar", description: "เข้าใจโครงสร้างภาษาอังกฤษทีละขั้น", icon: Shapes, href: "/academy/grammar" },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:z-50 focus:bg-background focus:p-3">ข้ามไปเนื้อหาหลัก</a>
      <header className="flex items-center justify-between gap-3 border-b py-6">
        <a className="flex items-center gap-3 text-sm font-bold sm:text-base" href="/" aria-label="Academy หน้าหลัก">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-2xl text-primary-foreground">a.</span>
          <span>English Tutor<br className="sm:hidden" /> Academy</span>
        </a>
        <nav className="flex items-center gap-2" aria-label="เมนูหลัก"><a className="hidden rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary sm:inline-block" href="/login">เข้าสู่ระบบ</a><Button asChild variant="outline" size="sm"><a href="/dashboard">Dashboard</a></Button><ThemeToggle /></nav>
      </header>
      <main id="main" tabIndex={-1}>
        <section className="max-w-4xl py-14 sm:py-20" aria-labelledby="hero-title">
          <p className="text-xs font-semibold tracking-[0.18em] text-primary">YOUR ENGLISH JOURNEY STARTS HERE</p>
          <h1 id="hero-title" className="my-6 text-3xl font-bold leading-relaxed tracking-tight sm:text-5xl sm:leading-relaxed">ภาษาอังกฤษที่ดีขึ้น<br /><span className="text-primary">เริ่มจากก้าวเล็ก ๆ ทุกวัน</span></h1>
          <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">พื้นที่เรียนภาษาอังกฤษสำหรับคนไทย ฝึกทั้งฟัง พูด อ่าน และเขียน พร้อมเติบโตอย่างมั่นใจในแบบของคุณ</p>
          <Button asChild size="lg" className="mt-7"><a href="#academies">สำรวจเส้นทางการเรียน <ArrowUpRight aria-hidden="true" /></a></Button>
          <p className="mt-4 text-xs leading-6 text-muted-foreground">เลือก Academy เพื่อเริ่มบทเรียน หรือเข้าสู่ระบบเพื่อบันทึกความก้าวหน้าของคุณ</p>
        </section>
        <section id="academies" className="scroll-mt-8" aria-labelledby="academies-title">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><p className="mb-2 text-xs font-semibold tracking-[0.18em] text-primary">SIX WAYS TO GROW</p><h2 id="academies-title" className="text-2xl font-semibold">เส้นทางการเรียนของคุณ</h2></div>
            <Badge variant="outline" className="w-fit">Beginner → Advanced</Badge>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map(({ title, description, icon: Icon, href }, index) => (
              <a href={href} key={title} className="group block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <Card className="flex h-full flex-col motion-safe:transition-shadow motion-safe:group-hover:shadow-md">
                  <CardHeader className="flex-1">
                    <div className="mb-5 flex items-center justify-between"><span className="grid size-11 place-items-center rounded-xl bg-secondary text-secondary-foreground"><Icon className="size-5" aria-hidden="true" /></span><span className="text-xs tabular-nums text-muted-foreground">0{index + 1}</span></div>
                    <CardTitle>{title} Academy</CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </CardHeader>
                  <CardFooter><Badge variant="secondary">เปิดบทเรียน ↗</Badge></CardFooter>
                </Card>
              </a>
            ))}
          </div>
        </section>
      </main>
      <footer className="mt-16 flex flex-col justify-between gap-2 border-t py-6 text-xs text-muted-foreground sm:flex-row"><span>AI English Tutor Academy</span><span>Built for progress, one day at a time.</span></footer>
    </div>
  );
}
