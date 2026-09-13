import { cache } from "react";
import { getProfile } from "../onboarding/profile";
import { createClient } from "./server";

export function supabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Both cached per request. Every getUser() is a round trip to Supabase Auth
 * (150–300ms), and the hub layout, header and page each asked separately —
 * about five auth calls and three profile reads per click on a real account,
 * which is why navigating was slow there and instant in demo mode.
 */
export const getSupabaseUser = cache(async () => {
  if (!supabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** The signed-in user's profile row, or null in demo mode. Read-only paths only:
 *  a server action that writes the profile should re-read it with getProfile. */
export const getMyProfile = cache(async () => {
  const user = await getSupabaseUser();
  if (!user) return null;
  return getProfile(await createClient(), user.id);
});
