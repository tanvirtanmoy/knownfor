import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";
import type { ProfileViewLinkRow, ProfileRow } from "@/types/database";

// How many active (non-revoked, non-expired) view links a user may hold at once.
// Revoking or deleting a link frees a slot.
export const MAX_ACTIVE_VIEW_LINKS = 5;

// Anti-churn: bounds how many view links a single user can create per rolling
// 24h window, so revoke-and-recreate loops can't bloat the table.
export const MAX_VIEW_LINKS_PER_DAY = 20;

// A non-revoked link is "active" only while unexpired.
export function isViewLinkActive(link: ProfileViewLinkRow): boolean {
  if (link.revoked) return false;
  if (link.expires_at && new Date(link.expires_at).getTime() <= Date.now())
    return false;
  return true;
}

// URL-safe, unguessable view token (~24 chars).
export function generateViewToken(): string {
  return randomBytes(18).toString("base64url");
}

// Validate a view token. Uses the service-role client so tokens stay
// unenumerable (there is no anon read policy on profile_view_links, and the
// profile itself may be private). Returns the link + profile when the token is
// valid, not revoked and not expired, else null.
export async function getProfileByViewToken(
  token: string | undefined | null
): Promise<{ link: ProfileViewLinkRow; profile: ProfileRow } | null> {
  if (!token) return null;
  const admin = createAdminClient();

  const { data: link } = await admin
    .from("profile_view_links")
    .select("*")
    .eq("token", token)
    .eq("revoked", false)
    .maybeSingle();
  if (!link) return null;

  const typedLink = link as ProfileViewLinkRow;
  if (!isViewLinkActive(typedLink)) return null;

  const { data: profile } = await admin
    .from("users")
    .select("*")
    .eq("id", typedLink.profile_user_id)
    .maybeSingle();
  if (!profile) return null;

  return { link: typedLink, profile: profile as ProfileRow };
}

// Best-effort view tracking — never blocks rendering.
export async function touchViewLink(linkId: string): Promise<void> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profile_view_links")
    .select("view_count")
    .eq("id", linkId)
    .maybeSingle();
  const next =
    (((data as { view_count: number } | null)?.view_count ?? 0) as number) + 1;
  await admin
    .from("profile_view_links")
    .update({ view_count: next, last_viewed_at: new Date().toISOString() })
    .eq("id", linkId);
}
