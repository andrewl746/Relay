"use client";

import Link from "next/link";
import { useState } from "react";
import { CloseIcon } from "./icons";
import { Field, SlotRows } from "./form-fields";
import { btnPrimary, btnSecondary, btnTertiary, fieldClass } from "./ui";

const COMMON_ITEMS = ["Desk", "Desk chair", "Lamp", "Mini fridge", "Bookshelf", "Mattress topper", "Mirror", "Laundry hamper", "Monitor", "Rug"];

type Item = { key: number; name: string; condition: string };

export function RoomBundleForm({ defaultPlace }: { defaultPlace: string }) {
  const [items, setItems] = useState<Item[]>([
    { key: 0, name: "Desk", condition: "good" },
    { key: 1, name: "Desk chair", condition: "good" },
  ]);
  const [custom, setCustom] = useState("");
  const [free, setFree] = useState(false);
  const [listed, setListed] = useState<number | null>(null);

  const addItem = (name: string) => {
    const value = name.trim();
    if (!value) return;
    setItems((current) => [...current, { key: Math.max(-1, ...current.map((i) => i.key)) + 1, name: value, condition: "good" }]);
  };

  const unused = COMMON_ITEMS.filter((name) => !items.some((i) => i.name.toLowerCase() === name.toLowerCase()));

  if (listed !== null) {
    return (
      <div role="status" className="rounded-2 border border-rule-strong bg-paper-raised px-5 py-5">
        <p className="t-title text-[22px]">Listed.</p>
        <p className="mt-1">
          Your room is on the board as one bundle with {listed} items. Incoming students with matching lists get told
          right away.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-5">
          <Link href="/" className={btnPrimary}>
            See it on the board
          </Link>
          <Link href="/handoffs" className={btnTertiary}>
            Go to my handoffs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (items.length > 0) setListed(items.length);
      }}
      className="space-y-8"
    >
      <Field label="Where’s the room" hint="Only the street shows publicly. The unit number goes on the confirmation." htmlFor="room">
        <input id="room" name="room" required defaultValue={defaultPlace} placeholder="318 Lester St" className={fieldClass} />
      </Field>

      <fieldset>
        <legend className="t-eyebrow text-ink-2">What’s in it</legend>
        <p className="mt-1 text-[13px] text-ink-2">Tap to add. You can rename anything.</p>

        {unused.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {unused.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => addItem(name)}
                className="inline-flex min-h-11 items-center rounded-1 border border-dashed border-rule-strong px-3 text-[13px] font-semibold hover:border-ink hover:bg-paper-raised"
              >
                + {name}
              </button>
            ))}
          </div>
        )}

        <ul className="mt-4 border-t border-rule">
          {items.map((item, i) => (
            <li key={item.key} className="flex items-center gap-2 border-b border-rule py-2">
              <span className="data w-6 shrink-0 text-[13px] text-ink-2">{i + 1}</span>
              <input
                aria-label={`Item ${i + 1}`}
                value={item.name}
                onChange={(e) =>
                  setItems((current) => current.map((x) => (x.key === item.key ? { ...x, name: e.target.value } : x)))
                }
                className={`${fieldClass} flex-1`}
              />
              <select
                aria-label={`Condition of ${item.name || `item ${i + 1}`}`}
                value={item.condition}
                onChange={(e) =>
                  setItems((current) => current.map((x) => (x.key === item.key ? { ...x, condition: e.target.value } : x)))
                }
                className={`${fieldClass} w-28 sm:w-32`}
              >
                <option value="like-new">Like new</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
              <button
                type="button"
                onClick={() => setItems((current) => current.filter((x) => x.key !== item.key))}
                aria-label={`Remove ${item.name || `item ${i + 1}`}`}
                className="grid size-11 shrink-0 place-items-center rounded-1 text-ink-2 hover:bg-paper-raised hover:text-ink"
              >
                <CloseIcon className="size-4" />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex gap-2">
          <label htmlFor="custom-item" className="sr-only">
            Something else
          </label>
          <input
            id="custom-item"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addItem(custom);
                setCustom("");
              }
            }}
            placeholder="Something else, like “shower caddy”"
            className={`${fieldClass} flex-1`}
          />
          <button
            type="button"
            onClick={() => {
              addItem(custom);
              setCustom("");
            }}
            className={btnSecondary}
          >
            Add
          </button>
        </div>
        {items.length === 0 && <p className="mt-2 text-[13px] font-semibold">Add at least one item to list your room.</p>}
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={free ? "Price" : "Price for everything"} htmlFor="bundle-price">
          {free ? (
            <p className="data py-2.5 font-semibold">Free</p>
          ) : (
            <div className="relative">
              <span className="data pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-2">$</span>
              <input
                id="bundle-price"
                type="number"
                min={0}
                inputMode="numeric"
                required
                placeholder="140"
                className={`${fieldClass} data pl-7`}
              />
            </div>
          )}
          <label className="mt-2 flex cursor-pointer items-center gap-2 text-[13px]">
            <input type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} className="size-4 accent-[var(--ink)]" />
            Give it all away for free
          </label>
        </Field>
        <Field label="Gone by" hint="Usually the morning you leave." htmlFor="room-deadline">
          <input
            id="room-deadline"
            type="datetime-local"
            required
            defaultValue="2026-09-15T12:00"
            className={`${fieldClass} data`}
          />
        </Field>
      </div>

      <SlotRows defaultPlace={defaultPlace} />

      <button type="submit" disabled={items.length === 0} className={`${btnPrimary} w-full sm:w-auto`}>
        List the whole room
      </button>
    </form>
  );
}
