import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { getProfileByViewToken, touchViewLink } from "@/lib/view-links";
import { ProfileWall } from "@/components/ProfileWall";
import type { PublicFeedback, ProfileSummaryRow } from "@/types/database";

interface Props {
  params: { token: string };
}

// Private view links are never indexed and carry no descriptive metadata — the
// whole point is that only people with the link can see the profile.
export const metadata: Metadata = {
  title: "Private profile",
  robots: { index: false, follow: false },
};

export default async function ViewLinkPage({ params }: Props) {
  // Validated server-side with the service-role client (the profile may be
  // private). Returns null for unknown / revoked / expired tokens → 404.
  const match = await getProfileByViewToken(params.token);
  if (!match) notFound();

  const { link, profile } = match;

  // The wall mirrors the public one, but the profile may be private so we read
  // its feedback + summary with the service-role client (RLS would hide them).
  const admin = createAdminClient();
  const [{ data: feedbackRows }, { data: summaryRows }] = await Promise.all([
    admin
      .from("feedback")
      .select(
        "id, sentence, giver_name, giver_role, giver_company, relationship, allow_name_public, created_at"
      )
      .eq("profile_user_id", profile.id)
      .eq("status", "approved")
      .eq("is_public", true)
      .order("created_at", { ascending: false }),
    admin
      .from("profile_summaries")
      .select("*")
      .eq("profile_user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const feedback = (feedbackRows as PublicFeedback[] | null) ?? [];
  const summary = ((summaryRows as ProfileSummaryRow[] | null) ?? [])[0] ?? null;

  // Best-effort view tracking — never blocks rendering.
  await touchViewLink(link.id);

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 rounded-xl border border-brand/20 bg-brand-soft/40 px-4 py-3 text-sm text-ink-soft">
          You&apos;re viewing a private profile shared with you via a personal
          link. Please don&apos;t share it further without {profile.full_name?.split(" ")[0] ?? "their"}
          {" "}permission.
        </div>
        <ProfileWall profile={profile} feedback={feedback} summary={summary} />
      </div>
    </div>
  );
}
