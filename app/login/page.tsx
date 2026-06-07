import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign in or create your profile",
  description:
    "Sign in to KnownFor with Google or Microsoft and start collecting authentic feedback from the people you work with.",
};

export default async function LoginPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/admin");

  return (
    <div className="container-page py-20">
      <div className="mx-auto max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Sign in to KnownFor
        </h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          New here? Signing in with Google or Microsoft creates your profile
          automatically.
        </p>
        <div className="mt-8 rounded-2xl border border-line bg-canvas-card p-6 shadow-card">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-4 text-center text-xs text-ink-muted">
          By continuing you agree to how we handle your data, described in our{" "}
          <Link href="/privacy" className="underline hover:text-ink">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
