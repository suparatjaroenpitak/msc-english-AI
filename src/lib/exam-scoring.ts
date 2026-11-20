export type ScorableQuestion = { id: string; correctOption: number };
export type SubmittedAnswer = { questionId: string; selectedOption: number | null };

export function scoreExam(questions: ScorableQuestion[], answers: SubmittedAnswer[]) {
  const selected = new Map(answers.map((answer) => [answer.questionId, answer.selectedOption]));
  const correct = questions.reduce((total, question) => total + (selected.get(question.id) === question.correctOption ? 1 : 0), 0);
  return { correct, total: questions.length, percentage: questions.length ? Math.round((correct / questions.length) * 100) : 0 };
}
