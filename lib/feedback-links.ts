import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";
import type { FeedbackLinkRow, ProfileRow } from "@/types/database";

// How many active (non-revoked) share links a single user may hold at once.
// Each link maps 1:1 to a QR code, so this also caps QR generation. Revoking or
// deleting a link frees a slot.
export const MAX_ACTIVE_LINKS = 5;

// Anti-churn: even within the active cap, a user could revoke-and-recreate in a
// loop to bloat the table with token rows. This bounds how many links a single
// user can create per rolling 24h window.
export const MAX_LINKS_PER_DAY = 20;

// URL-safe, unguessable share token (~24 chars).
export function generateToken(): string {
  return randomBytes(18).toString("base64url");
}

// Validate a share token against a slug. Uses the service-role client so tokens
// stay unenumerable (there is no anon read policy on feedback_links). Returns
// the matching link + profile when the token is valid and not revoked, else null.
export async function getValidLink(
  slug: string,
  token: string | undefined | null
): Promise<{ link: FeedbackLinkRow; profile: ProfileRow } | null> {
  if (!token) return null;
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("users")
    .select("*")
    .eq("public_slug", slug)
    .maybeSingle();
  if (!profile) return null;

  const { data: link } = await admin
    .from("feedback_links")
    .select("*")
    .eq("token", token)
    .eq("profile_user_id", (profile as ProfileRow).id)
    .eq("revoked", false)
    .maybeSingle();
  if (!link) return null;

  return { link: link as FeedbackLinkRow, profile: profile as ProfileRow };
}

// Best-effort usage tracking — never blocks a submission.
export async function touchLink(linkId: string): Promise<void> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("feedback_links")
    .select("use_count")
    .eq("id", linkId)
    .maybeSingle();
  const next = (((data as { use_count: number } | null)?.use_count ?? 0) as number) + 1;
  await admin
    .from("feedback_links")
    .update({ use_count: next, last_used_at: new Date().toISOString() })
    .eq("id", linkId);
}
