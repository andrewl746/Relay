import { formatWalk, walkKm } from "@/lib/hub/geo";

/**
 * Where to pick it up.
 *
 * Uses the Google Maps Embed API when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set.
 * The Embed API is deliberate over the JS SDK: it is a plain iframe, so there
 * is no client bundle, no loader script, nothing to hydrate, and it cannot
 * break the page if Google is slow — it just stays blank inside its own frame.
 *
 * Without a key it degrades to a written description rather than a fake map.
 * A hand-drawn approximation of a real place is worse than no map: it looks
 * like data and isn't.
 */
export function PickupMap({
  from,
  to,
  fromLabel,
  toLabel,
}: {
  /** Where the viewer is starting from. */
  from: string | null | undefined;
  /** Where the item is. */
  to: string;
  fromLabel?: string;
  toLabel?: string;
}) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const km = walkKm(from, to);
  const area = toLabel ?? to.split(",")[0];

  // Scope the query to the city so "Sunview St" doesn't land in another country.
  const place = `${to}, Waterloo, Ontario`;

  return (
    <figure className="overflow-hidden rounded-md border border-border bg-surface">
      {key ? (
        <iframe
          title={`Map showing ${area}`}
          aria-label={`Map showing ${area}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="block h-[280px] w-full border-0"
          src={`https://www.google.com/maps/embed/v1/place?key=${key}&q=${encodeURIComponent(
            place,
          )}&zoom=15`}
        />
      ) : (
        <div className="flex h-[280px] flex-col items-center justify-center gap-2 bg-surface-2 px-6 text-center">
          <svg aria-hidden viewBox="0 0 24 24" className="size-8 text-ink-3" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
            <circle cx="12" cy="10" r="2.6" />
          </svg>
          <p className="text-[15px] font-semibold text-ink">{area}</p>
          <p className="text-[13px] text-ink-2">
            Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to show the map here.
          </p>
        </div>
      )}

      <figcaption className="border-t border-border px-4 py-3 text-[14px] text-ink-2">
        Pickup at <span className="font-semibold text-ink">{area}</span>
        {km !== null ? ` · ${formatWalk(km)} from ${fromLabel ?? "you"}` : null}
      </figcaption>
    </figure>
  );
}
