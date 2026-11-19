# Phase 02: Setup Tailwind CSS และ shadcn/ui

## 1. เป้าหมายและแนวทาง

Phase นี้เปลี่ยน CSS หน้าเริ่มต้นให้เป็น Tailwind utilities และวางคอมโพเนนต์ที่นำกลับมาใช้ได้สำหรับหน้าบทเรียนในอนาคต ได้ Button, Card และ Badge พร้อมไอคอน Lucide และโหมดสว่าง/มืดที่จดจำการเลือกในเบราว์เซอร์

ใช้ Tailwind **3.4.19** ร่วมกับ Next.js **14.2.35** และ React **18.3.1** ตามโครงเดิม โดยติดตั้ง shadcn/ui แบบ manual: เก็บ source component ใน src/components/ui ไม่ต้องมีแพ็กเกจชื่อ shadcn/ui ใน runtime และไม่ต้องรัน CLI เพื่อให้คอมโพเนนต์ทำงาน

Button/Card/Badge ใช้รูปแบบ shadcn/ui สำหรับ React 18 และ Tailwind 3 ปรับ spacing, heading และสีให้เข้ากับเว็บเรา ส่วน ThemeToggle เป็นคอมโพเนนต์ของโปรเจกต์

แหล่งอ้างอิงทางการ:

- [Tailwind 3 กับ Next.js](https://v3.tailwindcss.com/docs/guides/nextjs)
- [shadcn: Tailwind v4 และความเข้ากันได้กับแอป Tailwind 3 / React 18](https://ui.shadcn.com/docs/tailwind-v4)
- [shadcn manual installation](https://ui.shadcn.com/docs/installation/manual) — เอกสารปัจจุบันใช้ stack ใหม่กว่า จึงไม่คัดลอก config Tailwind 4 มาผสมกับ Phase นี้

## 2. Packages ที่เพิ่ม

| Package | Version | หน้าที่ |
|---|---|---|
| tailwindcss | 3.4.19 | สร้าง utility CSS จาก class ที่ใช้ |
| postcss | 8.5.33 | ประมวลผล CSS ผ่าน plugins |
| autoprefixer | 10.4.21 | เติม CSS prefix ตาม browser targets |
| tailwindcss-animate | 1.0.7 | รองรับ animation utilities ของ UI ในอนาคต |
| @radix-ui/react-slot | 1.1.2 | ส่ง style/props ไป element ลูกเมื่อใช้ asChild |
| class-variance-authority | 0.7.1 | กำหนด variant และ size ของ component |
| clsx | 2.1.1 | รวม class แบบมีเงื่อนไข |
| tailwind-merge | 2.6.0 | แก้ class Tailwind 3 ที่ขัดกัน |
| lucide-react | 0.468.0 | SVG icons |
| next-themes | 0.4.6 | อ่านธีมระบบ สลับธีม และเก็บค่าที่เลือก |

ยังไม่ต้องใช้ React Hook Form หรือ Zod จนกว่าจะเริ่มทำแบบฟอร์มจริง

## 3. คำสั่ง Terminal

ไฟล์และแพ็กเกจใน workspace ถูกติดตั้งให้แล้ว หากทำตามด้วยตัวเองจาก Phase 01 ให้รัน:

```powershell
Set-Location -LiteralPath 'D:\งาน\ฝึก Eng\msc english AI\msc english AI'
npm install --save-exact @radix-ui/react-slot@1.1.2 class-variance-authority@0.7.1 clsx@2.1.1 tailwind-merge@2.6.0 lucide-react@0.468.0 next-themes@0.4.6
npm install -D --save-exact tailwindcss@3.4.19 postcss@8.5.33 autoprefixer@10.4.21 tailwindcss-animate@1.0.7
```

จากนั้นสร้าง/แทนที่ไฟล์ตามโค้ดเต็มในข้อ 10 ไม่มีคำสั่ง init ที่จำเป็น เพราะมี config ครบแล้ว หากดาวน์โหลดโปรเจกต์ที่มี package-lock.json ปัจจุบัน ใช้ `npm ci` แทนการติดตั้งทีละแพ็กเกจ

ไม่ใช้ --force หรือ --legacy-peer-deps การติดตั้งในเครื่องนี้สำเร็จโดยไม่ต้องข้ามการตรวจ peer dependencies

## 4. ไฟล์ที่เพิ่มและเปลี่ยน

```text
components.json                  เพิ่ม: config ของ shadcn tooling
tailwind.config.ts               เพิ่ม: scan paths, theme tokens, dark mode
postcss.config.mjs               เพิ่ม: Tailwind และ Autoprefixer
src/lib/utils.ts                 เพิ่ม: cn()
src/components/ui/button.tsx     เพิ่ม: ปุ่มและลิงก์ที่มีรูปแบบเดียวกัน
src/components/ui/card.tsx       เพิ่ม: ส่วนประกอบของการ์ด
src/components/ui/badge.tsx      เพิ่ม: ป้ายสถานะ
src/components/theme-provider.tsx เพิ่ม: client provider
src/components/theme-toggle.tsx  เพิ่ม: ปุ่มสลับธีม
src/app/layout.tsx               แก้: ครอบ ThemeProvider
src/app/globals.css              แทนที่: Tailwind directives และ light/dark tokens
src/app/page.tsx                 แทนที่: ใช้ UI components และ responsive utilities
src/app/loading.tsx              แก้: layout และสีจาก theme
src/app/error.tsx                แก้: ใช้ Button
src/app/not-found.tsx            แก้: ใช้ Button asChild กับ Next Link
package.json                    แก้: dependencies exact versions
package-lock.json               npm สร้าง/ปรับอัตโนมัติ
README.md                       แก้: เชื่อมคู่มือ Phase 02
docs/phase-02.md                 เพิ่ม: คู่มือนี้
```

ไฟล์จาก Phase 01 ที่ไม่ได้อยู่ในรายการยังใช้เวอร์ชันเดิม ไม่ต้องแก้ tsconfig เพราะมี alias @/* → ./src/* แล้ว

## 5. อธิบายโค้ดภาษาไทย

**Tailwind:** content ชี้ไป src ทุกไฟล์ TSX จึงค้นพบ class ของทั้ง page และ components แล้ว PostCSS สร้าง CSS ที่จำเป็น ใช้ class แบบเต็ม เช่น sm:grid-cols-2 ไม่ต่อชื่อ class ด้วยข้อความแบบ runtime เพราะ Tailwind อาจสแกนไม่พบ

**Design tokens:** globals.css เก็บสีเป็นค่า HSL ใน :root และ .dark ส่วน tailwind.config.ts map ชื่อเหล่านี้ไปเป็น bg-background, text-foreground, bg-primary และ border-border เมื่อเปลี่ยนธีมสีทั้งเว็บเปลี่ยนตาม โดยไม่ต้องเขียนสีแยกในทุก component

**cn():** clsx รวม class แบบมีเงื่อนไข แล้ว tailwind-merge แก้ class ที่ขัดกัน เช่น cn('p-6', 'p-4') เหลือ p-4 จึงให้ผู้เรียก component ปรับ spacing ได้

**Button:** cva กำหนด variant และ size; forwardRef เข้ากับ React 18; Radix Slot ทำให้ asChild ส่งรูปแบบปุ่มไปยัง a หรือ Link โดยไม่เกิด button ซ้อน a เช่นปุ่มสำรวจเป็นลิงก์ anchor จริง ส่วนปุ่มธีมเป็น button จริง มี focus ring และ disabled state

**Card:** แยก Header, Title, Description, Content และ Footer เพื่อจัดเนื้อหาได้ตามหน้าที่ CardTitle ใช้ h3 เพราะหน้าแรกมี h1 และ h2 อยู่แล้ว; CardDescription ใช้ p

**Badge:** แสดงสถานะสั้น ๆ ไม่มี click handler การ์ดบทเรียนยังระบุว่าเร็ว ๆ นี้ และไม่ทำให้เข้าใจว่าเริ่มบทเรียนได้แล้ว

**ThemeProvider:** next-themes เพิ่ม class dark ให้ html, อ่าน prefers-color-scheme เป็นค่าเริ่มต้น และเก็บค่าที่ผู้ใช้เลือกใน localStorage การครอบ children ใน client provider ไม่ได้ทำให้ Server Components ทั้งหมดกลายเป็น Client Components

**Hydration:** html ใช้ suppressHydrationWarning เพราะ next-themes ปรับ attribute ก่อน hydration ส่วน ThemeToggle รอ mounted ก่อนใช้ resolvedTheme และก่อนเปิดให้กด จึงให้ HTML รอบแรกของ server และ client ตรงกัน คำสั่งนี้ใช้เฉพาะ html ไม่ได้ใช้ซ่อน error ทุกตำแหน่ง

**Accessibility:** มี skip link, focus styles, aria-label และ aria-pressed สำหรับปุ่มโหมดมืด ไอคอนตกแต่งใช้ aria-hidden รองรับ reduced motion และปุ่มธีมมีขนาด 44px

**Responsive:** จอเล็กแสดงการ์ดคอลัมน์เดียว ตั้งแต่ 640px เป็น 2 คอลัมน์ และตั้งแต่ 1024px เป็น 3 คอลัมน์ ไม่มีการโหลด font จากภายนอกใน build

## 6. ขั้นตอน Run

```powershell
npm run dev
```

เปิด http://localhost:3000 ถ้า port ถูกใช้ ให้ `npm run dev -- -p 3001` และเปิด port 3001

ทดสอบ production:

```powershell
npm run typecheck
npm run build
npm start -- --hostname 127.0.0.1 -p 3017
```

เปิด http://127.0.0.1:3017 ใช้ Ctrl+C เพื่อหยุด server Phase นี้ไม่ต้องมี .env.local, Database หรือ API key

## 7. วิธีทดสอบและผลที่ตรวจได้จริง

ตรวจอัตโนมัติในเครื่องนี้แล้ว:

- npm install ผ่าน ไม่พบ peer dependency conflict
- npm run typecheck ผ่าน
- npm run build ผ่าน สร้าง / และ /_not-found สำเร็จ
- Production server เริ่มสำเร็จ; GET / ตอบ 200 และมี markup ของปุ่มธีม
- GET /missing-page ตอบ 404

เครื่องมือเบราว์เซอร์หมดเวลาขณะเปิดหน้า จึงยังไม่ยืนยันภาพจริง, hydration ใน browser หรือผลการกดปุ่มธีมจาก browser การตรวจ HTTP ไม่ได้แทนการตรวจ interaction รายการต่อไปให้ทำใน browser:

1. เปิดหน้าแรก เห็นการ์ด 6 หมวดและปุ่มดวงจันทร์/ดวงอาทิตย์
2. กดปุ่มธีม สีหน้าและการ์ดเปลี่ยน จากนั้น refresh ธีมที่เลือกควรยังอยู่
3. กดกลับอีกครั้งและใช้ Tab/Enter ทดสอบปุ่ม ควรเห็น focus ring
4. เปิด Console ตรวจว่าไม่มี hydration mismatch
5. ตั้ง viewport 375px, 768px และ 1280px ตรวจว่าเป็น 1, 2 และ 3 คอลัมน์ตามลำดับ และไม่มีแนวนอนล้น
6. กดสำรวจเส้นทางการเรียน ต้องเลื่อนถึงหัวข้อการ์ด
7. เปิด /missing-page และกดกลับหน้าหลัก
8. เปิด reduced motion ในระบบหรือ DevTools การเลื่อนควรไม่ใช้ smooth animation

ยังไม่มีฐานข้อมูลสำหรับ empty/success states ของการเรียน; loading/error/404 ได้ปรับรูปแบบแล้ว หน้าคงที่อาจโหลดเร็วเกินกว่าจะเห็น loading

**ผล npm audit:** พบ 12 แพ็กเกจที่ได้รับผลกระทบ (high 11, critical 1) รวมรายการที่ส่งต่อกันใน dependency tree ไม่ใช่ 12 ช่องโหว่ที่แยกกันทั้งหมด นอกจาก Next.js/PostCSS ที่ติดมากับ Next.js 14 ยังมีสาย dependencies ของ Tailwind 3 ที่เกี่ยวกับ picomatch การติดตั้ง PostCSS รุ่นใหม่โดยตรงไม่ได้แทนที่ PostCSS ภายใน Next.js อัตโนมัติ ขณะนี้ยังไม่แก้ด้วยการข้าม major; ต้องอัปเกรดและทดสอบ stack ก่อนเปิดบริการจริง อย่าใช้ npm audit fix --force โดยไม่ตรวจผลการเปลี่ยนเวอร์ชัน

Prisma validation จะทำใน Phase 03 เมื่อมี schema จริง

## 8. ปัญหาที่พบบ่อย

| ปัญหา | วิธีตรวจ/แก้ |
|---|---|
| Tailwind class ไม่แสดงผล | ตรวจ content path, import globals.css ใน layout และ restart dev server หลังเปลี่ยน config |
| VS Code แจ้ง Unknown at rule @tailwind | เป็นคำเตือน CSS editor; ติดตั้ง Tailwind CSS IntelliSense และดูผล build เป็นหลัก |
| สีไม่เปลี่ยนเมื่อกดธีม | ตรวจว่า ThemeProvider ครอบ children, attribute เป็น class และ darkMode ใน config เป็น class |
| ไอคอนธีมผิดตอนโหลดแรก | รอ mounted ก่อนอ่าน resolvedTheme ตามโค้ด ไม่อ่าน localStorage ใน server render |
| Import @/components ไม่พบ | ตรวจ tsconfig paths และสะกดชื่อไฟล์ให้ตรงตัวพิมพ์เพื่อรองรับ Linux deploy |
| ติดตั้ง tailwind-merge รุ่นใหม่แล้ว class รวมผิด | Phase นี้ใช้ 2.6.0 สำหรับ Tailwind 3; อย่าสลับเป็นรุ่นสำหรับ Tailwind 4 โดยไม่ตรวจ |
| คัดลอก shadcn ปัจจุบันแล้ว CSS error | อย่าผสม @import tailwindcss หรือ theme syntax ของ Tailwind 4 กับ config นี้ ใช้ source ในคู่มือนี้ |
| npm.ps1 ถูกบล็อก | ใช้ npm.cmd แทน npm |

## 9. Checklist

- [x] ติดตั้ง dependencies และบันทึก lockfile
- [x] ตั้งค่า Tailwind, PostCSS และ components.json
- [x] มี cn, Button, Card, Badge และ Lucide icons ที่ถูกใช้ในหน้าเว็บ
- [x] เพิ่ม ThemeProvider/ThemeToggle พร้อมการจดจำธีม
- [x] ปรับหน้าแรกและหน้ารองรับ loading/error/404
- [x] TypeScript, production build และ HTTP smoke checks ผ่าน
- [x] มีคำสั่ง, โค้ดเต็ม, คำอธิบาย, troubleshooting และรายงานข้อจำกัด
- [ ] ตรวจ responsive และ theme interaction ด้วย browser ตามข้อ 7
- [ ] แก้ dependency advisories ก่อน production

หยุดที่ Phase 02 ตามลำดับบทเรียน พิมพ์ **ต่อ** เพื่อเริ่ม Phase 03: PostgreSQL และ Prisma

## 10. Source code เต็มทุกไฟล์ที่เพิ่มหรือแก้

โค้ดด้านล่างเป็น snapshot จากไฟล์จริง ณ Phase 02 ไม่รวม lockfile ที่ npm สร้างและตัวคู่มือเอง

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
    "@radix-ui/react-slot": "1.1.2",
    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "lucide-react": "0.468.0",
    "next": "14.2.35",
    "next-themes": "0.4.6",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "tailwind-merge": "2.6.0"
  },
  "devDependencies": {
    "@types/node": "22.10.2",
    "@types/react": "18.3.18",
    "@types/react-dom": "18.3.5",
    "autoprefixer": "10.4.21",
    "postcss": "8.5.33",
    "tailwindcss": "3.4.19",
    "tailwindcss-animate": "1.0.7",
    "typescript": "5.7.3"
  }
}
```


### components.json

```
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```


### tailwind.config.ts

```
import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))", input: "hsl(var(--input))", ring: "hsl(var(--ring))",
        background: "hsl(var(--background))", foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
    },
  },
  plugins: [animate],
};
export default config;
```


### postcss.config.mjs

```
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```


### src/lib/utils.ts

```
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```


### src/components/ui/button.tsx

```
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: { default: "h-11 px-4 py-2", sm: "h-9 rounded-md px-3", lg: "h-12 rounded-md px-6", icon: "h-11 w-11" },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";
export { Button, buttonVariants };
```


### src/components/ui/card.tsx

```
import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
));
Card.displayName = "Card";
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
));
CardHeader.displayName = "CardHeader";
const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-xl font-semibold leading-normal tracking-tight", className)} {...props} />
));
CardTitle.displayName = "CardTitle";
const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm leading-7 text-muted-foreground", className)} {...props} />
));
CardDescription.displayName = "CardDescription";
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
));
CardFooter.displayName = "CardFooter";
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
```


### src/components/ui/badge.tsx

```
import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", {
  variants: { variant: {
    default: "border-transparent bg-primary text-primary-foreground",
    secondary: "border-transparent bg-secondary text-secondary-foreground",
    outline: "text-foreground",
  } },
  defaultVariants: { variant: "default" },
});
interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}
export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
```


### src/components/theme-provider.tsx

```
"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props} />;
}
```


### src/components/theme-toggle.tsx

```
"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  return (
    <Button type="button" variant="outline" size="icon" disabled={!mounted}
      aria-label="โหมดมืด" aria-pressed={isDark}
      onClick={() => setTheme(isDark ? "light" : "dark")}>
      {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  );
}
```


### src/app/layout.tsx

```
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "AI English Tutor Academy",
  description: "พื้นที่ฝึกภาษาอังกฤษสำหรับผู้เรียนชาวไทย ตั้งแต่ Beginner ถึง Advanced",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```


### src/app/globals.css

```
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    color-scheme: light;
    --background: 72 24% 96%;
    --foreground: 161 35% 17%;
    --card: 0 0% 100%;
    --card-foreground: 161 35% 17%;
    --popover: 0 0% 100%;
    --popover-foreground: 161 35% 17%;
    --primary: 161 41% 25%;
    --primary-foreground: 0 0% 100%;
    --secondary: 90 23% 91%;
    --secondary-foreground: 161 35% 24%;
    --muted: 90 16% 92%;
    --muted-foreground: 150 10% 38%;
    --accent: 90 23% 89%;
    --accent-foreground: 161 35% 17%;
    --destructive: 0 72% 45%;
    --destructive-foreground: 0 0% 100%;
    --border: 100 15% 85%;
    --input: 100 15% 78%;
    --ring: 161 41% 35%;
    --radius: 0.875rem;
  }
  .dark {
    color-scheme: dark;
    --background: 160 20% 9%;
    --foreground: 80 20% 93%;
    --card: 160 18% 12%;
    --card-foreground: 80 20% 93%;
    --popover: 160 18% 12%;
    --popover-foreground: 80 20% 93%;
    --primary: 145 36% 70%;
    --primary-foreground: 160 30% 12%;
    --secondary: 160 15% 20%;
    --secondary-foreground: 80 20% 93%;
    --muted: 160 15% 18%;
    --muted-foreground: 100 10% 70%;
    --accent: 160 15% 23%;
    --accent-foreground: 80 20% 93%;
    --destructive: 0 63% 42%;
    --destructive-foreground: 0 0% 100%;
    --border: 160 14% 25%;
    --input: 160 14% 32%;
    --ring: 145 36% 70%;
  }
  * { @apply border-border; }
  html { scroll-behavior: smooth; }
  body { @apply bg-background text-foreground antialiased; font-family: Arial, Tahoma, sans-serif; line-height: 1.7; }
  a:focus-visible { @apply rounded-sm outline-none ring-2 ring-ring ring-offset-2 ring-offset-background; }
  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }
}
```


### src/app/page.tsx

```
import { ArrowUpRight, BookOpen, Headphones, Languages, MessageCircle, PenLine, Shapes } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const modules = [
  { title: "Speaking", description: "ฝึกสนทนาในสถานการณ์ที่พบได้จริง", icon: MessageCircle },
  { title: "Listening", description: "ฝึกฟัง จับใจความ และทบทวนตามจังหวะของคุณ", icon: Headphones },
  { title: "Reading", description: "อ่านอย่างเข้าใจ พร้อมคำอธิบายภาษาไทย", icon: BookOpen },
  { title: "Writing", description: "พัฒนาประโยค ย่อหน้า และงานเขียน", icon: PenLine },
  { title: "Vocabulary", description: "เรียนคำศัพท์และทบทวนอย่างเป็นระบบ", icon: Languages },
  { title: "Grammar", description: "เข้าใจโครงสร้างภาษาอังกฤษทีละขั้น", icon: Shapes },
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
        <ThemeToggle />
      </header>
      <main id="main" tabIndex={-1}>
        <section className="max-w-4xl py-14 sm:py-20" aria-labelledby="hero-title">
          <p className="text-xs font-semibold tracking-[0.18em] text-primary">YOUR ENGLISH JOURNEY STARTS HERE</p>
          <h1 id="hero-title" className="my-6 text-3xl font-bold leading-relaxed tracking-tight sm:text-5xl sm:leading-relaxed">ภาษาอังกฤษที่ดีขึ้น<br /><span className="text-primary">เริ่มจากก้าวเล็ก ๆ ทุกวัน</span></h1>
          <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">พื้นที่เรียนภาษาอังกฤษสำหรับคนไทย ฝึกทั้งฟัง พูด อ่าน และเขียน พร้อมเติบโตอย่างมั่นใจในแบบของคุณ</p>
          <Button asChild size="lg" className="mt-7"><a href="#academies">สำรวจเส้นทางการเรียน <ArrowUpRight aria-hidden="true" /></a></Button>
          <p className="mt-4 text-xs leading-6 text-muted-foreground">กำลังเตรียมเปิดให้เรียน — พบกับครู AI และบทเรียนได้เร็ว ๆ นี้</p>
        </section>
        <section id="academies" className="scroll-mt-8" aria-labelledby="academies-title">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><p className="mb-2 text-xs font-semibold tracking-[0.18em] text-primary">SIX WAYS TO GROW</p><h2 id="academies-title" className="text-2xl font-semibold">เส้นทางการเรียนของคุณ</h2></div>
            <Badge variant="outline" className="w-fit">Beginner → Advanced</Badge>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map(({ title, description, icon: Icon }, index) => (
              <Card key={title} className="flex flex-col motion-safe:transition-shadow motion-safe:hover:shadow-md">
                <CardHeader className="flex-1">
                  <div className="mb-5 flex items-center justify-between"><span className="grid size-11 place-items-center rounded-xl bg-secondary text-secondary-foreground"><Icon className="size-5" aria-hidden="true" /></span><span className="text-xs tabular-nums text-muted-foreground">0{index + 1}</span></div>
                  <CardTitle>{title} Academy</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardFooter><Badge variant="secondary">เร็ว ๆ นี้</Badge></CardFooter>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <footer className="mt-16 flex flex-col justify-between gap-2 border-t py-6 text-xs text-muted-foreground sm:flex-row"><span>AI English Tutor Academy</span><span>Built for progress, one day at a time.</span></footer>
    </div>
  );
}
```


### src/app/loading.tsx

```
export default function Loading() {
  return <main className="mx-auto max-w-6xl px-5 py-16"><p role="status" className="text-muted-foreground">กำลังโหลดบทเรียน…</p></main>;
}
```


### src/app/error.tsx

```
"use client";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto max-w-2xl space-y-5 px-5 py-16"><h1 className="text-3xl font-bold">ไม่สามารถแสดงหน้านี้ได้</h1><p role="alert" className="text-muted-foreground">โปรดลองอีกครั้ง หากยังพบปัญหาให้โหลดหน้าใหม่</p><Button onClick={reset}>ลองอีกครั้ง</Button></main>;
}
```


### src/app/not-found.tsx

```
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <main className="mx-auto max-w-2xl space-y-5 px-5 py-16"><h1 className="text-3xl font-bold">ไม่พบหน้าที่ต้องการ</h1><p className="text-muted-foreground">ตรวจสอบที่อยู่ หรือกลับไปเริ่มต้นใหม่</p><Button asChild><Link href="/">กลับหน้าหลัก</Link></Button></main>;
}
```


### README.md

```
# AI English Tutor Academy

เริ่มอ่าน [คู่มือ Architecture และ Phase 01](docs/phase-01.md) แล้วอ่าน [Phase 02: Tailwind และ shadcn/ui](docs/phase-02.md)

สถานะ: Phase 02 มี Tailwind CSS, shadcn/ui แบบ manual, Lucide และโหมดสว่าง/มืด ยังไม่มีการเชื่อมต่อ AI, Database หรือ Google OAuth

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

