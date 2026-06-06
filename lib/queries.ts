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
