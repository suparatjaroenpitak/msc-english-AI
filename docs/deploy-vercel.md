# Deploy AI English Tutor Academy to Vercel

สถาปัตยกรรม deploy ใช้ Vercel สำหรับ Next.js, PostgreSQL สำหรับข้อมูล relational และ Vercel Blob private store สำหรับไฟล์เสียง Vercel ระบุว่า Marketplace เหมาะกับ Postgres และ Blob เหมาะกับไฟล์ขนาดใหญ่ ส่วน private Blob ต้องใช้ `BLOB_READ_WRITE_TOKEN` ทุก operation

## 1. Login และ link project

```powershell
npx vercel login
npx vercel whoami
npx vercel link --yes
```

`vercel whoami` ต้องแสดง account/team ก่อน deploy

## 2. PostgreSQL storage

Vercel Dashboard → Project → Storage → Marketplace → เลือก Neon/Supabase/Postgres provider แล้ว connect store กับ project ให้ `DATABASE_URL` ถูกเติมใน Preview และ Production

ระบบนี้ใช้ Prisma relations, transactions และ foreign keys จึงต้องใช้ PostgreSQL ไม่ใช้ Blob แทน database

```powershell
npx vercel env ls
npx vercel env pull .env.local
```

## 3. Private Blob storage

สร้างใน Dashboard หรือใช้ CLI เมื่อ version รองรับ:

```powershell
npx vercel blob create-store ai-english-tutor-audio --access private
```

เชื่อม store กับ project และ Production/Preview environment ให้มี:

```text
BLOB_READ_WRITE_TOKEN=<private Blob token>
```

Route `/api/voice/transcribe` จะเก็บเสียงเป็น `audio/<userId>/<requestId>.webm` ด้วย `access: "private"` ถ้าไม่มี token local ยังถอดเสียงได้ แต่ `storedInBlob` จะเป็น false

## 4. Vercel environment variables

เพิ่มค่าใน Project Settings หรือ `vercel env add`:

```text
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-project.vercel.app
AUTH_SECRET=<random 32-byte secret>
AUTH_GOOGLE_ID=<production Google OAuth client id>
AUTH_GOOGLE_SECRET=<production Google OAuth client secret>
GROQ_API_KEY=<Groq key>
GROQ_MODEL=openai/gpt-oss-20b
GROQ_ADVANCED_MODEL=openai/gpt-oss-120b
GROQ_STT_MODEL=whisper-large-v3-turbo
BLOB_READ_WRITE_TOKEN=<private Blob token>
```

ห้าม commit ค่าเหล่านี้และห้ามใช้ `NEXT_PUBLIC_` กับ secrets

## 5. Google OAuth production redirect

เพิ่มใน Google Cloud OAuth client แบบ exact:

```text
Authorized origin: https://your-project.vercel.app
Redirect URI: https://your-project.vercel.app/api/auth/callback/google
```

เมื่อใช้ custom domain ให้เพิ่ม origin/redirect ของ custom domain และเปลี่ยน `NEXTAUTH_URL` ให้ตรง

## 6. Migration และ seed

Migration ล่าสุดเพิ่ม `SpeakingSession.audioBlobPath`:

```text
prisma/migrations/20261120000000_add_audio_blob_path/migration.sql
```

รันจากเครื่องที่เข้าถึง production database ได้:

```powershell
npx vercel env run --environment=production -- npm run db:deploy
npx vercel env run --environment=production -- npm run db:seed
```

ห้ามใช้ `db:migrate` หรือ `migrate reset` กับ production

## 7. Deploy และตรวจสอบ

```powershell
npx vercel deploy
npx vercel deploy --prod
npx vercel curl / --deployment <deployment-url>
npx vercel curl /api/health --deployment <deployment-url>
npx vercel logs --environment production --level error --since 5m
```

`/api/health` ต้องคืน 200 เมื่อ PostgreSQL ตอบ `SELECT 1`; ถ้าไม่พร้อมจะคืน 503

## 8. Storage/AI smoke test

1. เปิด `/login` และ login ด้วย Google test user
2. ทำ onboarding แล้วเปิด `/teacher`
3. เปิด `/voice` อัดเสียงสั้น ๆ และตรวจ `storedInBlob: true`
4. ตรวจ Blob store ใต้ `audio/<userId>/` และ `SpeakingSession.audioBlobPath`
5. ตรวจ APIUsageLog, logout และ session expiry

Private Blob URL ไม่ใช่ public download URL หากต้องการ replay ภายหลังต้องเพิ่ม authenticated `get()` route ที่ตรวจ session/ownership ก่อน

## 9. Production notes

- Vercel Functions เป็น stateless; rate limiter ปัจจุบันเป็น in-memory ต่อ instance ควรย้ายไป Redis/Upstash ก่อน scale
- Audio จำกัด 8 MB และควรกำหนด retention/deletion policy ให้สอดคล้องกับ privacy policy
- Next.js 14 และ dependency audit ยังมี advisories จึงควรผ่าน security gate และวางแผนอัปเกรดก่อนเปิดผู้ใช้ทั่วไป
