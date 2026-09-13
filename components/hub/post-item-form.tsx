"use client";

import Link from "next/link";
import { useState } from "react";
import { formatWhen } from "@/lib/hub/format";
import { LIFESPAN_DAYS } from "@/lib/hub/urgency";
import { RETURNS, type Category, type OfferType, type Urgency } from "@/lib/hub/types";
import { ChoiceChips, Field, SlotRows } from "./form-fields";
import { btnPrimary, btnTertiary, fieldClass } from "./ui";

export function PostItemForm({ defaultPlace }: { defaultPlace: string }) {
  const [category, setCategory] = useState<Category>("furniture");
  const [offerType, setOfferType] = useState<OfferType>("sale");
  const [urgency, setUrgency] = useState<Urgency>("low");
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
          <Link href="/browse" className={btnPrimary}>
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

      <div className="flex flex-wrap gap-x-10 gap-y-6">
        <ChoiceChips
          legend="Category"
          name="category"
          value={category}
          onChange={setCategory}
          options={[
            { value: "furniture", label: "Furniture" },
            { value: "school", label: "School" },
            { value: "tools", label: "Tools" },
            { value: "kitchen", label: "Kitchen" },
            { value: "electronics", label: "Electronics" },
            { value: "misc", label: "Everything else" },
          ]}
        />
        <ChoiceChips
          legend="Do you want it back?"
          name="offerType"
          value={offerType}
          onChange={setOfferType}
          options={[
            { value: "free", label: "Give away" },
            { value: "sale", label: "Sell" },
            { value: "borrow", label: "Lend, free" },
            { value: "loan", label: "Lend, for a fee" },
          ]}
        />
      </div>

      {RETURNS[offerType] && (
        <div className="sm:max-w-xs">
          <Field label="How long can they keep it" hint="We put the return date on both your handoff cards." htmlFor="returnDays">
            <select id="returnDays" name="returnDays" defaultValue="7" className={fieldClass}>
              <option value="1">1 day</option>
              <option value="3">3 days</option>
              <option value="7">1 week</option>
              <option value="14">2 weeks</option>
              <option value="30">1 month</option>
            </select>
          </Field>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {offerType !== "free" && (
          <Field label={offerType === "loan" ? "Fee to borrow it" : "Price"} htmlFor="price">
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
            <option value="like-new">Like new</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
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

      <div className="grid gap-6 border-t border-rule pt-6 sm:grid-cols-2">
        <Field label="Where do they pick it up" hint="A building or an intersection is enough." htmlFor="pickupArea">
          <input id="pickupArea" name="pickupArea" required defaultValue={defaultPlace} placeholder="318 Lester St" className={fieldClass} />
        </Field>
        <Field label="How should they reach you" htmlFor="contact">
          <input id="contact" name="contact" required placeholder="you@uwaterloo.ca" className={fieldClass} />
        </Field>
      </div>

      <Field label="Photo" hint="Optional. A bad phone photo still beats no photo." htmlFor="photo">
        <input id="photo" name="photo" type="file" accept="image/*" className={`${fieldClass} py-2 file:mr-3 file:rounded-1 file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-paper file:font-semibold`} />
      </Field>

      <SlotRows defaultPlace={defaultPlace} />

      <button type="submit" className={`${btnPrimary} w-full sm:w-auto`}>
        List it
      </button>
    </form>
  );
}
