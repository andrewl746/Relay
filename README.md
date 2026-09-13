# Relay

**You need a drill for one Saturday afternoon.** Someone four doors down owns one, isn't
using it, and will rent it to you for **$4 a day**. Relay computes where that drill goes for
the whole term — so it's never in a closet, the owner makes something back, and you always
know who you hand it to next.

Built at **PivotHacks** · Builder's Club, Waterloo ON · 12 hours.
Starting problem: **Problem 8 — Resource Sharing.**

---

## The problem

Someone moves into their own place for the first time. Within a month they need — each for
about one afternoon — a drill, a step ladder, a hand truck, a carpet cleaner, an air
mattress, a suitcase, a stand mixer, a space heater, a sewing machine.

Buying all of it costs more than the furniture. So they buy a $60 drill and use it twice,
or they don't hang the shelf.

Meanwhile, in the same building, **there are already four drills.** Each is used twice a
year and sits in a closet for the other 363 days.

The friction was never finding an object. It's that a one-off loan between strangers has no
structure — no price, no end date, and no idea where the thing goes next.

## What Relay does

You say what you need, in your own words, and when. You get **one answer**:

> **Aditi has one.** Beechwood, 4 min walk. Free Thu Oct 2 – Sun Oct 5, **$16 for 4 days.**
> You hand it to **Wes Z.** on Sunday.
> <sub>matches on drill, same tools class · 0.768</sub>

That last line is the point. A marketplace matches one person to one person. **Relay routes
one object through a dozen people across a term** — so the handoff is already arranged
before you even have the thing.

**Owners set a daily rate and keep all of it** — Relay displays and totals the amount, and
the two people settle it between themselves. Across the seeded network, an earning item
averages **$149 a term**. A $60 drill pays for itself two and a half times while its owner
still uses it whenever they want.

## Relay and Chain

Two names, one project.

- **Relay** is the product — what a student opens.
- **Chain** is the engine inside it — the part that computes the route.

Chain is a four-stage pipeline: **embed → retrieve → rerank → assign.** The last stage is
weighted interval scheduling by dynamic programming, maximizing match quality while
minimizing days the item spends in a closet and moves across neighbourhoods.

*Exact within an item, greedy across items.* Not globally optimal, and we don't claim it is.

```
config.json ──► lib/config.ts                    domain vocabulary lives here only
scripts/seed ──► scripts/prepare ──► data/*.json build-time embed + rerank
                                          │
lib/relay/store.ts ◄──────────────────────┘      merges user rows into the seed
        │
        ├──► lib/match    retrieve top-K, rerank
        ├──► lib/assign   the DP
        └──► app/         need · handoffs · shelf · network
```

The whole match path for one new need — embed, retrieve over every item, rerank — is
**2.6 ms measured**, which is why the write path needs no queue, no job runner, and no
spinner.

## Status

| | |
|---|---|
| ✅ | Chain engine: embed, retrieve, rerank, DP, greedy assignment |
| ✅ | Seed: 60 people, 90 items, 231 needs, 2,310 scored pairs — longest chain 13 holders |
| ✅ | `/network` board: live DP, remove-a-person, recomputes in ~10 ms |
| 🔨 | Relay surface: need composer, answer card, handoffs, shelf |
| 🔨 | Pricing: config + docs done; into the DP objective after Pivot 3 |
| 📋 | Rooms as a second item kind — see [PROJECT.md §11](docs/PROJECT.md) |

## Docs

| | |
|---|---|
| [HANDOFF.md](HANDOFF.md) | **Start here if you are new to this repo.** What is real vs mocked, landmines, next steps |
| [docs/PROJECT.md](docs/PROJECT.md) | Problem, pricing, engine, screens, data model, build plan, pitch + judge Q&A |
| [docs/DESIGN.md](docs/DESIGN.md) | Visual system — tokens, type, components, screens, a11y |
| [PIVOTS.md](PIVOTS.md) | **Live.** One entry per pivot. Adaptability is 30 of 100 points |

## Run

```bash
npm run dev
```

http://localhost:4287

| | |
|---|---|
| `npm run seed` | regenerate `data/seed.json` — deterministic |
| `npm run pipeline` | embed + rerank → `data/dataset.json`, `data/matches.json` |
| `npm run chains` | print computed chains to the terminal |
| `npm run typecheck` | `tsc --noEmit` |

Requires Node 22. The scripts pass `--experimental-strip-types` for Node < 22.18.

## Stack

Next.js 16.3.5 (App Router, Server Components) · React 19 · Tailwind v4 · TypeScript.
No database — seed data loads from JSON into memory. No vector DB — cosine over an
in-memory array at n=90 is microseconds.

> Next 16 renamed `middleware.ts` → `proxy.ts` and moved caching to Cache Components
> (`cacheComponents: true` + `use cache`). Check `node_modules/next/dist/docs/` before
> touching either — see [AGENTS.md](AGENTS.md).

## Team

*(add names and roles)*

---

*Scaffolded from `create-next-app`; disclosed as a starter template per event rules.*
