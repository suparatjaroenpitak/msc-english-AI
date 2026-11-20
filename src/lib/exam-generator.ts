import "server-only";

import { z } from "zod";
import { getGroqClient, getGroqModel } from "@/lib/groq";

const generatedQuestionSchema = z.object({
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  correctOption: z.number().int().min(0).max(3),
  explanations: z.array(z.string()).length(4),
});
const generatedSchema = z.object({ questions: z.array(generatedQuestionSchema).min(1).max(20) });

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;

export async function generateExamQuestions(input: { category: string; level: string; count: number }): Promise<{ questions: GeneratedQuestion[]; source: "groq" | "fallback" }> {
  const fallback: GeneratedQuestion[] = [
    { prompt: "Yesterday, I ___ to work by train.", options: ["go", "went", "gone", "going"], correctOption: 1, explanations: ["ใช้ go เป็นปัจจุบัน", "went เป็น past simple ที่ถูกต้อง", "gone ต้องใช้กับ have/has", "going ต้องมี verb to be"] },
    { prompt: "She has lived here ___ 2020.", options: ["for", "since", "at", "on"], correctOption: 1, explanations: ["for ใช้กับช่วงเวลา", "since ใช้กับจุดเริ่มต้นของเวลา", "at ใช้กับเวลา/สถานที่เฉพาะ", "on ใช้กับวัน"] },
    { prompt: "If I have time, I ___ you tomorrow.", options: ["call", "called", "will call", "calling"], correctOption: 2, explanations: ["ยังไม่สมบูรณ์ใน first conditional", "เป็นอดีต", "will call เหมาะกับผลลัพธ์ในอนาคต", "รูป -ing ต้องมี auxiliary"] },
    { prompt: "The report ___ by the team yesterday.", options: ["writes", "wrote", "was written", "writing"], correctOption: 2, explanations: ["เป็น present simple", "เป็น active past", "เป็น passive past ที่ถูกต้อง", "เป็น gerund"] },
    { prompt: "The word 'improve' is closest in meaning to ___.", options: ["make better", "make smaller", "make later", "make louder"], correctOption: 0, explanations: ["improve หมายถึงทำให้ดีขึ้น", "ไม่ใช่ความหมายหลัก", "ไม่ใช่ความหมายหลัก", "ไม่ใช่ความหมายหลัก"] },
  ];
  const client = getGroqClient();
  if (!client) return { questions: Array.from({ length: input.count }, (_, index) => fallback[index % fallback.length]), source: "fallback" };
  try {
    const completion = await client.chat.completions.create({ model: getGroqModel("standard"), temperature: 0.2, max_tokens: 1800, response_format: { type: "json_object" }, messages: [{ role: "system", content: "Generate a fair English exam. Return only JSON: { questions: [{ prompt, options: [four strings], correctOption: 0-3, explanations: [four strings] }] }. Explain every option in Thai. Do not include markdown." }, { role: "user", content: `Category: ${input.category}; CEFR level: ${input.level}; number of questions: ${input.count}` }] });
    const parsed = generatedSchema.parse(JSON.parse(completion.choices[0]?.message?.content ?? "{}"));
    return { questions: parsed.questions.slice(0, input.count), source: "groq" };
  } catch (error) {
    console.error("Exam generation fallback", error instanceof Error ? error.message : "unknown");
    return { questions: Array.from({ length: input.count }, (_, index) => fallback[index % fallback.length]), source: "fallback" };
  }
}
