import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

// Server client bound to the request cookies. Respects RLS using the signed-in
// user's session (or the anon role for visitors).
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    env.supabaseUrl(),
    env.supabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // `setAll` is called from a Server Component where mutating cookies
            // is not allowed. Safe to ignore — middleware refreshes the session.
          }
        },
      },
    }
  );
}

// Service-role client — SERVER ONLY, bypasses RLS. Use sparingly (e.g. capturing
// private submission metadata that the public role cannot write).
export function createAdminClient() {
  return createSupabaseClient(
    env.supabaseUrl(),
    env.supabaseServiceRoleKey(),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}
