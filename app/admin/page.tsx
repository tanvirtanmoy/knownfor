import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  getCurrentProfile,
  getOwnerFeedback,
  getLatestSummary,
  getFeedbackLinks,
} from "@/lib/queries";
import { AdminFeedbackTable } from "@/components/AdminFeedbackTable";
import { ShareCard } from "@/components/ShareCard";
import { AdminSummaryCard } from "@/components/AdminSummaryCard";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Moderate feedback",
  robots: { index: false },
};

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams?: { linkError?: string; summaryError?: string };
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const linkError = searchParams?.linkError;
  const summaryError = searchParams?.summaryError;
  const errorMessage =
    linkError === "limit"
      ? "You've reached your limit of active links. Revoke or delete one to generate another."
      : linkError === "rate"
        ? "You've created a lot of links recently. Please try again later."
        : summaryError === "rate"
          ? "You can regenerate your summary up to 3 times a day. Please try again tomorrow."
          : null;

  const [all, summary, links] = await Promise.all([
    getOwnerFeedback(profile.id),
    getLatestSummary(profile.id),
    getFeedbackLinks(profile.id),
  ]);
  const pending = all.filter((f) => f.status === "pending");
  const approved = all.filter((f) => f.status === "approved");
  const archived = all.filter(
    (f) => f.status === "hidden" || f.status === "rejected"
  );

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Review feedback before it appears publicly.
        </h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          Approving feedback makes it public on your profile wall.
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          {errorMessage}
        </div>
      )}

      {profile.public_slug && (
        <ShareCard
          links={links}
          siteUrl={env.siteUrl()}
          slug={profile.public_slug}
        />
      )}

      <AdminSummaryCard
        summary={summary}
        hasApprovedFeedback={approved.length > 0}
        showDailyLimit={profile.role !== "admin"}
      />

      <AdminFeedbackTable
        title="Pending"
        description="New submissions waiting for your review."
        items={pending}
        emptyMessage="No pending feedback right now. Share your link to collect some."
      />

      <AdminFeedbackTable
        title="Approved"
        description="Currently shown on your public wall (toggle visibility anytime)."
        items={approved}
        emptyMessage="Nothing approved yet."
      />

      <AdminFeedbackTable
        title="Hidden & rejected"
        description="Not shown publicly."
        items={archived}
        emptyMessage="Nothing here."
      />
    </div>
  );
}
