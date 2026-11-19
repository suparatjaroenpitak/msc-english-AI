# Architecture และ Phase 01: Setup Next.js 14

## 1. ภาพรวม Architecture

ระบบใช้ Next.js App Router เป็นทั้งเว็บและ Backend ในโปรเจกต์เดียว React แสดงหน้าจอ และ TypeScript ช่วยตรวจชนิดข้อมูลก่อนรัน

```text
Browser: React UI / Microphone / Speech Synthesis
   ↓ HTTPS + Session cookie
Next.js: Server Components + Route Handlers
   ↓ ตรวจ session → ตรวจ Zod → จำกัด usage → ตรวจ ownership
Services: AI Teacher / Lessons / Exams / Learning Progress
   ├─ Groq (เรียกเฉพาะ server)
   └─ Repositories → Prisma → PostgreSQL
Google OAuth ↔ NextAuth ↔ Database session
```

นี่คือ Architecture เป้าหมาย Phase 01 ทำเฉพาะฐาน Next.js เท่านั้น ไม่ส่งข้อมูลไป Groq และไม่ต้องมี API key

- Browser บันทึกเสียงด้วย MediaRecorder และเล่นคำตอบด้วย Speech Synthesis ใน Phase 06
- Server ตรวจผู้ใช้จาก session ทุกครั้ง ไม่ใช้ userId จาก client เป็นสิทธิ์เข้าถึงข้อมูล
- Prisma ใช้ query ที่ระบุเจ้าของข้อมูล ป้องกันการอ่านประวัติข้ามบัญชี
- เก็บข้อสอบและเฉลยบน server ส่งเฉพาะโจทย์/ตัวเลือกก่อนส่งคำตอบ
- แยก Groq client เป็น server-only จำกัด context, daily usage และบันทึก token usage
- วางแผนใช้ NextAuth.js v4 กับ Next.js 14 โดยกำหนด Google provider และ Prisma adapter ของ major ที่เข้ากันได้ใน Phase 04 จะไม่ผสมตัวอย่าง Auth.js v5
- ชื่อ AUTH_* ใน env จะถูก map ใน config อย่างชัดเจน ไม่สมมติว่า NextAuth v4 อ่านชื่อเหล่านี้อัตโนมัติ

## 2. โครงสร้างเป้าหมาย

| Path | หน้าที่ | เริ่มสร้าง |
|---|---|---|
| src/app/ | หน้าเว็บ Layout และ API Route Handlers | Phase 01 |
| src/components/ | UI ใช้ซ้ำและ shadcn/ui | Phase 02 |
| src/features/ | ส่วนหน้าจอแยกตามบทเรียน/Chat/Exam | ตาม feature |
| src/lib/ | Config, Prisma client, session utilities | Phase 03–04 |
| src/services/ | กฎการเรียนและการเรียก AI | Phase 05 |
| src/repositories/ | Query database พร้อม ownership | Phase 03 เป็นต้นไป |
| src/hooks/ | React hooks เช่น recorder | Phase 06 |
| src/types/ | TypeScript types ที่ใช้ร่วมกัน | ตาม feature |
| src/validations/ | Zod schemas สำหรับ input/output | Phase 04 เป็นต้นไป |
| src/prompts/ | Prompt ของครูและการสร้างบทเรียน | Phase 05 |
| prisma/schema.prisma | Model และ relations | Phase 03 |
| prisma/migrations/ | ประวัติการเปลี่ยน schema | Phase 03 |
| prisma/seed.ts | ข้อมูลเริ่มต้นที่มีสิทธิ์ใช้งาน | Phase 03 |
| public/images/, public/icons/ | Static assets | เมื่อมี asset |
| tests/unit/, tests/integration/, tests/e2e/ | Tests ตามระดับ | ตาม feature / Phase 13 |
| docs/ | คู่มือทำตามทีละ Phase | Phase 01 |

ไม่สร้างโฟลเดอร์เปล่าเพื่อให้ดูเหมือน feature เสร็จแล้ว โครงสร้างปัจจุบันประกอบด้วย src/app และไฟล์ตั้งค่าที่แสดงท้ายคู่มือนี้

## 3. เป้าหมาย Phase 01

ได้โปรเจกต์ Next.js 14 App Router + React 18 + TypeScript strict ที่รันได้ มีหน้าเริ่มต้น responsive, metadata ภาษาไทย, loading, error และ 404 หน้าเริ่มต้นเป็นเนื้อหาคงที่จึงยังไม่มี empty state ของข้อมูลผู้ใช้หรือ success state ของการบันทึก

**สถานะเวอร์ชัน:** ตรวจ npm registry ได้ Next.js 14.2.35 เป็น patch ล่าสุดในสาย 14 ที่ registry ส่งกลับ แต่ Next.js 14 อยู่ในกลุ่ม unsupported ตาม https://nextjs.org/support-policy จึงไม่ใช่ฐานที่พร้อมเปิด production อย่างปลอดภัยในระยะยาว ต้องอัปเกรดก่อน Phase deployment

เอกสารติดตั้ง Next.js 14: https://nextjs.org/docs/14/getting-started/installation ระบุ Node.js ขั้นต่ำ 18.17 อย่างไรก็ตามเครื่องนี้ใช้ Node.js 24.21.0 และ npm 11.19.0 หลีกเลี่ยงการติดตั้ง Node รุ่นเก่าที่หมดการสนับสนุนเพียงเพื่อให้ตรงค่าขั้นต่ำ

## 4. Packages และคำสั่ง Terminal

Runtime: next 14.2.35, react 18.3.1, react-dom 18.3.1

Development: typescript 5.7.3, @types/node 22.10.2, @types/react 18.3.18, @types/react-dom 18.3.5

ยังไม่ติดตั้ง Tailwind, shadcn/ui, Prisma, NextAuth หรือ Groq เพราะอยู่ใน Phase ต่อไป ใช้ CSS ปกติชั่วคราว

เปิด PowerShell ที่โปรเจกต์:

```powershell
Set-Location -LiteralPath 'D:\งาน\ฝึก Eng\msc english AI\msc english AI'
node --version
npm --version
```

ไฟล์ถูกสร้างให้แล้ว หากเริ่มใหม่จากโฟลเดอร์ว่าง ให้สร้างไฟล์ตามโค้ดเต็มในข้อ 9 แล้วติดตั้ง:

```powershell
npm install
npm run dev
```

เมื่อมี package-lock.json แล้ว ใช้ `npm ci` สำหรับติดตั้งซ้ำให้ตรง lockfile ไม่ใช้ create-next-app@latest เพราะจะสร้าง Next.js คนละ major และชื่อโฟลเดอร์ปัจจุบันมีช่องว่าง จึงกำหนดชื่อ package เป็น ai-english-tutor-academy โดยตรง

เปิด http://localhost:3000 และกด “สำรวจเส้นทางการเรียน” เพื่อเลื่อนไปการ์ดทั้ง 6 หมวด กด Ctrl+C ใน Terminal เพื่อหยุด dev server

Phase นี้ไม่ต้องคัดลอก .env.example ไป .env.local และไม่ต้องกรอก secret ตัวแปรในตัวอย่างเตรียมไว้สำหรับ Phase ถัดไปเท่านั้น ห้ามเติม NEXT_PUBLIC_ ให้ API keys

## 5. คำอธิบายไฟล์

- package.json กำหนดเวอร์ชันแบบ exact และ scripts สำหรับ development, production และตรวจชนิดข้อมูล
- package-lock.json เป็นผลจาก npm install ให้เก็บใน Git เพื่อให้การติดตั้งซ้ำตรงกัน ไม่ต้องเขียนเอง
- tsconfig.json เปิด strict และ alias @/ ไปที่ src/ โดยใช้ moduleResolution แบบ bundler
- next-env.d.ts ประกาศชนิดของ Next.js และ Next Image; Next.js ดูแลไฟล์นี้
- next.config.mjs เปิด React Strict Mode ช่วยตรวจปัญหาระหว่างพัฒนา และปิด X-Powered-By
- layout.tsx เป็น Server Component ครอบทุกหน้า ตั้ง metadata และภาษา th
- page.tsx เป็น Server Component ไม่มี client JS สำหรับ state ที่ยังไม่จำเป็น แสดงชื่อโครงการและ 6 เส้นทางการเรียนโดยระบุว่ายังอยู่ในแผนพัฒนา
- globals.css วางสี ตัวอักษร และ grid ที่ลดจาก 3 เป็น 2 และ 1 คอลัมน์ตามความกว้างหน้าจอ
- loading.tsx เป็น fallback ระหว่างโหลด segment; หน้าคงที่โหลดเร็วอาจไม่เห็นข้อความนี้
- error.tsx ต้องใช้ use client เพราะ error boundary มีปุ่ม reset ไม่แสดงรายละเอียด exception ให้ผู้ใช้
- not-found.tsx แสดง 404 และลิงก์กลับหน้าหลัก
- .gitignore กัน build output, dependencies และ secrets ออกจาก Git แต่อนุญาต .env.example

## 6. วิธีทดสอบ

```powershell
npm run typecheck
npm run build
npm start
```

typecheck ต้องไม่มี TypeScript error ส่วน build ต้องสำเร็จ จึงใช้ npm start ได้ หาก dev ใช้ port 3000 อยู่ให้หยุดก่อน หรือ `npm start -- -p 3001`

Manual checks:

1. เปิด / ตรวจชื่อเว็บ ภาษาไทย และการ์ดครบ 6 หมวด
2. กดปุ่มสำรวจ ต้องเลื่อนไปหัวข้อเส้นทางการเรียน
3. เปิด /missing-page ต้องได้หน้า 404 และกลับหน้าหลักได้
4. ย่อหน้าจอประมาณ 375px เนื้อหาไม่ควรล้นแนวนอน
5. ใช้ Tab โฟกัสลิงก์ได้และเห็น outline

ยังไม่มี Prisma schema จึงยังไม่รัน prisma validate; จะตรวจ validate/generate/migrations ใน Phase 03 ส่วน Google auth, rate limit, user isolation และ AI mocks จะเพิ่มเมื่อมี implementation ที่ทดสอบได้จริง

## 7. ปัญหาที่พบบ่อย

| อาการ | วิธีแก้ |
|---|---|
| npm.ps1 ถูก execution policy ปิดกั้น | ใช้ npm.cmd แทน npm โดยไม่ต้องเปลี่ยน policy ทั้งเครื่อง |
| npm install timeout | ตรวจ internet/proxy/registry ด้วย npm config get registry แล้วลองใหม่ ไม่ปิด TLS verification |
| Port 3000 ถูกใช้ | ใช้ npm run dev -- -p 3001 |
| Module not found | ตรวจว่าอยู่โฟลเดอร์ที่มี package.json แล้ว npm ci |
| npm start ไม่พบ production build | รัน npm run build ให้ผ่านก่อน |
| มี warning เรื่อง security ของ Next 14 | ตรวจ npm audit และวางแผนอัปเกรด อย่าใช้ npm audit fix --force โดยไม่ตรวจ major ที่เปลี่ยน |
| หน้าเดิมหลังแก้ไฟล์ | ตรวจ Terminal ว่า compile สำเร็จและ refresh หน้าเว็บ |

## 8. Checklist

- [x] กำหนด Next.js 14 และ React 18 แบบ exact version
- [x] ใช้ src/app และ TypeScript strict
- [x] สร้างหน้าเริ่มต้น พร้อม loading/error/404
- [x] มี .gitignore และ env placeholders เท่านั้น
- [x] อธิบาย Architecture, โครงสร้าง, คำสั่ง, วิธีทดสอบ และข้อจำกัด
- [x] ตรวจผลติดตั้ง, typecheck และ build ตามรายงานการตรวจท้ายไฟล์
- [ ] ผู้เรียนเปิดหน้าเว็บและตรวจ responsive/keyboard ตามรายการ

หยุดที่ Phase 01 เมื่อพร้อมพิมพ์ **ต่อ** เพื่อเริ่ม Phase 02: Tailwind และ shadcn/ui

## 9. Source code เต็มทุกไฟล์ของ Phase 01

ส่วนต่อไปเป็น snapshot ของไฟล์จริง ไม่รวม lockfile ที่ npm สร้าง, build output และตัวคู่มือเอง

### package.json

```
{
  "name": "ai-english-tutor-academy",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "14.2.35",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "@types/node": "22.10.2",
    "@types/react": "18.3.18",
    "@types/react-dom": "18.3.5",
    "typescript": "5.7.3"
  }
}
```


### .gitignore

```
node_modules/
.next/
out/
coverage/
*.tsbuildinfo
.env*
!.env.example
*.log
.DS_Store
```


### .env.example

```
# Placeholder only. Services are configured in later phases.
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/english_academy
GROQ_API_KEY=replace_me
GROQ_MODEL=openai/gpt-oss-20b
GROQ_ADVANCED_MODEL=openai/gpt-oss-120b
GROQ_STT_MODEL=whisper-large-v3-turbo
AUTH_SECRET=replace_me
AUTH_GOOGLE_ID=replace_me
AUTH_GOOGLE_SECRET=replace_me
```


### next.config.mjs

```
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
```


### next-env.d.ts

```
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// Managed by Next.js.
```


### tsconfig.json

```
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```


### src/app/layout.tsx

```
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI English Tutor Academy",
  description: "พื้นที่ฝึกภาษาอังกฤษสำหรับผู้เรียนชาวไทย ตั้งแต่ Beginner ถึง Advanced",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
```


### src/app/page.tsx

```
const modules = [
  ["01", "Speaking", "ฝึกสนทนาในสถานการณ์ที่พบได้จริง"],
  ["02", "Listening", "ฝึกฟัง จับใจความ และทบทวนตามจังหวะของคุณ"],
  ["03", "Reading", "อ่านอย่างเข้าใจ พร้อมคำอธิบายภาษาไทย"],
  ["04", "Writing", "พัฒนาประโยค ย่อหน้า และงานเขียน"],
  ["05", "Vocabulary", "เรียนคำศัพท์และทบทวนอย่างเป็นระบบ"],
  ["06", "Grammar", "เข้าใจโครงสร้างภาษาอังกฤษทีละขั้น"],
];

export default function HomePage() {
  return (
    <main id="main">
      <header className="header">
        <a className="brand" href="/" aria-label="Academy หน้าหลัก"><span className="mark">a.</span> English Tutor Academy</a>
        <span className="badge">Phase 01 · Project setup</span>
      </header>
      <section className="hero" aria-labelledby="hero-title">
        <p className="eyebrow">YOUR ENGLISH JOURNEY STARTS HERE</p>
        <h1 id="hero-title">ภาษาอังกฤษที่ดีขึ้น<br /><span>เริ่มจากก้าวเล็ก ๆ ทุกวัน</span></h1>
        <p className="intro">พื้นที่เรียนภาษาอังกฤษสำหรับคนไทย ฝึกทั้งฟัง พูด อ่าน และเขียน พร้อมเติบโตอย่างมั่นใจในแบบของคุณ</p>
        <a className="button" href="#academies">สำรวจเส้นทางการเรียน <span aria-hidden="true">↗</span></a>
        <p className="notice">ต้นแบบ Phase 01 — ระบบ AI, เสียง และ Google Login จะเพิ่มใน Phase ถัดไป</p>
      </section>
      <section id="academies" aria-labelledby="academies-title">
        <div className="section-heading"><div><p className="eyebrow">SIX WAYS TO GROW</p><h2 id="academies-title">เส้นทางการเรียนของคุณ</h2></div><span>Beginner → Advanced</span></div>
        <div className="grid">{modules.map(([number, title, description]) => (
          <article className="card" key={number}>
            <span className="number">{number}</span><h3>{title} Academy</h3><p>{description}</p><span className="upcoming">อยู่ในแผนพัฒนา</span>
          </article>
        ))}</div>
      </section>
      <footer>AI English Tutor Academy <span>Built for progress, one day at a time.</span></footer>
    </main>
  );
}
```


### src/app/globals.css

```
:root { color-scheme: light; --ink: #193c35; --muted: #66756e; --paper: #f7f8f3; --line: #dde4da; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--paper); color: var(--ink); font-family: Arial, Tahoma, sans-serif; line-height: 1.7; }
a { color: inherit; }
a:focus-visible, button:focus-visible { outline: 3px solid #ab6b20; outline-offset: 5px; }
main { max-width: 1180px; margin: auto; padding: 0 32px; }
.header { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 26px 0; border-bottom: 1px solid var(--line); }
.brand { display: flex; gap: 12px; align-items: center; text-decoration: none; font-weight: 700; }
.mark { display: grid; place-items: center; width: 40px; height: 40px; background: var(--ink); color: white; border-radius: 12px; font-size: 26px; }
.badge { padding: 5px 12px; border: 1px solid var(--line); border-radius: 24px; font-size: 12px; }
.hero { padding: 80px 0 64px; max-width: 850px; }
.eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #547667; }
h1 { font-size: clamp(32px, 4.7vw, 58px); line-height: 1.45; letter-spacing: -1.5px; margin: 18px 0; }
h1 span { color: #66826e; }
.intro { max-width: 620px; color: var(--muted); font-size: 17px; }
.button { display: inline-flex; gap: 32px; margin-top: 18px; padding: 12px 24px; background: var(--ink); color: white; border-radius: 12px; text-decoration: none; }
.button:hover { background: #285b4d; }
.notice { font-size: 12px; color: var(--muted); margin-top: 18px; }
.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
h2 { margin: 0; font-size: 26px; }
.section-heading > span { font-size: 13px; color: var(--muted); }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.card { padding: 25px; background: #fff; border: 1px solid var(--line); border-radius: 18px; }
.number { font-size: 13px; color: #687c69; }
h3 { margin: 20px 0 8px; font-size: 19px; }
.card p { color: var(--muted); font-size: 14px; min-height: 48px; }
.upcoming { display: inline-block; padding: 3px 10px; border-radius: 20px; background: #eef2e8; font-size: 11px; }
footer { display: flex; justify-content: space-between; gap: 20px; margin-top: 64px; padding: 24px 0; border-top: 1px solid var(--line); font-size: 12px; color: var(--muted); }
@media (max-width: 760px) { .grid { grid-template-columns: repeat(2, 1fr); } .badge { display: none; } .hero { padding-top: 48px; } }
@media (max-width: 480px) { main { padding: 0 20px; } .grid { grid-template-columns: 1fr; } .section-heading, footer { align-items: start; flex-direction: column; } .brand { font-size: 14px; } }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
```


### src/app/loading.tsx

```
export default function Loading() {
  return <main><p role="status">กำลังโหลดบทเรียน…</p></main>;
}
```


### src/app/error.tsx

```
"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main><h1>ไม่สามารถแสดงหน้านี้ได้</h1><p role="alert">โปรดลองอีกครั้ง หากยังพบปัญหาให้โหลดหน้าใหม่</p><button className="button" onClick={reset}>ลองอีกครั้ง</button></main>;
}
```


### src/app/not-found.tsx

```
import Link from "next/link";

export default function NotFound() {
  return <main><h1>ไม่พบหน้าที่ต้องการ</h1><p>ตรวจสอบที่อยู่ หรือกลับไปเริ่มต้นใหม่</p><Link className="button" href="/">กลับหน้าหลัก</Link></main>;
}
```


### README.md

```
# AI English Tutor Academy

เริ่มอ่าน [คู่มือ Architecture และ Phase 01](docs/phase-01.md)

สถานะ: Phase 01 เท่านั้น ยังไม่มีการเชื่อมต่อ AI, Database หรือ Google OAuth

```powershell
npm ci
npm run dev
```

เปิด http://localhost:3000

```powershell
npm run typecheck
npm run build
npm start
```

Next.js 14 หมดระยะสนับสนุนแล้ว ใช้ตามข้อกำหนดของบทเรียนนี้ ก่อนเปิดบริการจริงต้องย้ายไปเวอร์ชันที่ยังได้รับการสนับสนุนและทดสอบอีกครั้ง
```


## 10. ผลตรวจจริง

- npm install: ผ่าน ได้ package-lock.json
- npm run typecheck: ผ่าน
- npm run build: ผ่าน สร้าง static routes สำเร็จ (รอบแรก sandbox ปฏิเสธ mkdir; รอบได้รับสิทธิ์ผ่าน)
- Production server: เริ่มสำเร็จและรายงาน Ready; HTTP smoke check ยังยืนยันไม่ได้ เพราะ sandbox ปฏิเสธการเชื่อมต่อ socket ไป localhost ไม่ได้ผล 200/404 ที่ตรวจยืนยันแล้ว
- npm audit: ไม่ผ่าน พบแพ็กเกจที่ได้รับผลกระทบ 2 รายการ (high 1, critical 1) คือ next และ postcss; ยังไม่ได้เปลี่ยน major เพราะ Phase นี้กำหนด Next.js 14
- ยังไม่ได้ตรวจหน้าตาผ่าน browser จริงหรือทดสอบ microphone/auth/database ซึ่งยังไม่อยู่ใน Phase นี้
- หยุด production server ที่ใช้ทดสอบแล้ว ผู้เรียนเริ่มเองได้ด้วย npm run dev

การ build ผ่านไม่ใช่การรับรองความปลอดภัยสำหรับ production ต้องแก้ความเสี่ยง dependency ด้วยการย้ายรุ่นที่ยังสนับสนุนก่อนเผยแพร่

