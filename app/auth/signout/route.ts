import { NextResponse } from "next/server";
import { USER_COOKIE } from "@/lib/hub/dev-login";
import { createClient } from "@/lib/supabase/server";

// Firebase comparison: auth.signOut(), just called from the server so the
// relay-user cookie (which is what the rest of the app actually reads) can
// be cleared in the same response.
//
// Signing out of Supabase is skipped when it isn't configured yet, same
// reasoning as proxy.ts: the dev picker alone is a valid way to run this app,
// clicking "Sign out" there shouldn't 500 just because no one's set up a
// Supabase project.
export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete(USER_COOKIE);
  return response;
}
