"use client";

import { useActionState, useState } from "react";
import { saveInterests, type ActionState } from "@/app/(onboarding)/actions";
import { INTERESTS } from "@/lib/onboarding/interests";
import { InterestArt } from "./interest-art";

const initialState: ActionState = { status: "idle" };

/**
 * A grid of boxes, not a list of checkboxes. Picking interests is a browsing
 * decision, so it should look like looking at things — each tile carries its
 * own stencil art. It lives in Parcel's corner, so it's always two columns.
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

        <div className="grid grid-cols-2 gap-3">
          {INTERESTS.map((interest, i) => {
            const on = picked.includes(interest.id);
            return (
              <label
                key={interest.id}
                className={`group anim-flap relative flex cursor-pointer flex-col gap-3 rounded-[4px] border p-3 transition-[transform,border-color,background-color] duration-100 hover:-translate-y-[2px] ${
                  on
                    ? "border-[var(--kand-red)] bg-[var(--kraft-100)]"
                    : "border-[var(--kraft-300)] bg-[var(--kraft-50)] hover:border-[var(--kraft-400)]"
                }`}
                style={{
                  animationDelay: `${i * 45}ms`,
                  boxShadow: on ? "0 3px 0 var(--kand-red)" : "0 2px 0 var(--kraft-300)",
                }}
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
                      : "border-[var(--kraft-400)] text-transparent"
                  }`}
                >
                  ✓
                </span>

                <span
                  className={`h-12 w-12 transition-colors ${
                    on ? "text-[var(--kand-red)]" : "text-[var(--kraft-400)] group-hover:text-[var(--ink-2)]"
                  }`}
                >
                  <InterestArt id={interest.id} />
                </span>

                <span>
                  <span className="block text-[16px] font-semibold text-[var(--ink)]">
                    {interest.label}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-[var(--ink-2)]">
                    {interest.hint}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {state.status === "error" && <p className="gh-flash-error">{state.message}</p>}

      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className="gh-btn gh-btn-primary">
          {pending ? "Saving…" : "Next"}
        </button>
        <span className="text-[13px] text-[var(--ink-2)]">
          {picked.length === 0
            ? "Pick as many as you like — you can change these later."
            : `${picked.length} selected`}
        </span>
      </div>
    </form>
  );
}
