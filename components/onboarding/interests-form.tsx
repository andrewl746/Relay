"use client";

import { useActionState } from "react";
import { saveInterests, type ActionState } from "@/app/(onboarding)/actions";
import { INTERESTS } from "@/lib/onboarding/interests";

const initialState: ActionState = { status: "idle" };

export function InterestsForm({ defaultInterests }: { defaultInterests: string[] }) {
  const [state, formAction, pending] = useActionState(saveInterests, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="sr-only">What are you looking for?</legend>
        {INTERESTS.map((interest) => (
          <label
            key={interest.id}
            className="flex cursor-pointer items-start gap-3 rounded-md border border-gh-border px-3 py-2.5 has-[:checked]:border-gh-accent has-[:checked]:bg-gh-accent-subtle"
          >
            <input
              type="checkbox"
              name="interests"
              value={interest.id}
              defaultChecked={defaultInterests.includes(interest.id)}
              className="mt-0.5 size-4 accent-[var(--gh-accent)]"
            />
            <span>
              <span className="block text-[14px] font-medium">{interest.label}</span>
              <span className="block text-[12px] text-gh-fg-muted">{interest.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {state.status === "error" && <p className="gh-flash-error">{state.message}</p>}

      <button type="submit" disabled={pending} className="gh-btn gh-btn-primary">
        {pending ? "Saving…" : "Next"}
      </button>
    </form>
  );
}
