import { describe, expect, it } from "vitest";
import { consumeRateLimit } from "@/lib/rate-limit-core";

describe("consumeRateLimit", () => {
  it("allows up to the configured limit and then rejects", () => {
    const key = `test-${Date.now()}-${Math.random()}`;
    expect(consumeRateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(consumeRateLimit(key, 2, 60_000).allowed).toBe(true);
    const blocked = consumeRateLimit(key, 2, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});
