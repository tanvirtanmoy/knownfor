import { describe, it, expect } from "vitest";
import { summarizeFeedback } from "@/lib/ai/summarize-feedback";

describe("summarizeFeedback (local heuristic)", () => {
  it("extracts top traits from feedback sentences", async () => {
    const result = await summarizeFeedback({
      fullName: "Tanvir",
      feedback: [
        { sentence: "Takes ownership until the issue is resolved.", relationship: "manager" },
        { sentence: "Always willing to help teammates when blocked.", relationship: "colleague" },
        { sentence: "Explains technical problems so they are easy to understand.", relationship: "stakeholder" },
        { sentence: "Reliable and you never need to worry about delivery.", relationship: "client" },
      ],
    });

    const traitNames = result.topTraits.map((t) => t.trait);
    expect(traitNames).toContain("Ownership");
    expect(traitNames).toContain("Collaboration");
    expect(traitNames).toContain("Communication");
    expect(traitNames).toContain("Reliability");
    expect(result.summary).toContain("Tanvir");
    expect(result.generatedAt).toBeTypeOf("string");
  });

  it("caps top traits at five", async () => {
    const result = await summarizeFeedback({
      fullName: "Tanvir",
      feedback: [
        { sentence: "ownership reliable explain help solve problem clearly", relationship: null },
      ],
    });
    expect(result.topTraits.length).toBeLessThanOrEqual(5);
  });

  it("handles an empty feedback list gracefully", async () => {
    const result = await summarizeFeedback({ fullName: "Tanvir", feedback: [] });
    expect(result.topTraits).toEqual([]);
    expect(result.summary).toContain("Not enough feedback");
  });
});
