import { CAMPUS_TIME_ZONE, NOW } from '../hub/clock.ts'

/**
 * Calendar days, in the YYYY-MM-DD strings the dataset uses.
 *
 * These are dates, not instants. Formatting "2026-10-02" through a local
 * timezone turns it into the evening of Oct 1 in Waterloo, so every label here
 * reads the string as a UTC calendar day on purpose.
 */

const DAY = 86_400_000

const dayKey = new Intl.DateTimeFormat('en-CA', {
  timeZone: CAMPUS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const label = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})

/** Today on campus. Uses the app's pinned clock so seeded dates stay meaningful. */
export function today(): string {
  return dayKey.format(NOW)
}

export function isDay(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
  )
}

export function addDays(day: string, n: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10)
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY)
}

/** "Thu Oct 2" */
export function dayLabel(day: string): string {
  return label.format(new Date(`${day}T00:00:00Z`)).replace(',', '')
}

/** "today", "tomorrow", or "Thu Oct 2" */
export function relativeDay(day: string): string {
  const d = daysBetween(today(), day)
  if (d === 0) return 'today'
  if (d === 1) return 'tomorrow'
  if (d === -1) return 'yesterday'
  return dayLabel(day)
}

/** "Thu Oct 2 – Sun Oct 5" */
export function rangeLabel(from: string, to: string): string {
  return `${dayLabel(from)} – ${dayLabel(to)}`
}
