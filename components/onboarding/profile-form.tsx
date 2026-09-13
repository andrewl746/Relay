"use client";

import { useActionState, useState } from "react";
import { saveProfileStep, type ActionState } from "@/app/(onboarding)/actions";
import { getUniversity, type University } from "@/lib/onboarding/universities";
import { UniversityCombobox } from "./university-combobox";

const initialState: ActionState = { status: "idle" };

type Defaults = {
  fullName: string | null;
  universityId: string | null;
  livingSituation: "on_campus" | "off_campus" | null;
  street: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  postalCode: string | null;
};

export function ProfileForm({ defaults }: { defaults: Defaults }) {
  const [state, formAction, pending] = useActionState(saveProfileStep, initialState);
  const [onCampus, setOnCampus] = useState(defaults.livingSituation === "on_campus");
  const [university, setUniversity] = useState<University | null>(
    defaults.universityId ? getUniversity(defaults.universityId) : null,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="fullName" className="gh-label">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          required
          defaultValue={defaults.fullName ?? ""}
          placeholder="Jordan Kim"
          className="gh-input"
        />
      </div>

      <UniversityCombobox defaultUniversityId={defaults.universityId} onSelect={setUniversity} />

      <fieldset>
        <legend className="gh-label">Where are you living?</legend>
        <div className="flex gap-4">
          {(["on_campus", "off_campus"] as const).map((value) => (
            <label key={value} className="flex items-center gap-2 text-[14px]">
              <input
                type="radio"
                name="livingSituation"
                value={value}
                required
                defaultChecked={defaults.livingSituation === value}
                onChange={() => setOnCampus(value === "on_campus")}
                className="size-4 accent-[var(--gh-accent)]"
              />
              {value === "on_campus" ? "On campus" : "Off campus"}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Living on campus means the address is the university's, not something
          to type. We still submit it so matching has real coordinates. */}
      {onCampus ? (
        <div>
          <span className="gh-label">Your address</span>
          {university ? (
            <div className="rounded-md border border-gh-border bg-gh-canvas-subtle px-3 py-3 text-[14px]">
              <p className="font-semibold">{university.name}</p>
              <p className="text-gh-fg-muted">
                {university.campus.street}
                <br />
                {university.campus.city}, {university.campus.province}{" "}
                {university.campus.postalCode}
              </p>
              <input type="hidden" name="street" value={university.campus.street} />
              <input type="hidden" name="city" value={university.campus.city} />
              <input type="hidden" name="province" value={university.campus.province} />
              <input type="hidden" name="country" value={university.campus.country} />
              <input type="hidden" name="postalCode" value={university.campus.postalCode} />
            </div>
          ) : (
            <p className="text-[14px] text-gh-fg-muted">
              Pick your university above and we&rsquo;ll use its campus address.
            </p>
          )}
        </div>
      ) : (
        <>
      <div>
            <label htmlFor="street" className="gh-label">
              Street address
            </label>
            <input
              id="street"
              name="street"
              required
              defaultValue={defaults.street ?? ""}
              placeholder="318 Lester St, unit 4"
              className="gh-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="gh-label">
                City
              </label>
              <input
                id="city"
                name="city"
                required
                defaultValue={defaults.city ?? ""}
                placeholder="Waterloo"
                className="gh-input"
              />
            </div>
            <div>
              <label htmlFor="province" className="gh-label">
                Province / State
              </label>
              <input
                id="province"
                name="province"
                required
                defaultValue={defaults.province ?? ""}
                placeholder="ON"
                className="gh-input"
              />
            </div>
            <div>
              <label htmlFor="country" className="gh-label">
                Country
              </label>
              <input
                id="country"
                name="country"
                required
                defaultValue={defaults.country ?? "Canada"}
                placeholder="Canada"
                className="gh-input"
              />
            </div>
            <div>
              <label htmlFor="postalCode" className="gh-label">
                Postal code
              </label>
              <input
                id="postalCode"
                name="postalCode"
                required
                defaultValue={defaults.postalCode ?? ""}
                placeholder="N2L 3G1"
                className="gh-input"
              />
            </div>
          </div>
        </>
      )}

      {state.status === "error" && <p className="gh-flash-error">{state.message}</p>}

      <button type="submit" disabled={pending} className="gh-btn gh-btn-primary">
        {pending ? "Saving…" : "Next"}
      </button>
    </form>
  );
}
