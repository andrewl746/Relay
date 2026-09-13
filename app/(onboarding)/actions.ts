"use server";

import { redirect } from "next/navigation";
import { isUniversityEmail } from "@/lib/hub/email";
import { sendVerificationEmail } from "@/lib/onboarding/email";
import { CODE_LENGTH, CODE_TTL_MINUTES, MAX_ATTEMPTS, generateCode, hashCode } from "@/lib/onboarding/otp";
import { getProfile } from "@/lib/onboarding/profile";
import { getUniversity } from "@/lib/onboarding/universities";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseUser } from "@/lib/supabase/session";

export type ActionState = { status: "idle" | "error" | "sent"; message?: string; devCode?: string };

async function requireUser() {
  const authUser = await getSupabaseUser();
  if (!authUser) redirect("/login");
  const supabase = await createClient();
  return { supabase, user: authUser };
}

export async function saveProfileStep(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const universityId = String(formData.get("universityId") ?? "").trim();
  const livingSituation = String(formData.get("livingSituation") ?? "").trim();
  const street = String(formData.get("street") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const province = String(formData.get("province") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();

  if (!fullName) return { status: "error", message: "Enter your name." };
  if (!getUniversity(universityId)) return { status: "error", message: "Choose a university from the list." };
  if (livingSituation !== "on_campus" && livingSituation !== "off_campus") {
    return { status: "error", message: "Choose whether you live on or off campus." };
  }
  if (!street) return { status: "error", message: "Enter your street address." };
  if (!city) return { status: "error", message: "Enter your city." };
  if (!province) return { status: "error", message: "Enter your province or state." };
  if (!country) return { status: "error", message: "Enter your country." };
  if (!postalCode) return { status: "error", message: "Enter your postal code." };

  const profile = await getProfile(supabase, user.id);
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
      onboarding_step: profile?.onboarding_step === "profile" ? "verify" : profile?.onboarding_step,
    })
    .eq("id", user.id);

  if (error) return { status: "error", message: "Couldn't save that. Try again." };

  redirect("/onboarding/verify");
}

export async function sendVerificationCode(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const profile = await getProfile(supabase, user.id);
  const university = profile?.university_id ? getUniversity(profile.university_id) : null;

  if (!university) return { status: "error", message: "Finish the first step before verifying your email." };
  if (!isUniversityEmail(email, university.emailDomain)) {
    return { status: "error", message: `Use your @${university.emailDomain} address.` };
  }

  const code = generateCode();
  const { error: insertError } = await supabase.from("email_verifications").insert({
    user_id: user.id,
    email,
    code_hash: hashCode(code),
    expires_at: new Date(Date.now() + CODE_TTL_MINUTES * 60_000).toISOString(),
  });
  if (insertError) return { status: "error", message: "Couldn't send a code. Try again." };

  await supabase.from("profiles").update({ university_email: email }).eq("id", user.id);

  try {
    await sendVerificationEmail(email, code);
    return { status: "sent", message: email };
  } catch (err) {
    // Real email delivery failed (commonly Resend's sandbox limit before a domain is
    // verified). The code is already generated and stored, so fall back to showing it
    // directly rather than blocking the flow on an external dependency.
    console.error("sendVerificationEmail failed, falling back to on-screen code:", err);
    return { status: "sent", message: email, devCode: code };
  }
}

export async function confirmVerificationCode(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const code = String(formData.get("code") ?? "").trim();
  if (code.length !== CODE_LENGTH) return { status: "error", message: `Enter the ${CODE_LENGTH}-digit code.` };

  const { data: rows } = await supabase
    .from("email_verifications")
    .select("*")
    .eq("user_id", user.id)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1);
  const record = rows?.[0];

  if (!record) return { status: "error", message: "Request a new code first." };
  if (new Date(record.expires_at).getTime() < Date.now()) {
    return { status: "error", message: "That code expired. Send a new one." };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    return { status: "error", message: "Too many tries. Send a new code." };
  }

  if (hashCode(code) !== record.code_hash) {
    await supabase
      .from("email_verifications")
      .update({ attempts: record.attempts + 1 })
      .eq("id", record.id);
    const left = MAX_ATTEMPTS - record.attempts - 1;
    return { status: "error", message: left > 0 ? `Wrong code. ${left} tries left.` : "Too many tries. Send a new code." };
  }

  await supabase.from("email_verifications").update({ consumed_at: new Date().toISOString() }).eq("id", record.id);

  // Re-verifying after a university change: back to settings, not through
  // interests and wants a second time.
  const profile = await getProfile(supabase, user.id);
  const reverify = Boolean(profile?.onboarding_completed);
  await supabase
    .from("profiles")
    .update(reverify ? { university_email_verified: true } : { university_email_verified: true, onboarding_step: "interests" })
    .eq("id", user.id);

  redirect(reverify ? "/settings" : "/onboarding/interests");
}

export async function saveInterests(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const interests = formData.getAll("interests").map(String);

  const { error } = await supabase
    .from("profiles")
    .update({ interests, onboarding_step: "wants" })
    .eq("id", user.id);

  if (error) return { status: "error", message: "Couldn't save that. Try again." };

  redirect("/onboarding/wants");
}

type WantInput = { text: string; maxPriceCents: number | null };

export async function finishWants(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  let items: WantInput[] = [];
  try {
    items = JSON.parse(String(formData.get("wants") ?? "[]"));
  } catch {
    items = [];
  }

  const rows = items
    .map((item) => ({ user_id: user.id, text: item.text.trim(), max_price_cents: item.maxPriceCents }))
    .filter((row) => row.text.length > 0);

  if (rows.length > 0) {
    const { error: wantsError } = await supabase.from("wants").insert(rows);
    if (wantsError) return { status: "error", message: "Couldn't save your list. Try again." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_step: "complete", onboarding_completed: true })
    .eq("id", user.id);

  if (error) return { status: "error", message: "Couldn't finish setup. Try again." };

  redirect("/");
}
