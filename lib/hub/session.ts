import { cookies } from "next/headers";
import { getProfile, type ProfileRow } from "../onboarding/profile";
import { createClient } from "../supabase/server";
import { getSupabaseUser } from "../supabase/session";
import { getUser } from "./data";
import { USER_COOKIE } from "./dev-login";
import { DEFAULT_USER_ID } from "./site";
import type { User } from "./types";

function profileToUser(id: string, email: string | undefined, profile: ProfileRow | null): User {
  return {
    id,
    name: profile?.full_name || email?.split("@")[0] || "New student",
    email: profile?.university_email || email || "",
    universityId: profile?.university_id || "uw",
    home: [profile?.street, profile?.city].filter(Boolean).join(", "),
    moveStatus: "staying",
    moveDate: null,
    note:
      profile?.living_situation === "on_campus"
        ? "Living on campus"
        : profile?.living_situation === "off_campus"
          ? "Living off campus"
          : "",
  };
}

export async function getCurrentUser(): Promise<User> {
  const supabaseUser = await getSupabaseUser();
  if (supabaseUser) {
    const supabase = await createClient();
    const profile = await getProfile(supabase, supabaseUser.id);
    return profileToUser(supabaseUser.id, supabaseUser.email, profile);
  }

  const id = (await cookies()).get(USER_COOKIE)?.value;
  const user = (id ? await getUser(id) : null) ?? (await getUser(DEFAULT_USER_ID));
  if (!user) throw new Error(`Default demo user ${DEFAULT_USER_ID} is missing from mock data`);
  return user;
}
