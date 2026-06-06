import { describe, it, expect } from "vitest";
import {
  feedbackFormSchema,
  looksSpammy,
  RELATIONSHIPS,
} from "@/lib/validators/feedback";

describe("feedbackFormSchema", () => {
  it("accepts a valid one-sentence submission", () => {
    const result = feedbackFormSchema.safeParse({
      sentence: "Tanvir is reliable and always unblocks the team quickly.",
      relationship: "colleague",
      allow_name_public: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty sentence", () => {
    const result = feedbackFormSchema.safeParse({ sentence: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a too-short sentence", () => {
    const result = feedbackFormSchema.safeParse({ sentence: "good" });
    expect(result.success).toBe(false);
  });

  it("rejects a sentence longer than 280 chars", () => {
    const result = feedbackFormSchema.safeParse({ sentence: "a".repeat(281) });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown relationship", () => {
    const result = feedbackFormSchema.safeParse({
      sentence: "A perfectly fine sentence about working together.",
      relationship: "enemy",
    });
    expect(result.success).toBe(false);
  });

  it("defaults allow_name_public to false", () => {
    const result = feedbackFormSchema.safeParse({
      sentence: "A perfectly fine sentence about working together.",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.allow_name_public).toBe(false);
  });

  it("normalises empty optional strings to undefined", () => {
    const result = feedbackFormSchema.safeParse({
      sentence: "A perfectly fine sentence about working together.",
      giver_name: "",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.giver_name).toBeUndefined();
  });

  it("exposes the documented relationship set", () => {
    expect(RELATIONSHIPS).toContain("colleague");
    expect(RELATIONSHIPS).toContain("manager");
    expect(RELATIONSHIPS).toHaveLength(7);
  });
});

describe("looksSpammy", () => {
  it("flags links", () => {
    expect(looksSpammy("Check this out http://spam.example")).toBe(true);
    expect(looksSpammy("visit www.spam.example now")).toBe(true);
  });

  it("flags html tags", () => {
    expect(looksSpammy("<script>alert(1)</script>")).toBe(true);
  });

  it("flags long character runs", () => {
    expect(looksSpammy("aaaaaaaaaa")).toBe(true);
  });

  it("flags content with too few letters", () => {
    expect(looksSpammy("123 456")).toBe(true);
  });

  it("passes genuine feedback", () => {
    expect(
      looksSpammy("Tanvir takes ownership until the issue is resolved.")
    ).toBe(false);
  });
});
