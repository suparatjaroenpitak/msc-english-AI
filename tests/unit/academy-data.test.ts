import { describe, expect, it } from "vitest";
import { academyModules } from "@/lib/academy-data";

describe("academy catalog", () => {
  it("contains all six learning modules", () => {
    expect(Object.keys(academyModules)).toEqual(["speaking", "listening", "reading", "writing", "vocabulary", "grammar"]);
  });
});
