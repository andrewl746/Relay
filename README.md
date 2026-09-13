# Relay

*(working title — previously "Campus Hub". Rename as the team likes.)*

**Craigslist for co-op students, where everything is keyed to the term.**

Sublet your place, sell or rent out your furniture, and hand it all to the person arriving
as you leave — before the date you both already know.

Built at **PivotHacks** · Builder's Club, Waterloo ON · 12 hours.
Starting problem: **Problem 8 — Resource Sharing.**

---

## Problem

Useful items sit unused while someone nearby needs the same thing.

On a university campus this happens on a **predictable schedule**. Every co-op rotation and
term boundary, thousands of students leave at the same time and thousands more arrive.
Desks, monitors, mini fridges, lab kits and textbooks get thrown out because coordinating a
handoff is harder than throwing the item away. The buyer and the seller are often in the
same building and never find each other.

The same rotation strands housing. The leaver pays rent on an empty room for four months;
the arriver, 400 km away, can't find a 4-month place because the whole market is built for
12-month leases.

General marketplaces don't solve either. They're built for browsing on a random Tuesday, not
for a ten-day window where everything has to move before a flight leaves — and they sort by
**recency**, which is exactly backwards when every listing has a deadline.

## What we're building

A campus-scoped marketplace built around move-out timing, covering both **a place** and
**the things in it**.

**Two modes on the same data:**

- **Marketplace mode** — normal listings for furniture and school materials, year-round.
- **Clearing mode** — during move-out windows, listings carry a deadline, the feed sorts by
  urgency instead of recency, prices decay toward a floor, and incoming students get matches
  *pushed* to them instead of searching an empty app.

**Two kinds × two deals:**

| | **rent** | **sale** |
|---|---|---|
| **place** | Sublet or lease takeover, furnished or unfurnished | — |
| **thing** | A desk for the term, returned in December | A desk sold outright |

`thing + rent` is the hinge: an arriver on a 4-month term doesn't want to *buy* a desk
they'll have to dump in December, and a leaver subletting unfurnished can rent the furniture
out instead of paying for storage.

## Core features

1. **Marketplace** — listings for sublets, furniture and school materials, for sale or for
   rent. Students join their own university hub, so listings are local and pickup is realistic.
2. **Student email verification** — a valid university email is required to list or claim.
   Keeps the hub local and cuts scams. *Deliberately cautious about auto-filtering: a very
   cheap listing is usually someone who needs it gone by Friday, not a scam. Flag for review,
   never delete.*
3. **Deadlines and urgency sorting** — a listing carries an expiry ("gone by Sat 12pm") and
   the feed ranks by time pressure. Price can decay toward a floor as the deadline closes,
   because the seller's real alternative is the dumpster.
4. **Term matching** — availability windows matched against co-op term windows, with the
   overlap ("exchange zone") and a coverage % shown on every listing.
5. **Wants list matching** — incoming students post what they need before they arrive, with
   a budget and a move-in date. The system pairs and notifies both sides. A new user in July
   sees a queue of upcoming matches instead of an empty feed.
6. **Room bundles** — a leaver posts a whole room as one bundle; an arriver claims it in one
   action. One leaver has eight items, one arriver needs eight items; existing marketplaces
   force eight separate transactions.
7. **Exchange options** — when a buyer claims, they pick from slots the seller already set
   instead of opening a blank chat. Both sides get a confirmation with a time and a place.
   Handoffs default to **public campus locations**.

## Secondary

- **Camera scanning** — point a phone at a room, a vision model drafts the listings. Removes
  the reason people don't list: filling a form costs more than the item is worth. Feature-flagged,
  with normal photo upload as the fallback.
- **Condition photos at handoff** — at handoff and at return, for **rentals only** (housing
  and lent items), so damage disputes have evidence. Not needed for permanent sales.
- **Item history** — how many times an item has been passed between students.
- **Chat** — low priority. Exchange options cover most of what students actually need. If
  added, it stays attached to a claimed item rather than open messaging between strangers.

## Impact

Every claimed listing is one less item in a dumpster and one less thing an incoming student
buys new. A per-campus dashboard tracks **items diverted and money saved** — which is also
the number a residence life or sustainability office cares about.

## Build priority

1. Marketplace, listings, hubs, verification
2. Deadlines and urgency sorting
3. Term matching / exchange zone
4. Wants list matching
5. Room bundles
6. Exchange options and scheduling
7. Price decay
8. Item history
9. Camera scanning *(stretch)*
10. Condition photos *(stretch)*
11. Chat *(only if time remains)*

## Demo plan

Shown entirely by our own team, no outside users required.

1. Seed the hub with realistic listings from one campus.
2. A student leaving for co-op lists their room as a bundle in under a minute.
3. An incoming student's wants list matches the bundle; they get a notification.
4. They claim it and pick a pickup slot. Both sides see the confirmation.
5. Show the urgency feed and price decay on an item close to its deadline.

## Docs

| | |
|---|---|
| [docs/PROJECT.md](docs/PROJECT.md) | Feature specs, matching math, data model, architecture, Snowflake plan, build plan, pitch + judge Q&A |
| [docs/DESIGN.md](docs/DESIGN.md) | Visual system — tokens, type, components, screens, motion, a11y |
| [PIVOTS.md](PIVOTS.md) | **Live.** Updated at each pivot. Adaptability is 30 of 100 points |

## Team

*(add names and roles)*

## Stack

Next.js 16.3.5 (App Router, Server Components) · React 19 · Tailwind v4 · TypeScript.
Seed data in memory — no database for the hackathon build.

> Next 16 renamed `middleware.ts` → `proxy.ts` and moved caching to Cache Components
> (`cacheComponents: true` + `use cache`). Check `node_modules/next/dist/docs/` before
> touching either — see [AGENTS.md](AGENTS.md).

## Run

```bash
npm run dev
```

http://localhost:3000

---

*Scaffolded from `create-next-app`; disclosed as a starter template per event rules.*
