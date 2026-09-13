import { chipClass, fieldClass } from "@/components/hub/ui";
import { config } from "@/lib/config";
import type { Profile } from "@/lib/relay/runtime";

const WINDOW_COPY = [
  { value: "morning", label: "Mornings", hint: "before noon" },
  { value: "afternoon", label: "Afternoons", hint: "noon to 5" },
  { value: "evening", label: "Evenings", hint: "after 5" },
] as const;

const ERRORS: Record<string, string> = {
  where: "Pick the neighbourhood you live in.",
  when: "Pick at least one part of the day you can meet people.",
  away: "Give both away dates with the second after the first, or leave both empty.",
};

/**
 * The three things routing needs from a person. Shared by first-run setup and
 * /you, so what someone answered once is exactly what they can edit later.
 */
export function ProfileFields({ profile, error }: { profile: Profile; error?: string }) {
  const message = error ? ERRORS[error] : undefined;

  return (
    <div className="grid gap-9">
      {message && (
        <p role="alert" className="border border-ink bg-paper-raised px-4 py-3 font-semibold">
          {message}
        </p>
      )}

      <div>
        <label htmlFor="name" className="t-eyebrow text-ink-2">
          Name people nearby see
        </label>
        <input
          id="name"
          name="name"
          defaultValue={profile.name}
          maxLength={40}
          autoComplete="name"
          className={`${fieldClass} mt-2 sm:max-w-sm`}
        />
        <p className="mt-1.5 text-[13px] text-ink-2">First name and last initial is plenty.</p>
      </div>

      <fieldset>
        <legend className="t-eyebrow text-ink-2">Where do you live?</legend>
        <p className="mt-1 text-[13px] text-ink-2">Routes favour a short walk. Nobody sees your street.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {config.locations.map((place) => (
            <label key={place}>
              <input
                type="radio"
                name="neighbourhood"
                value={place}
                defaultChecked={profile.neighbourhood === place}
                required
                className="peer sr-only"
              />
              <span className={chipClass}>{place}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="t-eyebrow text-ink-2">When can you meet people?</legend>
        <p className="mt-1 text-[13px] text-ink-2">Two people are only routed together if they share one of these.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {WINDOW_COPY.map((w) => (
            <label key={w.value}>
              <input
                type="checkbox"
                name="windows"
                value={w.value}
                defaultChecked={profile.pickupWindows.includes(w.value)}
                className="peer sr-only"
              />
              <span className={`${chipClass} gap-2`}>
                {w.label}
                <span className="font-medium opacity-75">{w.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="t-eyebrow text-ink-2">Away at all this term?</legend>
        <p className="mt-1 text-[13px] text-ink-2">Reading week, a trip home. Nobody is routed to you while you&apos;re gone.</p>
        <div className="mt-3 grid max-w-md grid-cols-2 gap-3">
          <div>
            <label htmlFor="awayFrom" className="text-[13px] font-semibold">
              Leaving
            </label>
            <input
              id="awayFrom"
              name="awayFrom"
              type="date"
              defaultValue={profile.awayFrom ?? ""}
              className={`${fieldClass} data mt-1`}
            />
          </div>
          <div>
            <label htmlFor="awayUntil" className="text-[13px] font-semibold">
              Back
            </label>
            <input
              id="awayUntil"
              name="awayUntil"
              type="date"
              defaultValue={profile.awayUntil ?? ""}
              className={`${fieldClass} data mt-1`}
            />
          </div>
        </div>
      </fieldset>
    </div>
  );
}
