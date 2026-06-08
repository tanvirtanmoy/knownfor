import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RESERVED_SLUGS } from "@/lib/validators/profile";
import {
  SLUG_RE,
  SLUG_MIN,
  SLUG_MAX,
  isSlugAvailable,
  findAvailableSlug,
} from "@/lib/slug";

// Live handle-availability check for the onboarding + profile forms. Returns
// whether a handle is free and, when it isn't, a ready-to-use suggestion.
// Gated to signed-in users — slug existence is already public (you can just
// visit the URL), but requiring auth keeps casual enumeration off the endpoint.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const raw = new URL(request.url).searchParams.get("slug") ?? "";
  const slug = raw.trim().toLowerCase();

  if (slug.length < SLUG_MIN || slug.length > SLUG_MAX || !SLUG_RE.test(slug)) {
    return NextResponse.json({
      available: false,
      reason: `Use ${SLUG_MIN}–${SLUG_MAX} lowercase letters, numbers, and hyphens.`,
    });
  }

  if (RESERVED_SLUGS.has(slug)) {
    return NextResponse.json({
      available: false,
      reason: "That handle is reserved.",
      suggestion: await findAvailableSlug(slug),
    });
  }

  if (await isSlugAvailable(slug, user.id)) {
    return NextResponse.json({ available: true });
  }

  return NextResponse.json({
    available: false,
    reason: "That handle is already taken.",
    suggestion: await findAvailableSlug(slug),
  });
}
