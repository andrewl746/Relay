# Next steps: Parcel's corner (onboarding) handoff

For a fresh Claude session picking this up cold. Read this, then `HANDOFF.md` (the team's
project overview) and `AGENTS.md` (this is Next.js 16: read `node_modules/next/dist/docs/`
before writing Next code).

## Where things are

- **Repo:** `andrewl746/pivothacks`, local clone at
  `C:\Users\adars\Downloads\Programming\GitHub\pivothacks\pivothacks`.
- **Branch:** `adarsh/parcel-guide`, cut from `main` at `3950a91`. **Local only, nothing
  committed, nothing pushed.** All work below is uncommitted in the working tree.
  Teammates push to `main` often: `git fetch` first.
- **Dev server:** `npm run dev` → http://localhost:4287 (not 3000).
- **No `.env.local` on this machine**, so Supabase is off and the app runs in demo mode.
  Parcel's corner only renders for a signed-in Supabase account, so locally you need a
  preview page (step 2 below). Don't read or create `.env.local` without asking the user.

## What the user asked for, in order

1. An onboarding **avatar guide** (not an xAI Grok bot, not a chatbot). They pointed at
   grokbots.ai for the look, but those avatars come from that site's own unlicensed
   generator, so **Parcel is original art**: an open cardboard box with a face (Relay's
   logo is an open box), moods `hi`, `thinking`, `pointing`, `cheer`.
2. "Build Parcel into Relay while matching the existing UI."
3. **Latest, and the current task:** "all the 'tell us about yourself' stuff should be in
   Parcel's corner, not taking over the entire website." So the four onboarding steps
   (Your info, Verify email, Interests, Wishlist) no longer get full pages. They run in a
   panel in the corner of the normal site, with Parcel guiding.

## Decisions already made (don't reopen without the user)

- Parcel is original SVG art. Nothing is copied from grokbots.ai.
- Every Parcel tip must be true of what the code does. The claims and their sources are
  listed in the comment at the top of `components/onboarding/guide-tips.ts`.
- Setup lives in the corner of the site, and the site stays usable behind it.
- The corner keeps the onboarding look (`.gh` classes from `app/(auth)/github-ui.css`,
  kraft palette, light-only).
- Saving a step **refreshes the layout instead of redirecting**; the corner reads the next
  step from the profile.
- Old step URLs `/onboarding/(profile|verify|interests|wants)` redirect to `/`.
- Ask the user before committing, pushing or merging.

## What's done (uncommitted)

| File | Change |
|---|---|
| `components/onboarding/guide-bot.tsx` | **New.** Parcel, pure SVG, `mood` prop |
| `components/onboarding/guide-tips.ts` | **New.** Tips per step, plus `tipsFor(step, reverify)` for the "changed university" case |
| `components/onboarding/parcel-corner.tsx` | **New, client.** The corner panel: step dots, Parcel + tip bubble ("Next tip"), title, scrolling form area. "Hide" or Escape folds it to a pill ("Finish setting up · N of 4"). 420px bottom-right from `sm` up; bottom sheet (max 70dvh) on phones. Imports `github-ui.css` |
| `components/onboarding/onboarding-corner.tsx` | **New, server.** `pendingStep(profile)` picks the step in the order the old pages enforced (finished accounts only come back for step 2 after a university change), and renders the matching existing form inside `ParcelCorner` |
| `app/(hub)/layout.tsx` | No longer redirects unfinished accounts to `/onboarding/profile`; renders `<OnboardingCorner>` for signed-in users |
| `app/(onboarding)/actions.ts` | Each step returns `nextStep()` (`revalidatePath("/", "layout")` + `{ status: "saved" }`) instead of `redirect()`. New `backToInterests()` action. `ActionState` gains `"saved"` |
| `app/auth/callback/route.ts` | Always lands on `/` (the corner picks up unfinished setup) |
| `lib/hub/settings-actions.ts` | Changing university no longer redirects to `/onboarding/verify`; the corner asks to re-verify |
| `next.config.ts` | Redirects old step URLs to `/` |
| `components/onboarding/interests-form.tsx` | Always 2 columns and smaller tiles, to fit the panel |
| **Deleted** | `app/(onboarding)/layout.tsx`, the four `app/(onboarding)/onboarding/*/page.tsx`, `components/onboarding/shell.tsx` (only those pages used it). `app/(onboarding)/actions.ts` stays where it is because the forms import it |

The four forms (`profile-form`, `verify-email-form`, `interests-form`, `wants-step-form`)
are otherwise unchanged.

## Status

- ESLint: **passes** on every changed file.
- Typecheck: **passes** for all of this work. A clean run (dev server stopped,
  `.next/dev/types` cleared) gives exactly 3 errors, all from the merge-conflict markers in
  `app/(hub)/browse/page.tsx` (item 6), which aren't ours.
- **Not yet looked at in a browser. Not yet tested against Supabase.** An earlier version
  (tips-only corner on the full-page onboarding) was verified in Chrome; this rebuild has not been.
- The dev server is stopped.

## Do these in order

1. **Re-check the typecheck** if anything changed since this was written. If the dev server
   was running while routes were added or deleted, stop it and delete `.next/dev/types` first
   (stale generated types show up as errors there). Then run
   `npx next typegen && npx tsc --noEmit`. Expect only the three `browse/page.tsx` errors.
2. **Look at it with a temporary preview page.** Create `app/(hub)/parcel-preview/page.tsx`
   (under the hub layout, so the real site header shows behind the corner). Render
   `<OnboardingCorner profile={...} fallbackName="Jordan Kim" />` with fake `ProfileRow`
   objects chosen by `?step=`:
   - `1`: empty profile
   - `2`: profile filled (`university_id: "uw"`, on campus, campus address), not verified
   - `3`: verified, `onboarding_step: "interests"`
   - `4`: verified, `onboarding_step: "wants"`, `interests: ["furniture", "kitchen-supplies"]`
   - `reverify`: `onboarding_completed: true`, not verified (expect "Verify your new university email")
   - `complete`: completed and verified (expect no corner)

   Check at desktop width and at 390px:
   - the panel sits bottom-right and the page behind stays scrollable and clickable
   - Hide and Escape fold it to the pill, and the pill reopens it
   - "Next tip" steps through the moods
   - the long profile form scrolls inside the panel
   - the university dropdown isn't clipped by the scrolling area
   - the interests grid and the wishlist input row fit
   - on phones the sheet stays at or under 70% of the screen height

   **Delete the preview page before committing.**
3. **Test the real flow with Supabase** (the user sets up `.env.local` per `SETUP.md`; never
   commit keys):
   - A new account signs in and lands on `/` with the corner at step 1.
   - Each save moves the corner to the next step without leaving the page. For the verify
     step, the code shows on screen when email delivery isn't set up.
   - "Back to interests" on step 4 works, and Finish or Skip for now makes the corner disappear.
   - In Settings, changing university shows "Saved", then the corner asks to verify the new email.
   - `/onboarding/profile` redirects to `/`.
4. **Risks to check while testing:**
   - `parcel-corner.tsx` imports `github-ui.css`, which has its own `@import "tailwindcss"`,
     so it now loads on every hub page. Check hub styling is unchanged (button pointer
     cursor, serif headings). If it isn't, move the `.gh` tokens and `gh-*` classes into
     `app/globals.css` without the Tailwind import, and drop the import.
   - Unfinished accounts can now reach hub pages that the old layout redirect used to block.
     Check pages that use `getCurrentUser()` (`lib/hub/session.ts`) cope with an empty
     profile, especially posting a listing (`pickupArea: user.home` could be empty). Consider
     gating post and claim until setup is done, and ask the user.
   - The corner is `z-50`, the sticky site header is `z-40`, and the user menu is `z-50`
     inside the header. Check nothing overlaps badly.
5. **Wishlist copy mismatch (raise with the user):** step 4's description (kept from the old
   page) says "we'll match them as people post", but `lib/hub/data.ts` says real users'
   wants aren't run through matching yet. Parcel's tips deliberately don't promise matching.
6. **Broken on `main` (not ours):** commit `3950a91` ("button changes", by sandmanfan11)
   committed `git stash pop` conflict markers into `app/(hub)/browse/page.tsx` (lines 95–101,
   `<<<<<<< Updated upstream` / `>>>>>>> Stashed changes`). That breaks `/browse` and `tsc`.
   The upstream side carries a deliberate dark-mode hover fix, so it's likely the one to
   keep. **Ask the user before resolving.**
7. **Open question for the user:** the demo login (`components/hub/dev-login.tsx`) still sends
   demo users to the old full-page `app/onboarding/page.tsx`. It's separate from the Supabase
   steps and was left untouched. Should it move into the corner too?
8. **Ship:** when steps 1–3 pass, ask the user, then commit on `adarsh/parcel-guide` and push
   or merge as they say.

## Loose ends from this session

- **Artifacts:**
  - The **Grok Bot (MCP) tutorial** was the wrong topic:
    https://claude.ai/code/artifact/64c0e5d2-91d1-45de-9cf8-47f19e468d51. The user hasn't
    said whether to delete it.
  - The **Parcel tutorial** (https://claude.ai/code/artifact/726bb58a-a6df-4714-ab0c-18ea74a15ef6)
    describes the earlier tips-only corner, not setup-in-the-corner. Update it after the rebuild.
- **Possible leaked key:** `.env.example` contains what looks like a real Google Maps API key
  (`AIzaSy…`). Tell the user to rotate it and replace it with a placeholder.
- **Other branch:** local `adarsh/ui-redesign` has an unpushed commit (`dd886a0`) with the
  old paper redesign; `main` doesn't use it.
- **Already on `main` from this session:** the Relay MCP backend work, booking pins, the
  `relay-person` cookie, and the UI lint fixes are merged and pushed. `main` had 0 ESLint
  errors before the browse conflict landed.

## Gotchas that already cost time

- **PowerShell `Remove-Item` is blocked** on paths with parentheses like `app\(hub)\...`.
  Use the Bash tool: `rm -rf 'app/(hub)/x'`.
- **Line endings:** git `core.autocrlf=true`, so checked-out files are CRLF. The Edit tool
  copes; scripted find-and-replace must handle `\r\n`.
- **Chrome automation:**
  - Background tabs get frozen: `setTimeout` waits hang and `javascript_tool` times out
    after 45s. Use a fresh tab, and wait with `MessageChannel` ticks instead of timers.
  - React applies click updates a tick later, so wait before reading the DOM.
  - Screenshots can cover less than the real viewport, and right-edge elements get cropped.
    Load the page in an iframe at the top-left instead.
  - Closing a tab can reset the tab group, so call `tabs_context_mcp` again before navigating.
- **Relay's clock is pinned** to 2026-09-13 (`lib/hub/clock.ts`).
- **Scripts:** repo scripts run with `node --experimental-strip-types`.
- **Onboarding styles are light-only.** The `.gh` wrapper sets its own background
  (unlayered), so a Tailwind `bg-*` utility on the same element loses; put the utility on
  a child instead.
- **Headings** (`h1`–`h3`) use the Merriweather serif by default (`app/globals.css` base layer).
