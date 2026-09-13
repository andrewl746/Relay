# Chain — project context

## What this is

A 12-hour hackathon project for PivotHacks (Waterloo, one day, judged at 8:15 PM).

Chain computes **handoff sequences** for physical items moving between people on
rotating schedules. The motivating case: Waterloo co-op students displace every
four months on a synchronized cycle. Every departure has a matching arrival
somewhere in the same city. A desk shouldn't go into storage between terms — it
should pass to the next person arriving.

This is **not** a marketplace. It is not listings, search, rentals, deposits, or
messaging. The product is the computed chain and the reasoning behind it.

## Why the architecture looks like this

Two rubric facts drive every decision below:

- **Adaptability is 30 of 100 points.** Four "pivots" are revealed during the day
  (10:00 AM, 12:00 PM, 4:00 PM) that may change the target user, the constraints,
  or the scope. The codebase must absorb those as data edits, not rewrites.
- **Demo is 10 points and lasts 2 minutes.** Anything not visible in 2 minutes is
  worth zero. Prefer one legible screen over five features.

Therefore: **no domain vocabulary in code.** No type named `Student`, no field
named `coopTerm`, no hardcoded "Waterloo". Those live in `config.json`. When a
pivot says "your users are now travel nurses," the change is a config edit plus a
reseed, target 15 minutes.

## Stack

- **Next.js + TypeScript, single app.** API routes for the backend. No separate server.
- **No database.** Seed data loads from JSON into memory at boot. n is in the low
  hundreds; a database is pure setup cost with zero demo value.
- **No vector database.** Cosine similarity over an in-memory array is O(n) at n=300,
  which is microseconds. Do not install Pinecone, Chroma, pgvector, or FAISS.
- **Tailwind** for styling. No component library.

If anything in this section starts to feel limiting, the correct response is to
finish the demo first and revisit at 5 PM (which will not happen).

## Data model

Three arrays in memory. Note that no field names a domain.

```ts
type Person = {
  id: string
  label: string          // display name
  location: string       // free text, e.g. "Northdale"
  awayFrom: string       // ISO date — absent from the location
  awayUntil: string      // ISO date
}

type Item = {
  id: string
  holderId: string       // current holder
  rawText: string        // how a human actually wrote it
  embedding: number[]
  freeFrom: string       // ISO — available to hand off
  freeUntil: string      // ISO
}

type Need = {
  id: string
  personId: string
  rawText: string
  embedding: number[]
  needFrom: string
  needUntil: string
}
```

`config.json` holds every domain-specific string:

```json
{
  "actor": "student",
  "actorPlural": "students",
  "cycle": "co-op term",
  "place": "Waterloo",
  "cycleBoundaries": ["2026-09-01", "2027-01-01", "2027-05-01", "2027-09-01"]
}
```

Every user-facing string reads from this file. Grep for hardcoded "student" before
the demo; there should be zero hits outside `config.json` and the seed generator.

## The pipeline (retrieve-and-rerank)

Four stages. Call it "retrieve-and-rerank" when explaining it — it is not a
"transformer pipeline," and a judge may notice.

1. **Embed.** Item and need `rawText` → vectors. Precompute for all seed data at
   build time and cache to a JSON file. Do not embed at request time during the demo.
2. **Retrieve.** Cosine similarity, take top 10 per need. This stage optimizes
   recall, not precision. Garbage in the top 10 is expected and fine.
3. **Rerank.** One LLM call per need over the 10 candidates. Returns, per candidate,
   a score in [0,1] and a short reason string. Example reasons: "folding table
   satisfies desk need, adequate surface"; "bar stool rejected, wrong height class".
4. **Assign.** The reranked score becomes `matchScore` in the DP below.

**The rerank score must feed the DP, not just render in the UI.** If it only
displays, the AI is a caption and scores accordingly.

### Provider seam

Wrap stages 1 and 3 behind one interface:

```ts
interface MatchProvider {
  embed(texts: string[]): Promise<number[][]>
  rerank(need: string, candidates: string[]): Promise<{score: number, reason: string}[]>
}
```

Two implementations: `SnowflakeProvider` (Cortex `EMBED_TEXT_1024`,
`COMPLETE`, `VECTOR_COSINE_SIMILARITY`) and `LocalProvider` (any embedding API +
any chat model). Swap via env var. This exists so that abandoning the Snowflake
track at 9:00 AM is a one-line change rather than a refactor.

## The algorithm

**Weighted interval scheduling, per item, via dynamic programming.**

For a single item, choose a set of non-overlapping needs to cover across the year,
maximizing total value:

```
sort candidate needs by needUntil ascending

dp[i] = max over all j where needUntil[j] <= needFrom[i] of:
          dp[j] + matchScore[i] - LAMBDA * gapDays(j, i) - MU * distance(j, i)

dp[0] = base case, no predecessor
```

- `gapDays(j, i)` = days between holder j releasing and holder i arriving. This is
  storage time, and it is the quantity the product exists to eliminate.
- `distance(j, i)` = crude location penalty. String match on neighbourhood is
  sufficient; do not integrate a maps API.
- Backtrack through `dp` to recover the actual chain.

O(n²) where n is candidate needs per item, which is dozens. Do not optimize this.
Do not reach for min-cost flow. The DP is exact for the single-item case and
implementable in about 30 lines.

**Across items:** iterate items scarcest-first and run the DP per item, marking
needs as consumed. This is greedy across items and exact within an item. When a
judge asks about optimality, say exactly that sentence — do not claim global
optimality.

## UI — one screen

A horizontal timeline. Time on the x-axis spanning three cycle boundaries. One row
per person showing their in-location interval. One row at the bottom for the item,
rendered as a continuous bar when storage days are zero, broken into segments with
a labeled red gap when they are not. Handoff points marked at boundaries.

Below the timeline: the chain's cost breakdown (total storage days, total distance,
sum of match scores) and the rerank reason string for each hop.

**One interactive control: "remove this person."** Clicking it drops a person,
re-runs assignment, and re-renders. The bar breaks and storage days jump. This is
the demo climax and must be fast — precompute embeddings so the only live work is
the DP.

Nothing else is interactive. No forms, no login, no settings.

## Seed data

Generate programmatically, but **hand-write 15 item descriptions first** in real
human voice — with typos, missing dimensions, inconsistent capitalization, brand
names, pickup locations mentioned mid-sentence. Then clone that pattern for the
rest. Uniformly-phrased synthetic data makes semantic matching look broken and
quietly costs points in three rubric categories at once.

Target: ~60 people, ~120 items, ~90 needs. Real Waterloo neighbourhood names
(Northdale, Lester, Sunnydale, Beechwood, King St N). Real term boundaries
matching `config.json`.

## Build order

| Time | Milestone |
|---|---|
| 8:00–8:20 | Schema, `config.json`, seed generator (generator, not hand-typed rows) |
| 8:20–9:00 | Embeddings cached, retrieval returning candidates. Snowflake spike runs in parallel, **hard kill at 9:00** |
| 9:00–9:45 | Interval DP, chains printing to terminal. No UI yet |
| 9:45–10:00 | Timeline rendering one chain. Ugly is correct |
| 10:00 | Pivot 2 lands — a working "before" state must exist by now |
| Afternoon | Rerank → intake parsing → remove-person button, in that order, each independently cuttable |
| 5:00 PM onward | Demo polish and `PIVOTS.md` only. No new features, no refactors |

## Hard non-goals

Do not build, even if it seems easy:

- Authentication, user accounts, sessions
- A database or ORM
- A vector database
- Maps, geocoding, or routing APIs
- Messaging, notifications, or email
- Payments, deposits, or damage handling
- Mobile layouts
- Tests
- Docker, CI, or deployment config
- More than one seeded city
- Any second screen

If a pivot appears to require one of these, the correct response is almost always
a narrower reinterpretation that fits in 90 minutes.

## PIVOTS.md protocol

Maintain `PIVOTS.md` in the repo, updated live at each pivot. Four entries, each
with exactly these fields:

```
## Pivot N — [time]
What dropped:
What we considered:
What we chose:
What we deliberately did NOT change, and why:
```

The last field is worth the most. Judges ask it directly and most teams have no
answer.

## Pre-decided pivot responses

| Pivot shape | Response | Budget |
|---|---|---|
| New user group | Edit `config.json`, reseed | 15 min |
| New constraint (cost, trust, accessibility) | New penalty term in the DP objective | 20 min |
| Remove a feature | Drop the rerank stage; chains still compute on raw cosine | 5 min |
| New stakeholder | Add a person who holds items without needing them | 20 min |
| Scope cut | Demo a single chain instead of the network | 5 min |

Pivot 4 lands at 4:00 PM with four hours left. Whatever it says, the response must
be finishable in 90 minutes. This rule is decided now, not at 4 PM.
