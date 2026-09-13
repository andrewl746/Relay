"use client";

import Link from "next/link";
import { useState } from "react";
import { categoryLabel, formatWhen } from "@/lib/hub/format";
import type { Category, OfferType } from "@/lib/hub/types";
import { ChoiceChips, Field, SlotRows } from "./form-fields";
import { btnPrimary, btnTertiary, fieldClass } from "./ui";

export function PostItemForm({ defaultPlace }: { defaultPlace: string }) {
  const [category, setCategory] = useState<Category>("furniture");
  const [offerType, setOfferType] = useState<OfferType>("sale");
  const [hasDeadline, setHasDeadline] = useState(true);
  const [listed, setListed] = useState<{ title: string; deadline: string | null } | null>(null);

  if (listed) {
    return (
      <div role="status" className="rounded-2 border border-rule-strong bg-paper-raised px-5 py-5">
        <p className="t-title text-[22px]">Listed.</p>
        <p className="mt-1">
          “{listed.title}” is on the board
          {listed.deadline ? `, gone by ${listed.deadline} unless someone claims it.` : "."}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-5">
          <Link href="/" className={btnPrimary}>
            See it on the board
          </Link>
          <button type="button" onClick={() => setListed(null)} className={btnTertiary}>
            Post another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const deadline = data.get("expiresAt");
        setListed({
          title: String(data.get("title")),
          deadline: hasDeadline && deadline ? formatWhen(`${deadline}:00-04:00`) : null,
        });
      }}
      className="space-y-8"
    >
      <Field label="What is it" htmlFor="title">
        <input id="title" name="title" required placeholder="IKEA desk, white, 120cm" className={fieldClass} />
      </Field>

      <Field label="Details" hint="Size, brand, any scratches. Write it like you’d text a friend." htmlFor="description">
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Fits a laptop and a monitor. One leg wobbles a bit."
          className={fieldClass}
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Category" htmlFor="category">
          <select
            id="category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className={fieldClass}
          >
            {(Object.keys(categoryLabel) as Category[]).map((value) => (
              <option key={value} value={value}>
                {categoryLabel[value]}
              </option>
            ))}
          </select>
        </Field>

        <ChoiceChips
          legend="Offer"
          name="offerType"
          value={offerType}
          onChange={setOfferType}
          options={[
            { value: "sale", label: "Sell" },
            { value: "free", label: "Give away for free" },
            { value: "lend", label: "Lend for free" },
            { value: "rent", label: "Lend for money" },
          ]}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {(offerType === "sale" || offerType === "rent") && (
          <Field label={offerType === "rent" ? "Price per term" : "Price"} htmlFor="price">
            <div className="relative">
              <span className="data pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-2">$</span>
              <input
                id="price"
                name="price"
                type="number"
                min={0}
                inputMode="numeric"
                required
                placeholder="25"
                className={`${fieldClass} data pl-7`}
              />
            </div>
          </Field>
        )}
        <Field label="Condition" htmlFor="condition">
          <select id="condition" name="condition" defaultValue="good" className={fieldClass}>
            <option value="new">New</option>
            <option value="like-new">Like new</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="bad">Bad</option>
          </select>
        </Field>
      </div>

      <fieldset className="border-y border-rule py-5">
        <legend className="sr-only">Deadline</legend>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={hasDeadline}
            onChange={(e) => setHasDeadline(e.target.checked)}
            className="mt-1 size-4 accent-[var(--ink)]"
          />
          <span>
            <span className="block font-semibold">It has to be gone by a certain time</span>
            <span className="block text-[13px] text-ink-2">
              Listings with a deadline sit higher on the board as the time gets closer.
            </span>
          </span>
        </label>
        {hasDeadline && (
          <div className="mt-4 sm:max-w-xs">
            <Field label="Gone by" htmlFor="expiresAt">
              <input
                id="expiresAt"
                name="expiresAt"
                type="datetime-local"
                required
                defaultValue="2026-09-15T12:00"
                className={`${fieldClass} data`}
              />
            </Field>
          </div>
        )}
      </fieldset>

      <SlotRows defaultPlace={defaultPlace} />

      <button type="submit" className={`${btnPrimary} w-full sm:w-auto`}>
        List it
      </button>
    </form>
  );
}
