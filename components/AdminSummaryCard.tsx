import { generateSummary } from "@/lib/actions/admin";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { TraitPill } from "@/components/TraitPill";
import type { ProfileSummaryRow } from "@/types/database";

export function AdminSummaryCard({
  summary,
  hasApprovedFeedback,
}: {
  summary: ProfileSummaryRow | null;
  hasApprovedFeedback: boolean;
}) {
  return (
    <section className="rounded-2xl border border-line bg-canvas-card p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">AI summary</h2>
          <p className="mt-1 text-sm text-ink-muted">
            A short, human summary of what you&apos;re known for, generated from
            approved public feedback.
          </p>
        </div>
        <form action={generateSummary}>
          <Button type="submit" size="sm" disabled={!hasApprovedFeedback}>
            {summary ? "Regenerate" : "Generate summary"}
          </Button>
        </form>
      </div>

      {!hasApprovedFeedback && (
        <p className="mt-4 text-sm text-ink-muted">
          Approve some feedback first. The summary is built from your public
          wall.
        </p>
      )}

      {summary && (
        <div className="mt-4 rounded-xl border border-line bg-canvas-subtle p-4">
          <p className="text-ink">{summary.summary}</p>
          {summary.top_traits && summary.top_traits.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {summary.top_traits.map((t) => (
                <TraitPill key={t.trait} label={t.trait} />
              ))}
            </div>
          )}
          {summary.generated_at && (
            <p className="mt-3 text-xs text-ink-muted">
              Generated {formatDate(summary.generated_at)}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
