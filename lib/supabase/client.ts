"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

// Browser client — used in client components (e.g. the login form).
// Untyped on purpose: we keep type safety at our own function boundaries
// (see lib/queries.ts and types/database.ts) rather than via generated types.
export function createClient() {
  return createBrowserClient(env.supabaseUrl(), env.supabaseAnonKey());
}
