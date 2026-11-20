import Link from "next/link";
import { notFound } from "next/navigation";
import { academyModules, type AcademyModule } from "@/lib/academy-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function generateStaticParams() { return Object.keys(academyModules).map((module) => ({ module })); }

export default function AcademyModulePage({ params }: { params: { module: string } }) {
  if (!(params.module in academyModules)) notFound();
  const module = academyModules[params.module as AcademyModule];
  return <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8"><header className="mb-10 flex items-center justify-between gap-4"><Link className="text-sm font-bold" href="/">AI English Tutor Academy</Link><Badge variant="outline">{module.thai}</Badge></header><section className="mb-8 max-w-2xl"><p className="mb-2 text-xs font-semibold tracking-[0.18em] text-primary">LEARNING ACADEMY</p><h1 className="text-3xl font-bold">{module.title}</h1><p className="mt-3 leading-7 text-muted-foreground">{module.description}</p><Button asChild className="mt-6"><Link href={module.action}>{module.actionLabel}</Link></Button></section><div className="grid gap-5 md:grid-cols-2">{module.lessons.map((lesson, index) => <Card key={lesson.title}><CardHeader><CardDescription>บทที่ {index + 1}</CardDescription><CardTitle>{lesson.title}</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm leading-7">{lesson.body}</p><div className="rounded-md bg-secondary/60 p-3 text-sm leading-7"><span className="font-medium">Practice prompt:</span> {lesson.prompt}</div></CardContent></Card>)}</div></main>;
}
