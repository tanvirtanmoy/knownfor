import { createClient } from "@/lib/supabase/server";
import { RESERVED_SLUGS } from "@/lib/validators/profile";

// Shared handle (public_slug) helpers. The database `unique` constraint on
// users.public_slug is the source of truth — these helpers make the experience
// smoother (suggest a free handle, check availability live) but never replace
// that constraint, which stays the race-safe backstop.

export const SLUG_RE = /^[a-z0-9-]+$/;
export const SLUG_MIN = 2;
export const SLUG_MAX = 40;

// Turn an arbitrary seed (a name or email) into a candidate handle.
export function slugify(seed: string): string {
  return seed
    .toLowerCase()
    .trim()
    .replace(/@.*$/, "") // drop email domain
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX);
}

// Is this exact handle free to claim? `exceptUserId` lets a user keep their own
// current handle when editing their profile (so it doesn't read as "taken").
export async function isSlugAvailable(
  slug: string,
  exceptUserId?: string
): Promise<boolean> {
  if (RESERVED_SLUGS.has(slug)) return false;
  const supabase = createClient();
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("public_slug", slug)
    .maybeSingle();
  if (!data) return true;
  return exceptUserId ? data.id === exceptUserId : false;
}

// First available variant of a seed: base, then base-2, base-3, … — the same
// "graceful fallback" pattern LinkedIn uses when a name handle is taken.
export async function findAvailableSlug(seed: string): Promise<string> {
  const base = slugify(seed) || "user";
  const supabase = createClient();

  // One query: pull everything sharing the base prefix, then find the first gap.
  const { data } = await supabase
    .from("users")
    .select("public_slug")
    .like("public_slug", `${base}%`);

  const taken = new Set<string>(
    (data ?? []).map((r: { public_slug: string | null }) => r.public_slug ?? "")
  );
  const isFree = (s: string) => !taken.has(s) && !RESERVED_SLUGS.has(s);

  if (isFree(base)) return base;
  for (let n = 2; n < 1000; n++) {
    const suffix = `-${n}`;
    const candidate = `${base.slice(0, SLUG_MAX - suffix.length)}${suffix}`;
    if (isFree(candidate)) return candidate;
  }
  // Astronomically unlikely fallback: append a short random tail.
  const rand = Date.now().toString(36).slice(-5);
  return `${base.slice(0, SLUG_MAX - rand.length - 1)}-${rand}`;
}
