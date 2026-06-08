"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getValidLink, touchLink } from "@/lib/feedback-links";
import {
  feedbackFormSchema,
  looksSpammy,
} from "@/lib/validators/feedback";
import { checkRateLimit } from "@/lib/rate-limit-db";
import { hashIp, sanitizeText } from "@/lib/utils";
import { notifyNewFeedback } from "@/lib/notifications/email";

export interface SubmitFeedbackState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function clientIp(): string {
  const h = headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

export async function submitFeedback(
  slug: string,
  _prevState: SubmitFeedbackState,
  formData: FormData
): Promise<SubmitFeedbackState> {
  const parsed = feedbackFormSchema.safeParse({
    sentence: formData.get("sentence"),
    relationship: formData.get("relationship") || undefined,
    giver_name: formData.get("giver_name") || undefined,
    giver_role: formData.get("giver_role") || undefined,
    giver_company: formData.get("giver_company") || undefined,
    allow_name_public: formData.get("allow_name_public") === "on",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors, error: "Please fix the highlighted fields." };
  }

  const data = parsed.data;
  const sentence = sanitizeText(data.sentence);

  if (looksSpammy(sentence)) {
    return {
      error:
        "That doesn't look like a sentence about working with this person. Please try again.",
    };
  }

  // Re-validate the private link token server-side — a valid token is required
  // to submit, not just to view the form.
  const token = formData.get("token")?.toString();
  const valid = await getValidLink(slug, token);
  if (!valid) {
    return {
      error:
        "This feedback link is no longer valid. Please ask the person who shared it for a current link.",
    };
  }
  const { profile, link } = valid;

  const ip = clientIp();
  const ipHash = hashIp(ip);

  const supabase = createClient();
  const limit = await checkRateLimit(supabase, `feedback:${slug}:${ipHash}`, {
    limit: 5,
    windowSeconds: 60 * 60,
  });
  if (!limit.ok) {
    return {
      error: `You've submitted a few times already. Please try again in ${Math.ceil(
        limit.retryAfterSeconds / 60
      )} minute(s).`,
    };
  }

  const { error } = await supabase.from("feedback").insert({
    profile_user_id: profile.id,
    sentence,
    relationship: data.relationship ?? null,
    giver_name: data.giver_name ? sanitizeText(data.giver_name) : null,
    giver_role: data.giver_role ? sanitizeText(data.giver_role) : null,
    giver_company: data.giver_company
      ? sanitizeText(data.giver_company)
      : null,
    allow_name_public: data.allow_name_public,
    status: "pending",
    is_public: false,
    source: "public_form",
    ip_hash: ipHash,
    user_agent: headers().get("user-agent")?.slice(0, 400) ?? null,
  });

  if (error) {
    return { error: "Something went wrong saving your feedback. Please retry." };
  }

  await touchLink(link.id);

  // Optional owner notification — no-op if email isn't configured, and never
  // blocks the visitor's redirect.
  await notifyNewFeedback({
    profileName: profile.full_name ?? "your profile",
    slug,
    sentence,
    relationship: data.relationship ?? null,
  });

  // Short-lived proof of submission. The thank-you page (which reveals the
  // wall) only renders when this is present, so the wall can't be reached by
  // navigating to /thanks directly without submitting.
  cookies().set("kf_submitted", slug, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  revalidatePath(`/${slug}`);
  redirect(`/${slug}/feedback/thanks`);
}
