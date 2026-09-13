# Handoff — read this first

You are picking up **Relay**, a PivotHacks project, mid-build. This file is the
fastest path to being useful. It is current as of the **Pivot 4 (voice)** commit — the last pivot of the event.

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
- **[PIVOTS.md](PIVOTS.md) is the highest-value file in the repo.** All four pivots are
  now written up. Pivot 4 was **voice input**; read that entry before the demo.
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

### ⚠️ Half-real — the UI (`app/(hub)/`, `components/hub/`, `lib/hub/`)

A teammate built ~3,200 lines of UI against a **separate, hardcoded data model**. Parts of
it are now real. Parts are still a mockup. This table is the truth as of now.

| Thing | Reality |
|---|---|
| Google sign-in | **Real.** Supabase SSR auth, `app/(auth)/`, `/auth/callback`. Needs the provider toggle ON in the Supabase dashboard (see SETUP.md) |
| Profile / settings | **Real.** `/settings` writes name, university, living situation, address and avatar to Supabase through a validating server action. Delete-account goes through the `delete_own_account()` SECURITY DEFINER function |
| Demo mode | A cookie-picked seeded student, no auth. Switching demo students lives in **Settings**, not the header. Signing out clears this cookie too, so you don't land back in the hub as a stranger |
| Search | **Real, and not Ctrl-F** — see §4a |
| **Voice input** | **Real.** Speak into the board search or your wants list and the form submits. `components/hub/voice-input.tsx`. Pivot 4 |
| Claiming | **Real.** `lib/hub/claim-actions.ts` writes a claim to `data/runtime.json`; `/handoffs` reads it back. Verified end to end |
| Posting an item | **Still a mockup.** Form → React state → fake confirmation. `lib/relay/actions.ts#postItem` exists and is tested; the form does not call it yet |
| Wants list | **Still client-side.** Lost on refresh. `addNeed` exists, unwired |
| Notifications | Hardcoded rows in `lib/hub/mock-data.ts` |
| Room bundles | Form only |
| `.edu` verification | `isUniversityEmail()` in `lib/hub/email.ts` is correct and **called from nowhere**. Resend OTP path exists, needs `RESEND_API_KEY` |

`lib/hub/*` still has its own types (`Listing`, `Want`, `Claim`, `TimeSlot`) that **shadow**
the engine's. `lib/hub/scheduling.ts` admits it in a comment: *"Naive stand-in… The
interval DP in lib/assign.ts is the real version."*

**Finishing the wall between the two halves is the main outstanding work.** See §9.

---

## 4. Search — why it is not Ctrl-F

Someone will ask this in Q&A. The answer is two layers, unioned:

1. **Lexical + synonyms** (`lib/hub/search.ts`). Query tokens are AND-ed, synonyms within
   a token are OR-ed. This is what makes *"desk lamp"* exclude a bare desk while
   *"bookshelf"* finds a **bookcase** — two words for one object that share no substring.
   Covered by `npm run check:search` (**the bookshelf test**).
2. **Embeddings** (`lib/hub/semantic.ts`). The same `MatchProvider` seam the routing engine
   uses, pointed at the search box: `MATCH_PROVIDER=stub` is the offline hashed-bag model,
   `MATCH_PROVIDER=snowflake` embeds through Cortex. Two calibrated guards, both learned
   rather than guessed — a **relative** cut (absolute cosine isn't comparable across
   queries: "fridge" peaks at 0.63 on this corpus, "bookshelf" at 0.25) and an absolute
   floor below which the whole query is noise.

They are **unioned, never substituted**. If the provider is down, has no key, or rate
limits, the lexical half still answers and search degrades instead of breaking.

---

## 5. `lib/relay/` — the bridge (real, tested, partly wired)

| File | Role |
|---|---|
| `runtime.ts` | User-created items/needs/accepted hops as JSON on disk (`data/runtime.json`, gitignored). Survives a dev restart mid-demo; `cat`-able when something looks wrong on stage |
| `store.ts` | Merges the immutable seed corpus with runtime rows into **one** `Dataset` and hands it to the engine. Nothing downstream knows which rows came from where — a posted item competes for needs on identical terms. Built per request (the DP is 12ms; caching would serve a stale board right after a post) |
| `actions.ts` | `postItem` / `addNeed` / `acceptHop`. Each validates its own input — Server Functions take direct POSTs, not just calls from our UI |

**Verified end to end** by `npm run check:store`: *"need a power drill this saturday,
putting up shelves"* → embedded → matched to a real drill → routed Oct 2–5 at $4/day.

---

## 6. Landmines — things that already bit us

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

## 7. Snowflake — tested, blocked, do not re-litigate

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

## 8. The design system — read before you touch any UI

**`docs/DESIGN.md` is STALE.** It describes a dark "Industrial Premium / Tactical
Logistics" theme that was abandoned. What is actually built is below; trust this file and
the CSS, not that one.

**Kraft, one accent.** `app/globals.css` holds the whole palette as CSS variables and
`app/(hub)/hub.css` only aliases old token names — **do not define a colour in two
places.**

- Surfaces are warm white, **not** beige: `--bg` is the page, `--surface` is white so
  cards sit *above* the page, `--surface-2` is for inset wells. An earlier all-beige ramp
  read as 1991 PC plastic.
- Cardboard comes from **texture**, not from tinting surfaces brown: a real board photo at
  5% behind everything (`body::before`, fixed layer, **not** `background-attachment`,
  which repaints the backdrop every scroll frame and stalled Lenis).
- **`.hub` must not paint a background.** It used to, which covered the texture and left
  every signed-in page flat white.
- **One accent**, `--accent: #1A56DB` (dark: `#5B9BFF`). 6.2:1 on white both directions, so
  it is safe as text on paper *and* as a fill with white on top. It was a burnt sienna
  before; on a warm paper ground that read as the cardboard gone damp.
- **Measure contrast, don't estimate it.** A previous build had near-black text on the red
  fill — about 2:1 — on the single most urgent element on screen.

**Type and structure**

- Every page uses `PageShell` (one width), `PageTitle` (one h1), `SectionTitle` (19px).
  Pages used to roll their own h1 at 28px bold / 30px semibold / a 54px clamp.
- **`.t-eyebrow` is 13px sentence case now.** It was 11px bold uppercase at 0.14em, which
  is dashboard chrome — and it was carrying real sentences nobody could read.
- **Every section on every page sits on a `.board` card.** Bare sections on the page ground
  looked unfinished next to the home screen.
- **Hover = colour or fill, not an underline.** Underlines-on-hover were pulled back to a
  minimum site-wide; row titles shift to the accent instead.
- Nav holds where you *go* (Browse, Post, Handoffs). The profile menu holds what's *yours*
  (My list, My posts, Settings). Nothing has two homes. The header is **sticky** and paints
  its own translucent ground.
- The logo is `components/hub/logo.tsx`: the PNG as a **CSS mask**, so one asset takes a
  real `background-color` — ink normally, accent on hover, correct in dark mode. Tinting
  via `currentColor` does not fade, because there is no specified-value change to animate.
- Board→listing navigation is a **shared-element view transition**
  (`components/hub/transition-link.tsx`); the thumbnail grows into the hero. React's own
  `<ViewTransition>` would replace it but only exists in the **experimental** React
  channel — this repo is on stable React 19.2, so the native API is driven by hand. The
  awkward part (resolving the transition promise only after React commits the new route)
  is documented in the file. **Don't "simplify" it back to resolving immediately.**

---

## 9. What to do next, in priority order

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
4. **Voice on the post form** (the Pivot 4 option we cut). Needs entity extraction —
   "lending my drill, four dollars a day, pickup at V1" → five fields. `lib/providers/
   backboard.ts#extractNeedMetadata` is structurally correct and blocked on billing.
5. Only then, UI polish — and read **§8**, not docs/DESIGN.md, which is stale.

**Still needs a human, not a model:**

- Flip **"Enable Sign in with Google"** in the Supabase dashboard (the Client ID and
  Secret are already there; the toggle is simply off). Deliberately not done for you —
  changing someone's account settings isn't ours to do.
- Generate a **Snowflake PAT**, set `SNOWFLAKE_ACCOUNT` / `SNOWFLAKE_PAT`. Never ask a
  model to generate or read that token.
- Run migrations **0003_wants / 0004_delete_account / 0005_avatar** in the SQL editor.
- `RESEND_API_KEY` + `RESEND_FROM_EMAIL` (domain is verified, key isn't in `.env.local`).
- Optional: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — without it the pickup map degrades to a
  written description rather than drawing a fake map.
- Backboard credits: the free tier covers Memory & RAG, **not** LLM chat.

**Protect the last 45 minutes** (19:15–20:00): freeze, seed the demo path, rehearse
the two minutes three times. A demo that runs beats a feature nobody sees.

---

## 10. Decisions already made — don't reopen without a reason

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

## 11. Commands

```bash
npm run dev          # http://localhost:4287  (NOT 3000)
npm run seed         # regenerate data/seed.json — deterministic
npm run pipeline     # embed + rerank -> data/dataset.json, data/matches.json
npm run chains       # print computed chains to the terminal
npm run check        # provider smoke test — run after ANY stub weight change
npm run check:store  # end-to-end write-path test
npm run check:search # the bookshelf test — "bookshelf" must find a bookcase
npm run reset        # wipe runtime.json before a demo run
npm run typecheck
```

After changing `scripts/seed.ts` or any embedding weight: **`npm run seed && npm run
pipeline`**, then re-run every check.

**Voice needs Chrome or Safari and a real origin.** `SpeechRecognition` doesn't exist in
Firefox (the button hides itself) and the mic permission prompt needs `localhost` or
HTTPS — not a LAN IP. Test the demo on the machine you'll demo from.

---

## 12. Pitch skeleton

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
