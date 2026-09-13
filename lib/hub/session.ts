import { cookies } from "next/headers";
import type { ProfileRow } from "../onboarding/profile";
import { getMyProfile, getSupabaseUser } from "../supabase/session";
import { getUser, getUsers } from "./data";
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
    // They are signed in and already here, so there is no separate arrival
    // address to walk from. See the `destination` note in ./types.
    destination: null,
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
    return profileToUser(supabaseUser.id, supabaseUser.email, await getMyProfile());
  }

  const id = (await cookies()).get(USER_COOKIE)?.value;
  let user = id ? await getUser(id) : null;
  
  if (!user) {
    user = await getUser(DEFAULT_USER_ID);
  }
  
  if (!user) {
    const allUsers = await getUsers();
    user = allUsers[0];
  }

  if (!user) throw new Error(`No users exist in the dataset.`);
  return user;
}
