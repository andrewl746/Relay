"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { ThemeToggle } from "@/components/theme";
import { saveSettings, type SettingsState } from "@/lib/hub/settings-actions";
import { getUniversity, UNIVERSITIES, type University } from "@/lib/onboarding/universities";
import { UserSwitcher } from "./user-switcher";
import { btnPrimary, btnSecondary, fieldClass, SectionTitle } from "./ui";

const initial: SettingsState = { status: "idle" };

export type SettingsDefaults = {
  fullName: string;
  email: string;
  universityId: string | null;
  livingSituation: "on_campus" | "off_campus" | null;
  street: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  postalCode: string | null;
  avatarUrl: string | null;
};

function Row({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="board p-5 sm:p-6">
      <SectionTitle>{title}</SectionTitle>
      {hint && <p className="mt-1 mb-4 text-[14px] text-ink-2">{hint}</p>}
      <div className={hint ? "" : "mt-4"}>{children}</div>
    </section>
  );
}

export function SettingsForm({
  defaults,
  deleteAction,
  signOutAction,
  signedIn,
  demoUsers,
  currentUserId,
}: {
  defaults: SettingsDefaults;
  deleteAction: () => Promise<void>;
  signOutAction: () => Promise<void>;
  /** False in demo mode: there is no profile row to edit and nothing to delete. */
  signedIn: boolean;
  demoUsers: { id: string; label: string }[];
  currentUserId: string;
}) {
  const [state, formAction, pending] = useActionState(saveSettings, initial);
  const [onCampus, setOnCampus] = useState(defaults.livingSituation !== "off_campus");
  const [university, setUniversity] = useState<University | null>(
    defaults.universityId ? getUniversity(defaults.universityId) : null,
  );
  const [avatar, setAvatar] = useState(defaults.avatarUrl ?? "");
  const [confirming, setConfirming] = useState(false);

  // Demo students are rows in a seed file, not accounts. There is no profile
  // to save, no photo to change and no account to delete, so the form is not
  // shown at all — an editable form that silently discards what you type is
  // worse than no form. What a demo student does have is which student you
  // are looking at, which is the only setting that means anything here.
  if (!signedIn) {
    return (
      <div className="space-y-6">
        <Row
          title="Demo student"
          hint="You're browsing the seeded demo. Every student sees a different board — different matches, different pickup times they can actually make."
        >
          <UserSwitcher users={demoUsers} currentUserId={currentUserId} />
        </Row>

        <Row title="Appearance" hint="Applies on this device.">
          <ThemeToggle />
        </Row>

        <Row title="Your own account" hint="Sign in with your university Google account to post, claim and keep a list of your own.">
          <Link href="/login" className={btnPrimary}>
            Sign in
          </Link>
        </Row>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-6">
        <Row title="Photo" hint="Taken from your Google account. Paste a link to use a different one.">
          <div className="flex items-center gap-4">
            {avatar ? (
              <Image
                src={avatar}
                alt=""
                width={64}
                height={64}
                unoptimized
                className="size-16 rounded-full object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="flex size-16 items-center justify-center rounded-full bg-accent text-[28px] font-bold text-on-accent"
                style={{ lineHeight: 1 }}
              >
                {defaults.fullName.trim().charAt(0).toUpperCase() || "?"}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <label htmlFor="avatarUrl" className="sr-only">
                Photo link
              </label>
              <input
                id="avatarUrl"
                name="avatarUrl"
                type="url"
                inputMode="url"
                value={avatar}
                onChange={(e) => setAvatar(e.currentTarget.value)}
                placeholder="https://…"
                className={fieldClass}
              />
            </div>
          </div>
        </Row>

        <Row title="You">
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="mb-1 block text-[14px] font-semibold">
                Name
              </label>
              <input
                id="fullName"
                name="fullName"
                required
                defaultValue={defaults.fullName}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="universityId" className="mb-1 block text-[14px] font-semibold">
                University
              </label>
              <select
                id="universityId"
                name="universityId"
                defaultValue={defaults.universityId ?? ""}
                onChange={(e) => setUniversity(getUniversity(e.currentTarget.value))}
                className={fieldClass}
              >
                <option value="" disabled>
                  Choose your university
                </option>
                {UNIVERSITIES.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[13px] text-ink-2">Switching universities means verifying your new university email.</p>
            </div>
            <p className="text-[14px] text-ink-2">
              Signed in as <span className="font-semibold text-ink">{defaults.email}</span>
            </p>
          </div>
        </Row>

        <Row title="Where you are" hint="Used to work out walking distance. Other students only ever see the area.">
          <fieldset className="mb-4">
            <legend className="sr-only">Living situation</legend>
            <div className="flex gap-5">
              {(["on_campus", "off_campus"] as const).map((v) => (
                <label key={v} className="flex items-center gap-2 text-[15px]">
                  <input
                    type="radio"
                    name="livingSituation"
                    value={v}
                    defaultChecked={
                      v === (defaults.livingSituation === "off_campus" ? "off_campus" : "on_campus")
                    }
                    onChange={() => setOnCampus(v === "on_campus")}
                    className="size-4 accent-[var(--accent)]"
                  />
                  {v === "on_campus" ? "On campus" : "Off campus"}
                </label>
              ))}
            </div>
          </fieldset>

          {onCampus ? (
            <div className="rounded-md border border-border bg-surface-2 px-4 py-3 text-[15px]">
              {university ? (
                <>
                  <p className="font-semibold">{university.name}</p>
                  <p className="text-ink-2">
                    {university.campus.street}, {university.campus.city}{" "}
                    {university.campus.postalCode}
                  </p>
                </>
              ) : (
                <p className="text-ink-2">Pick your university and we&rsquo;ll use its address.</p>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="street" className="mb-1 block text-[14px] font-semibold">
                  Street address
                </label>
                <input id="street" name="street" defaultValue={defaults.street ?? ""} className={fieldClass} />
              </div>
              <div>
                <label htmlFor="city" className="mb-1 block text-[14px] font-semibold">City</label>
                <input id="city" name="city" defaultValue={defaults.city ?? ""} className={fieldClass} />
              </div>
              <div>
                <label htmlFor="province" className="mb-1 block text-[14px] font-semibold">Province</label>
                <input id="province" name="province" defaultValue={defaults.province ?? ""} className={fieldClass} />
              </div>
              <div>
                <label htmlFor="country" className="mb-1 block text-[14px] font-semibold">Country</label>
                <input id="country" name="country" defaultValue={defaults.country ?? "Canada"} className={fieldClass} />
              </div>
              <div>
                <label htmlFor="postalCode" className="mb-1 block text-[14px] font-semibold">Postal code</label>
                <input id="postalCode" name="postalCode" defaultValue={defaults.postalCode ?? ""} className={fieldClass} />
              </div>
            </div>
          )}
        </Row>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={pending} className={btnPrimary}>
            {pending ? "Saving…" : "Save changes"}
          </button>
          {state.status === "saved" && (
            <span className="text-[14px] font-semibold text-done">Saved</span>
          )}
          {state.status === "error" && (
            <span className="text-[14px] font-semibold text-accent">{state.message}</span>
          )}
        </div>
      </form>

      <Row title="Appearance" hint="Applies on this device.">
        <ThemeToggle />
      </Row>

      <Row title="Session" hint={`Signed in as ${defaults.email}.`}>
        <form action={signOutAction}>
          <button type="submit" className={btnSecondary}>
            Sign out
          </button>
        </form>
      </Row>

      <section className="rounded-md border border-accent/40 bg-surface p-5 sm:p-6">
        <SectionTitle>Delete account</SectionTitle>
        <p className="mt-1 mb-4 max-w-[60ch] text-[14px] text-ink-2">
          Permanently removes your profile, your list and your listings. This
          can&rsquo;t be undone.
        </p>
        {!confirming ? (
          <button type="button" onClick={() => setConfirming(true)} className={btnSecondary}>
            Delete my account
          </button>
        ) : (
          <form action={deleteAction} className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-sm bg-accent px-5 text-[15px] font-semibold text-on-accent"
            >
              Yes, delete it
            </button>
            <button type="button" onClick={() => setConfirming(false)} className={btnSecondary}>
              Keep my account
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
