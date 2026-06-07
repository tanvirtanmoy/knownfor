import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GDPR Art. 15 / 20 — let a signed-in user download a portable copy of their
// own data as JSON. RLS scopes every query to the caller, so a user can only
// ever export their own records. We deliberately omit the anti-spam metadata
// (hashed IP, user-agent) attached to incoming feedback: that is the giver's
// data, not the profile owner's, and is never shown to the owner.
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const [profile, feedback, summaries, links] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("feedback")
      .select(
        "id, sentence, giver_name, giver_role, giver_company, relationship, allow_name_public, status, is_public, source, created_at, approved_at"
      )
      .eq("profile_user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("profile_summaries")
      .select("id, summary, top_traits, generated_at, created_at")
      .eq("profile_user_id", user.id),
    supabase
      .from("feedback_links")
      .select("id, label, token, revoked, use_count, last_used_at, created_at")
      .eq("profile_user_id", user.id),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
    },
    profile: profile.data ?? null,
    feedback_received: feedback.data ?? [],
    summaries: summaries.data ?? [],
    share_links: links.data ?? [],
  };

  const filename = `knownfor-data-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
