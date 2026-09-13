"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { USER_COOKIE } from "../hub/dev-login";
import { createClient } from "./server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Drop the demo identity too. Without this, signing out landed straight
  // back in the hub as whichever seeded student the dev-login cookie still
  // named — you appeared to be logged in as a stranger.
  (await cookies()).delete(USER_COOKIE);
  redirect("/welcome");
}

/**
 * Deletes the signed-in user's own account, then signs them out.
 *
 * Goes through the delete_own_account() SQL function rather than the admin API,
 * because the admin API needs a service_role key and that key must never be in
 * this app's environment — it bypasses row-level security entirely. The
 * function is SECURITY DEFINER but only ever deletes auth.uid(), so a caller
 * cannot name someone else's account.
 *
 * Destructive and irreversible: the UI must confirm before calling this.
 */
export async function deleteAccount() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("delete_own_account");
  if (error) {
    throw new Error(
      `Couldn't delete the account: ${error.message}. Run supabase/migrations/0004_delete_account.sql if you haven't.`,
    );
  }

  await supabase.auth.signOut();
  redirect("/welcome?deleted=1");
}
