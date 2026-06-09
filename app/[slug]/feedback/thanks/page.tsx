import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getProfileBySlugAdmin, getApprovedFeedback } from "@/lib/queries";
import { FeedbackCard } from "@/components/FeedbackCard";
import { Button } from "@/components/ui/Button";

interface Props {
  params: { slug: string };
}

export const metadata: Metadata = {
  title: "Thank you",
  robots: { index: false },
};

export default async function ThanksPage({ params }: Props) {
  // Admin lookup: this page is reached right after submitting feedback, which
  // works for private profiles too (token-gated), so resolve without RLS.
  const profile = await getProfileBySlugAdmin(params.slug);
  if (!profile) notFound();

  // Only reachable right after submitting (the submit action sets this cookie).
  // Direct visitors are sent to the form so the wall isn't exposed unearned.
  if (cookies().get("kf_submitted")?.value !== params.slug) {
    redirect(`/${params.slug}/feedback`);
  }

  // The wall preview / public-profile link only make sense for public profiles.
  const feedback = profile.is_public ? await getApprovedFeedback(profile.id) : [];
  const firstName = profile.full_name?.split(" ")[0] ?? "them";

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-2xl text-brand-dark">
            ✓
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-ink">
            Thank you for sharing your thoughts.
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-ink-soft">
            Your feedback will be reviewed before it appears publicly. We
            appreciate you taking the time.
          </p>
        </div>

        {feedback.length > 0 && (
          <section className="mt-14">
            <h2 className="text-center text-2xl font-semibold tracking-tight text-ink">
              What others say about working with {firstName}
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {feedback.map((item, i) => (
                <FeedbackCard key={item.id} item={item} index={i} />
              ))}
            </div>
          </section>
        )}

        {profile.is_public && (
          <div className="mt-12 text-center">
            <Link href={`/${profile.public_slug}`}>
              <Button size="lg" variant="secondary">
                View public profile
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
