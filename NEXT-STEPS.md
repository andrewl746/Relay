# Next steps: Parcel's corner (onboarding) handoff

For a fresh Claude session picking this up cold. Read this, then `HANDOFF.md` (the team's
project overview) and `AGENTS.md` (this is Next.js 16: read `node_modules/next/dist/docs/`
before writing Next code).

## Where things are

- **Repo:** `andrewl746/pivothacks`, local clone at
  `C:\Users\adars\Downloads\Programming\GitHub\pivothacks\pivothacks`.
- **Branch:** `adarsh/parcel-guide`. `origin/main` (up to `04d2337`) is merged in locally as
  `a146814`. The integration work on top of that is **uncommitted**. Nothing new is pushed.
  Teammates push to `main` often: `git fetch` first.
- **Dev server:** `npm run dev` → http://localhost:4287 (not 3000).
- **No `.env.local` on this machine**, so Supabase is off and the app runs in demo mode.
  Parcel's corner and the Post/Claim gate only apply to a signed-in Supabase account. Don't
  read or create `.env.local` without asking the user.

## What the user asked for, in order

1. An onboarding **avatar guide** (not an xAI Grok bot, not a chatbot). **Parcel is
   original art**: an open cardboard box with a face (Relay's logo is an open box), moods
   `hi`, `thinking`, `pointing`, `cheer`.
2. "Build Parcel into Relay while matching the existing UI."
3. "All the 'tell us about yourself' stuff should be in Parcel's corner, not taking over the
   entire website." The four steps (Your info, Verify email, Interests, Wishlist) run in a
   panel in the corner of the normal site.
4. "Complete parcel integration into the website", with these answers:
   - merge `main` in now and commit the merge (done)
   - **gate Post and Claim until steps 1–2** (profile saved, email verified); Interests and
     Wishlist stay optional
   - demo login lands on `/`, and the old full-page `app/onboarding/page.tsx` is deleted

## Decisions already made (don't reopen without the user)

- Parcel is original SVG art. Nothing is copied from grokbots.ai.
- Every Parcel tip must be true of what the code does. Claims and their sources are listed
  at the top of `components/onboarding/guide-tips.ts`.
- Setup lives in the corner of the site, and the site stays usable behind it.
- The corner uses the `gh-*` classes, which `main` retinted onto the site palette. It
  follows dark mode now; it's no longer light-only.
- Saving a step **refreshes the layout instead of redirecting**; the corner reads the next
  step from the profile.
- Old URLs `/onboarding` and `/onboarding/(profile|verify|interests|wants)` redirect to `/`.
- Ask the user before committing, pushing or merging.

## How it fits together

| Piece | Where |
|---|---|
| Which step is pending | `pendingStep()` and `tradeBlocker()` in `lib/onboarding/profile.ts` |
| The corner (server) | `components/onboarding/onboarding-corner.tsx`, rendered by `app/(hub)/layout.tsx` for signed-in users |
| The corner (client) | `components/onboarding/parcel-corner.tsx`: step dots, Parcel + tips, scrolling form, Hide/Escape to a pill. Also exports `OpenParcelCorner`, a button that unfolds the corner from anywhere (window event) |
| Parcel | `components/onboarding/guide-bot.tsx`; the tape uses `var(--accent)` |
| Post/Claim gate | `getTradeBlocker()` in `lib/hub/session.ts` (null in demo mode). Pages: `app/(hub)/post`, `post/room`, `listings/[id]/claim` render `components/onboarding/setup-required.tsx`. Actions: `createListing` returns an error, `claimListing` throws |
| Step actions | `app/(onboarding)/actions.ts` (stays there because the forms import it) |
| Styles | `app/(auth)/github-ui.css`, now `@import`ed once by `app/globals.css` with no Tailwind import of its own |

## Status

- **Typecheck:** passes with zero errors (clean `.next/dev/types`, `npx next typegen && npx tsc --noEmit`).
  The `/browse` conflict markers came from `main` and are fixed there.
- **ESLint:** 0 errors. The 12 warnings are all in files this work didn't touch, plus
  `_formData` in `lib/hub/actions.ts`, which was already there.
- **Browser (headless Chrome, 1280×800 and 390×844, light and dark), with a temporary
  preview page that has since been deleted.** All checks pass:
  - panel bottom-right (420px) on desktop; on phones a sheet ≤ 70% of the screen
  - page behind scrolls and is clickable
  - Hide and Escape fold it to a focused pill; the pill reopens it with focus on the heading
  - "Next tip" steps through the tips
  - the profile form scrolls inside the panel
  - interests grid and wishlist row fit
  - reverify and complete states are right
  - the gate's button unfolds the corner
  - hub headings are still Merriweather and buttons still `cursor: pointer`
  - both old URLs return 307 to `/`
  - no console errors
- **Bugs found and fixed in that pass:**
  - Lenis smooth scroll swallowed wheel events, so the form never scrolled. Fixed with
    `data-lenis-prevent` + `overscroll-contain` on the scroll area.
  - Escape in the university dropdown also folded the whole panel. The combobox now
    `preventDefault`s it, and the corner ignores handled Escapes.
- **Demo mode checked:** `/post`, `/post/room` and a claim page still show their forms (no gate).
- **Not yet tested against Supabase.**

## Do these in order

1. **Test the real flow with Supabase** (the user sets up `.env.local` per `SETUP.md`; never
   commit keys):
   - A new account signs in and lands on `/` with the corner at step 1.
   - `/post` and a claim page show "Finish your profile first". The button opens the corner.
   - Each save moves the corner to the next step without leaving the page. For the verify
     step, the code shows on screen when email delivery isn't set up.
   - After verifying (step 3), Post and Claim work. Interests and Wishlist are still pending.
   - "Back to interests" on step 4 works, and Finish or Skip for now makes the corner disappear.
     Wishlist items should show on `/wants` with matches (main wired `getMatches` to hybrid search).
   - In Settings, changing university shows "Saved", then the corner asks to verify the new
     email, and Post/Claim are gated again until it's verified.
2. **Ship:** ask the user, then commit on `adarsh/parcel-guide` and push or merge as they say.

## Loose ends

- On a phone, the university dropdown can run about 44px past the bottom of the sheet. The
  sheet scrolls to show it; nothing is unreachable.
- **Artifacts:**
  - The **Grok Bot (MCP) tutorial** was the wrong topic:
    https://claude.ai/code/artifact/64c0e5d2-91d1-45de-9cf8-47f19e468d51. The user hasn't
    said whether to delete it.
  - The **Parcel tutorial** (https://claude.ai/code/artifact/726bb58a-a6df-4714-ab0c-18ea74a15ef6)
    still describes the earlier tips-only corner.
- **Leaked key:** `main` removed the Google Maps key from `.env.example`, but it's still in
  git history. The user should rotate it.
- **Other branch:** local `adarsh/ui-redesign` has an unpushed commit (`dd886a0`) with the
  old paper redesign; `main` doesn't use it.

## Gotchas that already cost time

- **PowerShell `Remove-Item` is blocked** on paths with parentheses like `app\(hub)\...`.
  Use the Bash tool: `rm -rf 'app/(hub)/x'`.
- **Line endings:** git `core.autocrlf=true`, so checked-out files are CRLF. The Edit tool
  copes; scripted find-and-replace must handle `\r\n`.
- **Lenis owns wheel scrolling.** Any new scrollable panel needs `data-lenis-prevent`.
- **Browser checks without the Chrome extension:** drive headless Chrome over the DevTools
  Protocol from a Node script (Node 24 has a global `WebSocket`). Mouse clicks with mobile
  emulation on hit whatever is at that point, and on a phone the sheet covers most of the page.
- **Relay's clock is pinned** to 2026-09-13 (`lib/hub/clock.ts`).
- **Scripts:** repo scripts run with `node --experimental-strip-types`.
- **Headings** (`h1`–`h3`) use the Merriweather serif by default (`app/globals.css` base layer).
- **Stale route types:** if the dev server was running while routes were added or deleted,
  stop it and delete `.next/dev/types` before `tsc`.
