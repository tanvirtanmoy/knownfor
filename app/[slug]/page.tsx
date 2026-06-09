import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getProfileBySlug,
  getApprovedFeedback,
  getLatestSummary,
} from "@/lib/queries";
import { ProfileWall } from "@/components/ProfileWall";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  // getProfileBySlug uses the RLS-enforced client, so a private profile returns
  // null here too — its metadata never leaks.
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
  // RLS only returns the row when is_public = true, so private profiles 404 on
  // their public slug — they're reachable solely via a /v/<token> view link.
  const profile = await getProfileBySlug(params.slug);
  if (!profile) notFound();

  const [feedback, summary] = await Promise.all([
    getApprovedFeedback(profile.id),
    getLatestSummary(profile.id),
  ]);

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <ProfileWall profile={profile} feedback={feedback} summary={summary} />
      </div>
    </div>
  );
}
