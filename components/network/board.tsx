'use client'

import { useMemo, useState } from 'react'
import type { Chain, Dataset, Item, Person } from '@/lib/types'
import type { MatchTable } from '@/lib/match'
import { assignAll, idleDays } from '@/lib/assign'
import { config, timelineStart, timelineEnd } from '@/lib/config'

const T0 = timelineStart.getTime()
const T1 = timelineEnd.getTime()
const SPAN = T1 - T0
const DAY = 86400000

const clamp = (x: number) => Math.max(0, Math.min(100, x))
const pct = (iso: string) => clamp(((new Date(iso).getTime() - T0) / SPAN) * 100)
const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / DAY)

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

type Span = { from: string; to: string; kind: 'held' | 'idle'; hopIndex: number }

/** Walk the item's free window, alternating covered hops and idle stretches. */
function itemSpans(item: Item, chain: Chain): Span[] {
  const spans: Span[] = []
  let cursor = item.freeFrom
  chain.hops.forEach((hop, i) => {
    const start = hop.from < cursor ? cursor : hop.from
    if (daysBetween(cursor, start) > 0)
      spans.push({ from: cursor, to: start, kind: 'idle', hopIndex: i })
    const end = hop.to > item.freeUntil ? item.freeUntil : hop.to
    if (daysBetween(start, end) > 0)
      spans.push({ from: start, to: end, kind: 'held', hopIndex: i })
    cursor = end > cursor ? end : cursor
  })
  if (daysBetween(cursor, item.freeUntil) > 0)
    spans.push({
      from: cursor,
      to: item.freeUntil,
      kind: 'idle',
      hopIndex: chain.hops.length,
    })
  return spans
}

/** Milliseconds a computation takes. Lives outside the component so render stays pure. */
function timeIt(run: () => unknown): number {
  const start = performance.now()
  run()
  return performance.now() - start
}

export default function Board({
  data,
  table,
}: {
  data: Dataset
  table: MatchTable
}) {
  const [excluded, setExcluded] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  // How long the last re-plan took. Measured in the click handler rather than
  // during render, so render stays pure and server and client always agree.
  const [ms, setMs] = useState<number | null>(null)
  const peopleById = useMemo(
    () => new Map(data.people.map((p) => [p.id, p])),
    [data.people],
  )
  const itemsById = useMemo(
    () => new Map(data.items.map((i) => [i.id, i])),
    [data.items],
  )

  // The only live computation on the page. Everything upstream is precomputed.
  const chains = useMemo(
    () => assignAll(data, table, { excludePersonIds: excluded }),
    [data, table, excluded],
  )

  // Removing someone re-plans the whole network. The timed run here is the
  // same computation the memo above repeats; ~10ms is cheap enough to show.
  function toggle(personId: string) {
    const next = excluded.includes(personId)
      ? excluded.filter((x) => x !== personId)
      : [...excluded, personId]
    setMs(timeIt(() => assignAll(data, table, { excludePersonIds: next })))
    setExcluded(next)
  }
  const byItem = useMemo(
    () => new Map(chains.map((c) => [c.itemId, c])),
    [chains],
  )

  // Ranked by chain length, so the shelf always leads with something worth
  // looking at. Computed once against the untouched network so removing a
  // person does not reshuffle the shelf under the demo's feet.
  const shelf = useMemo(() => {
    const base = assignAll(data, table, {})
    return base
      .filter((c) => c.hops.length > 1)
      .sort((a, b) => b.hops.length - a.hops.length || b.value - a.value)
      .slice(0, 12)
      .map((c) => c.itemId)
  }, [data, table])

  const activeId = selected ?? shelf[0]
  const item = activeId ? itemsById.get(activeId) : undefined
  const chain: Chain = byItem.get(activeId ?? '') ?? {
    itemId: activeId ?? '',
    hops: [],
    totalGapDays: 0,
    totalDistance: 0,
    totalMatchScore: 0,
    value: 0,
  }

  const idle = item ? idleDays(item, chain) : 0
  const spans = item ? itemSpans(item, chain) : []
  const holder = item ? peopleById.get(item.holderId) : undefined

  // Person rows: the holder, then everyone the chain passes through, then
  // anyone removed so they can be put back.
  const rowIds: string[] = []
  if (holder) rowIds.push(holder.id)
  for (const hop of chain.hops) if (!rowIds.includes(hop.personId)) rowIds.push(hop.personId)
  for (const id of excluded) if (!rowIds.includes(id)) rowIds.push(id)
  const rows = rowIds.map((id) => peopleById.get(id)).filter(Boolean) as Person[]

  const placed = chains.filter((c) => c.hops.length > 0).length
  const networkIdle = chains.reduce((s, c) => {
    const it = itemsById.get(c.itemId)
    return it ? s + idleDays(it, c) : s
  }, 0)

  return (
    <div className="flex flex-col gap-5">
      {/* network summary */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-ink-2">
        <span>
          <b className="text-ink">{placed}</b>/{data.items.length}{' '}
          {config.ui.itemNounPlural} placed
        </span>
        <span>
          <b className="text-ink">{networkIdle.toLocaleString()}</b>{' '}
          {config.ui.gapLabel} across the network
        </span>
        <span>
          <b className="text-ink">{excluded.length}</b> removed
        </span>
        <span className="text-ink-2">
          {mounted ? `recomputed in ${ms.toFixed(1)}ms` : ' '}
        </span>
      </div>

      {/* item shelf */}
      <div className="flex flex-wrap gap-1.5">
        {shelf.map((id) => {
          const it = itemsById.get(id)!
          const c = byItem.get(id)
          const on = id === activeId
          return (
            <button
              key={id}
              onClick={() => setSelected(id)}
              className={`max-w-[15rem] truncate rounded-1 border px-2 py-1 text-xs ${
                on
                  ? 'border-ink bg-ink text-paper'
                  : 'border-rule-strong text-ink-2 hover:border-ink'
              }`}
              title={it.rawText}
            >
              {it.rawText.slice(0, 34)}
              <span className={on ? 'text-ink-3' : 'text-ink-2'}>
                {' '}
                · {c?.hops.length ?? 0}
              </span>
            </button>
          )
        })}
      </div>

      {!item ? (
        <p className="text-sm text-ink-2">No chain to show.</p>
      ) : (
        <>
          {/* the timeline */}
          <section className="rounded-2 border border-rule-strong bg-paper-raised p-4">
            <p className="mb-3 text-sm text-ink-2">{item.rawText}</p>

            {/* axis */}
            <div className="relative mb-2 ml-40 h-5 border-b border-rule">
              {config.cycleBoundaries.map((b, i) => {
                const last = i === config.cycleBoundaries.length - 1
                return (
                  <div
                    key={b}
                    className="absolute top-0 h-5 border-l border-rule-strong"
                    style={{ left: `${pct(b)}%` }}
                  >
                    <span
                      className={`absolute top-0 whitespace-nowrap text-[10px] text-ink-2 ${
                        last ? 'right-0 mr-1' : 'ml-1'
                      }`}
                    >
                      {fmt(b)}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* The item leads. A long chain can run to a dozen holders, and the
                bar is the whole point — it must never scroll off the screen. */}
            <div className="flex items-center gap-2">
              <div className="w-40 shrink-0 text-xs font-medium text-ink">
                the {config.ui.itemNoun}
              </div>
              <div className="relative h-6 flex-1 rounded-1 bg-paper-sunk">
                {spans.map((s, i) => (
                  <div
                    key={i}
                    className={`absolute inset-y-0 ${
                      s.kind === 'held' ? 'bg-seal-fill' : 'bg-signal-fill'
                    }`}
                    style={{
                      left: `${pct(s.from)}%`,
                      width: `${Math.max(0.4, pct(s.to) - pct(s.from))}%`,
                    }}
                    title={
                      s.kind === 'held'
                        ? `${fmt(s.from)} – ${fmt(s.to)}`
                        : `${daysBetween(s.from, s.to)} ${config.ui.gapLabel}`
                    }
                  />
                ))}
                {chain.hops.map((h) => (
                  <div
                    key={h.needId}
                    className="absolute -top-1 h-8 w-px bg-ink"
                    style={{ left: `${pct(h.from)}%` }}
                    title={`${config.ui.handoffNoun} ${fmt(h.from)}`}
                  />
                ))}
              </div>
            </div>

            {/* idle callouts, placed under the bar they belong to */}
            <div className="relative ml-40 mt-1 h-4">
              {spans
                .filter((s) => s.kind === 'idle' && daysBetween(s.from, s.to) >= 5)
                .map((s, i) => (
                  <span
                    key={i}
                    className="absolute whitespace-nowrap text-[10px] font-medium text-signal"
                    style={{ left: `${pct(s.from)}%` }}
                  >
                    {daysBetween(s.from, s.to)}d stored
                  </span>
                ))}
            </div>

            {/* one row per person */}
            <div className="mt-2 border-t border-rule pt-2" />
            {rows.map((p) => {
              const off = excluded.includes(p.id)
              const before = { from: config.cycleBoundaries[0], to: p.awayFrom }
              const after = {
                from: p.awayUntil,
                to: config.cycleBoundaries[config.cycleBoundaries.length - 1],
              }
              return (
                <div key={p.id} className="flex items-center gap-2 py-[1.5px]">
                  <div className="flex w-40 shrink-0 items-center gap-1">
                    <button
                      onClick={() => toggle(p.id)}
                      className={`rounded-1 px-1 text-[10px] leading-4 ${
                        off
                          ? 'bg-signal-fill text-paper'
                          : 'text-ink-2 hover:bg-paper-sunk hover:text-ink'
                      }`}
                      title={
                        off ? 'put this person back' : config.ui.removeActionLabel
                      }
                    >
                      {off ? 'undo' : '×'}
                    </button>
                    <span
                      className={`truncate text-xs ${
                        off ? 'text-ink-3 line-through' : 'text-ink-2'
                      }`}
                    >
                      {p.label}
                    </span>
                    <span className="ml-auto shrink-0 text-[10px] text-ink-2">
                      {p.location}
                    </span>
                  </div>
                  <div className="relative h-3 flex-1 rounded-1 bg-paper-sunk">
                    {[before, after].map((iv, i) =>
                      daysBetween(iv.from, iv.to) > 0 ? (
                        <div
                          key={i}
                          className={`absolute inset-y-0 rounded-1 ${
                            off ? 'bg-rule' : 'bg-rule-strong'
                          }`}
                          style={{
                            left: `${pct(iv.from)}%`,
                            width: `${pct(iv.to) - pct(iv.from)}%`,
                          }}
                        />
                      ) : null,
                    )}
                  </div>
                </div>
              )
            })}

          </section>

          {/* cost breakdown */}
          <section className="grid gap-4 md:grid-cols-[auto_1fr]">
            <dl className="flex gap-6 text-xs md:flex-col md:gap-2">
              <div>
                <dt className="text-ink-2">{config.ui.gapLabel}</dt>
                <dd
                  className={`data text-xl font-semibold ${
                    idle === 0 ? 'text-seal' : 'text-signal'
                  }`}
                >
                  {idle}
                </dd>
              </div>
              <div>
                <dt className="text-ink-2">cross-area moves</dt>
                <dd className="data text-xl font-semibold">{chain.totalDistance}</dd>
              </div>
              <div>
                <dt className="text-ink-2">match score sum</dt>
                <dd className="data text-xl font-semibold">
                  {chain.totalMatchScore.toFixed(2)}
                </dd>
              </div>
              <div>
                <dt className="text-ink-2">objective value</dt>
                <dd className="data text-xl font-semibold">
                  {chain.value.toFixed(3)}
                </dd>
              </div>
            </dl>

            <ol className="flex flex-col gap-1.5 text-xs">
              {chain.hops.length === 0 && (
                <li className="text-signal">
                  No chain — this {config.ui.itemNoun} sits unused for the whole
                  window.
                </li>
              )}
              {chain.hops.map((hop, i) => {
                const p = peopleById.get(hop.personId)
                return (
                  <li key={hop.needId} className="flex gap-2">
                    <span className="w-4 shrink-0 text-ink-2">{i + 1}</span>
                    <span className="w-28 shrink-0 font-medium text-ink">
                      {p?.label}
                    </span>
                    <span className="w-28 shrink-0 text-ink-2">
                      {fmt(hop.from)} – {fmt(hop.to)}
                    </span>
                    <span className="w-12 shrink-0 data text-ink-2">
                      {hop.matchScore.toFixed(3)}
                    </span>
                    <span className="text-ink-2">{hop.reason}</span>
                    {hop.gapDays > 0 && (
                      <span className="shrink-0 text-signal">
                        +{hop.gapDays}d
                      </span>
                    )}
                  </li>
                )
              })}
            </ol>
          </section>
        </>
      )}
    </div>
  )
}
