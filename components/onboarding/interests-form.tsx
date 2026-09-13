"use client";

import { useActionState, useState } from "react";
import { saveInterests, type ActionState } from "@/app/(onboarding)/actions";
import { btnPrimary } from "@/components/hub/ui";
import { INTERESTS } from "@/lib/onboarding/interests";
import { InterestArt } from "./interest-art";
import { errorClass } from "./shell";

const initialState: ActionState = { status: "idle" };

/**
 * A grid of boxes, not a list of checkboxes. Picking interests is a browsing
 * decision, so it should look like looking at things — each tile carries its
 * own stencil art and the whole set fills the width.
 *
 * The input stays a real checkbox (visually hidden, not removed) so the form
 * posts normally and keyboard + screen-reader behaviour is unchanged.
 */
export function InterestsForm({ defaultInterests }: { defaultInterests: string[] }) {
  const [state, formAction, pending] = useActionState(saveInterests, initialState);
  const [picked, setPicked] = useState<string[]>(defaultInterests);

  const toggle = (id: string, on: boolean) =>
    setPicked((prev) => (on ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)));

  return (
    <form action={formAction} className="space-y-6">
      <fieldset>
        <legend className="sr-only">What are you looking for?</legend>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {INTERESTS.map((interest, i) => {
            const on = picked.includes(interest.id);
            return (
              <label
                key={interest.id}
                className={`group anim-flap relative flex cursor-pointer flex-col gap-3 rounded-md border p-4 transition-[border-color,background-color,box-shadow] duration-100 hover:shadow-[var(--lift)] sm:p-5 ${
                  on
                    ? "border-accent bg-accent-tint"
                    : "border-border bg-surface hover:border-border-strong"
                }`}
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <input
                  type="checkbox"
                  name="interests"
                  value={interest.id}
                  defaultChecked={on}
                  onChange={(e) => toggle(interest.id, e.currentTarget.checked)}
                  className="sr-only"
                />

                {/* tick, drawn only when chosen */}
                <span
                  aria-hidden
                  className={`absolute top-3 right-3 grid size-6 place-items-center rounded-full border-2 text-[13px] font-bold transition-colors ${
                    on
                      ? "border-accent bg-accent text-on-accent"
                      : "border-border-strong text-transparent"
                  }`}
                >
                  ✓
                </span>

                <span
                  className={`h-16 w-16 transition-colors sm:h-20 sm:w-20 ${
                    on ? "text-accent" : "text-ink-3 group-hover:text-ink-2"
                  }`}
                >
                  <InterestArt id={interest.id} />
                </span>

                <span>
                  <span className="block text-[16px] font-semibold text-ink">
                    {interest.label}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-ink-2">
                    {interest.hint}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {state.status === "error" && <p className={errorClass}>{state.message}</p>}

      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? "Saving…" : "Next"}
        </button>
        <span className="text-[13px] text-ink-2">
          {picked.length === 0
            ? "Pick as many as you like — you can change these later."
            : `${picked.length} selected`}
        </span>
      </div>
    </form>
  );
}
