import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  rehostProviderAvatar,
  HOSTED_AVATAR_MARKER,
} from "@/lib/provider-avatar";

// OAuth (and magic-link) PKCE callback. Supabase redirects the browser here with
// a `code`; we exchange it for a session cookie, then send the user on:
//   * brand-new users (no public_slug yet) → /onboarding to choose their handle
//   * everyone else → their dashboard (or the original ?redirect target)
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const redirectParam = searchParams.get("redirect");

  // Surface provider errors instead of silently dropping the user on the login page.
  const error = searchParams.get("error_description") ?? searchParams.get("error");
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("public_slug, profile_image_url")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.public_slug) {
      // Brand-new account (still needs onboarding): if the provider handed us a
      // photo (Google → avatar_url, LinkedIn OIDC → picture) and we haven't
      // already stored one in our own bucket, re-host it so it doesn't expire.
      // Scoped to first login so we never re-add a photo the user later removed.
      const meta = user.user_metadata ?? {};
      const providerPhoto =
        (typeof meta.picture === "string" && meta.picture) ||
        (typeof meta.avatar_url === "string" && meta.avatar_url) ||
        null;
      const alreadyHosted =
        profile?.profile_image_url?.includes(HOSTED_AVATAR_MARKER) ?? false;
      if (providerPhoto && !alreadyHosted) {
        await rehostProviderAvatar(user.id, providerPhoto);
      }
      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  const dest = redirectParam && redirectParam.startsWith("/") ? redirectParam : "/admin";
  return NextResponse.redirect(`${origin}${dest}`);
}
