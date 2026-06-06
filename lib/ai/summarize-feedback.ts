// AI summary service — structured for the future, deliberately not wired to a
// paid provider in the MVP. Swap `localHeuristicSummary` for an OpenAI call
// (gpt-4o-mini, etc.) once there's enough feedback to summarise.
//
// The public contract (SummarizeInput → SummarizeResult) is what the rest of
// the app should depend on, so the implementation can change freely.

import type { PublicFeedback, TopTrait } from "@/types/database";

export interface SummarizeInput {
  fullName: string;
  feedback: Pick<PublicFeedback, "sentence" | "relationship">[];
}

export interface SummarizeResult {
  summary: string;
  topTraits: TopTrait[];
  generatedAt: string;
}

const TRAIT_KEYWORDS: Record<string, string[]> = {
  Ownership: ["own", "ownership", "responsib", "accountab", "resolved", "until"],
  Reliability: ["reliab", "trust", "depend", "consistent", "worry"],
  Communication: ["explain", "communicat", "clear", "understand", "articulate"],
  Collaboration: ["help", "team", "collaborat", "together", "support", "blocked"],
  "Problem Solving": ["solve", "solving", "problem", "fix", "real problem", "figure"],
};

function localHeuristicSummary(input: SummarizeInput): SummarizeResult {
  const counts = new Map<string, number>();

  for (const item of input.feedback) {
    const text = item.sentence.toLowerCase();
    for (const [trait, keywords] of Object.entries(TRAIT_KEYWORDS)) {
      if (keywords.some((k) => text.includes(k))) {
        counts.set(trait, (counts.get(trait) ?? 0) + 1);
      }
    }
  }

  const total = input.feedback.length || 1;
  const topTraits: TopTrait[] = [...counts.entries()]
    .map(([trait, n]) => ({ trait, weight: Number((n / total).toFixed(2)) }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);

  const traitWords = topTraits.map((t) => t.trait.toLowerCase());
  const summary =
    traitWords.length > 0
      ? `People frequently describe working with ${input.fullName} as ${listToProse(
          traitWords
        )}.`
      : `Not enough feedback yet to summarise what ${input.fullName} is known for.`;

  return { summary, topTraits, generatedAt: new Date().toISOString() };
}

function listToProse(items: string[]): string {
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

async function openAiSummary(
  input: SummarizeInput,
  apiKey: string
): Promise<SummarizeResult> {
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const lines = input.feedback
    .map((f, i) => `${i + 1}. (${f.relationship ?? "unspecified"}) ${f.sentence}`)
    .join("\n");

  const prompt =
    `Here is anonymous one-sentence feedback about ${input.fullName} from people ` +
    `they have worked with:\n\n${lines}\n\n` +
    `Return strict JSON: {"summary": string, "topTraits": [{"trait": string, "weight": number between 0 and 1}]}. ` +
    `The summary is 1-2 warm, professional sentences describing what ${input.fullName} ` +
    `is known for and, where the data supports it, how different relationships ` +
    `(e.g. colleagues vs stakeholders) describe them. Provide up to 5 topTraits ` +
    `ordered by prominence. Do not invent feedback not present above.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You write concise, human, trustworthy professional reputation summaries. Never use ratings, scores or rankings.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI request failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content) as {
    summary?: string;
    topTraits?: TopTrait[];
  };

  return {
    summary: parsed.summary?.trim() || localHeuristicSummary(input).summary,
    topTraits: Array.isArray(parsed.topTraits)
      ? parsed.topTraits.slice(0, 5)
      : [],
    generatedAt: new Date().toISOString(),
  };
}

// Public entry point. Uses OpenAI when OPENAI_API_KEY is set, otherwise falls
// back to the deterministic local heuristic. Any provider error also falls back,
// so summary generation never hard-fails.
export async function summarizeFeedback(
  input: SummarizeInput
): Promise<SummarizeResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && input.feedback.length > 0) {
    try {
      return await openAiSummary(input, apiKey);
    } catch {
      return localHeuristicSummary(input);
    }
  }
  return localHeuristicSummary(input);
}
