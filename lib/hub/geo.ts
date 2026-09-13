/**
 * Where things are, in kilometres, on a hand-placed grid.
 *
 * Deliberately not a maps API. Everything in this story is inside a ~2km box
 * around one campus, so a routing call would spend a key, a network round trip
 * and the DP's 10ms recompute budget to move a number by a few hundred metres —
 * which never reorders anything, because the deadline term dominates. Straight
 * line times a detour factor is the honest model at this scale, and it runs in
 * microseconds inside the matching loop.
 *
 * x grows east, y grows north, origin at the campus centre.
 */

export type Point = { x: number; y: number };

/** Streets are not straight lines. Multiplier from crow-flies to actual walk. */
const DETOUR = 1.25;

/** Average walking speed, km/h. */
const WALK_KMH = 4.8;

const PLACES: Record<string, Point> = {
  // campus
  slc: { x: 0, y: 0 },
  "dana porter": { x: -0.1, y: 0.02 },
  "davis centre": { x: 0.15, y: 0.2 },
  e7: { x: 0.22, y: 0.16 },
  "village 1": { x: 0.2, y: -0.28 },
  "mackenzie king": { x: 0.45, y: 0.55 },
  // off campus
  sunview: { x: -0.55, y: 0.42 },
  lester: { x: -0.45, y: 0.6 },
  phillip: { x: -0.3, y: 0.55 },
  columbia: { x: -0.1, y: 0.75 },
  "king st n": { x: 0.95, y: 0.45 },
  albert: { x: -0.7, y: 0.15 },
  hazel: { x: -0.62, y: 0.7 },
};

/**
 * Resolve a free-text place to a point. Addresses in this data are written the
 * way a person would type them — "318 Lester St, unit 4", "Village 1 front
 * desk" — so match on the landmark keyword rather than parsing an address.
 */
export function locate(place: string | null | undefined): Point | null {
  if (!place) return null;
  const text = place.toLowerCase();
  for (const [key, point] of Object.entries(PLACES)) {
    if (text.includes(key)) return point;
  }
  return null;
}

export function distanceKm(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y) * DETOUR;
}

/** Walking distance between two written places, or null if either is unknown. */
export function walkKm(from: string | null | undefined, to: string | null | undefined): number | null {
  const a = locate(from);
  const b = locate(to);
  if (!a || !b) return null;
  return distanceKm(a, b);
}

export function walkMinutes(km: number): number {
  return Math.max(1, Math.round((km / WALK_KMH) * 60));
}

export function formatWalk(km: number): string {
  return `${walkMinutes(km)} min walk`;
}

/** Every known place, for drawing the map. */
export function placeEntries(): { key: string; point: Point }[] {
  return Object.entries(PLACES).map(([key, point]) => ({ key, point }));
}
