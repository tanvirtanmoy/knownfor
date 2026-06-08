import type { SupabaseClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rate-limit";

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
