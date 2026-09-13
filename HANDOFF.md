# Handoff — read this first

You are picking up **Relay**, a PivotHacks project, mid-build. This file is the
fastest path to being useful. It is current as of commit `cbd7f9e`.

Read in this order: **this file → [PIVOTS.md](PIVOTS.md) → [docs/PROJECT.md](docs/PROJECT.md)**.
[docs/DESIGN.md](docs/DESIGN.md) only when you touch UI.

---

## 1. The 60-second version

**Relay** is the product. **Chain** is the engine inside it. Two names, one project.

> You need a drill for one Saturday afternoon. Someone four doors down owns one,
> isn't using it, and will rent it to you for $4 a day. Relay computes where that
> drill goes for the whole term — so it's never in a closet, the owner makes
> something back, and you always know who you hand it to next.

A marketplace matches one person to one person. Relay **routes one object through
many people across a term**. That routing is the entire differentiator.

- **User (set by Pivot 2):** a university student living independently for the first time.
- **Objects:** things you need once and can't justify buying (drill, ladder, carpet
  cleaner, projector, suitcase) — **for rent**; plus things a leaver doesn't need and
  an arriver won't buy new (water filter, desk lamp, mini fridge) — **for sale**.
- **Pricing:** owner sets a daily rate (rent) or a price (sale). Relay displays and
  totals it; **the two people settle the money themselves.** We never touch funds.

---

## 2. The event constraints that shape everything

- **12 hours**, 8:00 AM → 8:00 PM. Judging 8:15 PM, **3 minutes per team**
  (2 min pitch+demo, 1 min Q&A).
- **Four forced pivots**: 8:00 (done), 10:00 (done), 12:00, 16:00.
- **Rubric: Adaptability & Pivot Response 30 / Technical 25 / Problem 20 /
  Creativity 15 / Demo 10.** Adaptability outweighs execution.
- Judges ask verbatim: *which pivot hit hardest · what did you remove ·
  **what did you intentionally NOT change** · why does it look like this.*
- **[PIVOTS.md](PIVOTS.md) is the highest-value file in the repo.** Update it within
  minutes of each pivot. Pivot 3 and 4 entries are still blank.
- Handbook rule, decided in advance: **a Pivot 4 response must fit in 90 minutes.**
  Narrow or reframe, never rebuild.

---

## 3. What is REAL vs what is a MOCKUP

This is the single most important thing to understand, and it is not obvious from
the file tree. **There are two disconnected halves.**

### ✅ Real — the engine (`lib/`, `scripts/`, `data/`)

Four stages: **embed → retrieve → rerank → assign.**

| File | What it does |
|---|---|
| `lib/types.ts` | `Person` / `Item` / `Need` / `Chain` / `Hop`. **No domain vocabulary — keep it that way.** It survived Pivot 2 untouched, which is why Pivot 2 cost an hour instead of a day |
| `lib/vector.ts` | cosine (bare dot product; vectors are pre-normalized) |
| `lib/match.ts` | retrieve top-10 per need, then rerank |
| `lib/assign.ts` | **the DP.** Weighted interval scheduling per item, greedy across items |
| `lib/providers/` | the seam: `stub` (offline, default) and `snowflake` (unverified) |
| `scripts/seed.ts` | deterministic generator, 60 people / 90 items / 231 needs |
| `scripts/prepare.ts` | build-time embed + rerank → `data/dataset.json`, `data/matches.json` |
| `lib/relay/` | **the real data layer I added** — see §4 |

Current network: **27/90 items placed, 117 handoffs, 12ms** for the whole assignment.

**Say this exactly when asked about optimality: _exact within an item, greedy across
items._ Do not claim global optimality.**
Call the pipeline **retrieve-and-rerank**, not "a transformer pipeline."

### ❌ Mockup — the UI (`app/(hub)/`, `components/hub/`, `lib/hub/`)

A teammate built ~3,200 lines of UI against a **separate, hardcoded data model**.
It looks finished. It persists nothing.

| Thing | Reality |
|---|---|
| University sign-in / `.edu` verification | **Does not exist.** `/login` is a user picker. `isUniversityEmail()` in `lib/hub/email.ts` is correct and **called from nowhere** |
| Session | Plaintext cookie set via `document.cookie`. Unsigned, client-writable |
| Posting an item | Form → React state → fake confirmation. **Writes nothing** |
| Claiming | Navigates to a URL with a slot id. No claim recorded |
| Wants list | Client-side array, lost on refresh |
| Handoffs / notifications | Hardcoded rows in `lib/hub/mock-data.ts` (625 lines) |
| Room bundles | Form only |

`lib/hub/*` has its own types (`Listing`, `Want`, `Claim`, `TimeSlot`) that **shadow**
the engine's. `lib/hub/scheduling.ts` even admits it in a comment: *"Naive stand-in…
The interval DP in lib/assign.ts is the real version."*

**The wall between the two halves is the main outstanding work.** See §7.

---

## 4. `lib/relay/` — the bridge I built (real, tested, not yet wired to the UI)

| File | Role |
|---|---|
| `runtime.ts` | User-created items/needs/accepted hops as JSON on disk (`data/runtime.json`, gitignored). Survives a dev restart mid-demo; `cat`-able when something looks wrong on stage |
| `store.ts` | Merges the immutable seed corpus with runtime rows into **one** `Dataset` and hands it to the engine. Nothing downstream knows which rows came from where — a posted item competes for needs on identical terms. Built per request (the DP is 12ms; caching would serve a stale board right after a post) |
| `actions.ts` | `postItem` / `addNeed` / `acceptHop`. Each validates its own input — Server Functions take direct POSTs, not just calls from our UI |

**Verified end to end** by `npm run check:store`: *"need a power drill this saturday,
putting up shelves"* → embedded → matched to a real drill → routed Oct 2–5 at $4/day.

---

## 5. Landmines — things that already bit us

Read these before you debug something that looks mysterious.

1. **Node 22.14 can't run bare `.ts`.** Every script passes
   `--experimental-strip-types`. Node ≥22.18 wouldn't need it. Don't "clean this up."
2. **Fonts are self-hosted in `app/fonts/`, deliberately.** `next/font/google`
   fetches at build time; it timed out and **500'd every route**. Beyond that, a demo
   that reaches `fonts.gstatic.com` dies on venue wifi. Do not switch back.
3. **The stub's weights are tuned and load-bearing.** `W_NOUN=3 > W_CONCEPT=1.2`.
   They were `TOKEN=1 / CONCEPT=2`, which made `::tools` outrank the literal word
   "drill" — a screwdriver set beat the actual drill on the one query the demo is
   built on. If you change them, re-run `npm run check`.
4. **Mixing embedding providers silently corrupts everything.** Stub is 256-dim,
   Cortex is 768/1024, and `cosine()` compares over `min(len)`. It won't crash; it
   will return meaningless numbers. `providerMeta()` exists to stamp this.
5. **A countdown must never be rendered into cached HTML.** Server emits an ISO
   timestamp, client computes the remainder.
6. **`lib/data.ts` caches only in production, on purpose.** Reseeding is half of every
   pivot response and a cache that survives it shows you the old world.
7. **Deleting `.next` while the dev server runs** breaks it until restart.

---

## 6. Snowflake — tested, blocked, do not re-litigate

The event has a **separate 30-point Snowflake track**.

**Cortex AI is gated on trial accounts. Verified twice**, on both the 30-day trial
(`yclkqnw-kf57737`) and the **120-day student trial** (`nakkqzo-wk53488`) the handbook
promises:

| | |
|---|---|
| `AI_EMBED`, `AI_COMPLETE`, `EMBED_TEXT_768`, `CORTEX.COMPLETE` | ❌ *"not available for trial accounts"* |
| `VECTOR_COSINE_SIMILARITY` | ✅ works |
| `ALTER ACCOUNT SET CORTEX_ENABLED_CROSS_REGION='ANY_REGION'` | ran clean, changed nothing — it's a SKU gate, not a region issue |

`RELAY.CORE` (people/items/needs with `VECTOR(FLOAT,256)`) **already exists** in the
student account. DDL is in [snowflake/schema.sql](snowflake/schema.sql).

**The remaining viable story, and it's honest:** the corpus lives in Snowflake,
retrieval runs there as SQL vector search, and only the embedding *function* stays
local behind the provider seam. "Why Snowflake and not an LLM API" → the data is
already there.

**Open actions:** (a) the user was asked to raise the Cortex gate with an organizer —
if it's universal, every Snowflake-track team is blocked; (b) a PAT is needed in
`.env.local` to test the REST inference endpoints, which are a different service
surface than the SQL functions. **Do not generate or read the token yourself** — ask
the user. `npm run check` verifies it in five seconds.

`lib/providers/snowflake.ts` is written but **has never executed against a live
endpoint.** Treat it as unverified.

---

## 7. What to do next, in priority order

The user's stated preference: **get the architecture and backend stable before
designing a frontend. The teammate's UI is expendable; mock data can be twisted or
removed as needed.**

1. **Repoint `lib/hub/data.ts` at `lib/relay/store.ts`** and delete
   `lib/hub/mock-data.ts`. Its function signatures are already `async` for exactly
   this. Mapping: `Listing`→`Item`, `Want`→`Need`, `Claim`/`TimeSlot`→`Hop`,
   `User`→`Person`. **The DP already computes the time slot the claim flow currently
   fakes** — that's the integration that makes the engine visible in the product.
2. **Wire the forms to `lib/relay/actions.ts`** so posting and wants actually persist.
3. **Real session**: signed `httpOnly` cookie, and call the `isUniversityEmail()` that
   already exists.
4. Only then, UI polish (docs/DESIGN.md).

**Protect the last 45 minutes** (19:15–20:00): freeze, seed the demo path, rehearse
the two minutes three times. A demo that runs beats a feature nobody sees.

---

## 8. Decisions already made — don't reopen without a reason

From [docs/PROJECT.md §3](docs/PROJECT.md), the decision ledger. These are answers to
a scored judging question.

| Decision | Why |
|---|---|
| **The date is the primary key** | Survived every pivot. Every version of this product is about windows of time lining up |
| **We compute a route, not a match** | One-to-one matching is solved and unremarkable |
| **No money moves through us** | Pricing made this tempting. Display and total; they settle it |
| **No domain vocabulary in `lib/types.ts`** | Why Pivot 2 cost an hour |
| **Precompute at build time, never at request time** | A 4-second spinner in a 2-minute demo is fatal |
| **A hop is a loan, not a change of custody** | The item goes home between borrowers; a *direct handoff* is the optimization. 13 strangers holding one drill for four months was not credible |
| **A sale is a chain of length 1** | Ownership transfers; the buyer can relist and start a fresh chain |

---

## 9. Commands

```bash
npm run dev          # http://localhost:4287  (NOT 3000)
npm run seed         # regenerate data/seed.json — deterministic
npm run pipeline     # embed + rerank -> data/dataset.json, data/matches.json
npm run chains       # print computed chains to the terminal
npm run check        # provider smoke test — run after ANY stub weight change
npm run check:store  # end-to-end write-path test
npm run reset        # wipe runtime.json before a demo run
npm run typecheck
```

After changing `scripts/seed.ts` or any embedding weight: **`npm run seed && npm run
pipeline`**, then re-run both checks.

---

## 10. Pitch skeleton

*Started here → learned this → changed this → ended up here → why it matters.*
Do not spend 90 seconds on the problem.

> "Problem 8, resource sharing. We started with students throwing out furniture at
> co-op move-out. Then our user became someone living on their own for the first time,
> and that changed what an *item* is — not furniture you inherit, but the drill you
> need for one afternoon and can't justify buying. In the same building there are
> already four drills, each used twice a year.
>
> Relay. You say what you need and when. We don't just find a drill — we compute where
> that drill goes for the whole term.
>
> [demo] … A $60 drill pays for itself two and a half times while its owner still uses
> it whenever they want.
>
> Every building already owns everything in it. The problem was never supply — nobody
> knew the schedule. We computed the schedule."

Then **one thing you deliberately kept** (§8). That's worth as much as the change.
