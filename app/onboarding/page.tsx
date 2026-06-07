import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries";
import { OnboardingForm } from "@/components/OnboardingForm";

export const metadata: Metadata = {
  title: "Set up your profile",
  robots: { index: false },
};

// Derive a friendly default handle from a name or email local-part.
function suggestSlug(seed: string): string {
  return seed
    .toLowerCase()
    .trim()
    .replace(/@.*$/, "") // drop email domain
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export default async function OnboardingPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  // Already onboarded → straight to the dashboard.
  if (profile.public_slug) redirect("/admin");

  // Pull the email to seed a handle suggestion (auth user is the source of truth).
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const defaultName = profile.full_name ?? "";
  const defaultSlug = suggestSlug(
    profile.full_name || user?.email || profile.email || ""
  );

  return (
    <div className="container-page py-20">
      <div className="mx-auto max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Welcome to Known<span className="text-brand">For</span>
        </h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          Just one step: pick the handle for your public profile.
        </p>
        <div className="mt-8 rounded-2xl border border-line bg-canvas-card p-6 shadow-card">
          <OnboardingForm defaultName={defaultName} defaultSlug={defaultSlug} />
        </div>
      </div>
    </div>
  );
}
