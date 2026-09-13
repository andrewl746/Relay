"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OfferType, PlaceKind, Urgency } from "@/lib/hub/types";
import { RETURNS } from "@/lib/hub/types";
import { btnPrimary, fieldClass } from "./ui";
import { Field } from "./form-fields";

export type SlotOption = {
  id: string;
  placeKind: PlaceKind;
  day: string;
  time: string;
  sentence: string;
  place: string;
  suggested: boolean;
  beforeArrival: boolean;
};

type Props = {
  listingId: string;
  sellerFirstName: string;
  buyerName: string;
  options: SlotOption[];
  suggestionReason: string | null;
  defaultSlotId: string | null;
  isBundle: boolean;
  buyerEmail: string;
  offerType: OfferType;
  priceLabel: string;
  returnDays: number | null;
};

/**
 * Demo payment only. These are fixed, non-functional placeholders and there is
 * deliberately no field to type a card number into — a hackathon build has no
 * business touching real card data, and a picker reads the same on stage.
 */
const CARDS = [
  { id: "visa-4242", label: "Visa ending 4242" },
  { id: "mc-5556", label: "Mastercard ending 5556" },
] as const;

export function ClaimForm({
  listingId,
  sellerFirstName,
  buyerName,
  options,
  suggestionReason,
  defaultSlotId,
  isBundle,
  buyerEmail,
  offerType,
  priceLabel,
  returnDays,
}: Props) {
  const router = useRouter();
  const methods = (["campus", "seller"] as const).filter((kind) => options.some((o) => o.placeKind === kind));
  const initialSlot = options.find((o) => o.id === defaultSlotId) ?? null;

  const [method, setMethod] = useState<PlaceKind>(initialSlot?.placeKind ?? methods[0]);
  const [slotId, setSlotId] = useState<string | null>(initialSlot?.id ?? null);
  const [urgency, setUrgency] = useState<Urgency>("medium");
  const [payment, setPayment] = useState<string>(CARDS[0].id);

  const costsMoney = offerType === "sale" || offerType === "loan";

  const visible = options.filter((o) => o.placeKind === method);
  const selected = visible.find((o) => o.id === slotId) ?? null;

  const methodLabel = (kind: PlaceKind) =>
    kind === "campus" ? "Public spot on campus" : `Pickup at ${sellerFirstName}’s place`;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!selected) return;
        const q = new URLSearchParams({ slot: selected.id, urgency });
        if (costsMoney) q.set("payment", payment);
        router.push(`/listings/${listingId}/claim/confirmed?${q}`);
      }}
      className="space-y-8"
    >
      {methods.length > 1 ? (
        <fieldset>
          <legend className="t-eyebrow text-ink-2">How to get it</legend>
          <div className="mt-2 border-t border-rule">
            {methods.map((kind) => (
              <label key={kind} className="flex min-h-11 cursor-pointer items-center gap-3 border-b border-rule py-2">
                <input
                  type="radio"
                  name="method"
                  checked={method === kind}
                  onChange={() => {
                    setMethod(kind);
                    setSlotId(null);
                  }}
                  className="size-4 accent-[var(--ink)]"
                />
                <span className="font-semibold">{methodLabel(kind)}</span>
                <span className="ml-auto truncate text-[13px] text-ink-2">
                  {[...new Set(options.filter((o) => o.placeKind === kind).map((o) => o.place))].join(", ")}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <div>
          <p className="t-eyebrow text-ink-2">How to get it</p>
          <p className="mt-2 font-semibold">
            {methodLabel(method)}, {visible[0]?.place}
          </p>
        </div>
      )}

      <fieldset>
        <legend className="t-eyebrow text-ink-2">Pick a time</legend>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {visible.map((o) => (
            <label key={o.id} className="cursor-pointer">
              <input
                type="radio"
                name="slot"
                value={o.id}
                checked={slotId === o.id}
                onChange={() => setSlotId(o.id)}
                className="peer sr-only"
              />
              <span className="data block h-full rounded-1 border border-rule px-3 py-2.5 transition-colors duration-[90ms] peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink hover:border-rule-strong hover:bg-paper-raised peer-checked:hover:bg-ink">
                <span className="block text-[13px]">{o.day}</span>
                <span className="block text-[15px] font-semibold">{o.time}</span>
                {methods.length > 1 && <span className="block truncate font-sans text-[12px] opacity-75">{o.place}</span>}
                {o.suggested && <span className="mt-1 block font-sans text-[12px] font-semibold">Best fit</span>}
                {o.beforeArrival && <span className="mt-1 block font-sans text-[12px] opacity-75">Before you arrive</span>}
              </span>
            </label>
          ))}
        </div>
        {suggestionReason && visible.some((o) => o.suggested) && (
          <p className="mt-3 text-[13px] text-ink-2">
            <span className="font-semibold text-ink">Best fit:</span> {suggestionReason}
          </p>
        )}
      </fieldset>

      <fieldset className="border-t border-rule pt-6">
        <legend className="t-eyebrow text-ink-2">Your details</legend>
        <div className="mt-3 grid gap-6 sm:grid-cols-2">
          <Field label="Name" htmlFor="buyerName">
            <input id="buyerName" name="buyerName" required defaultValue={buyerName} className={fieldClass} />
          </Field>
          <Field label="Contact" hint="How the owner reaches you if they are running late." htmlFor="buyerContact">
            <input id="buyerContact" name="buyerContact" required defaultValue={buyerEmail} className={fieldClass} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="border-t border-rule pt-6">
        <legend className="t-eyebrow text-ink-2">How badly do you need it?</legend>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(["low", "medium", "high"] as const).map((level) => (
            <label key={level} className="cursor-pointer">
              <input
                type="radio"
                name="urgency"
                value={level}
                checked={urgency === level}
                onChange={() => setUrgency(level)}
                className="peer sr-only"
              />
              <span className="block rounded-1 border border-rule px-3 py-2.5 text-center text-[15px] font-semibold transition-colors duration-[90ms] peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink hover:border-rule-strong hover:bg-paper-raised peer-checked:hover:bg-ink">
                {level === "low" ? "Can wait" : level === "medium" ? "This week" : "Need it now"}
              </span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-[13px] text-ink-2">
          {urgency === "high"
            ? "If someone else wants the same thing and has other options, this goes to you."
            : "Used only to break a tie when two people want the same item."}
        </p>
      </fieldset>

      {costsMoney && (
        <fieldset className="border-t border-rule pt-6">
          <legend className="t-eyebrow text-ink-2">Payment · {priceLabel}</legend>
          <div className="mt-3 border-t border-rule">
            {[...CARDS, { id: "cash", label: "Pay in person" }].map((c) => (
              <label key={c.id} className="flex min-h-11 cursor-pointer items-center gap-3 border-b border-rule py-2">
                <input
                  type="radio"
                  name="payment"
                  value={c.id}
                  checked={payment === c.id}
                  onChange={() => setPayment(c.id)}
                  className="size-4 accent-[var(--ink)]"
                />
                <span className="font-semibold">{c.label}</span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-[13px] text-ink-2">
            Demo only — no card is charged and no card details are collected.
          </p>
        </fieldset>
      )}

      <div aria-live="polite" className="rounded-2 border border-rule-strong bg-paper-raised px-5 py-4">
        {selected ? (
          <>
            <p className="text-[17px] font-semibold">{selected.sentence}</p>
            <p className="mt-1 text-ink-2">
              {buyerName.split(" ")[0]} and {sellerFirstName}.{" "}
              {isBundle ? "It’s a whole room, so bring a friend and a car." : "Bring a friend for anything heavy."}
            </p>
            {RETURNS[offerType] && returnDays !== null && (
              <p className="mt-2 text-[13px] font-semibold text-signal">
                You give this back after {returnDays === 1 ? "1 day" : `${returnDays} days`}. We put the date on both your cards.
              </p>
            )}
          </>
        ) : (
          <p className="text-ink-2">Pick a time above to see your handoff.</p>
        )}
      </div>

      <button type="submit" disabled={!selected} className={`${btnPrimary} w-full sm:w-auto`}>
        {costsMoney ? `Confirm handoff · ${priceLabel}` : "Confirm handoff"}
      </button>
    </form>
  );
}
