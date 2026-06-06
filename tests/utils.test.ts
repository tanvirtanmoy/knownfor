import { describe, it, expect } from "vitest";
import { sanitizeText, hashIp, cn } from "@/lib/utils";

describe("sanitizeText", () => {
  it("collapses whitespace", () => {
    expect(sanitizeText("hello    world")).toBe("hello world");
  });

  it("trims surrounding whitespace", () => {
    expect(sanitizeText("  hi  ")).toBe("hi");
  });

  it("strips control characters", () => {
    const withControl = `a${String.fromCharCode(0)}b${String.fromCharCode(9)}c`;
    expect(sanitizeText(withControl)).toBe("a b c");
  });
});

describe("hashIp", () => {
  it("is deterministic for the same input", () => {
    expect(hashIp("1.2.3.4")).toBe(hashIp("1.2.3.4"));
  });

  it("differs for different inputs", () => {
    expect(hashIp("1.2.3.4")).not.toBe(hashIp("5.6.7.8"));
  });

  it("never returns the raw ip", () => {
    expect(hashIp("1.2.3.4")).not.toContain("1.2.3.4");
  });
});

describe("cn", () => {
  it("joins truthy class names and drops falsy ones", () => {
    expect(cn("a", false, undefined, "b", null)).toBe("a b");
  });
});
