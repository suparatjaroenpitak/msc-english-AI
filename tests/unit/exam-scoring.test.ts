import { describe, expect, it } from "vitest";
import { scoreExam } from "@/lib/exam-scoring";

describe("scoreExam", () => {
  it("grades matching answers and leaves unanswered items incorrect", () => {
    const result = scoreExam([{ id: "a", correctOption: 1 }, { id: "b", correctOption: 2 }], [{ questionId: "a", selectedOption: 1 }]);
    expect(result).toEqual({ correct: 1, total: 2, percentage: 50 });
  });
  it("returns zero safely for an empty exam", () => {
    expect(scoreExam([], [])).toEqual({ correct: 0, total: 0, percentage: 0 });
  });
});
