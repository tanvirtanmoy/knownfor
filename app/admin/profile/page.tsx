import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries";
import { ProfileForm } from "@/components/ProfileForm";

export const metadata: Metadata = {
  title: "Profile settings",
  robots: { index: false },
};

export default async function AdminProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Profile settings
      </h1>
      <p className="mt-1.5 text-sm text-ink-muted">
        This is what visitors see on your public profile.
      </p>

      <div className="mt-8 rounded-2xl border border-line bg-canvas-card p-6 shadow-card sm:p-8">
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
