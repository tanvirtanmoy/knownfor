import { ProfileHeader } from "@/components/ProfileHeader";
import { FeedbackCard } from "@/components/FeedbackCard";
import { TraitPill } from "@/components/TraitPill";
import type {
  ProfileRow,
  PublicFeedback,
  ProfileSummaryRow,
} from "@/types/database";

// The full profile body (header, bio, AI summary, "Known for" traits, feedback
// wall). Shared by the public /<slug> page and the private /v/<token> page so
// both render an identical, curated wall.
export function ProfileWall({
  profile,
  feedback,
  summary,
}: {
  profile: ProfileRow;
  feedback: PublicFeedback[];
  summary: ProfileSummaryRow | null;
}) {
  // The summary and "Known for" traits are derived from public feedback, so they
  // must never outlive it. If nothing is visible, hide them — otherwise a profile
  // whose feedback was hidden or deleted would show traits floating above an
  // empty wall.
  const hasPublicFeedback = feedback.length > 0;

  return (
    <>
      <ProfileHeader profile={profile} />

      {profile.bio && (
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-soft">
          {profile.bio}
        </p>
      )}

      {hasPublicFeedback && summary?.summary && (
        <p className="mt-6 max-w-2xl border-l-2 border-brand/40 pl-4 text-lg italic leading-relaxed text-ink">
          {summary.summary}
        </p>
      )}

      {hasPublicFeedback &&
        summary?.top_traits &&
        summary.top_traits.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
              Known for
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {summary.top_traits.map((t) => (
                <TraitPill key={t.trait} label={t.trait} />
              ))}
            </div>
          </section>
        )}

      <section className="mt-14">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">
          People describe working with {profile.full_name?.split(" ")[0]} as…
        </h2>

        {feedback.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-line bg-canvas-card/60 p-10 text-center">
            <p className="text-ink-soft">
              No feedback has been shared publicly yet.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {feedback.map((item, i) => (
              <FeedbackCard key={item.id} item={item} index={i} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
