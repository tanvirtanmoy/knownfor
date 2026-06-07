"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Label, Input, FieldError } from "@/components/ui/Field";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/admin";
  const oauthError = params.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(oauthError);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "azure" | null>(
    null
  );

  async function signInWithProvider(provider: "google" | "azure") {
    setError(null);
    setOauthLoading(provider);

    const supabase = createClient();
    const callback = new URL("/auth/callback", window.location.origin);
    if (redirectTo && redirectTo !== "/admin") {
      callback.searchParams.set("redirect", redirectTo);
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callback.toString(),
        // Azure: ask for the basic profile + email so we can prefill the name.
        ...(provider === "azure" ? { scopes: "email openid profile" } : {}),
      },
    });

    if (error) {
      setError(error.message);
      setOauthLoading(null);
    }
    // On success the browser is redirected to the provider — nothing else to do.
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="space-y-3">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          disabled={oauthLoading !== null}
          onClick={() => signInWithProvider("google")}
          className="w-full"
        >
          {oauthLoading === "google" ? "Redirecting…" : "Continue with Google"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          disabled={oauthLoading !== null}
          onClick={() => signInWithProvider("azure")}
          className="w-full"
        >
          {oauthLoading === "azure"
            ? "Redirecting…"
            : "Continue with Microsoft"}
        </Button>
      </div>

      <div className="flex items-center gap-3 text-xs text-ink-muted">
        <span className="h-px flex-1 bg-line" />
        or with email
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5"
        />
        <FieldError />
      </div>
      <Button type="submit" size="lg" disabled={loading} className="w-full">
        {loading ? "Signing in…" : "Sign in"}
      </Button>
      </form>
    </div>
  );
}
