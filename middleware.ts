import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Inactivity timeout: sign users out after 14 days without a request.
// Supabase's own refresh tokens never expire on the free plan, so we enforce
// this ourselves with a sliding "last seen" timestamp cookie.
const INACTIVITY_LIMIT_MS = 14 * 24 * 60 * 60 * 1000;
const LAST_SEEN_COOKIE = "kf_last_seen";
// The cookie must outlive the inactivity window — if it expired on its own we
// could no longer tell that the user had been away, and they'd stay logged in.
// 400 days is the maximum a browser will honour.
const LAST_SEEN_MAX_AGE = 60 * 60 * 24 * 400;

// Refreshes the Supabase auth session on each request and guards /admin.
export async function middleware(request: NextRequest) {
  // 1. Canonical host. OAuth (PKCE) stores its code-verifier cookie on the
  //    origin the user started on; if Supabase sends them back to a different
  //    host the exchange fails. Force everyone onto the apex before anything
  //    else so there is exactly one origin.
  if (request.nextUrl.hostname === "www.knownfor.eu") {
    const apex = request.nextUrl.clone();
    apex.hostname = "knownfor.eu";
    return NextResponse.redirect(apex, 308);
  }

  // 2. Safety net: if an OAuth `code` lands anywhere other than the callback
  //    (e.g. Supabase fell back to the Site URL root), forward it — with its
  //    query intact — to the callback that knows how to exchange it.
  if (
    request.nextUrl.searchParams.has("code") &&
    request.nextUrl.pathname !== "/auth/callback"
  ) {
    const callback = request.nextUrl.clone();
    callback.pathname = "/auth/callback";
    return NextResponse.redirect(callback);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

  // 3. Inactivity timeout. For a signed-in user, compare the last-seen stamp
  //    against the 14-day window. Too old → sign out and send to login. Still
  //    active → slide the window forward by re-stamping the current time.
  if (user) {
    const lastSeenRaw = request.cookies.get(LAST_SEEN_COOKIE)?.value;
    const lastSeen = lastSeenRaw ? Number(lastSeenRaw) : null;
    const now = Date.now();

    if (lastSeen && now - lastSeen > INACTIVITY_LIMIT_MS) {
      // signOut() clears the auth cookies via the cookie handler above, which
      // rebuilds `response`; carry those cleared cookies onto the redirect.
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("expired", "1");
      if (isAdminRoute) {
        url.searchParams.set("redirect", request.nextUrl.pathname);
      }
      const redirect = NextResponse.redirect(url);
      response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
      redirect.cookies.delete(LAST_SEEN_COOKIE);
      return redirect;
    }

    response.cookies.set(LAST_SEEN_COOKIE, String(now), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: LAST_SEEN_MAX_AGE,
    });
  }

  if (isAdminRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Run on everything except static assets & images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
