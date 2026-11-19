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
