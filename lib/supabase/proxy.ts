import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie on every request. Firebase comparison:
 * the closest thing is `onIdTokenChanged` auto-refreshing a token client-side —
 * this does the same job, but server-side and on every navigation, because
 * Server Components read the session from a cookie and can't refresh it
 * themselves (see lib/supabase/server.ts).
 *
 * Lives in lib/supabase/ rather than at the project root because the file
 * Next.js actually loads is proxy.ts (see that file) — Next 16 renamed
 * middleware.ts to proxy.ts, and Supabase's own docs still say middleware.ts.
 * This is the translated version.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Fail open, not closed. This proxy runs on almost every route (see the
  // matcher in proxy.ts), so a missing .env.local — the normal state right
  // after a fresh clone, before anyone's set up a Supabase project — would
  // otherwise 500 the entire app, including pages that have nothing to do
  // with auth. Real auth pages still work fine without this: the dev picker
  // and the rest of the app just keep running on the cookie session alone.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not remove: this call is what actually refreshes the token. Reading
  // getSession() alone (or skipping this) lets an expired session through.
  await supabase.auth.getUser();

  return response;
}
