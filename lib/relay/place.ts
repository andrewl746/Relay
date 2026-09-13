import { config } from '../config.ts'

/**
 * Walking distance between neighbourhoods, from the same coordinates the DP's
 * distance penalty uses (config.locationCoords). Straight line times a detour
 * factor: at this scale a routing API would move the number by a few hundred
 * metres and change no decision.
 */

const coords = config.locationCoords as Record<string, { lat: number; lon: number }>

/** Streets are not straight lines. Same factor as lib/hub/geo.ts. */
const DETOUR = 1.25
const WALK_KMH = 4.8

export function kmBetween(a: string, b: string): number | null {
  if (a === b) return 0
  const p = coords[a]
  const q = coords[b]
  if (!p || !q) return null
  const rad = Math.PI / 180
  const dLat = (q.lat - p.lat) * rad
  const dLon = (q.lon - p.lon) * rad
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(p.lat * rad) * Math.cos(q.lat * rad) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * DETOUR
}

/** "same neighbourhood", "14 min walk", or null when a place is unknown. */
export function walkLabel(km: number | null): string | null {
  if (km === null) return null
  if (km === 0) return 'same neighbourhood'
  return `${Math.max(1, Math.round((km / WALK_KMH) * 60))} min walk`
}
