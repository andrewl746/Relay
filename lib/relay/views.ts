import 'server-only'
import { config } from '../config.ts'
import { addDays, daysBetween, today } from './dates.ts'
import { kmBetween } from './place.ts'
import { readRuntime, type Profile } from './runtime.ts'
import { snapshot, type Snapshot } from './store.ts'
import type { Chain, Item, Person } from '../types.ts'
import type { Me } from './me.ts'

/**
 * The shapes each screen renders, computed from one engine snapshot.
 * No screen reaches into the engine directly.
 */

// ---------------------------------------------------------------- handoffs

export type SlipKind = 'pickup' | 'handoff' | 'return' | 'lend' | 'back'

export type Slip = {
  key: string
  kind: SlipKind
  date: string
  /** Days from today; negative when late. */
  inDays: number
  item: Item
  /** The other person at this handoff. */
  counterpart: Person
  owner: Person
  /** What changes hands in money at this handoff, if anything. */
  cost: number | null
  /** Booked by a person, rather than only proposed by the route. */
  booked: boolean
  receiptId: string | null
  walkKm: number | null
  done: boolean
  overdue: boolean
}

const priceFor = (item: Item, from: string, to: string) =>
  item.deal === 'sale' ? item.price : item.price * Math.max(1, daysBetween(from, to))

export function slipsFor(me: Me, snap: Snapshot = snapshot()): { due: Slip[]; done: Slip[] } {
  const runtime = readRuntime()
  const people = new Map(snap.data.people.map((p) => [p.id, p]))
  const mine = people.get(me.id) ?? me.person
  const confirmed = new Set(me.profile.confirmed)
  const t = today()
  const slips: Slip[] = []

  const add = (s: Omit<Slip, 'inDays' | 'walkKm' | 'done' | 'overdue'>) => {
    const done = confirmed.has(s.key)
    const inDays = daysBetween(t, s.date)
    slips.push({
      ...s,
      inDays,
      walkKm: kmBetween(mine.location, s.counterpart.location),
      done,
      overdue: !done && inDays < 0,
    })
  }

  // What I booked: collect it, then pass it on or give it back.
  for (const accepted of runtime.accepted.filter((a) => a.personId === me.id)) {
    const item = snap.itemById(accepted.itemId)
    const owner = item && people.get(item.holderId)
    if (!item || !owner) continue
    const chain = snap.chainOf(item.id)
    const at = chain.hops.findIndex((h) => h.needId === accepted.needId)
    const hop = at >= 0 ? chain.hops[at] : null
    const prev = at > 0 ? chain.hops[at - 1] : null
    const next = at >= 0 ? chain.hops[at + 1] ?? null : null
    const collectFrom = hop && prev && !hop.viaOwner ? people.get(prev.personId) ?? owner : owner

    add({
      key: `pickup:${accepted.id}`,
      kind: 'pickup',
      date: accepted.from,
      item,
      counterpart: collectFrom,
      owner,
      cost: accepted.cost,
      booked: true,
      receiptId: accepted.id,
    })

    if (item.deal === 'rent') {
      const handTo = next && !next.viaOwner ? people.get(next.personId) ?? owner : owner
      add({
        key: `give:${accepted.id}`,
        kind: handTo.id === owner.id ? 'return' : 'handoff',
        date: accepted.to,
        item,
        counterpart: handTo,
        owner,
        cost: null,
        booked: true,
        receiptId: accepted.id,
      })
    }
  }

  // What I own, as the route has it scheduled.
  for (const item of snap.data.items.filter((i) => i.holderId === me.id)) {
    const chain = snap.chainOf(item.id)
    chain.hops.forEach((hop, i) => {
      const borrower = people.get(hop.personId)
      if (!borrower) return
      const accepted = runtime.accepted.find((a) => a.itemId === item.id && a.needId === hop.needId)
      if (i === 0 || hop.viaOwner) {
        add({
          key: `lend:${item.id}:${hop.needId}`,
          kind: 'lend',
          date: hop.from,
          item,
          counterpart: borrower,
          owner: mine,
          cost: priceFor(item, hop.from, hop.to),
          booked: Boolean(accepted),
          receiptId: accepted?.id ?? null,
        })
      }
      const next = chain.hops[i + 1]
      if (item.deal === 'rent' && (!next || next.viaOwner)) {
        add({
          key: `back:${item.id}:${hop.needId}`,
          kind: 'back',
          date: hop.to,
          item,
          counterpart: borrower,
          owner: mine,
          cost: null,
          booked: Boolean(accepted),
          receiptId: accepted?.id ?? null,
        })
      }
    })
  }

  // Keep it to what matters now: upcoming, or late by a few days at most.
  const recent = addDays(t, -3)
  const relevant = slips.filter((s) => s.done || s.date >= recent)
  const byDate = (a: Slip, b: Slip) => a.date.localeCompare(b.date)

  return {
    due: relevant.filter((s) => !s.done).sort(byDate).slice(0, 14),
    done: relevant.filter((s) => s.done).sort(byDate).slice(-8),
  }
}

export function receiptFor(me: Me, id: string, snap: Snapshot = snapshot()) {
  const accepted = readRuntime().accepted.find((a) => a.id === id)
  const item = accepted && snap.itemById(accepted.itemId)
  if (!accepted || !item) return null
  if (accepted.personId !== me.id && item.holderId !== me.id) return null
  const owner = snap.personById(item.holderId)
  const borrower = snap.personById(accepted.personId)
  if (!owner || !borrower) return null
  return { accepted, item, owner, borrower }
}

// ---------------------------------------------------------------- shelf

export type ShelfEntry = {
  item: Item
  chain: Chain
  earned: number
  idle: number
  next: { person: Person; on: string } | null
}

export function shelfFor(me: Me, snap: Snapshot = snapshot()) {
  const t = today()
  const entries: ShelfEntry[] = snap.data.items
    .filter((i) => i.holderId === me.id)
    .map((item) => {
      const chain = snap.chainOf(item.id)
      const upcoming = chain.hops.find((h) => h.from >= t)
      const person = upcoming ? snap.personById(upcoming.personId) : undefined
      return {
        item,
        chain,
        earned: snap.earnedOn(item),
        idle: snap.idleOn(item),
        next: upcoming && person ? { person, on: upcoming.from } : null,
      }
    })

  return {
    entries,
    earned: entries.reduce((s, e) => s + e.earned, 0),
    idle: entries.reduce((s, e) => s + e.idle, 0),
    borrowers: new Set(entries.flatMap((e) => e.chain.hops.map((h) => h.personId))).size,
  }
}

/** What people on this network usually charge per day, for the lend form's hint. */
export function typicalRates(snap: Snapshot = snapshot()) {
  const rents = snap.data.items
    .filter((i) => i.deal === 'rent')
    .map((i) => i.price)
    .sort((a, b) => a - b)
  const at = (q: number) =>
    rents.length ? rents[Math.floor(q * (rents.length - 1))] : config.pricing.defaultRatePerDay
  return { low: at(0.25), high: at(0.75) }
}

// ---------------------------------------------------------------- need

/** Tomorrow, for as long as they usually borrow things. */
export function defaultWindow(profile: Profile) {
  const from = addDays(today(), 1)
  const last = profile.searches[0]
  const days = last ? Math.min(14, Math.max(1, daysBetween(last.from, last.to))) : 2
  return { from, to: addDays(from, days), days }
}

// ---------------------------------------------------------------- hello

/**
 * Who to offer on the sign-in page: recent joiners, then the busiest people.
 * Busiest means handoffs the route actually gives their things, not how many
 * things they own: someone with five items nobody borrows opens on an empty
 * shelf and an empty handoff list, which is the wrong first click in a demo.
 */
export function featuredPeople(snap: Snapshot = snapshot()) {
  const runtime = readRuntime()
  const lends = new Map<string, number>()
  const routed = new Map<string, number>()
  const asks = new Map<string, number>()
  for (const i of snap.data.items) {
    lends.set(i.holderId, (lends.get(i.holderId) ?? 0) + 1)
    routed.set(i.holderId, (routed.get(i.holderId) ?? 0) + snap.chainOf(i.id).hops.length)
  }
  for (const n of snap.data.needs) asks.set(n.personId, (asks.get(n.personId) ?? 0) + 1)

  const rows = snap.data.people.map((person) => ({
    person,
    profile: runtime.profiles[person.id] ?? null,
    lends: lends.get(person.id) ?? 0,
    routed: routed.get(person.id) ?? 0,
    asks: asks.get(person.id) ?? 0,
  }))

  const joined = rows.filter((r) => r.person.id.startsWith('u-p-') && r.profile?.setupDone).reverse().slice(0, 4)
  const seeded = rows
    .filter((r) => !r.person.id.startsWith('u-p-'))
    .sort(
      (a, b) =>
        (b.profile?.visits ?? 0) - (a.profile?.visits ?? 0) ||
        b.routed - a.routed ||
        b.lends - a.lends ||
        b.asks - a.asks,
    )
    .slice(0, 8)

  return [...joined, ...seeded]
}
