# Phase 04: Google OAuth Login และ Protected Routes

## 1. เป้าหมาย

Phase นี้เพิ่มการเข้าสู่ระบบด้วย Google OAuth 2.0 ผ่าน NextAuth.js **v4.24.15** ซึ่งเข้ากับ Next.js 14 และ Prisma adapter **1.0.7** ใช้ database sessions ที่เก็บใน PostgreSQL ตาม schema Phase 03 ไม่ผสม API ของ Auth.js v5

เมื่อผู้ใช้เข้าสู่ระบบครั้งแรก Prisma adapter สร้าง User และ Account จากนั้น event/session callback จะสร้างหรือเติม `LearningProfile` และ `TeacherPreference` ให้โดยอัตโนมัติ ผู้ใช้ที่ยังไม่ทำ onboarding จะได้รับการนำไป `/onboarding` จากหน้า dashboard และสามารถบันทึกค่าได้ผ่าน server route ที่ตรวจ session และ Zod ก่อนเขียนฐานข้อมูล

หน้าและ API ที่เพิ่ม:

```text
/login                         ปุ่ม Sign in with Google
/onboarding                    protected form ตั้งค่า level และครู
/dashboard                     protected dashboard อ่านข้อมูลของ user ปัจจุบัน
/api/auth/[...nextauth]        NextAuth GET/POST handlers
/api/onboarding                protected POST + Zod validation
```

การป้องกันใช้ `getServerSession` ใน Server Component และ Route Handler โดยตรง เพราะ session strategy เป็น database session; ไม่ใช้ `userId` ที่ส่งจาก browser เป็นสิทธิ์ และไม่ใช้ middleware JWT ที่ไม่เข้ากับ database session ใน setup นี้

## 2. Packages และเหตุผล

| Package | Version | หน้าที่ |
|---|---|---|
| next-auth | 4.24.15 | Google provider, database session, signIn/signOut |
| @next-auth/prisma-adapter | 1.0.7 | map User/Account/Session/VerificationToken กับ Prisma |
| zod | 3.25.76 | ตรวจ body ของ onboarding ฝั่ง server |

ตรวจ npm registry ก่อน pin version แล้ว ใช้ `npm install` จะอัปเดต package-lock ให้อัตโนมัติ ไม่ใช้ `next-auth@latest` เพราะอาจเปลี่ยนไป Auth.js API major ใหม่

## 3. คำสั่งติดตั้งและ Run

```powershell
Set-Location -LiteralPath 'D:\งาน\ฝึก Eng\msc english AI\msc english AI'
npm install --save-exact next-auth@4.24.15 @next-auth/prisma-adapter@1.0.7 zod@3.25.76
Copy-Item .env.example .env.local
```

แก้ `.env.local` ให้มีค่าอย่างน้อย:

```text
DATABASE_URL=postgresql://academy:academy_dev_password@localhost:5432/english_academy?schema=public
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=<สุ่มค่าอย่างน้อย 32 bytes>
AUTH_GOOGLE_ID=<Google OAuth client ID>
AUTH_GOOGLE_SECRET=<Google OAuth client secret>
```

เริ่ม database ตาม Phase 03 และรัน migration ก่อน:

```powershell
docker compose up -d postgres
npm run db:deploy
npm run db:seed
npm run dev
```

เปิด http://localhost:3000/login แล้วกดเข้าสู่ระบบด้วย Google

สร้าง AUTH_SECRET ใหม่ด้วย PowerShell ได้ด้วย:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

ห้ามใส่ secret ใน `NEXT_PUBLIC_*`, source code, Git หรือ screenshot และห้ามใช้ค่า `replace_me` เมื่อเปิด OAuth จริง

## 4. ตั้งค่า Google Cloud Console ทีละขั้นตอน

1. เปิด [Google Cloud Console](https://console.cloud.google.com/) และเลือก project เดิมหรือสร้าง project ใหม่สำหรับแอปนี้
2. ไปที่ **APIs & Services → OAuth consent screen**
3. เลือก User Type **External** สำหรับผู้ใช้ทั่วไป ถ้าเป็น Google Workspace ภายในองค์กรจึงใช้ Internal
4. ใส่ App name เช่น `AI English Tutor Academy`, support email และ developer contact email
5. เพิ่ม scope ที่จำเป็นเท่านั้น: `openid`, `email`, `profile` ไม่ต้องขอ Google Drive, Calendar หรือ scope อื่นใน Phase นี้
6. ถ้าแอปยังอยู่ Testing ให้เพิ่มบัญชี Google ที่จะทดสอบใน **Test users** มิฉะนั้น Google จะปฏิเสธผู้ใช้ที่ไม่ได้อยู่ในรายการ
7. ไปที่ **APIs & Services → Credentials → Create credentials → OAuth client ID**
8. เลือก application type **Web application** และตั้งชื่อเช่น `AI English Tutor Academy local`
9. ใน **Authorized JavaScript origins** ใส่ `http://localhost:3000`
10. ใน **Authorized redirect URIs** ใส่ `http://localhost:3000/api/auth/callback/google`
11. กด Create แล้วคัดลอก Client ID ไปที่ `AUTH_GOOGLE_ID` และ Client Secret ไปที่ `AUTH_GOOGLE_SECRET`
12. รีสตาร์ท `npm run dev` หลังแก้ `.env.local` เพราะ Next.js อ่าน environment ตอนเริ่ม process

สำหรับ production ให้เพิ่ม origin เช่น `https://academy.example.com` และ redirect URI ที่ตรงกันแบบ exact: `https://academy.example.com/api/auth/callback/google` จากนั้นตั้ง `NEXTAUTH_URL=https://academy.example.com` และใช้ OAuth client แยกจาก local เมื่อเป็นไปได้ อย่าใส่ wildcard หรือ redirect URI ของโดเมนที่ควบคุมไม่ได้

## 5. Session และการไหลของข้อมูล

```text
Browser → /api/auth/signin/google
  → Google consent
  → /api/auth/callback/google
  → NextAuth verifies state/code and stores Account + Session
  → session callback sets user.id and upserts LearningProfile/TeacherPreference
  → callbackUrl (/dashboard)
```

`src/lib/auth.ts` กำหนด `strategy: "database"`, อายุ session 30 วัน และ update ทุก 24 ชั่วโมง หลัง login callback จะได้รับ user จาก database adapter จึงเก็บ id จาก server ลงใน session augmentation

`src/lib/auth-guard.ts` มี `requireSession()` ซึ่ง redirect ไป `/login` ถ้าไม่มี session ใช้เฉพาะ Server Component; API ใช้ `getServerSession(authOptions)` และตอบ HTTP 401 เองเพื่อไม่ให้ API redirect เป็น HTML

`src/types/next-auth.d.ts` เพิ่ม `session.user.id` ใน TypeScript เท่านั้น ไม่ได้เพิ่มสิทธิ์จริง สิทธิ์ยังต้องตรวจจาก session ที่ server อ่านได้

`events.createUser` และ session callback ใช้ upsert สองรายการ การทำซ้ำจึงไม่สร้าง profile ซ้ำ และรองรับบัญชีเดิมที่ยังไม่มีข้อมูล onboarding

## 6. Onboarding และ validation

ฟอร์มส่งเฉพาะ `level`, `dailyStudyMinutes`, `teacherName`, `personality`, `accent`, `explanationMode` ไป `/api/onboarding` ไม่มี `userId` ใน body

Route Handler ทำตามลำดับ:

1. โหลด database session
2. ถ้าไม่มี session ตอบ 401
3. parse JSON พร้อม catch malformed body
4. validate ด้วย Zod และจำกัดความยาว/ช่วงตัวเลข
5. ใช้ `session.user.id` เป็น owner
6. transaction upsert LearningProfile + TeacherPreference
7. ตอบ `{ ok: true }`

การใช้ transaction ป้องกัน profile ถูกบันทึกแต่ preference ล้มเหลวครึ่งทาง ส่วนข้อผิดพลาดจากฐานข้อมูลยังถูกส่งให้ error boundary/Next.js จัดการใน Phase นี้ โดย Phase security จะเพิ่ม structured logging และข้อความที่ปลอดภัยมากขึ้น

## 7. Protected dashboard

`/dashboard` บังคับ session ก่อน query และใช้ user id จาก session ในทุก query: profile, completed lesson count และ vocabulary count หากยังไม่มี database หรือ session จะไม่ทำให้หน้า static หลักเปิดเผยข้อมูลใด ๆ เพราะ dashboard เป็น dynamic route

`/onboarding` ก็ protected และ redirect กลับ dashboard เมื่อ `onboardingCompleted` เป็น true ปุ่ม sign out เรียก `signOut({ callbackUrl: "/" })` และไม่ทำลายข้อมูลการเรียน

## 8. การทดสอบ

ตรวจอัตโนมัติแล้ว:

- `npm ls next-auth @next-auth/prisma-adapter zod --depth=0` พบ version ตามที่ pin
- `npm run typecheck` ผ่าน
- `npm run build` ผ่านและพบ routes `/api/auth/[...nextauth]`, `/api/onboarding`, `/dashboard`, `/login`, `/onboarding`
- หน้าสาธารณะยัง build ได้แม้ไม่มี OAuth secret เพราะ provider list จะว่างและหน้า login แสดงคำแนะนำตั้งค่าแทน

ตรวจจริงหลังเปิด PostgreSQL และใส่ Google credentials:

1. เปิด `/login` ต้องเห็นข้อความตั้งค่าเมื่อยังไม่มี env และเห็นปุ่ม Google เมื่อมี env
2. กด Google login แล้ว callback ต้องกลับ `/dashboard`
3. ตรวจใน Prisma Studio ว่ามี User, Account, Session, LearningProfile และ TeacherPreference
4. เปิด `/dashboard` ใน private window ที่ยังไม่ login ต้อง redirect `/login?callbackUrl=%2Fdashboard`
5. เปิด `/api/onboarding` ด้วย POST โดยไม่ login ต้อง HTTP 401
6. ส่ง onboarding body ที่ level ผิดหรือ minutes เกิน 240 ต้อง HTTP 400 และไม่เขียนข้อมูล
7. ส่งข้อมูลถูกต้องแล้ว refresh dashboard ต้องเห็น level/streak/lesson/vocabulary
8. กดออกจากระบบแล้วเปิด dashboard ซ้ำ ต้องถูก redirect และ Session ถูกลบ/หมดอายุใน database
9. login ด้วยบัญชีทดสอบที่สอง ตรวจว่าข้อมูล profile และ progress แยก userId กัน

ยังไม่ได้ทำ end-to-end OAuth ใน environment นี้ เพราะไม่มี PostgreSQL, Google client ID/secret หรือ browser credentials การ build สำเร็จไม่ใช่หลักฐานว่า Google callback ใช้งานจริงจนกว่าจะทำรายการตรวจข้างต้น

## 9. ปัญหาที่พบบ่อย

| อาการ | วิธีแก้ |
|---|---|
| `redirect_uri_mismatch` | URI ใน Google ต้องตรง `NEXTAUTH_URL` และ `/api/auth/callback/google` แบบ exact รวม scheme/port |
| `Access blocked: app has not completed verification` | เพิ่มบัญชีใน OAuth consent screen → Test users หรือเผยแพร่/ตรวจสอบแอปก่อนใช้ผู้ใช้จริง |
| ปุ่ม login ไม่แสดง | ตรวจ `AUTH_GOOGLE_ID` และ `AUTH_GOOGLE_SECRET` ใน `.env.local` แล้ว restart dev server |
| `[next-auth][error][NO_SECRET]` | ตั้ง AUTH_SECRET ให้เป็นค่าจริงและตรวจว่า process อ่าน `.env.local` |
| `P1001` ตอน login | เปิด PostgreSQL และรัน migration ก่อน; NextAuth database session ต้องเขียน Session ได้ |
| `OAuthAccountNotLinked` | login ด้วย provider/อีเมลเดิมตามบัญชีที่สร้างไว้ ห้ามผูก account แบบข้าม provider เองใน client |
| dashboard วนกลับ login | ตรวจ cookie domain/HTTPS, NEXTAUTH_URL และเวลาเครื่อง; อย่าเรียก `requireSession` ใน Client Component |
| ข้อมูลผู้ใช้คนอื่นแสดง | หยุดใช้งาน endpoint และตรวจทุก query ให้ใช้ `session.user.id`; ห้ามรับ owner id จาก body |
| warning package.json Prisma config | เป็น deprecation warning ของ Prisma 7 จาก Phase 03 ยังไม่กระทบ NextAuth v4; ย้าย config เมื่ออัปเกรด Prisma |

## 10. Checklist

- [x] ติดตั้งและ pin NextAuth.js v4, Prisma adapter และ Zod
- [x] สร้าง Google provider และ database session configuration
- [x] สร้าง NextAuth route handler
- [x] สร้าง session TypeScript augmentation และ server auth guard
- [x] สร้าง login, onboarding และ protected dashboard pages
- [x] สร้าง onboarding API ที่ตรวจ session, JSON และ Zod
- [x] สร้าง automatic profile/preference upsert หลัง login
- [x] ตรวจ TypeScript และ production build
- [ ] ตั้งค่า Google Cloud credentials จริง
- [ ] รัน OAuth flow กับ PostgreSQL จริง
- [ ] เพิ่ม automated auth/integration/e2e tests ใน Phase 13

หยุดที่ Phase 04 ตามลำดับบทเรียน พิมพ์ **ต่อ** เพื่อเริ่ม Phase 05: Groq AI Chat Integration

## 11. Source code เต็มทุกไฟล์ที่เพิ่มหรือแก้

โค้ดด้านล่างเป็น snapshot จากไฟล์จริงของ Phase 04 ไม่รวม `package-lock.json` ที่ npm สร้างและไฟล์ migration จาก Phase 03
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
    "typecheck": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:validate": "prisma validate",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@next-auth/prisma-adapter": "1.0.7",
    "@prisma/client": "6.19.0",
    "@radix-ui/react-slot": "1.1.2",
    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "lucide-react": "0.468.0",
    "next": "14.2.35",
    "next-auth": "4.24.15",
    "next-themes": "0.4.6",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "server-only": "0.0.1",
    "tailwind-merge": "2.6.0",
    "zod": "3.25.76"
  },
  "devDependencies": {
    "@types/node": "22.10.2",
    "@types/react": "18.3.18",
    "@types/react-dom": "18.3.5",
    "autoprefixer": "10.4.21",
    "dotenv": "16.6.1",
    "postcss": "8.5.33",
    "prisma": "6.19.0",
    "tailwindcss": "3.4.19",
    "tailwindcss-animate": "1.0.7",
    "tsx": "4.20.6",
    "typescript": "5.7.3"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}


```

### .env.example

```
# Placeholder only. Services are configured in later phases.
DATABASE_URL=postgresql://academy:academy_dev_password@localhost:5432/english_academy?schema=public
NEXTAUTH_URL=http://localhost:3000
GROQ_API_KEY=replace_me
GROQ_MODEL=openai/gpt-oss-20b
GROQ_ADVANCED_MODEL=openai/gpt-oss-120b
GROQ_STT_MODEL=whisper-large-v3-turbo
AUTH_SECRET=replace_me
AUTH_GOOGLE_ID=replace_me
AUTH_GOOGLE_SECRET=replace_me


```

### src/types/next-auth.d.ts

```
import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}


```

### src/lib/auth.ts

```
import "server-only";

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

const googleClientId = process.env.AUTH_GOOGLE_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET;

async function ensureLearningData(userId: string) {
  await prisma.$transaction([
    prisma.learningProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    }),
    prisma.teacherPreference.upsert({
      where: { userId },
      update: {},
      create: { userId },
    }),
  ]);
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  providers: googleClientId && googleClientSecret
    ? [GoogleProvider({ clientId: googleClientId, clientSecret: googleClientSecret })]
    : [],
  secret: process.env.AUTH_SECRET,
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && !user.email) return false;
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        await ensureLearningData(user.id);
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      await ensureLearningData(user.id);
    },
  },
  debug: process.env.NODE_ENV === "development",
};

export const isGoogleConfigured = Boolean(googleClientId && googleClientSecret);


```

### src/lib/auth-guard.ts

```
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function requireSession(callbackUrl = "/dashboard") {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  return session;
}


```

### src/app/api/auth/[...nextauth]/route.ts

```
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };


```

### src/app/api/onboarding/route.ts

```
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const onboardingSchema = z.object({
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  dailyStudyMinutes: z.number().int().min(5).max(240),
  teacherName: z.string().trim().min(1).max(40),
  personality: z.string().trim().min(1).max(40),
  accent: z.enum(["AMERICAN", "BRITISH"]),
  explanationMode: z.enum(["ENGLISH_ONLY", "ENGLISH_THAI"]),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ข้อมูลคำขอไม่ใช่ JSON ที่ถูกต้อง" }, { status: 400 });
  }

  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูล onboarding ไม่ถูกต้อง", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { level, dailyStudyMinutes, teacherName, personality, accent, explanationMode } = parsed.data;
  await prisma.$transaction([
    prisma.learningProfile.upsert({
      where: { userId: session.user.id },
      update: { level, dailyStudyMinutes, onboardingCompleted: true },
      create: { userId: session.user.id, level, dailyStudyMinutes, onboardingCompleted: true },
    }),
    prisma.teacherPreference.upsert({
      where: { userId: session.user.id },
      update: { teacherName, personality, accent, explanationMode },
      create: { userId: session.user.id, teacherName, personality, accent, explanationMode },
    }),
  ]);

  return NextResponse.json({ ok: true });
}


```

### src/components/auth/google-sign-in-button.tsx

```
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function GoogleSignInButton({ callbackUrl = "/dashboard" }: { callbackUrl?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    await signIn("google", { callbackUrl });
    setLoading(false);
  }

  return (
    <Button type="button" className="w-full" onClick={handleSignIn} disabled={loading}>
      {loading ? "กำลังเชื่อมต่อ Google…" : "เข้าสู่ระบบด้วย Google"}
    </Button>
  );
}


```

### src/components/auth/sign-out-button.tsx

```
"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);
  return (
    <Button type="button" variant="outline" disabled={loading} onClick={async () => {
      setLoading(true);
      await signOut({ callbackUrl: "/" });
    }}>
      {loading ? "กำลังออกจากระบบ…" : "ออกจากระบบ"}
    </Button>
  );
}


```

### src/components/onboarding-form.tsx

```
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


```

### src/app/login/page.tsx

```
import Link from "next/link";
import { isGoogleConfigured } from "@/lib/auth";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function LoginPage({ searchParams }: { searchParams?: { callbackUrl?: string } }) {
  const callbackUrl = searchParams?.callbackUrl?.startsWith("/") ? searchParams.callbackUrl : "/dashboard";
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-12">
      <Card className="w-full">
        <CardHeader><Link className="mb-4 text-sm font-semibold text-primary" href="/">← กลับหน้าหลัก</Link><CardTitle>ยินดีต้อนรับกลับ</CardTitle><CardDescription>เข้าสู่ AI English Tutor Academy ด้วยบัญชี Google ของคุณ</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          {isGoogleConfigured ? <GoogleSignInButton callbackUrl={callbackUrl} /> : <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-7">ยังไม่ได้ตั้งค่า Google OAuth กรุณาเพิ่ม AUTH_GOOGLE_ID และ AUTH_GOOGLE_SECRET ในไฟล์ .env.local ตามคู่มือ Phase 04</div>}
          <p className="text-center text-xs leading-6 text-muted-foreground">เมื่อเข้าสู่ระบบ คุณยอมรับการเก็บประวัติการเรียนเพื่อปรับบทเรียนให้เหมาะกับคุณ</p>
        </CardContent>
      </Card>
    </main>
  );
}


```

### src/app/onboarding/page.tsx

```
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { OnboardingForm } from "@/components/onboarding-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await requireSession("/onboarding");
  const profile = await prisma.learningProfile.findUnique({ where: { userId: session.user.id } });
  const preference = await prisma.teacherPreference.findUnique({ where: { userId: session.user.id } });
  if (profile?.onboardingCompleted) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <Card><CardHeader><CardTitle>เริ่มต้นเส้นทางของคุณ</CardTitle><CardDescription>ตั้งค่าพื้นฐานเพื่อให้ครู AI ปรับบทเรียนได้เหมาะกับคุณ</CardDescription></CardHeader><CardContent><OnboardingForm initialValues={{ level: profile?.level ?? "A1", dailyStudyMinutes: profile?.dailyStudyMinutes ?? 15, teacherName: preference?.teacherName ?? "Alex", personality: preference?.personality ?? "encouraging", accent: preference?.accent ?? "AMERICAN", explanationMode: preference?.explanationMode ?? "ENGLISH_THAI" }} /></CardContent></Card>
    </main>
  );
}


```

### src/app/dashboard/page.tsx

```
import Link from "next/link";
import { requireSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireSession();
  const [profile, completedLessons, vocabularyCount] = await Promise.all([
    prisma.learningProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.lessonProgress.count({ where: { userId: session.user.id, status: "COMPLETED" } }),
    prisma.userVocabulary.count({ where: { userId: session.user.id } }),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <header className="mb-10 flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center"><div><Link className="text-sm font-bold" href="/">AI English Tutor Academy</Link><p className="mt-2 text-sm text-muted-foreground">สวัสดี {session.user.name ?? "ผู้เรียน"}</p></div><SignOutButton /></header>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-semibold tracking-[0.18em] text-primary">YOUR PROGRESS</p><h1 className="text-3xl font-bold">แดชบอร์ดการเรียน</h1></div><Badge variant="secondary">ระดับ {profile?.level ?? "A1"}</Badge></div>
      <div className="grid gap-5 sm:grid-cols-3"><Card><CardHeader><CardDescription>Learning streak</CardDescription><CardTitle>{profile?.learningStreak ?? 0} วัน</CardTitle></CardHeader></Card><Card><CardHeader><CardDescription>บทเรียนที่เรียนจบ</CardDescription><CardTitle>{completedLessons}</CardTitle></CardHeader></Card><Card><CardHeader><CardDescription>คำศัพท์ในคลัง</CardDescription><CardTitle>{vocabularyCount}</CardTitle></CardHeader></Card></div>
      <Card className="mt-5"><CardHeader><CardTitle>พร้อมเริ่มหรือยัง?</CardTitle><CardDescription>ตั้งค่าครูและเป้าหมายการเรียนของคุณได้ทุกเมื่อ</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-3"><Button asChild><Link href="/onboarding">แก้ไขเป้าหมายการเรียน</Link></Button><Button variant="outline" asChild><Link href="/">ดูเส้นทางการเรียน</Link></Button></CardContent></Card>
    </main>
  );
}


```

