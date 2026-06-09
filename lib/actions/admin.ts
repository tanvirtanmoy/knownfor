"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { profileSchema, RESERVED_SLUGS } from "@/lib/validators/profile";
import { sanitizeText } from "@/lib/utils";
import { summarizeFeedback } from "@/lib/ai/summarize-feedback";
import {
  generateToken,
  MAX_ACTIVE_LINKS,
  MAX_LINKS_PER_DAY,
} from "@/lib/feedback-links";
import {
  generateViewToken,
  isViewLinkActive,
  MAX_ACTIVE_VIEW_LINKS,
  MAX_VIEW_LINKS_PER_DAY,
} from "@/lib/view-links";
import { checkRateLimit, dailyRateLimitKey } from "@/lib/rate-limit-db";
import type {
  FeedbackStatus,
  FeedbackRow,
  ProfileViewLinkRow,
} from "@/types/database";

async function requireOwner() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, userId: user.id };
}

// Remove a user's stored avatars, optionally keeping one path (the just-uploaded
// file). Best-effort: storage isn't covered by the DB cascade, so we tidy up the
// per-user folder ourselves. Errors are swallowed — a stale file is harmless.
async function pruneAvatars(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  keepPath?: string
) {
  const { data: files } = await admin.storage.from("avatars").list(userId);
  if (!files?.length) return;
  const stale = files
    .map((o) => `${userId}/${o.name}`)
    .filter((p) => p !== keepPath);
  if (stale.length) await admin.storage.from("avatars").remove(stale);
}

export type ModerationAction =
  | "approve"
  | "hide"
  | "reject"
  | "delete"
  | "toggle_public";

export async function moderateFeedback(formData: FormData): Promise<void> {
  const { supabase, userId } = await requireOwner();
  const id = formData.get("id")?.toString();
  const action = formData.get("action")?.toString() as ModerationAction;
  if (!id || !action) return;

  if (action === "delete") {
    await supabase
      .from("feedback")
      .delete()
      .eq("id", id)
      .eq("profile_user_id", userId);
    revalidatePath("/admin");
    revalidatePath("/", "layout");
    return;
  }

  if (action === "toggle_public") {
    const { data } = await supabase
      .from("feedback")
      .select("is_public")
      .eq("id", id)
      .eq("profile_user_id", userId)
      .maybeSingle();
    if (data) {
      await supabase
        .from("feedback")
        .update({ is_public: !data.is_public })
        .eq("id", id)
        .eq("profile_user_id", userId);
    }
    revalidatePath("/admin");
    revalidatePath("/", "layout");
    return;
  }

  const statusMap: Record<string, FeedbackStatus> = {
    approve: "approved",
    hide: "hidden",
    reject: "rejected",
  };
  const status = statusMap[action];
  if (!status) return;

  await supabase
    .from("feedback")
    .update({
      status,
      is_public: status === "approved",
      approved_at: status === "approved" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("profile_user_id", userId);

  revalidatePath("/admin");
  revalidatePath("/", "layout");
}

export interface ProfileFormState {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string>;
}

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const { supabase, userId } = await requireOwner();

  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    headline: formData.get("headline") || undefined,
    bio: formData.get("bio") || undefined,
    location: formData.get("location") || undefined,
    public_slug: formData.get("public_slug"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors, error: "Please fix the highlighted fields." };
  }

  const v = parsed.data;

  if (RESERVED_SLUGS.has(v.public_slug)) {
    return {
      fieldErrors: { public_slug: "That slug is reserved. Try another." },
      error: "Please choose a different slug.",
    };
  }

  // Profile photo: the user may upload a new file, remove the current one, or
  // leave it untouched. `imageUrl === undefined` means "no change" — we only
  // write profile_image_url when there's an actual upload or an explicit remove,
  // so saving other fields never clears an existing photo.
  let imageUrl: string | null | undefined;
  const file = formData.get("profile_image");
  const removeImage = formData.get("remove_image") === "on";

  if (file instanceof File && file.size > 0) {
    const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!ALLOWED.includes(file.type)) {
      return {
        fieldErrors: { profile_image: "Use a JPEG, PNG, WebP, or GIF image." },
        error: "Please choose a valid image.",
      };
    }
    if (file.size > 2 * 1024 * 1024) {
      return {
        fieldErrors: { profile_image: "Image must be 2 MB or smaller." },
        error: "That image is too large.",
      };
    }

    const admin = createAdminClient();
    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${userId}/${Date.now()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: upErr } = await admin.storage
      .from("avatars")
      .upload(path, bytes, { contentType: file.type, upsert: true });
    if (upErr) {
      return { error: "Could not upload your photo. Please try again." };
    }

    imageUrl = admin.storage.from("avatars").getPublicUrl(path).data.publicUrl;

    // Best-effort: prune the user's older avatars so the bucket doesn't grow.
    await pruneAvatars(admin, userId, path);
  } else if (removeImage) {
    imageUrl = null;
    const admin = createAdminClient();
    await pruneAvatars(admin, userId);
  }

  const update: {
    full_name: string;
    headline: string | null;
    bio: string | null;
    location: string | null;
    public_slug: string;
    profile_image_url?: string | null;
  } = {
    full_name: v.full_name,
    headline: v.headline ?? null,
    bio: v.bio ?? null,
    location: v.location ?? null,
    public_slug: v.public_slug,
  };
  if (imageUrl !== undefined) update.profile_image_url = imageUrl;

  const { error } = await supabase
    .from("users")
    .update(update)
    .eq("id", userId);

  if (error) {
    if (error.code === "23505") {
      return {
        fieldErrors: { public_slug: "That slug is already taken." },
        error: "Please choose a different slug.",
      };
    }
    return { error: "Could not save your profile. Please try again." };
  }

  revalidatePath("/admin/profile");
  revalidatePath(`/${v.public_slug}`);
  return { success: true };
}

// Generate (or regenerate) the profile summary from approved, public feedback
// and persist it to profile_summaries. Uses OpenAI when configured, otherwise
// the local heuristic — see lib/ai/summarize-feedback.ts.
export async function generateSummary(): Promise<void> {
  const { supabase, userId } = await requireOwner();

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", userId)
    .maybeSingle();

  const { data: rows } = await supabase
    .from("feedback")
    .select("sentence, relationship")
    .eq("profile_user_id", userId)
    .eq("status", "approved")
    .eq("is_public", true);

  const feedback = (rows as Pick<FeedbackRow, "sentence" | "relationship">[]) ?? [];

  // Nothing public to summarise — clear any existing summary so the public page
  // never shows traits/summary text above an empty feedback wall.
  if (feedback.length === 0) {
    await supabase
      .from("profile_summaries")
      .delete()
      .eq("profile_user_id", userId);
    revalidatePath("/admin");
    revalidatePath("/", "layout");
    return;
  }

  // Rate limit: non-admins may (re)generate the summary at most 3×/day. This
  // caps OpenAI spend and abuse; admins (role = "admin") are exempt. Checked
  // right before the OpenAI call so a blocked attempt never burns API quota and
  // a no-op "clear empty summary" above never consumes a daily slot.
  if (profile?.role !== "admin") {
    const rate = await checkRateLimit(
      supabase,
      dailyRateLimitKey(`summary:${userId}`),
      { limit: 3, windowSeconds: 60 * 60 * 24 }
    );
    if (!rate.ok) {
      redirect("/admin?summaryError=rate");
    }
  }

  const result = await summarizeFeedback({
    fullName: (profile?.full_name as string) ?? "this person",
    feedback,
  });

  await supabase.from("profile_summaries").insert({
    profile_user_id: userId,
    summary: result.summary,
    top_traits: result.topTraits,
    generated_at: result.generatedAt,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/profile");
}

// Create a new private share link (unique token) for the owner's feedback form.
// Two guards keep this bounded per user: a hard cap on active (non-revoked)
// links, and a daily creation rate limit to stop revoke-and-recreate churn.
export async function createShareLink(formData: FormData): Promise<void> {
  const { supabase, userId } = await requireOwner();

  // 1) Active-link cap. Revoking/deleting a link frees a slot.
  const { count } = await supabase
    .from("feedback_links")
    .select("id", { count: "exact", head: true })
    .eq("profile_user_id", userId)
    .eq("revoked", false);
  if ((count ?? 0) >= MAX_ACTIVE_LINKS) {
    redirect("/admin?linkError=limit");
  }

  // 2) Daily creation rate limit (anti-churn), shared across instances.
  const rate = await checkRateLimit(supabase, `links:${userId}`, {
    limit: MAX_LINKS_PER_DAY,
    windowSeconds: 60 * 60 * 24,
  });
  if (!rate.ok) {
    redirect("/admin?linkError=rate");
  }

  const label =
    sanitizeText(formData.get("label")?.toString() ?? "").slice(0, 60) || null;

  await supabase.from("feedback_links").insert({
    profile_user_id: userId,
    token: generateToken(),
    label,
  });

  revalidatePath("/admin");
}

// Revoke a share link so its URL/QR can no longer open the feedback form.
// The row is kept (greyed out in the UI) so its submission count stays visible.
export async function revokeShareLink(formData: FormData): Promise<void> {
  const { supabase, userId } = await requireOwner();
  const id = formData.get("id")?.toString();
  if (!id) return;

  await supabase
    .from("feedback_links")
    .update({ revoked: true })
    .eq("id", id)
    .eq("profile_user_id", userId);

  revalidatePath("/admin");
}

// Permanently remove a share link (and its history) from the list.
export async function deleteShareLink(formData: FormData): Promise<void> {
  const { supabase, userId } = await requireOwner();
  const id = formData.get("id")?.toString();
  if (!id) return;

  await supabase
    .from("feedback_links")
    .delete()
    .eq("id", id)
    .eq("profile_user_id", userId);

  revalidatePath("/admin");
}

// --- Profile visibility + private view links -------------------------------

// Flip the profile between public (live at /<slug>, indexed) and private
// (only reachable through a /v/<token> view link). Driven by a hidden form
// field "make_public" = "on" | "off".
export async function setProfileVisibility(formData: FormData): Promise<void> {
  const { supabase, userId } = await requireOwner();
  const makePublic = formData.get("make_public") === "on";

  await supabase
    .from("users")
    .update({ is_public: makePublic })
    .eq("id", userId);

  revalidatePath("/admin");
  revalidatePath("/", "layout");
}

// Create a private view link (unique token) so the owner can share their wall
// with specific people without making it world-public. Same two guards as feedback
// links: an active-link cap plus a daily creation rate limit (anti-churn).
// An optional "expires_days" field sets a self-expiring link.
export async function createViewLink(formData: FormData): Promise<void> {
  const { supabase, userId } = await requireOwner();

  // 1) Active-link cap (counts non-revoked, non-expired links).
  const { data: existing } = await supabase
    .from("profile_view_links")
    .select("*")
    .eq("profile_user_id", userId);
  const activeCount = ((existing as ProfileViewLinkRow[] | null) ?? []).filter(
    isViewLinkActive
  ).length;
  if (activeCount >= MAX_ACTIVE_VIEW_LINKS) {
    redirect("/admin?viewError=limit");
  }

  // 2) Daily creation rate limit (anti-churn), shared across instances.
  const rate = await checkRateLimit(supabase, `viewlinks:${userId}`, {
    limit: MAX_VIEW_LINKS_PER_DAY,
    windowSeconds: 60 * 60 * 24,
  });
  if (!rate.ok) {
    redirect("/admin?viewError=rate");
  }

  const label =
    sanitizeText(formData.get("label")?.toString() ?? "").slice(0, 60) || null;

  // Optional expiry: 7 / 30 / 90 days, anything else (incl. "never") → no expiry.
  const expiresDays = Number(formData.get("expires_days"));
  const expires_at =
    [7, 30, 90].includes(expiresDays)
      ? new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

  await supabase.from("profile_view_links").insert({
    profile_user_id: userId,
    token: generateViewToken(),
    label,
    expires_at,
  });

  revalidatePath("/admin");
}

// Revoke a view link so its URL can no longer render the profile. The row is
// kept (greyed out) so its view count stays visible.
export async function revokeViewLink(formData: FormData): Promise<void> {
  const { supabase, userId } = await requireOwner();
  const id = formData.get("id")?.toString();
  if (!id) return;

  await supabase
    .from("profile_view_links")
    .update({ revoked: true })
    .eq("id", id)
    .eq("profile_user_id", userId);

  revalidatePath("/admin");
}

// Permanently remove a view link (and its history) from the list.
export async function deleteViewLink(formData: FormData): Promise<void> {
  const { supabase, userId } = await requireOwner();
  const id = formData.get("id")?.toString();
  if (!id) return;

  await supabase
    .from("profile_view_links")
    .delete()
    .eq("id", id)
    .eq("profile_user_id", userId);

  revalidatePath("/admin");
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
