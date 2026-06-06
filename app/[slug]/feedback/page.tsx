import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfileBySlug } from "@/lib/queries";
import { getValidLink } from "@/lib/feedback-links";
import { FeedbackForm } from "@/components/FeedbackForm";
import { Button } from "@/components/ui/Button";

interface Props {
  params: { slug: string };
  searchParams: { k?: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getProfileBySlug(params.slug);
  return {
    title: profile ? `Leave feedback for ${profile.full_name}` : "Leave feedback",
    description: profile
      ? `Describe what it's like to work with ${profile.full_name} in one sentence.`
      : undefined,
    robots: { index: false }, // submission page shouldn't be indexed
  };
}

export default async function FeedbackPage({ params, searchParams }: Props) {
  const profile = await getProfileBySlug(params.slug);
  if (!profile) notFound();

  const firstName = profile.full_name?.split(" ")[0] ?? profile.full_name ?? "";

  // Private link gate: the form opens only with a valid, non-revoked token.
  const valid = await getValidLink(params.slug, searchParams.k);
  if (!valid) {
    return (
      <div className="container-page py-16 sm:py-24">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-2xl text-brand-dark">
            🔒
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink">
            This is a private feedback link
          </h1>
          <p className="mt-3 leading-relaxed text-ink-soft">
            Feedback for {profile.full_name} can only be left through a personal
            link they share. This link is missing, invalid, or has been turned
            off. Please ask {firstName} for a current link.
          </p>
          <div className="mt-8">
            <Link href="/">
              <Button variant="secondary">Go to KnownFor</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Leave feedback for {profile.full_name}
        </h1>
        <p className="mt-2 text-ink-soft">
          Your feedback is reviewed before it appears publicly. To keep it
          genuine, you won&apos;t see other people&apos;s feedback before you
          submit.
        </p>

        <div className="mt-8 rounded-2xl border border-line bg-canvas-card p-6 shadow-card sm:p-8">
          <FeedbackForm
            slug={profile.public_slug!}
            fullName={firstName}
            token={searchParams.k!}
          />
        </div>
      </div>
    </div>
  );
}
