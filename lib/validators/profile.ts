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
