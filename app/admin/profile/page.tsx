import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries";
import { ProfileForm } from "@/components/ProfileForm";
import { DeleteAccountSection } from "@/components/DeleteAccountSection";

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

      <div className="mt-10 rounded-2xl border border-line bg-canvas-card p-6 shadow-card sm:p-8">
        <h2 className="text-lg font-semibold text-ink">Your data</h2>
        <p className="mt-1.5 text-sm text-ink-muted">
          Download a portable copy of everything we hold about you, including
          your profile and the feedback you have received.
        </p>
        <a
          href="/admin/account/export"
          download
          className="mt-4 inline-flex h-9 items-center rounded-xl border border-line px-4 text-sm font-medium text-ink-soft hover:bg-canvas-subtle hover:text-ink"
        >
          Download my data (JSON)
        </a>
      </div>

      <DeleteAccountSection />
    </div>
  );
}
