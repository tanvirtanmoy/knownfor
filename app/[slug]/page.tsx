import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getProfileBySlug,
  getApprovedFeedback,
  getLatestSummary,
} from "@/lib/queries";
import { ProfileHeader } from "@/components/ProfileHeader";
import { FeedbackCard } from "@/components/FeedbackCard";
import { TraitPill } from "@/components/TraitPill";
import { DEFAULT_TRAITS } from "@/lib/constants";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const profile = await getProfileBySlug(params.slug);
  if (!profile) return { title: "Profile not found" };

  const title = `${profile.full_name}, ${profile.headline ?? "KnownFor"}`;
  const description =
    profile.bio ??
    `See what people say it's like to work with ${profile.full_name}.`;

  return {
    title,
    description,
    alternates: { canonical: `/${profile.public_slug}` },
    openGraph: {
      title,
      description,
      url: `/${profile.public_slug}`,
      type: "profile",
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function ProfilePage({ params }: Props) {
  const profile = await getProfileBySlug(params.slug);
  if (!profile) notFound();

  const [feedback, summary] = await Promise.all([
    getApprovedFeedback(profile.id),
    getLatestSummary(profile.id),
  ]);

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <ProfileHeader profile={profile} />

        {profile.bio && (
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-soft">
            {profile.bio}
          </p>
        )}

        {summary?.summary && (
          <p className="mt-6 max-w-2xl border-l-2 border-brand/40 pl-4 text-lg italic leading-relaxed text-ink">
            {summary.summary}
          </p>
        )}

        {/* Known For — AI-derived traits when available, else the curated set. */}
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Known for
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {(summary?.top_traits && summary.top_traits.length > 0
              ? summary.top_traits.map((t) => t.trait)
              : DEFAULT_TRAITS
            ).map((t) => (
              <TraitPill key={t} label={t} />
            ))}
          </div>
        </section>

        {/* Feedback wall */}
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
      </div>
    </div>
  );
}
