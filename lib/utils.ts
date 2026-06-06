import { createHash } from "crypto";

// Tiny className combiner (avoids pulling in a dependency for this MVP).
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// Strip ASCII control characters and collapse whitespace. We never render user
// input as HTML (React escapes by default), but normalising keeps data clean.
const CONTROL_CHARS = new RegExp("[\\u0000-\\u001F\\u007F]", "g");

export function sanitizeText(input: string): string {
  return input.replace(CONTROL_CHARS, " ").replace(/\s+/g, " ").trim();
}

// Hash an IP with a server-side salt so we can rate-limit / dedupe without
// storing raw IPs (GDPR-friendly).
export function hashIp(ip: string): string {
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "knownfor";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
