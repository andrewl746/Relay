import { NextResponse } from "next/server";
import { getProfile } from "@/lib/onboarding/profile";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error_description") ?? url.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(oauthError)}`, url.origin));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, url.origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login?error=no_user", url.origin));

  const profile = await getProfile(supabase, user.id);
  const destination = profile?.onboarding_completed ? "/browse" : "/onboarding/profile";
  return NextResponse.redirect(new URL(destination, url.origin));
}
