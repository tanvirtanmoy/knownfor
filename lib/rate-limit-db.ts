import type { SupabaseClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/server";

export interface RateLimitOptions {
  limit?: number;
  windowSeconds?: number;
}

export interface RateLimitDecision {
  ok: boolean;
  retryAfterSeconds: number;
}

// Postgres-backed, atomic rate limiter shared across every serverless instance.
// Delegates to the check_rate_limit RPC (SECURITY DEFINER, see migration 0006).
// If the DB call fails for any reason we degrade gracefully to the per-instance
// in-memory limiter so the form is still throttled and never hard-fails.
export async function checkRateLimit(
  supabase: SupabaseClient,
  key: string,
  { limit = 5, windowSeconds = 60 * 60 }: RateLimitOptions = {}
): Promise<RateLimitDecision> {
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) {
    const fallback = rateLimit(key, { limit, windowMs: windowSeconds * 1000 });
    return { ok: fallback.ok, retryAfterSeconds: fallback.retryAfterSeconds };
  }

  return {
    ok: Boolean(row.allowed),
    retryAfterSeconds: Number(row.retry_after ?? 0),
  };
}

// Build a per-calendar-day rate-limit key by appending today's UTC date
// (YYYY-MM-DD) to a prefix. Because the key changes at 00:00 UTC, the counter
// starts fresh each day — a genuine daily quota that resets at the end of the
// day, rather than a rolling 24h window measured from first use. Both the writer
// (checkRateLimit in the action) and the reader (getRateLimitCount) must build
// the key the same way, so always go through this helper.
export function dailyRateLimitKey(prefix: string): string {
  const todayUtc = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `${prefix}:${todayUtc}`;
}

// Read the current hit count for a key WITHOUT incrementing it — used to render a
// live "x / N" usage indicator. Reads via the service-role client because the
// rate_limits table has RLS enabled with no policies. Returns 0 when no hits yet.
export async function getRateLimitCount(key: string): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("rate_limits")
    .select("count")
    .eq("key", key)
    .maybeSingle();
  return (data?.count as number | undefined) ?? 0;
}
