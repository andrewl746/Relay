import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client for Server Components, Route Handlers, and
 * Server Actions. Firebase comparison: there's no direct equivalent — the
 * Admin SDK is the closest thing, but this isn't that. This client still acts
 * as the signed-in user (it reads their session out of cookies), it just runs
 * on the server instead of in the browser.
 *
 * Supabase auth sessions live in cookies, not localStorage, specifically so
 * the server can read who's signed in before it renders anything — that's
 * what makes `getCurrentUser()` in lib/hub/session.ts work without a client
 * round-trip. `createServerClient` needs get/set/remove for those cookies;
 * Server Components can't set cookies (Next.js restriction on the read path),
 * so the write side is wrapped in a try/catch — it's a no-op there and that's
 * fine, because `proxy.ts` refreshes the session cookie on every request
 * before a Server Component ever runs.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — proxy.ts already refreshed
            // the session, so there's nothing this call needed to persist.
          }
        },
      },
    },
  );
}
