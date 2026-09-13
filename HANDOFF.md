# Handoff — read this first

You are picking up **Relay**, a PivotHacks project, mid-build. This file is the
fastest path to being useful. It is current as of the **post-Pivot-4 polish pass**, on top of
teammate commit `3b28dc2`. Pivot 4 (voice) was the last pivot of the event.

Read in this order: **this file → [PIVOTS.md](PIVOTS.md) → [docs/PROJECT.md](docs/PROJECT.md)**.
[docs/DESIGN.md](docs/DESIGN.md) only when you touch UI.

---

## 0. What changed since the Pivot 4 version of this file

**Teammate commits, merged into `main`:**

| Commit | What |
|---|---|
| `9a976a9` `ac36625` | **Relay backend** (Adarsh): per-person memory, `relay-person` cookie identity, answer engine, and **booking pins** in `lib/assign.ts` so a booked need stays on the item it was booked on. See §5 |
| `85ff019` | Favicon / apple-icon from the logo |
| `3b28dc2` | UI lint errors fixed without changing output: theme toggle and voice input read browser state through `useSyncExternalStore` instead of setState-in-effect; `/chains` timing moved out of render. **Lint is at 0 errors** |

**Polish pass (this session; uncommitted in the working tree when written):**

| Area | Change |
|---|---|
| Board → listing | Fixed a **multi-second freeze** on every click. Now React `<ViewTransition>`; `TransitionLink` deleted. §8 |
| Real-account speed | Navigation made ~5 Supabase Auth round trips + 3 profile reads per click. Now one each, via `cache()`. §6 #8 |
| Settings | Changing university clears the verified email and redirects to `/onboarding/verify`; a finished account returns to `/settings` afterwards, not through interests/wants again. **All settings saves fail until migration 0005 is run** — §6 #9 |
| Hydration error | `<html suppressHydrationWarning>` — `themeScript` stamps `data-theme` before React hydrates |
| Type | Merriweather for headings, Archivo for everything else; every page h1 bigger; `text-wrap: pretty/balance` |
| Colour | Dark-mode accent fills were 2.8:1. `--on-accent` token flips text to black in dark (7.6:1). Filter chips got a visible border; hover no longer darkens them into the page |
| Layout | One `SiteFooter` in the root layout, always below the fold. More space above page h1s. Navbar more translucent |
| Landing (`/welcome`) | Hub header, `.board` sections, token classes; Kandinsky shapes replaced by an SVG relay-route animation (no JS) |
| Small | Logo visible in dark mode everywhere; buttons get `cursor: pointer`; empty-state links all `btnTertiary`; bare empty states on cards; navbar avatar 28→36px; `UWaterloo` / `UofT`; home greeting varies per person but is stable across visits |
| **Backboard (sponsor)** | **Live at runtime, on the free credit.** Every want is a Backboard memory; posting a listing searches them by meaning and the confirmation names who's already looking for it. §7 |
| Onboarding | Restyled onto the site palette and components (it was a separate beige, red-accent, light-only theme). Follows dark mode |
| Headers | Landing, sign-in, legal and onboarding share `PlainHeader`, the same height as the hub header (59.34px). They had drifted apart |
| Landing links | "Sign in" → `/login`; "Get started" and "Find what you need" → `/register`. Same Google flow, different copy |

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
| Profile / settings | **Real.** `/settings` writes name, university, living situation, address and avatar to Supabase through a validating server action (`lib/hub/settings-actions.ts`). Changing university drops `university_email_verified` and redirects to re-verify. Delete-account goes through the `delete_own_account()` SECURITY DEFINER function. **Needs migration 0005** or every save fails |
| Demo mode | A cookie-picked seeded student, no auth. Switching demo students lives in **Settings**, not the header. Signing out clears this cookie too, so you don't land back in the hub as a stranger |
| Search | **Real, and not Ctrl-F** — see §4a |
| **Voice input** | **Real.** Speak into the board search or your wants list and the form submits. `components/hub/voice-input.tsx`. Pivot 4 |
| Claiming | **Real.** `lib/hub/claim-actions.ts` writes a claim to `data/runtime.json`; `/handoffs` reads it back. Verified end to end |
| Posting an item | **Real, in memory.** `lib/hub/actions.ts#createListing` adds to the `listings` array (lost on dev restart), with photo upload and edit/remove. Then it asks **Backboard memory** who already wants the item and shows them on the confirmation. It still doesn't go through `lib/relay/actions.ts#postItem`, so the engine never sees hub posts |
| Wants list | **Still client-side.** Lost on refresh. `addNeed` exists, unwired |
| Notifications | Hardcoded rows in `lib/hub/mock-data.ts` |
| Room bundles | Form only |
| University email verification | **Real in onboarding.** `sendVerificationCode` (`app/(onboarding)/actions.ts`) checks `isUniversityEmail()` against the chosen university's domain and stores a hashed OTP. Without `RESEND_API_KEY` the code is shown on screen instead of emailed. The hub itself does not gate on verification |

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
| `memory.ts` · `me.ts` | *(teammate, `9a976a9`)* Runtime people and profiles (neighbourhood, pickup windows, away dates, searches, dismissed). Identity is the httpOnly **`relay-person`** cookie — deliberately not `relay-user`, which is the hub's demo login; sharing it signed you out of one side when you signed into the other |
| `ui-actions.ts` · `routes.ts` | Server actions for sign-in/out, setup, find, **book** (addNeed + acceptHop, then confirms the route actually carries it and undoes if not), dismiss, lend. Redirect targets live in `routes.ts` |
| `answer.ts` · `views.ts` | Previews a typed need through the per-item DP with the same pins as the store; bookable answers plus misses with a reason and retry window. Views build handoff slips, receipts, shelf, typical rates |

**Booking pins** (`ac36625`): `assignAll` is greedy across items, so adding a booked need
could reshuffle the scarcity pass onto a *similar* item — the borrower saw a booking on one
drill while the route gave it to another. `AssignOptions.pinned` makes a pinned need eligible
only on its item, with a bonus inside that item's DP (subtracted from the reported value).
`npm run check:store` asserts it. **Nothing in the current hub UI calls `ui-actions.ts` yet.**

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
8. **Go through the cached Supabase getters.** `getSupabaseUser()` and `getMyProfile()` in
   `lib/supabase/session.ts` are wrapped in React `cache()`. Each `auth.getUser()` is a
   150–300ms round trip, and the layout, header and page each asked separately. That made
   real-account navigation take seconds while demo mode was instant. In render paths, never
   call `supabase.auth.getUser()` or `getProfile()` directly. A server action that *writes*
   the profile re-reads it with `getProfile`. The middleware uses `getClaims()`.
9. **Migration 0005 is not run, so every `/settings` save fails.** Confirmed against the live
   project: `column profiles.avatar_url does not exist`. The action sends `avatar_url` on
   every save, so the user sees "Couldn't save that" whatever they changed. The real error
   is now logged as `saveSettings failed:`. Fix: run `supabase/migrations/0005_avatar.sql`.
10. **`<html suppressHydrationWarning>` is load-bearing.** `themeScript` sets `data-theme`
    before hydration, so the server's attributes can never match. It only silences that one
    element's attributes. Removing it brings back the hydration error on every page for
    anyone with a stored theme.
11. **Backboard's `searchMemories` score is a distance, not a similarity.** Lower is
    closer: the right object scored 0.44–0.52, unrelated wants 0.7+. It also ignores
    `limit`. A "minimum score" filter matched everything. `MAX_WANT_DISTANCE = 0.58` was
    calibrated by `npm run seed:backboard -- --probe-only` (6 probes, all correct).
    Re-run it if you change what gets stored.

---

## 7. Snowflake — tested, blocked, do not re-litigate

> **Update (post-Pivot 4):** a card was added to the Snowflake account and Cortex is reported
> working. Not yet verified from the app: `SNOWFLAKE_ACCOUNT` and `SNOWFLAKE_PAT` are still
> empty in `.env.local` and `MATCH_PROVIDER=stub`. Once the user sets those two, run
> `npm run check`. Before switching the provider on, note that `lib/hub/semantic.ts`
> re-embeds every board item on every search. That's free on the stub, but a paid Cortex
> call per search.
>
> **Sponsor criteria (from the user):** Backboard's prize only requires *using* the
> service. Snowflake's is the same, but AI capabilities are preferred there.
>
> **Backboard — integrated, verified end to end.** The Free plan's $5 credit covers
> Memory & RAG only. LLM chat fails with "free credit is reserved for Memory & RAG", so
> `extractNeedMetadata` (a tool call) still returns defaults. BYOK on the Free plan is the
> other route to chat. What runs now, all in `lib/providers/backboard.ts`:
>
> - A `relay-wants` assistant holds one memory per want, stored as
>   `"<want text> — wanted by <first name>"`. Search returns only content and score, no
>   metadata, so the name is in the content.
> - `rememberWant` is called from onboarding's `finishWants`. The demo wants go in with
>   **`npm run seed:backboard`**, which resets and reseeds 10 memories, then prints a
>   calibration table.
> - `whoWants(title)` runs in `createListing`, and `PostItemForm` shows "N students are
>   already looking for this". Verified: posting "5-shelf bookcase" named Jordan
>   (bookshelf) and Owen (shelving) in 1.4s.
> - Both functions never throw. A post still saves if Backboard is down.
> - Cost is about $0.01 per memory operation. ~$4.8 of the free credit was left after
>   seeding. Don't call `whoWants` on page renders.
>
> **Pitch line:** "Backboard remembers what every student said they need. When you post
> something, it tells you who's already waiting for it."

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
- **One accent**, `--accent: #1A56DB` (dark: `#5B9BFF`) for text, links and rules. It was a
  burnt sienna before; on a warm paper ground that read as the cardboard gone damp.
- **Accent fills take `text-on-accent`, never `text-white`.** Same accent in both themes; the
  text flips: white in light (6.2:1), black in dark (7.6:1 on `#5B9BFF`). White on the dark
  accent was 2.8:1. A separate darker dark-mode fill was tried and rejected — it split the brand.
- **Measure contrast, don't estimate it.** A previous build had near-black text on the red
  fill — about 2:1 — on the single most urgent element on screen. Text passing isn't enough
  either: the browse filter chips were 6.6:1 text on a shape 1.2:1 from the page, and their
  hover (`bg-surface`) is *darker* than rest in dark mode, so it made them vanish. Chips now
  carry a `border-border-strong` that steps to `ink-3` on hover.
- **Step badges on `/welcome` vary by hue, not lightness**
  (`oklch(from var(--accent) l c calc(h ± n))`). Darkening sank them into the dark card;
  lightening broke the text contrast.

**Type and structure**

- **Two faces:** Archivo for everything you read and click, **Merriweather for `h1`–`h3`**
  (`--font-display`, set by a base rule in `globals.css`). Both self-hosted in `app/fonts/`.
  Body text is `text-wrap: pretty`, headings `balance` — no one-word last lines.
- **One footer**, `SiteFooter`, rendered once in `app/layout.tsx` after a `min-h-svh` wrapper,
  so every page fills the screen and the footer is always below the fold. Don't add
  per-layout footers back.
- Every page uses `PageShell` (one width), `PageTitle` (one h1), `SectionTitle` (19px).
  Pages used to roll their own h1 at 28px bold / 30px semibold / a 54px clamp.
- **`.t-eyebrow` is 13px sentence case now.** It was 11px bold uppercase at 0.14em, which
  is dashboard chrome — and it was carrying real sentences nobody could read.
- **Every section on every page sits on a `.board` card.** Bare sections on the page ground
  looked unfinished next to the home screen.
- **Hover = colour or fill, not an underline.** Underlines-on-hover were pulled back to a
  minimum site-wide; row titles shift to the accent instead. The one underlined style is
  `btnTertiary` (always underlined, text brightens on hover), and **every empty-state
  call to action uses it** — they used to be four different treatments.
- **Buttons show `cursor: pointer`** via one base rule in `globals.css`. Tailwind v4's
  preflight resets them to `default`.
- **Page h1s:** `PageTitle` is `clamp(32px, 4.5vw, 42px)` with `pt-12 sm:pt-16` above it
  in `PageShell`. Browse duplicates both, so change them together.
- **University short names are acronyms** (`UWaterloo`, `UofT`), in both
  `lib/onboarding/universities.ts` and `lib/hub/mock-data.ts`.
- **Home greeting** comes from a fixed list, picked by hashing the person's id. Different
  students see different lines; one student sees the same line on every visit. Not
  `Math.random` — that changed on every reload.
- **`/welcome` is built from hub parts:** the same sticky header (without account controls),
  `btnPrimary`/`btnSecondary`, `.board` sections, no page background. The hero animation
  (`RelayRoute`) is SVG + SMIL: a parcel moving down a dotted route and pausing at each
  stop. No JS, because the hero must never depend on hydration. Reduced motion keeps the
  route and hides the parcel.
- Nav holds where you *go* (Browse, Post, Handoffs). The profile menu holds what's *yours*
  (My list, My posts, Settings). Nothing has two homes. The header is **sticky** and paints
  its own translucent ground (`bg-bg/60`, 14px blur).
- **Two headers, one height.** `SiteHeader` is the hub header, with account controls.
  `PlainHeader` (`components/hub/plain-header.tsx`) is for everything outside the hub:
  landing, `/login`, `/register`, legal, onboarding. Its row is pinned to SiteHeader's
  measured height (17px nav text × 1.55 + `py-4` = 58.34px). Change the nav links and you
  change both. Don't hand-roll a header on a new page.
- **Onboarding uses the site design.** `app/(auth)/github-ui.css` keeps its `gh-*` class
  names, but every value is now a site token: `.gh-card` = `.board`, `.gh-input` =
  `fieldClass`, `.gh-btn-primary` = `btnPrimary`. Errors use the accent. It used to be a
  separate beige, red-accent, light-only theme. Add colours to `globals.css`, never there.
- The logo is `components/hub/logo.tsx`: the PNG as a **CSS mask**, so one asset takes a
  real `background-color` — ink normally, accent on hover, correct in dark mode. Tinting
  via `currentColor` does not fade, because there is no specified-value change to animate.
- Board→listing navigation is a **shared-element view transition**: `Thumb` in
  `components/hub/ui.tsx` wraps itself in React's `<ViewTransition name>`, and the
  thumbnail grows into the hero. The App Router ships React canary, so this works on
  plain `next/link` with no config (see `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`).
  It replaced a hand-rolled `TransitionLink` whose resolver lived in the row being
  unmounted — the promise never settled and every click froze the page for seconds.
  **Don't drive `document.startViewTransition` by hand again.**

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
3. **Real session**: signed `httpOnly` cookie for the hub's demo login. The Relay backend
   already has its own (`relay-person`, §5); Supabase sign-in is real.
4. **Voice on the post form** (the Pivot 4 option we cut). Needs entity extraction —
   "lending my drill, four dollars a day, pickup at V1" → five fields. `lib/providers/
   backboard.ts#extractNeedMetadata` is structurally correct and blocked on billing.
5. Only then, UI polish — and read **§8**, not docs/DESIGN.md, which is stale.

**Still needs a human, not a model:**

- Flip **"Enable Sign in with Google"** in the Supabase dashboard (the Client ID and
  Secret are already there; the toggle is simply off). Deliberately not done for you —
  changing someone's account settings isn't ours to do.
- Generate a **Snowflake PAT**, set `SNOWFLAKE_ACCOUNT` / `SNOWFLAKE_PAT`. Never ask a
  model to generate or read that token. **Still empty as of the Cortex card being added.**
- Backboard LLM chat needs *paid* credits; the free $5 only covers Memory & RAG.
- Run migrations **0003_wants / 0004_delete_account / 0005_avatar** in the SQL editor.
  **0005 is confirmed missing and breaks every settings save** (§6 #9). 0003/0004 unverified.
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
npm run seed:backboard            # reset + load demo wants into Backboard memory (~$0.10)
npm run seed:backboard -- --probe-only  # recheck the match cutoff without reseeding
npm run check:backboard           # the LLM extraction path — fails on free credit, by design
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
