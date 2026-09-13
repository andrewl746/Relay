"use client";

import { useActionState, useState } from "react";
import { finishWants, type ActionState } from "@/app/(onboarding)/actions";
import { INTEREST_SUGGESTIONS } from "@/lib/onboarding/interests";

const fieldClass = "gh-input";

const initialState: ActionState = { status: "idle" };

type WantRow = { key: number; text: string; maxPriceCents: number | null };

export function WantsStepForm({ interests }: { interests: string[] }) {
  const [state, formAction, pending] = useActionState(finishWants, initialState);
  const [items, setItems] = useState<WantRow[]>([]);
  const [text, setText] = useState("");
  const [budget, setBudget] = useState("");

  const suggestions = [...new Set(interests.flatMap((id) => INTEREST_SUGGESTIONS[id] ?? []))]
    .filter((label) => !items.some((i) => i.text.toLowerCase() === label.toLowerCase()))
    .slice(0, 6);

  const add = (label: string, priceCents: number | null = null) => {
    const value = label.trim();
    if (!value) return;
    setItems((current) => [
      ...current,
      { key: Math.max(-1, ...current.map((i) => i.key)) + 1, text: value, maxPriceCents: priceCents },
    ]);
  };

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="wants" value={JSON.stringify(items)} />

      {suggestions.length > 0 && (
        <div>
          <p className="gh-label">Quick add, based on what you picked</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => add(label)}
                className="inline-flex min-h-9 items-center rounded-full border border-gh-border px-3 text-[13px] font-medium hover:border-gh-accent hover:bg-gh-accent-subtle"
              >
                + {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="want-text" className="gh-label">
          Something else
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="want-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add(text, budget ? Math.round(Number(budget) * 100) : null);
                setText("");
                setBudget("");
              }
            }}
            placeholder="Describe it your way, like “somewhere to put my books”"
            className={`${fieldClass} flex-1`}
          />
          <label className="relative sm:w-28">
            <span className="sr-only">Budget in dollars, optional</span>
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[13px] text-gh-fg-subtle">
              under $
            </span>
            <input
              value={budget}
              onChange={(e) => setBudget(e.target.value.replace(/[^\d]/g, ""))}
              inputMode="numeric"
              placeholder="any"
              className={`${fieldClass} pl-[4.5rem]`}
            />
          </label>
          <button
            type="button"
            onClick={() => {
              add(text, budget ? Math.round(Number(budget) * 100) : null);
              setText("");
              setBudget("");
            }}
            className="gh-btn w-auto shrink-0 px-5"
          >
            Add
          </button>
        </div>
      </div>

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.key}
              className="flex items-center justify-between gap-3 rounded-md border border-gh-border px-3 py-2 text-[14px]"
            >
              <span>
                {item.text}
                {item.maxPriceCents !== null && (
                  <span className="ml-2 text-[12px] text-gh-fg-muted">
                    under ${(item.maxPriceCents / 100).toFixed(0)}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setItems((current) => current.filter((i) => i.key !== item.key))}
                aria-label={`Remove ${item.text}`}
                className="text-[13px] font-medium text-gh-fg-muted hover:text-gh-danger"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {state.status === "error" && <p className="gh-flash-error">{state.message}</p>}

      <button type="submit" disabled={pending} className="gh-btn gh-btn-primary">
        {pending ? "Saving…" : items.length > 0 ? "Finish" : "Skip for now"}
      </button>
    </form>
  );
}
