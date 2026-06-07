import { z } from "zod";

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));

export const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required.").max(120),
  headline: optional(160),
  bio: optional(600),
  location: optional(120),
  profile_image_url: z
    .string()
    .trim()
    .url("Must be a valid URL.")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  public_slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters.")
    .max(40)
    .regex(
      /^[a-z0-9-]+$/,
      "Use lowercase letters, numbers, and hyphens only."
    ),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

// Minimal first-run onboarding: a new user only needs a name + a public handle.
export const onboardingSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required.").max(120),
  public_slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Handle must be at least 2 characters.")
    .max(40)
    .regex(
      /^[a-z0-9-]+$/,
      "Use lowercase letters, numbers, and hyphens only."
    ),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;

// Reserved handles that must never become a public profile slug, because they
// collide with real routes (or would be confusing/abusive).
export const RESERVED_SLUGS = new Set([
  "admin",
  "login",
  "logout",
  "auth",
  "onboarding",
  "api",
  "feedback",
  "settings",
  "about",
  "privacy",
  "terms",
  "support",
  "help",
  "knownfor",
  "www",
]);
