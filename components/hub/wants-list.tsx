"use client";

import { useState, useTransition } from "react";
import { addWant, removeWant } from "@/lib/hub/actions";
import { CloseIcon } from "./icons";
import { VoiceInput } from "./voice-input";
import { btnSecondary, fieldClass } from "./ui";

export type WantRow = {
  id: string;
  text: string;
  budget: string | null;
  matchCount: number;
  fulfilled: boolean;
};

export function WantsList({ initial, prefill }: { initial: WantRow[]; prefill: string }) {
  const [rows, setRows] = useState(initial);
  const [text, setText] = useState(prefill);
  const [budget, setBudget] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Saving revalidates the page, which hands down fresh rows with real match
  // counts. Take them, but keep "found it" ticks — those only live here.
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    const found = new Set(rows.filter((r) => r.fulfilled).map((r) => r.id));
    setRows(initial.map((r) => (found.has(r.id) ? { ...r, fulfilled: true } : r)));
  }

  const ordered = [...rows.filter((r) => !r.fulfilled), ...rows.filter((r) => r.fulfilled)];

  const add = () => {
    const value = text.trim();
    if (!value) return;
    const pendingId = `pending-${Date.now()}`;
    setRows((current) => [
      ...current,
      { id: pendingId, text: value, budget: budget ? `under $${budget}` : null, matchCount: 0, fulfilled: false },
    ]);
    setText("");
    setBudget("");
    setError(null);
    startTransition(async () => {
      const result = await addWant(value, budget);
      if (result.status === "error") {
        setRows((current) => current.filter((r) => r.id !== pendingId));
        setText(value);
        setError(result.message);
      }
    });
  };

  const remove = (id: string) => {
    setRows((current) => current.filter((r) => r.id !== id));
    if (!id.startsWith("pending-")) startTransition(() => removeWant(id));
  };

  return (
    <div>
      <ul className="border-t border-rule">
        {ordered.map((row) => (
          <li key={row.id} className="flex min-h-12 items-center gap-3 border-b border-rule py-2">
            <input
              type="checkbox"
              checked={row.fulfilled}
              onChange={() =>
                setRows((current) => current.map((r) => (r.id === row.id ? { ...r, fulfilled: !r.fulfilled } : r)))
              }
              aria-label={row.fulfilled ? `Mark “${row.text}” as still needed` : `Mark “${row.text}” as found`}
              className="size-4 shrink-0 accent-[var(--ink)]"
            />
            <span className={`min-w-0 flex-1 ${row.fulfilled ? "text-ink-3 line-through" : ""}`}>
              {row.text}
              {row.budget && <span className="data ml-2 text-[13px] text-ink-2">{row.budget}</span>}
            </span>
            <span className={`shrink-0 text-[13px] ${row.matchCount > 0 && !row.fulfilled ? "font-semibold" : "text-ink-2"}`}>
              {row.fulfilled
                ? "found it"
                : row.matchCount > 0
                  ? `● ${row.matchCount} ${row.matchCount === 1 ? "match" : "matches"}`
                  : "○ none yet"}
            </span>
            <button
              type="button"
              onClick={() => remove(row.id)}
              aria-label={`Remove “${row.text}”`}
              className="grid size-9 shrink-0 place-items-center rounded-1 text-ink-2 hover:bg-paper-raised hover:text-ink"
            >
              <CloseIcon className="size-4" />
            </button>
          </li>
        ))}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
        className="mt-4 border border-dashed border-rule-strong p-3"
      >
        <label htmlFor="want-text" className="t-eyebrow text-ink-2">
          Add something
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="want-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Like “somewhere to put my books”"
            className={`${fieldClass} flex-1`}
          />
          <label className="relative sm:w-32">
            <span className="sr-only">Budget in dollars, optional</span>
            <span className="data pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[13px] text-ink-2">
              under $
            </span>
            <input
              value={budget}
              onChange={(e) => setBudget(e.target.value.replace(/[^\d]/g, ""))}
              inputMode="numeric"
              placeholder="any"
              className={`${fieldClass} data pl-[4.5rem]`}
            />
          </label>
          <VoiceInput targetId="want-text" submitOnFinish label="Say it" />
          <button type="submit" className={btnSecondary}>
            Add to list
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-2 text-[13px] font-semibold text-accent">
            {error}
          </p>
        )}
        <p className="mt-2 text-[13px] text-ink-2">
          Say it or write it, however you’d actually say it. “Somewhere to sit” still finds chairs.
        </p>
      </form>
    </div>
  );
}
