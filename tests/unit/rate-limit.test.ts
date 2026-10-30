import { describe, expect, it } from "vitest";
import { createRateLimiter } from "../../src/lib/rate-limit";

describe("createRateLimiter", () => {
  it("allows a number of attempts per window and per key", () => {
    let clock = 0;
    const limiter = createRateLimiter(3, 60_000, () => clock);
    expect([1, 2, 3, 4].map(() => limiter.allow("a"))).toEqual([true, true, true, false]);
    expect(limiter.allow("b")).toBe(true);

    clock = 59_999;
    expect(limiter.allow("a")).toBe(false);
    clock = 60_000;
    expect(limiter.allow("a")).toBe(true);
  });
});
