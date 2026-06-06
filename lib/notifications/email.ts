// Email notifications via Resend (https://resend.com), called over its REST API
// so no SDK dependency is needed. Entirely optional: if the env vars are not
// configured this is a silent no-op, so the app works without it.
//
// Required env to enable:
//   RESEND_API_KEY     — your Resend API key
//   NOTIFY_EMAIL_TO    — where to send notifications (your inbox)
//   NOTIFY_EMAIL_FROM  — a verified Resend sender, e.g. "KnownFor <noreply@knownfor.eu>"

import { env } from "@/lib/env";

interface NewFeedbackNotice {
  profileName: string;
  slug: string;
  sentence: string;
  relationship: string | null;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function notifyNewFeedback(
  notice: NewFeedbackNotice
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL_TO;
  const from = process.env.NOTIFY_EMAIL_FROM;

  if (!apiKey || !to || !from) return; // not configured — skip silently

  const adminUrl = `${env.siteUrl()}/admin`;
  const relationship = notice.relationship ?? "unspecified";
  const safeSentence = escapeHtml(notice.sentence);

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to,
        subject: `New feedback for ${notice.profileName}`,
        html:
          `<p>You received new feedback (pending review).</p>` +
          `<blockquote style="border-left:3px solid #2f6f6b;margin:0;padding:0 0 0 12px;color:#1c2433">` +
          `&ldquo;${safeSentence}&rdquo;</blockquote>` +
          `<p style="color:#697489">Relationship: ${escapeHtml(relationship)}</p>` +
          `<p><a href="${adminUrl}">Review it in your admin dashboard →</a></p>`,
      }),
    });
  } catch {
    // Never let a notification failure affect the submission flow.
  }
}
