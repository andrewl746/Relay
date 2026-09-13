# Relay

**Craigslist for co-op students, where everything is keyed to the term.**

Sublet your place, sell or rent out your furniture, and hand it all to the person arriving
as you leave — before the date you both already know.

Built at [PivotHacks](https://pivothacks.ca) · Builder's Club, Waterloo ON · 12 hours.

---

## Why

Co-op rotates thousands of students out of a city and thousands more into it, on the same
two weeks, three times a year. The leaver pays rent on an empty room and curbs a $200 desk.
The arriver, 400 km away, can't find a 4-month place and buys the same desk new.

The two sides are never online at the same time, and every tool they use sorts by *recency*.

Relay makes the **date** the primary key: rank by time pressure, match by window overlap,
let prices decay toward a floor as the deadline closes.

## Docs

| | |
|---|---|
| [docs/PROJECT.md](docs/PROJECT.md) | Product, scope, feature specs, data model, architecture, pivot log, build plan, pitch |
| [docs/DESIGN.md](docs/DESIGN.md) | Visual system — tokens, type, components, screens, motion, a11y |

## Stack

Next.js 16.3.5 (App Router, Server Components) · React 19 · Tailwind v4 · Postgres.

> Next 16 renamed `middleware.ts` → `proxy.ts` and moved caching to Cache Components
> (`cacheComponents: true` + `use cache`). Check `node_modules/next/dist/docs/` before
> writing anything that touches either — see [AGENTS.md](AGENTS.md).

## Run

```bash
npm run dev
```

http://localhost:3000

---

*Scaffolded from `create-next-app`; disclosed as a starter template per event rules.*
