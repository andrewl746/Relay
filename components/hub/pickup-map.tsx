import { formatWalk, locate, placeEntries, walkKm } from "@/lib/hub/geo";

/**
 * The walk, drawn. Hand-authored SVG over the same coordinate grid the matcher
 * ranks with — no tiles, no API key, no network. It renders a number the
 * engine already used to make a decision, rather than decorating the page with
 * a map that changes nothing.
 */

const BOUNDS = { minX: -0.85, maxX: 1.1, minY: -0.45, maxY: 0.92 };
const W = 320;
const H = 220;

const px = (x: number) => ((x - BOUNDS.minX) / (BOUNDS.maxX - BOUNDS.minX)) * W;
const py = (y: number) => ((BOUNDS.maxY - y) / (BOUNDS.maxY - BOUNDS.minY)) * H;

export function PickupMap({
  from,
  to,
  fromLabel,
  toLabel,
}: {
  from: string | null;
  to: string;
  fromLabel: string;
  toLabel: string;
}) {
  const a = locate(from);
  const b = locate(to);
  if (!b) return null;

  const km = a && b ? walkKm(from, to) : null;

  return (
    <figure className="border border-rule">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        role="img"
        aria-label={
          km === null
            ? `Map showing the pickup point at ${toLabel}.`
            : `Map showing a ${formatWalk(km)} between ${fromLabel} and ${toLabel}.`
        }
      >
        <rect width={W} height={H} fill="var(--paper-raised)" />

        {/* campus, as a landmark to orient against */}
        <ellipse
          cx={px(0.08)}
          cy={py(0.0)}
          rx={38}
          ry={30}
          fill="var(--paper-sunk)"
          stroke="var(--rule)"
        />
        <text
          x={px(0.08)}
          y={py(0.0)}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="8"
          letterSpacing="0.08em"
          fill="var(--ink-3, rgba(28,26,21,0.45))"
        >
          CAMPUS
        </text>

        {/* every other known place, faint, for a sense of the neighbourhood */}
        {placeEntries().map(({ key, point }) => (
          <circle key={key} cx={px(point.x)} cy={py(point.y)} r={1.8} fill="var(--rule-strong)" />
        ))}

        {a && b && (
          <line
            x1={px(a.x)}
            y1={py(a.y)}
            x2={px(b.x)}
            y2={py(b.y)}
            stroke="var(--ink)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        )}

        {a && (
          <>
            <circle cx={px(a.x)} cy={py(a.y)} r={5} fill="var(--ink)" />
            <text x={px(a.x)} y={py(a.y) - 10} textAnchor="middle" fontSize="10" fill="var(--ink)">
              {fromLabel}
            </text>
          </>
        )}

        <circle cx={px(b.x)} cy={py(b.y)} r={6} fill="var(--seal)" />
        <text
          x={px(b.x)}
          y={py(b.y) + 18}
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          fill="var(--seal)"
        >
          {toLabel}
        </text>
      </svg>

      <figcaption className="border-t border-rule px-3 py-2 text-[13px] text-ink-2">
        {km === null ? (
          <>Pickup at {toLabel}.</>
        ) : (
          <>
            <span className="data font-semibold text-ink">{formatWalk(km)}</span> from {fromLabel}. This
            distance is part of how the match was ranked.
          </>
        )}
      </figcaption>
    </figure>
  );
}
