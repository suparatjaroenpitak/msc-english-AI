# Phases 06–14: จาก Voice ถึง Production

ผู้ใช้เลือกให้ทำต่อยาวจนจบ จึงรวม implementation และวิธีใช้งานของ Phase 06–14 ไว้ในเอกสารนี้ หลัง Phase 05 โปรเจกต์มี MVP ที่ build ได้ครบเส้นทางหลัก ตั้งแต่พูดกับ Whisper ไปจนถึงข้อสอบและ Docker deployment

## Phase 06 — AI Voice Conversation

เพิ่ม `POST /api/voice/transcribe` และหน้า `/voice` สำหรับ Push-to-Talk: Browser ขอ microphone permission, MediaRecorder เก็บ Blob, server ตรวจ session/MIME/ขนาดไม่เกิน 8 MB แล้วส่ง Groq Whisper ตาม `GROQ_STT_MODEL` ค่าเริ่มต้น `whisper-large-v3-turbo` จากนั้นบันทึก SpeakingSession และ APIUsageLog

รองรับ fallback เมื่อ browser ไม่มี MediaRecorder, ปฏิเสธ microphone หรือไฟล์ไม่ใช่ audio ที่อนุญาต ให้กลับไปใช้ text chat ที่ `/teacher` ได้ ระบบไม่อ้างว่า transcript เป็น phoneme accuracy score เพราะยังไม่มีระบบประเมินเสียงจริง

ไฟล์หลัก: `src/app/api/voice/transcribe/route.ts`, `src/components/voice-recorder.tsx`, `src/app/voice/page.tsx`

## Phase 07 — Grammar Correction

เพิ่ม `POST /api/ai/correct-grammar` และหน้า `/grammar/correction` ส่ง prompt แบบ JSON ให้ Groq แล้ว parse ด้วย Zod เป็น `correctedSentence`, `explanationTh`, `naturalExpression` และ `mistakes` เมื่อพบ mistake จะบันทึก GrammarMistake ด้วย session user id เพื่อวิเคราะห์ weak topics ต่อไป

ผลลัพธ์แสดงเป็น text ธรรมดา ไม่ใช้ `dangerouslySetInnerHTML` และจำกัด input 2,000 ตัวอักษร

## Phase 08 — Speaking และ Listening Academy

`src/lib/academy-data.ts` มี catalog สำหรับ six modules และ dynamic route `/academy/[module]` สร้างหน้า `/academy/speaking` กับ `/academy/listening` พร้อมบทเรียน/คำถามตัวอย่าง Speaking เชื่อม `/voice` ส่วน Listening มีสคริปต์และ comprehension prompt

## Phase 09 — Reading และ Writing Academy

Reading มีบทอ่านตามระดับและคำถามจับใจความ Writing มีโจทย์อีเมล/paragraph และเชื่อม Grammar Coach การตรวจ writing ตอนนี้เน้น grammar/natural expression ก่อนเพิ่ม rubric ด้าน coherence และ essay ในรอบเนื้อหาหลักสูตร

## Phase 10 — Vocabulary และ Grammar Academy

`GET /api/vocabulary` โหลด UserVocabulary ของ session user เท่านั้น และ `POST /api/vocabulary` รับเฉพาะ `vocabularyId` ที่มีใน catalog แล้ว upsert ด้วย unique คู่ `userId_vocabularyId` จึงกันคำศัพท์ซ้ำโดย database หน้า `/vocabulary` แสดง IPA/Thai/example/status โดยไม่เดาคำอ่าน ส่วน `/grammar` แสดงหัวข้อ grammar และลิงก์ไป Grammar Coach

## Phase 11 — AI Exam System

เพิ่ม `GET/POST /api/exams`, `POST /api/exams/submit` และหน้า `/exam` โดย `exam-generator.ts` เรียก Groq JSON mode เมื่อมี key และ fallback เป็นชุดคำถามตรวจสอบแล้วเมื่อไม่มี key/โควตาไม่พอ

GET ส่ง prompt/options เท่านั้น ไม่ส่ง `correctOption` หรือ explanations; submit โหลดเฉลยจาก server ตรวจ exam ownership คำนวณด้วย `scoreExam`, บันทึก ExamAttempt/ExamAnswer แล้วค่อยส่งคะแนนกับคำอธิบายกลับ Practice/Exam mode ถูกเก็บใน schema และ Exam mode ได้ time limit จาก server

## Phase 12 — Dashboard และ Progress

Dashboard เชื่อม Teacher, Voice และ Progress หน้า `/progress` โหลด LearningProfile, DailyLearningProgress และ GrammarMistake ที่ยังไม่ resolved ส่วน `GET /api/learning/progress` คืนข้อมูลรวมสำหรับกราฟภายหลัง ทุก query ใช้ session user id

เพิ่ม `/api/health` ตรวจ `SELECT 1` กับ PostgreSQL และคืน 503 เมื่อ database down

## Phase 13 — Testing และ Security

เพิ่ม Vitest tests ที่ไม่พึ่ง network/database: `tests/unit/exam-scoring.test.ts`, `tests/unit/rate-limit.test.ts`, `tests/unit/academy-data.test.ts` ตรวจคะแนน, rate window และ catalog รวม 4 tests

คำสั่งตรวจ:

```powershell
npm test
npm run typecheck
npm run build
```

Security baseline: server-side session/ownership, Zod validation, server-only Groq key, audio MIME/8 MB limit, rate limit, Prisma cascade/SetNull, security response headers, prompt injection guidance, และ DELETE account ที่ต้องยืนยัน `DELETE_MY_ACCOUNT` การจำกัด rate แบบ Map เหมาะกับ MVP เท่านั้น ก่อน scale ต้องย้ายไป Redis/Upstash หรือ shared store และเพิ่ม observability ที่ redact PII

## Phase 14 — Production Deployment

เพิ่ม `Dockerfile`, `.dockerignore` และ `output: "standalone"` ใน `next.config.mjs`

```powershell
docker build -t ai-english-tutor-academy:latest .
docker run --rm --env-file .env.production -p 3000:3000 ai-english-tutor-academy:latest
```

Production environment อย่างน้อย: `DATABASE_URL`, `NEXTAUTH_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_ADVANCED_MODEL`, `GROQ_STT_MODEL`

Release sequence:

1. ตั้ง PostgreSQL และ secret manager
2. รัน `npm run db:deploy` เป็น job แยกก่อนเปิด app replicas
3. build image ด้วย `npm ci` จาก lockfile
4. deploy และตรวจ `GET /api/health`
5. ตั้ง Google production origin/redirect URI ให้ตรง `NEXTAUTH_URL`
6. ตรวจ login, dashboard, teacher, voice ด้วย test user
7. ดู APIUsageLog และ Groq quota

ห้ามรัน `prisma migrate reset` บน production และห้ามใส่ `.env.local` ใน image/Git Dockerfile ใช้ `.dockerignore` กัน env, tests, docs และ build artifacts ออกจาก context

Vercel ใช้ได้โดยตั้ง environment variables ใน Project Settings และรัน migration เป็น CI job แยก ไม่ผูก `db:migrate` กับทุก serverless build เมื่อมีหลาย instance

## Final verification

```powershell
npm test
npm run typecheck
npm run build
```

ถ้ามี PostgreSQL:

```powershell
npm run db:validate
npm run db:deploy
npm run db:seed
```

สถานะที่ยืนยันใน workspace: unit tests ผ่าน 4 tests, TypeScript ผ่าน, production build ผ่านและสร้าง routes ของ MVP ครบ ส่วน OAuth, Groq, Whisper และ migration จริงต้องใช้ credentials/database ของผู้ deploy จึงต้องทำ smoke testจริงก่อนเปิดผู้ใช้ทั่วไป
