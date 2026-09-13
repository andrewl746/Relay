import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { getUsers } from "@/lib/hub/data";
import { USER_COOKIE, safeNextPath } from "@/lib/hub/dev-login";
import { createClient } from "@/lib/supabase/server";

/**
 * Where the link in the magic-link email actually points. Firebase comparison:
 * this is the equivalent of the page you'd build to call
 * `isSignInWithEmailLink()` / `signInWithEmailLink()` — Supabase's version
 * just verifies server-side instead, in a route handler, before anything
 * renders.
 *
 * This route is doing two separate jobs, worth keeping mentally distinct:
 *
 *   1. Prove the email is real (Supabase's job — `verifyOtp`)
 *   2. Decide which of *our* app users that email belongs to (our job)
 *
 * Job 2 exists because Supabase Auth and the app's user data are two
 * different systems that were never merged: Supabase only ever holds an
 * identity (an email, a session), never a Listing or a moveDate. Once an
 * email is verified, we look it up against the same seeded `users` array the
 * dev picker already uses, and set the same `relay-user` cookie the dev
 * picker already sets. Every other file that reads "the current user" — the
 * whole rest of the app — needed zero changes for that reason.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // The email template embeds {{ .RedirectTo }} here, which is the full
  // `emailRedirectTo` URL the sign-in form passed (origin + destination path)
  // — Supabase requires that option to be an absolute URL. Reduce it back to
  // just a path before trusting it as a redirect target.
  const rawNext = searchParams.get("next");
  const nextPath = rawNext ? new URL(rawNext, origin).pathname : null;
  const next = safeNextPath(nextPath);

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error || !data.user?.email) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  const users = await getUsers();
  const matched = users.find(
    (u) => u.email.toLowerCase() === data.user!.email!.toLowerCase(),
  );

  if (!matched) {
    // The email is genuinely verified, but it isn't one of the seeded
    // students — there's no Listing history, no moveDate, nothing for the
    // rest of the app to render. Seeding a real account here is the natural
    // next step once this stops being a fixed demo roster.
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/auth/auth-code-error?reason=unknown-student`);
  }

  const response = NextResponse.redirect(`${origin}${next}`);
  response.cookies.set(USER_COOKIE, matched.id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });
  return response;
}
