import { z } from "zod";

export const RELATIONSHIPS = [
  "colleague",
  "manager",
  "stakeholder",
  "client",
  "mentor",
  "friend",
  "other",
] as const;

export const RELATIONSHIP_LABELS: Record<
  (typeof RELATIONSHIPS)[number],
  string
> = {
  colleague: "Colleague",
  manager: "Manager",
  stakeholder: "Stakeholder",
  client: "Client",
  mentor: "Mentor",
  friend: "Friend",
  other: "Other",
};

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Please keep this under ${max} characters.`)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));

export const feedbackFormSchema = z.object({
  sentence: z
    .string()
    .trim()
    .min(10, "Please write at least a few words.")
    .max(280, "Please keep it to one sentence (max 280 characters)."),
  relationship: z.enum(RELATIONSHIPS).optional(),
  giver_name: optionalTrimmed(120),
  giver_role: optionalTrimmed(120),
  giver_company: optionalTrimmed(120),
  allow_name_public: z.boolean().default(false),
});

export type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

// Spam heuristics — cheap, friendly, not a CAPTCHA. Blocks obvious junk while
// letting real one-sentence feedback through.
export function looksSpammy(sentence: string): boolean {
  const s = sentence.trim();
  if (/(https?:\/\/|www\.)/i.test(s)) return true; // links
  if (/<[^>]+>/.test(s)) return true; // html tags
  if (/(.)\1{6,}/.test(s)) return true; // aaaaaaa
  const letters = s.replace(/[^a-zA-Z]/g, "").length;
  if (letters < 6) return true; // not really words
  return false;
}
