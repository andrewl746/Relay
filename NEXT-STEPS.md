# Next steps: UI redesign handoff

For a fresh Claude agent picking this up cold. Read this first, then `HANDOFF.md` (engine
background) and `docs/DESIGN.md` (the visual system the new screens follow).

## Where things are

- **Branch:** `adarsh/ui-redesign` (local only), based on `origin/main` @ `d3d8772`.
  **Nothing is committed or pushed.** All the work below is uncommitted in the working tree.
  Teammates are pushing to `main` often; run `git fetch` before starting.
- **Dev server:** `npm run dev` → http://localhost:4287. It isn't running unless you start it.
- **Decisions already made by the user. Don't reopen them.**
  1. Look: **paper & ink** (docs/DESIGN.md), to match the logo pack in `public/brand/`
     (docs/BRAND.md). prmntr's dark "tactical" rewrite was reverted on this branch.
  2. Flows: **borrow → book → hand off**, and **lend → shelf**. The old marketplace screens are deleted.
  3. User memory: **server-side JSON** in `data/runtime.json` (gitignored), not Supabase.
  4. Work on a **branch**. Ask the user before committing or pushing.

## What was built (uncommitted)

| Area | Files |
|---|---|
| Memory store | `lib/relay/runtime.ts` (adds `people` and `profiles`), `lib/relay/memory.ts`, `lib/relay/me.ts` (cookie `relay-user` → current person) |
| Profile → engine | `lib/relay/store.ts` `withProfile()`: a profile's neighbourhood, pickup windows and away dates override the seed person before the DP runs |
| Answer engine | `lib/relay/answer.ts`: previews a typed need through the per-item DP, returns bookable answers plus "misses" with reasons |
| View models | `lib/relay/views.ts`: handoff slips, shelf, typical rates, featured people |
| Server actions | `lib/relay/ui-actions.ts`: startNew, continueAs, saveSetup, saveProfile, find, book, dismiss, markDone, lend, restore, forgetMemory, signOut |
| Screens | `app/(setup)/hello`, `app/(setup)/start`, `app/(hub)/page.tsx` (Need), `handoffs`, `handoffs/[id]` (receipt), `shelf`, `you`, `network` |
| Components | `components/relay/{answer-card,slip,chain-strip,profile-fields}.tsx`, `components/network/board.tsx` (moved from app/chains), `components/hub/{ui,site-header,nav-links}.tsx` |
| Styling | `app/globals.css` (paper tokens), `app/layout.tsx` (self-hosted Archivo + Plex Mono), `app/(auth)/github-ui.css` re-skinned to paper |
| Old routes | `next.config.ts` redirects: /wants, /post, /listings/*, /notifications, /chains, /account, /login/demo, /onboarding |
| Check | `scripts/check-flows.ts`: drives both journeys through the real server actions over HTTP |

## Current status: not green yet

Last run: `tsc` has 2 errors, and `check-flows` got 12 passed, 7 failed.

## Do these in order

1. **Fix the board type error.** In `components/network/board.tsx` (~line 156), replace
   ``{mounted ? `recomputed in ${ms.toFixed(1)}ms` : ' '}`` with
   ``{ms === null ? 'remove someone to re-plan live' : `recomputed in ${ms.toFixed(1)}ms`}``.
   This is also why `/network` returns 500.
2. **Restart the dev server.** `app/page.tsx` was deleted while it was running, and `/` probably
   still maps to the stale file. Then run:
   ```bash
   npx next typegen && npx tsc --noEmit
   npx eslint app lib/relay components next.config.ts
   node --experimental-strip-types scripts/check-flows.ts      # add KEEP=1 to keep the test data
   ```
3. **If the flows still fail at "need page greets them by name":** the Need page (`/`) returns
   200 but without the composer form. Read the dev server output for the render error on `/`.
   Everything after that step (find, dismiss, book, receipt, /you memory) depends on it.
   Target: all checks pass.
4. **Check the demo persona.** In the last run, p9 (Jae K.) had "Held by 0 people" on most shelf
   items and 0 handoffs. Check whether routing still produces chains once profiles are laid over
   people, and pick a persona whose shelf and handoffs aren't empty for the demo.
5. **ESLint in `lib/relay/actions.ts`** (`@ts-ignore`, `any` in the Backboard block) predates the
   redesign; that code is prmntr's. Fix only if the user wants it.
6. **Visual pass in Chrome at 1440px and 390px:** /hello → new student → /start → search "need a
   drill saturday, putting up shelves" (Oct 3–5) → Book it → /handoffs → /shelf (lend) → /you →
   /network. Run through the review checklist at the end of `docs/DESIGN.md`.
7. **Before any demo:** `npm run reset` (wipes runtime rows and profiles; the seed stays).
8. **Ask the user**, then commit on `adarsh/ui-redesign` and tell the team (or open a PR). The
   untracked `Relay student app logo design.zip` in the repo root shouldn't be committed.

## Gotchas that already cost time

- **PowerShell blocks `Remove-Item`** when a command contains paths like `app\(hub)\...`. Delete
  files with the Bash tool (`rm -rf 'app/(hub)/x'`) instead.
- **Long inline Node heredocs got cut off in Bash.** Put scripts in files.
- **New routes need `npx next typegen`** before `tsc` knows their `PageProps<"/route">`.
- **The clock is pinned** to Sun Sep 13 2026 11:00 (`lib/hub/clock.ts`), and seed dates run
  Sep 1 – Jan 1. Dates are `YYYY-MM-DD` calendar days; format them via `lib/relay/dates.ts` (UTC),
  never local time.
- **Fonts are self-hosted on purpose.** Google Fonts 500'd every route here, so don't add
  `next/font/google`.
- **Colour means three things only:** seal = in use, signal = idle, amber = money. Nothing is
  rounder than 4px. Only one primary button per screen.
- **Don't read or create `.env.local`.** Supabase and Backboard both fail open without keys.
- **Teammate libs are intentionally untouched:** `lib/hub/{data,matching,geo,mock-data}.ts` and
  `components/hub/pickup-map.tsx`. They're unused by the new screens but still compile.
