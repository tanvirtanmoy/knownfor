import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows up to the limit then blocks", () => {
    const key = `test-${Math.random()}`;
    const opts = { limit: 3, windowMs: 60_000 };

    expect(rateLimit(key, opts).ok).toBe(true);
    expect(rateLimit(key, opts).ok).toBe(true);
    expect(rateLimit(key, opts).ok).toBe(true);

    const blocked = rateLimit(key, opts);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks separate keys independently", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    const opts = { limit: 1, windowMs: 60_000 };

    expect(rateLimit(a, opts).ok).toBe(true);
    expect(rateLimit(b, opts).ok).toBe(true);
    expect(rateLimit(a, opts).ok).toBe(false);
  });

  it("resets after the window elapses", () => {
    const key = `reset-${Math.random()}`;
    const opts = { limit: 1, windowMs: 1 };

    expect(rateLimit(key, opts).ok).toBe(true);
    // Window of 1ms — next call after the clock advances should pass again.
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(rateLimit(key, opts).ok).toBe(true);
        resolve();
      }, 5);
    });
  });
});
