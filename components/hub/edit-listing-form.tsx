"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { updateListing, type UpdateListingResult } from "@/lib/hub/actions";
import { categoryLabel } from "@/lib/hub/format";
import type { Category, Listing, OfferType } from "@/lib/hub/types";
import { ChoiceChips, Field } from "./form-fields";
import { btnPrimary, btnTertiary, fieldClass } from "./ui";

const initialState: UpdateListingResult = { status: "idle" };

// "2026-09-15T12:00:00-04:00" -> "2026-09-15T12:00", what a datetime-local
// input needs. Every timestamp in this app is authored with that same
// -04:00 offset, so a plain slice is enough — no date library required.
function toLocalInput(expiresAt: string | null) {
  return expiresAt ? expiresAt.slice(0, 16) : "";
}

export function EditListingForm({ listing }: { listing: Listing }) {
  const [category, setCategory] = useState<Category>(listing.category);
  const [offerType, setOfferType] = useState<OfferType>(listing.offerType);
  const [hasDeadline, setHasDeadline] = useState(listing.expiresAt !== null);
  const [state, formAction, pending] = useActionState(updateListing.bind(null, listing.id), initialState);

  return (
    <form action={formAction} className="space-y-8">
      <Field label="What is it" htmlFor="title">
        <input id="title" name="title" required defaultValue={listing.title} className={fieldClass} />
      </Field>

      <Field label="Details" hint="Size, brand, any scratches. Write it like you'd text a friend." htmlFor="description">
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={listing.description}
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
                defaultValue={listing.priceCents !== null ? listing.priceCents / 100 : undefined}
                placeholder="25"
                className={`${fieldClass} data pl-7`}
              />
            </div>
          </Field>
        )}
        <Field label="Condition" htmlFor="condition">
          <select id="condition" name="condition" defaultValue={listing.condition} className={fieldClass}>
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
                defaultValue={toLocalInput(listing.expiresAt)}
                className={`${fieldClass} data`}
              />
            </Field>
          </div>
        )}
      </fieldset>

      {state.status === "error" && state.message && <p className="gh-flash-error">{state.message}</p>}

      <div className="flex flex-wrap items-center gap-5">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? "Saving…" : "Confirm changes"}
        </button>
        <Link href="/posts" className={btnTertiary}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
