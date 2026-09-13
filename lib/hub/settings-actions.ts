"use server";

import { revalidatePath } from "next/cache";
import { getUniversity } from "@/lib/onboarding/universities";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseUser } from "@/lib/supabase/session";

export type SettingsState = { status: "idle" | "saved" | "error"; message?: string };

/**
 * Updates the signed-in user's profile.
 *
 * Server Functions take direct POSTs, so everything is validated here rather
 * than trusted from the form. On campus, the address comes from the chosen
 * university, not from whatever was submitted.
 */
export async function saveSettings(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await getSupabaseUser();
  if (!user) return { status: "error", message: "You're signed out." };

  const fullName = String(formData.get("fullName") ?? "").trim();
  const universityId = String(formData.get("universityId") ?? "").trim();
  const livingSituation = String(formData.get("livingSituation") ?? "").trim();
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();

  if (fullName.length < 1) return { status: "error", message: "Enter your name." };
  const university = getUniversity(universityId);
  if (!university) return { status: "error", message: "Choose a university from the list." };
  if (livingSituation !== "on_campus" && livingSituation !== "off_campus") {
    return { status: "error", message: "Choose whether you live on or off campus." };
  }
  if (avatarUrl && !/^https:\/\//i.test(avatarUrl)) {
    return { status: "error", message: "A photo link has to start with https://" };
  }

  const onCampus = livingSituation === "on_campus";
  const street = onCampus ? university.campus.street : String(formData.get("street") ?? "").trim();
  const city = onCampus ? university.campus.city : String(formData.get("city") ?? "").trim();
  const province = onCampus ? university.campus.province : String(formData.get("province") ?? "").trim();
  const country = onCampus ? university.campus.country : String(formData.get("country") ?? "").trim();
  const postalCode = onCampus ? university.campus.postalCode : String(formData.get("postalCode") ?? "").trim();

  if (!onCampus && (!street || !city)) {
    return { status: "error", message: "Enter at least a street and a city." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      university_id: universityId,
      living_situation: livingSituation,
      street,
      city,
      province,
      country,
      postal_code: postalCode,
      avatar_url: avatarUrl || null,
    })
    .eq("id", user.id);

  if (error) return { status: "error", message: "Couldn't save that. Try again." };

  revalidatePath("/", "layout");
  return { status: "saved" };
}
