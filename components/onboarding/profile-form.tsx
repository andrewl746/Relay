"use client";

import { useActionState, useState } from "react";
import { saveProfileStep, type ActionState } from "@/app/(onboarding)/actions";
import { btnPrimary, fieldClass } from "@/components/hub/ui";
import { RESIDENCE_NOT_LISTED, residenceFromStreet, residencesFor } from "@/lib/onboarding/residences";
import { getUniversity, type University } from "@/lib/onboarding/universities";
import { errorClass, labelClass } from "./shell";
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
  const [living, setLiving] = useState(defaults.livingSituation);
  const [university, setUniversity] = useState<University | null>(
    defaults.universityId ? getUniversity(defaults.universityId) : null,
  );

  const savedResidence = residenceFromStreet(defaults.universityId, defaults.street);
  const [residenceId, setResidenceId] = useState(
    savedResidence ?? (defaults.livingSituation === "on_campus" && defaults.street ? RESIDENCE_NOT_LISTED : ""),
  );
  const residences = residencesFor(university?.id);

  // A typed address only belongs in the fields if it was typed in the first place.
  const typedDefaults = savedResidence ? null : defaults;
  const showAddressFields = living === "off_campus" || (living === "on_campus" && residenceId === RESIDENCE_NOT_LISTED);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="fullName" className={labelClass}>
          Full name
        </label>
        <input id="fullName" name="fullName" required defaultValue={defaults.fullName ?? ""} className={fieldClass} />
      </div>

      <UniversityCombobox
        defaultUniversityId={defaults.universityId}
        onSelect={(u) => {
          if (u?.id !== university?.id) setResidenceId("");
          setUniversity(u);
        }}
      />

      <fieldset>
        <legend className={labelClass}>Where are you living?</legend>
        <div className="flex gap-5">
          {(["on_campus", "off_campus"] as const).map((value) => (
            <label key={value} className="flex min-h-9 items-center gap-2 text-[15px] text-ink">
              <input
                type="radio"
                name="livingSituation"
                value={value}
                required
                defaultChecked={defaults.livingSituation === value}
                onChange={() => setLiving(value)}
                className="size-4 accent-[var(--accent)]"
              />
              {value === "on_campus" ? "On campus" : "Off campus"}
            </label>
          ))}
        </div>
      </fieldset>

      {living === "on_campus" && (
        <div>
          <label htmlFor="residenceId" className={labelClass}>
            Residence
          </label>
          <select
            id="residenceId"
            name="residenceId"
            required
            disabled={!university}
            value={residenceId}
            onChange={(e) => setResidenceId(e.currentTarget.value)}
            className={`${fieldClass} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <option value="" disabled>
              {university ? "Choose your residence" : "Choose your university first"}
            </option>
            {residences.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
            <option value={RESIDENCE_NOT_LISTED}>My residence isn&rsquo;t listed</option>
          </select>
        </div>
      )}

      {showAddressFields && (
        <>
          <div>
            <label htmlFor="street" className={labelClass}>
              Street address
            </label>
            <input id="street" name="street" required defaultValue={typedDefaults?.street ?? ""} className={fieldClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className={labelClass}>
                City
              </label>
              <input id="city" name="city" required defaultValue={typedDefaults?.city ?? ""} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="province" className={labelClass}>
                Province / State
              </label>
              <input
                id="province"
                name="province"
                required
                defaultValue={typedDefaults?.province ?? ""}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="country" className={labelClass}>
                Country
              </label>
              <input
                id="country"
                name="country"
                required
                defaultValue={typedDefaults?.country ?? "Canada"}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="postalCode" className={labelClass}>
                Postal code
              </label>
              {/* No Canadian postal code starts with Z, so this can't be anyone's. */}
              <input
                id="postalCode"
                name="postalCode"
                required
                defaultValue={typedDefaults?.postalCode ?? ""}
                placeholder="Z9X 4Y7"
                className={fieldClass}
              />
            </div>
          </div>
        </>
      )}

      {state.status === "error" && <p className={errorClass}>{state.message}</p>}

      <button type="submit" disabled={pending} className={`${btnPrimary} w-full`}>
        {pending ? "Saving…" : "Next"}
      </button>
    </form>
  );
}
