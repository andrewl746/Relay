"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createListing, type CreateListingResult } from "@/lib/hub/actions";
import { categoryLabel, formatWhen } from "@/lib/hub/format";
import { RETURNS, type Category, type OfferType, type Urgency } from "@/lib/hub/types";
import { LIFESPAN_DAYS } from "@/lib/hub/urgency";
import { ChoiceChips, Field, SlotRows } from "./form-fields";
import { PhotoField } from "./photo-field";
import { btnPrimary, btnTertiary, fieldClass } from "./ui";

const initialState: CreateListingResult = { status: "error", message: "" };

export function PostItemForm({ defaultPlace }: { defaultPlace: string }) {
  const [category, setCategory] = useState<Category>("furniture");
  const [offerType, setOfferType] = useState<OfferType>("sale");
  const [urgency, setUrgency] = useState<Urgency>("low");
  const [hasDeadline, setHasDeadline] = useState(true);
  const [state, formAction, pending] = useActionState(createListing, initialState);

  if (state.status === "ok") {
    return (
      <div role="status" className="rounded-2 border border-rule-strong bg-paper-raised px-5 py-5">
        <p className="t-title text-[22px]">Listed.</p>
        <p className="mt-1">
          “{state.title}” is on the board
          {state.expiresAt ? `, gone by ${formatWhen(state.expiresAt)} unless someone claims it.` : "."}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-5">
          <Link href="/" className={btnPrimary}>
            See it on the board
          </Link>
          {/* Plain anchor, not Link: forces a full reload so useActionState
              resets instead of reusing this component instance's state. */}
          <a href="/post" className={btnTertiary}>
            Post another
          </a>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-8">
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

      <PhotoField />

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

      {RETURNS[offerType] && (
        <div className="sm:max-w-xs">
          <Field label="How long can they keep it" hint="We put the return date on both handoff cards." htmlFor="returnDays">
            <select id="returnDays" name="returnDays" defaultValue="7" className={fieldClass}>
              <option value="1">1 day</option>
              <option value="3">3 days</option>
              <option value="7">1 week</option>
              <option value="14">2 weeks</option>
              <option value="30">1 month</option>
              <option value="105">The whole term</option>
            </select>
          </Field>
        </div>
      )}

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

      <div className="border-t border-rule pt-6">
        <ChoiceChips
          legend="How badly do you need it gone?"
          name="urgency"
          value={urgency}
          onChange={setUrgency}
          options={[
            { value: "low", label: "No rush" },
            { value: "medium", label: "Soon" },
            { value: "high", label: "Urgent" },
          ]}
        />
        <p className="mt-2 text-[13px] text-ink-2">
          {urgency === "high"
            ? "Urgent means this comes off the board in 48 hours — we stop offering pickup times after that, and if two people want it, it goes to whoever has no other option."
            : `We'll keep this live for ${LIFESPAN_DAYS[urgency]} days.`}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Where do they pick it up" hint="A building or an intersection is enough." htmlFor="pickupArea">
          <input id="pickupArea" name="pickupArea" placeholder="318 Lester St" className={fieldClass} />
        </Field>
        <Field label="How should they reach you" htmlFor="contact">
          <input id="contact" name="contact" placeholder="you@uwaterloo.ca" className={fieldClass} />
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

      {state.status === "error" && state.message && <p className="gh-flash-error">{state.message}</p>}

      <button type="submit" disabled={pending} className={`${btnPrimary} w-full sm:w-auto`}>
        {pending ? "Listing…" : "List it"}
      </button>
    </form>
  );
}
