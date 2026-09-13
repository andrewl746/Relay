"use client";

import { useState, type ReactNode } from "react";
import { CloseIcon } from "./icons";
import { btnTertiary, fieldClass } from "./ui";

export function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="t-eyebrow text-ink-2">
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {hint && <p className="mt-1.5 text-[13px] text-ink-2">{hint}</p>}
    </div>
  );
}

export function ChoiceChips<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="t-eyebrow text-ink-2">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="peer sr-only"
            />
            <span className="inline-flex min-h-11 items-center rounded-1 border border-rule px-4 text-[13px] font-semibold transition-colors duration-[90ms] peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink hover:border-rule-strong">
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

type SlotRow = { key: number; date: string; start: string; end: string; place: string };

export function SlotRows({ defaultPlace }: { defaultPlace: string }) {
  const [rows, setRows] = useState<SlotRow[]>([
    { key: 0, date: "2026-09-14", start: "17:00", end: "18:00", place: "SLC main lobby" },
    { key: 1, date: "2026-09-15", start: "10:00", end: "11:00", place: defaultPlace },
  ]);

  const update = (key: number, patch: Partial<SlotRow>) =>
    setRows((current) => current.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  return (
    <fieldset>
      <legend className="t-eyebrow text-ink-2">Pickup times</legend>
      <p className="mt-1 text-[13px] text-ink-2">
        Buyers pick one of these instead of messaging you. Public spots on campus are the safest default.
      </p>
      <ul className="mt-3 border-t border-rule">
        {rows.map((row, i) => (
          <li
            key={row.key}
            className="grid grid-cols-2 gap-2 border-b border-rule py-3 sm:grid-cols-[9.5rem_6rem_6rem_1fr_2.75rem] sm:items-center"
          >
            <input
              type="date"
              aria-label={`Pickup time ${i + 1}, date`}
              value={row.date}
              onChange={(e) => update(row.key, { date: e.target.value })}
              className={`${fieldClass} data col-span-2 sm:col-span-1`}
            />
            <input
              type="time"
              aria-label={`Pickup time ${i + 1}, from`}
              value={row.start}
              onChange={(e) => update(row.key, { start: e.target.value })}
              className={`${fieldClass} data`}
            />
            <input
              type="time"
              aria-label={`Pickup time ${i + 1}, until`}
              value={row.end}
              onChange={(e) => update(row.key, { end: e.target.value })}
              className={`${fieldClass} data`}
            />
            <input
              aria-label={`Pickup time ${i + 1}, place`}
              value={row.place}
              onChange={(e) => update(row.key, { place: e.target.value })}
              placeholder="Where to meet"
              className={`${fieldClass} col-span-2 sm:col-span-1`}
            />
            <button
              type="button"
              disabled={rows.length === 1}
              onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))}
              aria-label={`Remove pickup time ${i + 1}`}
              className="col-span-2 grid h-11 place-items-center rounded-1 text-ink-2 hover:bg-paper-raised hover:text-ink disabled:invisible sm:col-span-1"
            >
              <CloseIcon className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() =>
          setRows((current) => [
            ...current,
            {
              key: Math.max(-1, ...current.map((r) => r.key)) + 1,
              date: "2026-09-15",
              start: "12:00",
              end: "13:00",
              place: "SLC main lobby",
            },
          ])
        }
        className={`${btnTertiary} mt-3 min-h-11 text-[13px]`}
      >
        + Add another time
      </button>
    </fieldset>
  );
}
