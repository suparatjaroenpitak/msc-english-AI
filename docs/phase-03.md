# Phase 03: PostgreSQL และ Prisma

## 1. เป้าหมาย

Phase นี้วางฐานข้อมูลสำหรับผู้ใช้ บัญชี Google ในอนาคต โปรไฟล์การเรียน บทเรียน ประวัติการสนทนา เสียง คำศัพท์ Grammar Exam ความก้าวหน้ารายวัน และการบันทึกการใช้ AI โดยใช้ PostgreSQL + Prisma ORM 6.19.0

Prisma 6.19.0 ถูกเลือกให้เข้ากับ Node.js 24.21.0 ของเครื่องนี้และ Next.js 14 ในบทเรียนเดิม เอกสาร Prisma ระบุสาย Node.js 24 ที่รองรับไว้ใน [System requirements](https://docs.prisma.io/docs/orm/reference/system-requirements) ส่วนชื่อโมเดล Auth ถูกออกแบบให้ตรงกับ Prisma Adapter ของ NextAuth/Auth.js v4 ที่จะติดตั้งใน Phase 04

ผลที่ได้:

- `prisma/schema.prisma` มี entities ตาม Master Prompt พร้อม enum, relation, index, unique constraint และ cascade rules
- `prisma/migrations/20261119000000_init/migration.sql` เป็น SQL initial migration ที่สร้างจาก `prisma migrate diff`
- `prisma/seed.ts` มีบทเรียนตัวอย่าง 2 รายการและคำศัพท์ `improve` พร้อม upsert จึงรันซ้ำได้
- `src/lib/prisma.ts` สร้าง PrismaClient singleton และป้องกันการเปิด client ซ้ำใน Next.js development hot reload
- `docker-compose.yml` เตรียม PostgreSQL 16 local แบบ persistent volume
- scripts สำหรับ generate, validate, migrate, deploy, seed และ studio

## 2. โครงสร้างข้อมูลและ ownership

```text
User ── LearningProfile / TeacherPreference
  ├── LessonProgress ── Lesson
  ├── Conversation ── ChatMessage
  │                  └─ SpeakingSession
  ├── UserVocabulary ── Vocabulary
  ├── GrammarMistake
  ├── Exam ── ExamQuestion ── ExamAnswer ── ExamAttempt
  ├── DailyLearningProgress
  └── APIUsageLog
Auth.js: User ── Account / Session / VerificationToken
```

ทุกข้อมูลที่เป็นของผู้ใช้มี `userId` และ index ที่เริ่มด้วย userId เพื่อให้ repository ใน Phase ถัดไปบังคับ ownership ได้ เช่น query ความก้าวหน้าต้องมีทั้ง `userId` และ id ของรายการ ไม่รับ userId จาก client มาเป็นสิทธิ์โดยไม่มี session

ข้อมูลที่ควรเป็น shared catalog ได้แก่ `Lesson` และ `Vocabulary` จึงไม่มี userId และมี unique key (`slug`, `word`) ส่วน `Exam.userId` เป็น optional: null หมายถึง exam template กลาง, มีค่าเมื่อ AI สร้างให้ผู้ใช้เฉพาะคน

เฉลยข้อสอบอยู่ใน `ExamQuestion.correctOption` ฝั่ง server และ `ExamQuestion.explanations` ไม่ควรส่งออกมาก่อน submit ใน API Phase 11 แม้ schema จะอ่านได้จาก server ทุกอย่าง

## 3. Entities สำคัญ

| กลุ่ม | Models | กฎสำคัญ |
|---|---|---|
| Auth.js | User, Account, Session, VerificationToken | ชื่อ field ตรง adapter; ลบ User แล้วลบ account/session ตาม cascade |
| Profile | LearningProfile, TeacherPreference | userId unique เป็น one-to-one; level เริ่ม A1; ค่า preference มี default |
| Lessons | Lesson, LessonProgress | slug และคู่ userId+lessonId unique; ลบ lesson แล้วลบ progress |
| AI chat/voice | Conversation, ChatMessage, SpeakingSession | message อยู่ใต้ conversation; session เสียงอ้างอิง conversation แบบ SetNull |
| Vocabulary | Vocabulary, UserVocabulary | word และคู่ userId+vocabularyId unique; dueAt/status รองรับ spaced repetition |
| Grammar | GrammarMistake | เก็บ occurrenceCount และ resolvedAt เพื่อวิเคราะห์จุดอ่อน |
| Exams | Exam, ExamQuestion, ExamAttempt, ExamAnswer | order ต่อ exam unique และ answer ต่อ attempt+question unique |
| Analytics | DailyLearningProgress, APIUsageLog | หนึ่ง progress ต่อ user+date; usage log รองรับ user nullable และเก็บ token/status |

`String[]` และ `Json` ใช้กับข้อมูลที่มีโครงสร้างยืดหยุ่น เช่น weak topics, synonyms, feedback, options และ explanations แต่ API ต้อง validate รูปแบบด้วย Zod เมื่อเริ่มรับข้อมูลจาก client

## 4. Packages และ scripts

Runtime: `@prisma/client@6.19.0`, `server-only@0.0.1`

Development: `prisma@6.19.0`, `tsx@4.20.6`, `dotenv@16.6.1`

คำสั่งที่เพิ่มใน `package.json`:

```powershell
npm run db:generate  # สร้าง client จาก schema
npm run db:validate  # ตรวจ schema โดยไม่ต่อ database
npm run db:migrate   # สร้างและ apply migration ใน development
npm run db:deploy    # apply migration ที่ commit แล้วใน deployment
npm run db:seed      # รัน prisma/seed.ts
npm run db:studio    # เปิด Prisma Studio
```

Prisma เตือนว่า `package.json#prisma` จะ deprecated ใน Prisma 7 แต่ Phase นี้ pin Prisma 6.19 เพื่อให้เข้ากับ stack Next.js 14 และใช้วิธี seed ที่ตรวจสอบได้แล้ว ก่อนอัปเกรด Prisma ให้ย้าย config ไป `prisma.config.ts` ตาม migration guide และทดสอบทั้งหมดใหม่

## 5. ตั้งค่า PostgreSQL local

ติดตั้ง Docker Desktop ก่อน หากเครื่องมี Docker แล้ว:

```powershell
docker compose up -d postgres
```

สร้างไฟล์ `.env.local` จากค่าใน `.env.example` (ไฟล์จริงถูก ignore โดย Git):

```powershell
Copy-Item .env.example .env.local
```

ค่า local ที่ compose เตรียมให้คือ:

```text
DATABASE_URL=postgresql://academy:academy_dev_password@localhost:5432/english_academy?schema=public
```

จากนั้น:

```powershell
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
npm run db:studio
```

คำสั่ง `db:migrate -- --name init` จะสร้าง migration ใหม่เมื่อฐานข้อมูลพร้อมอยู่แล้ว ถ้าใช้ migration ที่ commit ไว้ใน repository ให้ใช้:

```powershell
npm run db:deploy
npm run db:seed
```

อย่าใช้ `migrate reset` กับข้อมูลจริง เพราะจะลบตารางและข้อมูลทั้งหมด ใน development ที่ต้องล้างจริงให้ตรวจ `DATABASE_URL` ว่าเป็น local ก่อนเสมอ

## 6. วิธีทำงานของ migration

ไฟล์ใน `prisma/migrations/20261119000000_init/migration.sql` ถูกสร้างจาก schema ด้วย:

```powershell
$env:DATABASE_URL='postgresql://academy:academy_dev_password@localhost:5432/english_academy?schema=public'
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
```

ในเครื่องนี้ schema ถูก validate และ migration SQL ถูก render แล้ว แต่ `prisma migrate deploy` ยัง apply ไม่ได้ เพราะไม่มี PostgreSQL/Docker endpoint ที่ localhost:5432 หากคำสั่งล้มเหลวด้วย connection error ให้เริ่ม compose แล้วลองใหม่ ไม่ต้องแก้ schema ตาม error ที่เป็นการเชื่อมต่อ

Production flow ให้ commit migration SQL, ตั้ง `DATABASE_URL` ใน secret manager และรัน `npm run db:deploy` ใน release step ห้ามรัน `db:migrate` บน production เพราะ command นี้มีขั้นตอน interactive และใช้สร้าง migration ใหม่

## 7. Seed data

Seed ใช้ `upsert`:

- lesson `speaking-self-introduction-a1`
- lesson `grammar-past-simple-a2`
- vocabulary `improve`

การรันซ้ำไม่สร้างข้อมูลซ้ำ เพราะใช้ `slug` และ `word` เป็น unique keys หากต้องเพิ่ม seed ใหม่ ให้ใช้ stable unique key และอย่าลบข้อมูลของผู้ใช้ใน seed

## 8. วิธีตรวจสอบและผลจริง

รันแล้วผ่าน:

```powershell
npx prisma format --check
$env:DATABASE_URL='postgresql://academy:academy_dev_password@localhost:5432/english_academy?schema=public'
npm run db:validate
npm run db:generate
npm run typecheck
npm run build
```

ผลคือ schema valid, Prisma Client generate สำเร็จ, TypeScript ผ่าน และ Next.js production build ผ่าน

ยังรัน `db:migrate` และ `db:seed` กับฐานข้อมูลจริงไม่ได้ เพราะ environment นี้ไม่พบ `psql`, `pg_isready`, Docker หรือ PostgreSQL service จึงยังไม่มีหลักฐานว่าการเชื่อมต่อ network ไป database ใช้งานได้ นี่เป็นข้อจำกัดด้าน environment ไม่ใช่ schema validation failure

## 9. ปัญหาที่พบบ่อย

| อาการ | วิธีแก้ |
|---|---|
| `DATABASE_URL` not found | สร้าง `.env.local` หรือกำหนด `$env:DATABASE_URL` ก่อนเรียก Prisma |
| `P1001 Can't reach database` | รัน `docker compose up -d postgres`, ตรวจ port 5432 และลอง `docker compose logs postgres` |
| `P3005 database schema not empty` | ใช้ database ใหม่หรือทำ baseline อย่างระวัง อย่า reset production |
| `PrismaClientInitializationError` ใน Next.js | import `prisma` จาก `@/lib/prisma` เฉพาะ Server Components/Route Handlers; อย่า import ใน Client Component |
| seed สร้างซ้ำ | ตรวจว่า upsert ใช้ unique `slug`/`word` และ migration มี unique index |
| Array field ใช้กับ database อื่นไม่ได้ | Schema นี้ตั้งใจใช้ PostgreSQL; อย่าสลับ provider เป็น SQLite |
| Prisma warning เรื่อง package.json config | เป็น deprecation warning ของ Prisma 7; Phase นี้ยัง pin v6.19 และต้องย้าย config ตอนอัปเกรด |
| Migration lock error | ตรวจ `prisma/migrations/migration_lock.toml` ว่า provider เป็น `postgresql` และไม่สลับ provider กลางโปรเจกต์ |

## 10. Checklist

- [x] Pin Prisma CLI และ Client เป็น 6.19.0
- [x] สร้าง PostgreSQL schema ครบตาม entities ที่กำหนด
- [x] เพิ่ม relations, indexes, unique constraints และ delete rules
- [x] เพิ่ม initial migration SQL และ migration lock
- [x] เพิ่ม seed ที่รันซ้ำได้
- [x] เพิ่ม singleton Prisma client แบบ server-only
- [x] เพิ่ม Docker Compose สำหรับ PostgreSQL local
- [x] ตรวจ format, validate, generate, typecheck และ build
- [ ] เปิด PostgreSQL จริงแล้วรัน migrate + seed
- [ ] ตรวจ query ownership ด้วย integration tests ใน Phase 13

หยุดที่ Phase 03 ตามลำดับบทเรียน พิมพ์ **ต่อ** เพื่อเริ่ม Phase 04: Google OAuth Login และ protected routes

## 11. Source code เต็มทุกไฟล์ที่เพิ่มหรือแก้

โค้ดด้านล่างเป็น snapshot จากไฟล์จริงของ Phase 03; migration SQL มีอยู่ใน repository แล้วและถูกสร้างจาก Prisma diff.

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
    "@prisma/client": "6.19.0",
    "@radix-ui/react-slot": "1.1.2",
    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "lucide-react": "0.468.0",
    "next": "14.2.35",
    "next-themes": "0.4.6",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "server-only": "0.0.1",
    "tailwind-merge": "2.6.0"
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
GROQ_API_KEY=replace_me
GROQ_MODEL=openai/gpt-oss-20b
GROQ_ADVANCED_MODEL=openai/gpt-oss-120b
GROQ_STT_MODEL=whisper-large-v3-turbo
AUTH_SECRET=replace_me
AUTH_GOOGLE_ID=replace_me
AUTH_GOOGLE_SECRET=replace_me


```

### docker-compose.yml

```
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: academy
      POSTGRES_PASSWORD: academy_dev_password
      POSTGRES_DB: english_academy
    ports:
      - "5432:5432"
    volumes:
      - english_academy_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U academy -d english_academy"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  english_academy_postgres_data:


```

### prisma/schema.prisma

```
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum CEFRLevel {
  A1
  A2
  B1
  B2
  C1
  C2
}

enum LessonModule {
  SPEAKING
  LISTENING
  READING
  WRITING
  VOCABULARY
  GRAMMAR
}

enum LessonProgressStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
}

enum ConversationMode {
  TEXT
  VOICE
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}

enum Accent {
  AMERICAN
  BRITISH
}

enum ExplanationMode {
  ENGLISH_ONLY
  ENGLISH_THAI
}

enum VocabularySource {
  OXFORD_3000
  OXFORD_5000
  TOEIC
  GOVERNMENT_EXAM
  BUSINESS_ENGLISH
  DAILY_ENGLISH
  AI_GENERATED
}

enum VocabularyReviewStatus {
  NEW
  LEARNING
  REVIEW
  MASTERED
}

enum ExamCategory {
  CEFR
  TOEIC
  GOVERNMENT_EXAM
  TEACHER_ASSISTANT
  GRAMMAR
  VOCABULARY
  READING
}

enum ExamMode {
  PRACTICE
  EXAM
}

enum ExamStatus {
  DRAFT
  READY
  ARCHIVED
}

model User {
  id                String                  @id @default(cuid())
  name              String?
  email             String?                 @unique
  emailVerified     DateTime?
  image             String?
  createdAt         DateTime                @default(now())
  updatedAt         DateTime                @updatedAt
  accounts          Account[]
  sessions          Session[]
  learningProfile   LearningProfile?
  teacherPreference TeacherPreference?
  lessonProgress    LessonProgress[]
  conversations     Conversation[]
  speakingSessions  SpeakingSession[]
  userVocabulary    UserVocabulary[]
  grammarMistakes   GrammarMistake[]
  exams             Exam[]
  examAttempts      ExamAttempt[]
  dailyProgress     DailyLearningProgress[]
  apiUsageLogs      APIUsageLog[]

  @@index([createdAt])
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expires])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model LearningProfile {
  id                  String    @id @default(cuid())
  userId              String    @unique
  level               CEFRLevel @default(A1)
  dailyStudyMinutes   Int       @default(15)
  learningStreak      Int       @default(0)
  totalStudyMinutes   Int       @default(0)
  onboardingCompleted Boolean   @default(false)
  weakTopics          String[]  @default([])
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model TeacherPreference {
  id              String          @id @default(cuid())
  userId          String          @unique
  teacherName     String          @default("Alex")
  personality     String          @default("encouraging")
  accent          Accent          @default(AMERICAN)
  explanationMode ExplanationMode @default(ENGLISH_THAI)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  user            User            @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Lesson {
  id          String           @id @default(cuid())
  slug        String           @unique
  title       String
  description String?
  module      LessonModule
  level       CEFRLevel
  content     Json
  published   Boolean          @default(false)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  progress    LessonProgress[]

  @@index([module, level])
  @@index([published])
}

model LessonProgress {
  id           String               @id @default(cuid())
  userId       String
  lessonId     String
  status       LessonProgressStatus @default(NOT_STARTED)
  score        Int?
  minutesSpent Int                  @default(0)
  startedAt    DateTime?
  completedAt  DateTime?
  createdAt    DateTime             @default(now())
  updatedAt    DateTime             @updatedAt
  user         User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson       Lesson               @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@unique([userId, lessonId])
  @@index([userId, status])
}

model Conversation {
  id               String            @id @default(cuid())
  userId           String
  title            String            @default("New conversation")
  mode             ConversationMode  @default(TEXT)
  startedAt        DateTime          @default(now())
  endedAt          DateTime?
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
  user             User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages         ChatMessage[]
  speakingSessions SpeakingSession[]

  @@index([userId, updatedAt])
}

model ChatMessage {
  id               String       @id @default(cuid())
  conversationId   String
  role             MessageRole
  content          String
  correctedText    String?
  thaiExplanation  String?
  metadata         Json?
  promptTokens     Int?
  completionTokens Int?
  createdAt        DateTime     @default(now())
  conversation     Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId, createdAt])
}

model SpeakingSession {
  id              String        @id @default(cuid())
  userId          String
  conversationId  String?
  scenario        String
  durationSeconds Int           @default(0)
  transcript      String?
  feedback        Json?
  score           Int?
  createdAt       DateTime      @default(now())
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  conversation    Conversation? @relation(fields: [conversationId], references: [id], onDelete: SetNull)

  @@index([userId, createdAt])
}

model Vocabulary {
  id              String           @id @default(cuid())
  word            String           @unique
  partOfSpeech    String?
  ipa             String?
  translationTh   String
  definition      String?
  exampleSentence String?
  exampleThai     String?
  synonyms        String[]         @default([])
  antonyms        String[]         @default([])
  collocations    String[]         @default([])
  source          VocabularySource @default(AI_GENERATED)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  userVocabulary  UserVocabulary[]

  @@index([source])
}

model UserVocabulary {
  id             String                 @id @default(cuid())
  userId         String
  vocabularyId   String
  status         VocabularyReviewStatus @default(NEW)
  dueAt          DateTime               @default(now())
  repetitions    Int                    @default(0)
  intervalDays   Int                    @default(0)
  easeFactor     Float                  @default(2.5)
  lastReviewedAt DateTime?
  createdAt      DateTime               @default(now())
  updatedAt      DateTime               @updatedAt
  user           User                   @relation(fields: [userId], references: [id], onDelete: Cascade)
  vocabulary     Vocabulary             @relation(fields: [vocabularyId], references: [id], onDelete: Cascade)

  @@unique([userId, vocabularyId])
  @@index([userId, dueAt])
  @@index([userId, status])
}

model GrammarMistake {
  id              String    @id @default(cuid())
  userId          String
  topic           String
  sourceText      String
  correctedText   String
  explanationTh   String?
  occurrenceCount Int       @default(1)
  resolvedAt      DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, topic])
  @@index([userId, resolvedAt])
}

model Exam {
  id               String         @id @default(cuid())
  userId           String?
  title            String
  category         ExamCategory
  level            CEFRLevel
  mode             ExamMode       @default(PRACTICE)
  questionCount    Int
  timeLimitSeconds Int?
  status           ExamStatus     @default(READY)
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  user             User?          @relation(fields: [userId], references: [id], onDelete: Cascade)
  questions        ExamQuestion[]
  attempts         ExamAttempt[]

  @@index([userId, createdAt])
  @@index([category, level])
}

model ExamQuestion {
  id            String       @id @default(cuid())
  examId        String
  order         Int
  prompt        String
  options       Json
  correctOption Int
  explanations  Json?
  createdAt     DateTime     @default(now())
  exam          Exam         @relation(fields: [examId], references: [id], onDelete: Cascade)
  answers       ExamAnswer[]

  @@unique([examId, order])
  @@index([examId])
}

model ExamAttempt {
  id          String       @id @default(cuid())
  userId      String
  examId      String
  score       Int?
  total       Int
  startedAt   DateTime     @default(now())
  submittedAt DateTime?
  createdAt   DateTime     @default(now())
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  exam        Exam         @relation(fields: [examId], references: [id], onDelete: Cascade)
  answers     ExamAnswer[]

  @@index([userId, createdAt])
  @@index([examId])
}

model ExamAnswer {
  id             String       @id @default(cuid())
  attemptId      String
  questionId     String
  selectedOption Int?
  isCorrect      Boolean?
  createdAt      DateTime     @default(now())
  attempt        ExamAttempt  @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  question       ExamQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@unique([attemptId, questionId])
  @@index([questionId])
}

model DailyLearningProgress {
  id                 String   @id @default(cuid())
  userId             String
  date               DateTime @db.Date
  studyMinutes       Int      @default(0)
  lessonsCompleted   Int      @default(0)
  speakingMinutes    Int      @default(0)
  vocabularyReviewed Int      @default(0)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date])
  @@index([userId, date])
}

model APIUsageLog {
  id               String   @id @default(cuid())
  userId           String?
  provider         String   @default("groq")
  model            String
  endpoint         String
  requestId        String?
  promptTokens     Int      @default(0)
  completionTokens Int      @default(0)
  statusCode       Int
  errorCode        String?
  createdAt        DateTime @default(now())
  user             User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId, createdAt])
  @@index([endpoint, createdAt])
}


```

### prisma/seed.ts

```
import { PrismaClient, CEFRLevel, LessonModule, VocabularySource } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const lessons = [
    {
      slug: "speaking-self-introduction-a1",
      title: "Introduce Yourself",
      description: "ประโยคพื้นฐานสำหรับแนะนำตัวเอง",
      module: LessonModule.SPEAKING,
      level: CEFRLevel.A1,
      content: {
        objective: "แนะนำชื่อ อาชีพ และสิ่งที่ชอบเป็นภาษาอังกฤษ",
        openingPrompt: "Hello! What is your name?",
      },
      published: true,
    },
    {
      slug: "grammar-past-simple-a2",
      title: "Past Simple: Everyday Stories",
      description: "เล่าเหตุการณ์ที่เกิดขึ้นแล้วอย่างมั่นใจ",
      module: LessonModule.GRAMMAR,
      level: CEFRLevel.A2,
      content: {
        objective: "ใช้ past simple กับเหตุการณ์ในอดีต",
        examples: ["I went to work yesterday.", "She watched a film last night."],
      },
      published: true,
    },
  ];

  for (const lesson of lessons) {
    await prisma.lesson.upsert({ where: { slug: lesson.slug }, update: lesson, create: lesson });
  }

  const vocabulary = [
    {
      word: "improve",
      partOfSpeech: "verb",
      ipa: "/ɪmˈpruːv/",
      translationTh: "ปรับปรุงให้ดีขึ้น",
      definition: "to make something better",
      exampleSentence: "We need to improve our English skills.",
      exampleThai: "เราจำเป็นต้องพัฒนาทักษะภาษาอังกฤษของเรา",
      synonyms: ["develop", "enhance"],
      antonyms: ["worsen"],
      collocations: ["improve skills", "improve performance"],
      source: VocabularySource.DAILY_ENGLISH,
    },
  ];

  for (const word of vocabulary) {
    await prisma.vocabulary.upsert({ where: { word: word.word }, update: word, create: word });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });


```

### src/lib/prisma.ts

```
import "server-only";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;


```

### prisma/migrations/migration_lock.toml

```
# Please do not edit this file manually.
provider = "postgresql"


```
