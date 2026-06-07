import { createClient } from "@/lib/supabase/server";
import type {
  ProfileRow,
  PublicFeedback,
  FeedbackRow,
  ProfileSummaryRow,
  FeedbackLinkRow,
} from "@/types/database";

// Public profile by slug. Returns null when not found.
export async function getProfileBySlug(
  slug: string
): Promise<ProfileRow | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("public_slug", slug)
    .maybeSingle();
  return data ?? null;
}

// Approved + public feedback for the wall. Selects only public-safe columns —
// ip_hash / user_agent are never returned to visitors.
export async function getApprovedFeedback(
  profileUserId: string
): Promise<PublicFeedback[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("feedback")
    .select(
      "id, sentence, giver_name, giver_role, giver_company, relationship, allow_name_public, created_at"
    )
    .eq("profile_user_id", profileUserId)
    .eq("status", "approved")
    .eq("is_public", true)
    .order("created_at", { ascending: false });
  return (data as PublicFeedback[] | null) ?? [];
}

// Full feedback rows for the owner's admin dashboard (RLS scopes to owner).
export async function getOwnerFeedback(
  profileUserId: string
): Promise<FeedbackRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("feedback")
    .select("*")
    .eq("profile_user_id", profileUserId)
    .order("created_at", { ascending: false });
  return (data as FeedbackRow[] | null) ?? [];
}

// Most recent AI/heuristic summary for a profile, or null if none generated.
export async function getLatestSummary(
  profileUserId: string
): Promise<ProfileSummaryRow | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profile_summaries")
    .select("*")
    .eq("profile_user_id", profileUserId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as ProfileSummaryRow | null) ?? null;
}

// The owner's share links (RLS scopes to owner), newest first.
export async function getFeedbackLinks(
  profileUserId: string
): Promise<FeedbackLinkRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("feedback_links")
    .select("*")
    .eq("profile_user_id", profileUserId)
    .order("created_at", { ascending: false });
  return (data as FeedbackLinkRow[] | null) ?? [];
}

// --- Platform super-admin queries (RLS grants admin cross-user read) -------

export interface AdminUserRow extends ProfileRow {
  feedbackCount: number;
  pendingCount: number;
}

// All users plus per-user feedback counts, for the platform overview.
export async function getAllUsersForAdmin(): Promise<AdminUserRow[]> {
  const supabase = createClient();
  const [{ data: users }, { data: feedback }] = await Promise.all([
    supabase.from("users").select("*").order("created_at", { ascending: false }),
    supabase.from("feedback").select("profile_user_id, status"),
  ]);

  const counts = new Map<string, { total: number; pending: number }>();
  for (const f of (feedback as { profile_user_id: string; status: string }[]) ??
    []) {
    const c = counts.get(f.profile_user_id) ?? { total: 0, pending: 0 };
    c.total += 1;
    if (f.status === "pending") c.pending += 1;
    counts.set(f.profile_user_id, c);
  }

  return ((users as ProfileRow[] | null) ?? []).map((u) => ({
    ...u,
    feedbackCount: counts.get(u.id)?.total ?? 0,
    pendingCount: counts.get(u.id)?.pending ?? 0,
  }));
}

// All currently-pending feedback across every profile, newest first.
export async function getPendingFeedbackForAdmin(): Promise<
  (FeedbackRow & { owner_name: string | null; owner_slug: string | null })[]
> {
  const supabase = createClient();
  const { data: rows } = await supabase
    .from("feedback")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const feedback = (rows as FeedbackRow[] | null) ?? [];
  if (feedback.length === 0) return [];

  const ownerIds = [...new Set(feedback.map((f) => f.profile_user_id))];
  const { data: owners } = await supabase
    .from("users")
    .select("id, full_name, public_slug")
    .in("id", ownerIds);

  const ownerMap = new Map(
    ((owners as Pick<ProfileRow, "id" | "full_name" | "public_slug">[]) ?? []).map(
      (o) => [o.id, o]
    )
  );

  return feedback.map((f) => ({
    ...f,
    owner_name: ownerMap.get(f.profile_user_id)?.full_name ?? null,
    owner_slug: ownerMap.get(f.profile_user_id)?.public_slug ?? null,
  }));
}

// The signed-in owner's profile row, or null if not signed in / no profile.
export async function getCurrentProfile(): Promise<ProfileRow | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return data ?? null;
}
