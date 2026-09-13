import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Firebase comparison: this is your `getAuth(app)`
 * — a singleton-ish handle you call from client components ("use client").
 *
 * The two env vars are the only Supabase setup this project needs: no schema,
 * no service-role key, nothing server-secret. Both are meant to be public —
 * that's why they're NEXT_PUBLIC_ — Supabase's row-level security is what
 * keeps the anon key safe to ship to the browser, the same way Firebase's
 * client config object is safe to ship.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
