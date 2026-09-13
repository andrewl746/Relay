# Relay — Design Document

**Companion:** [PROJECT.md](PROJECT.md) — product, engine, pricing, build plan, pitch.
**Logo:** [BRAND.md](BRAND.md) — lockups, icon cuts, and where each one is used in the app.
**Scope:** the visual system. Tokens, type, components, screens, motion, a11y, copy.
Everything here is meant to be built, not admired.

> **Direction confirmed Sep 13: paper and ink**, to match the logo pack, which is drawn in ink
> for paper. The dark "tactical" rewrite from 12:38 is in git history at `6741644`. The
> redesigned screens on branch `adarsh/ui-redesign` are built to this document.

---

## 1. The idea

> **A schedule for objects. It should look like a timetable, not a storefront.**

Relay is not a marketplace and must not look like one. Nothing is being merchandised —
there is no browsing, no feed, no cart. The user asks for one thing and gets **one answer
with a date on it**. The interface is a departure board and a set of small receipts.

### Banned

If a screenshot contains one of these, it's wrong.

| Banned | Why |
|---|---|
| Purple / indigo / blue-cyan gradients | The universal tell of an unconsidered project |
| Gradient blobs, glassmorphism, frosted panels | Decoration standing in for hierarchy |
| `border-radius: 12px` on everything | Nothing here is soft. A schedule isn't rounded |
| Drop shadows as the hierarchy mechanism | We have rules, weight and paper tone |
| Inter, or any default UI grotesque | The visual equivalent of not deciding |
| Emoji as interface icons | Fine in user content. Never in chrome |
| A product-grid or card wall | There is no catalogue. There is one answer |
| Skeleton shimmer | Sparkle for a wait that doesn't exist — everything here is ~10ms |
| Star ratings, "✨ AI-powered" copy | Trust theatre |

### Instead

**Paper and ink.** Warm newsprint ground, near-black ink, hairline rules. Chrome is
achromatic — **colour is a semantic channel, never decoration.**

**Colour means exactly three things**, and they map onto what the engine already computes:

| Colour | Meaning | Where |
|---|---|---|
| **Seal** (green) | **in use** — the thing is with someone who needed it | held spans, confirmed handoffs |
| **Signal** (red) | **idle** — it's in a closet, and that's the cost | gaps, unbooked stretches, overdue |
| **Amber** | **money** — rates, earnings, what's owed | daily rate, term earnings, cost of a hop |

Everything else — nav, buttons, filters, forms — is ink on paper. A screen with nothing
idle and nothing owed has almost no colour on it, and that's what makes red mean something.

**Data is monospaced.** Every number a user compares — rate, cost, dates, days, score — is
mono with tabular figures, so columns align and digits don't jitter. Prose numbers stay in
the text face.

**One committed light theme.** No dark mode for the hackathon. *A projector in a judging
room is not the place to discover the demo machine was set to dark* — this decision is
already in `globals.css` and we're keeping it. Tokens are structured so dark is a later
addition, not a retrofit.

---

## 2. Principles

1. **The answer is the interface.** One question in, one answer out. If a screen makes the
   user choose from a list, it has failed at its job.
2. **Always show what happens next.** Every object on screen that has a future should say
   what it is. *"You pass it to Wes on Sunday"* is the product.
3. **Colour is information.** Three meanings, no decoration.
4. **Receipts, not dashboards.** A handoff is a small agreement between two people. It
   should look like something you'd screenshot and send them.
5. **Density is respect.** A first-year checking this between classes on a phone.
6. **Nothing moves unless something changed.** Movement is a signal and we have few.

---

## 3. Colour

| Token | Hex | Role | Contrast on `--paper` |
|---|---|---|---|
| `--paper` | `#F2EFE6` | page ground, warm newsprint | — |
| `--paper-raised` | `#FBF9F4` | the answer card, sheets | — |
| `--paper-sunk` | `#E7E2D6` | inputs, timeline troughs | — |
| `--ink` | `#1C1A15` | primary text | **15.2:1** |
| `--ink-2` | `#57534A` | secondary, meta | **6.7:1** |
| `--ink-3` | `#8A8478` | tertiary — **≥18.66px bold or non-text only** | 3.2:1 |
| `--rule` | `rgba(28,26,21,.14)` | hairlines | — |
| `--rule-strong` | `rgba(28,26,21,.30)` | dividers, stamped boxes | — |
| `--seal` | `#2F5D3A` | **in use** — text | **6.6:1** |
| `--seal-fill` | `#3E7A4C` | held spans on the timeline | — |
| `--signal` | `#B83417` | **idle** — text | **5.2:1** |
| `--signal-fill` | `#C6371B` | gap spans, paper text on top | 5.2:1 inverted |
| `--amber` | `#8A5A00` | **money** — text | **5.2:1** |
| `--amber-fill` | `#E0A43A` | rate markers, fills only | — |

Ratios are measured, not estimated. `--ink-3` is the only token that fails normal-text AA
and it is restricted accordingly.

**Where colour is forbidden:** nav · buttons · form fields · person names · locations ·
empty states. All ink.

---

## 4. Typography

Two families. One does a job nobody expects.

**Archivo** — variable, weights 100–900, **width axis 62–125%**. Free on Google Fonts.
**IBM Plex Mono** — 400/500/600, tabular figures.

### Width as a hierarchy axis

Most interfaces build hierarchy from size and weight alone. We add **width**, from one
variable font:

```
  wdth 115%   ▸  display        WHAT DO YOU NEED?
  wdth 105%   ▸  page titles    Your shelf
  wdth 100%   ▸  body, UI       the workhorse
  wdth  88%   ▸  item names     power drill — black&decker, bits in the case
```

Item text is user-written, long, and lowercase ("suitcase. pickup king st n"). Condensed
lets a real description sit on one line without truncation, which matters because the
phrasing *is* the data the matcher saw.

### Scale

| Role | Family | Size / LH | Weight | Width | Tracking |
|---|---|---|---|---|---|
| Display | Archivo | `clamp(32px, 5vw, 48px)` / 1.05 | 700 | 115% | −0.025em |
| H1 | Archivo | 26 / 1.15 | 650 | 105% | −0.015em |
| H2 | Archivo | 19 / 1.25 | 600 | 100% | −0.01em |
| **Item name** | Archivo | 16 / 1.3 | 600 | **88%** | 0 |
| Body | Archivo | 15 / 1.55 | 400 | 100% | 0 |
| Meta | Archivo | 13 / 1.4 | 500 | 100% | 0.01em |
| Eyebrow | Archivo | 11 / 1 | 700 | 100% | **0.14em**, uppercase |
| **Data** | Plex Mono | 14 / 1.2 | 500 | — | 0 |
| Data large | Plex Mono | 22 / 1 | 600 | — | −0.01em |
| Data display | Plex Mono | 34 / 1 | 600 | — | −0.02em |

**Rules.** Every comparable number is Plex Mono + `tabular-nums`: rate, cost, dates, days,
match score, earnings. Prose numbers ("six people", "four doors down") stay in Archivo.
Uppercase only for eyebrows ≤11px with 0.14em tracking. Sentence case everywhere else.
Max measure 68ch.

```tsx
import { Archivo, IBM_Plex_Mono } from 'next/font/google'

const archivo = Archivo({ variable: '--font-sans', subsets: ['latin'], axes: ['wdth'] })
const plex = IBM_Plex_Mono({ variable: '--font-mono', subsets: ['latin'], weight: ['400','500','600'] })
```

---

## 5. Space, rules, radius, elevation

Space — 4px base: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`.

Radius — this alone kills the template look:

```
--r-0: 0      timeline bars, spans, stamps
--r-1: 2px    buttons, inputs, chips
--r-2: 4px    the answer card, sheets
```

**Nothing is rounder than 4px.**

**Rules over shadows.** Exactly two shadows exist:

```
--shadow-sheet: 0 8px 24px -8px rgba(28,26,21,.28);   /* dropdowns, modals */
/* and: none */
```

A `box-shadow` on a list row is a bug.

**Grid:** content max 900px for the answer flow, 1240px for `/network`. Single column on
mobile, 16px gutters.

---

## 6. The answer card — the core component

The product. Everything else supports it.

```
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────────┐                                           │
│  │ ✓ AVAILABLE  │                          $4 /day          │
│  └──────────────┘                          $16 for 4 days   │
│                                                             │
│  Aditi S.  ·  Beechwood  ·  4 min walk                      │
│                                                             │
│  power drill — black&decker, bits are in the case.          │
│  ive used it maybe twice. northdale                         │
│                                                             │
│  Thu Oct 2  ──────────────────────────►  Sun Oct 5          │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  ▸  You hand it to Wes Z. on Sunday Oct 5             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  matches on drill, same tools class              0.768      │
│                                                             │
│             [  BOOK IT  ]     not this one →                │
└─────────────────────────────────────────────────────────────┘
```

**Anatomy:**

1. **Availability stamp** — `--seal`, 1.5px `--rule-strong` box, `--r-0`, rotated −1.5°.
   The rotation is the one imperfect thing in a system of straight rules; it reads as a
   physical mark, not a platform badge.
2. **Price block, top right** — rate in `--amber` mono, total cost below in Data large.
   Right-aligned. The total is what they actually care about.
3. **Person · place · walk time** — ink. Never a map, never an avatar.
4. **The item's own words**, Archivo 88%, `--ink-2`. Unedited, typos intact. It's what the
   matcher saw and it's more trustworthy than a cleaned-up title.
5. **The window** — mono dates, a rule between them with an arrowhead. Not a date picker.
6. **The next-hop band** — `--paper-sunk`, 1px `--rule-strong`, full width. **This is the
   line no competitor can print.** It gets its own box precisely because it's the thesis.
7. **The reason string + score** — the model's honest output, `--ink-3` mono, small. Do not
   dress it up, do not hide it.
8. **One primary button.** "not this one" is a text link, not a second button.

**States:** no match → see §10. Idle-risk variant → the next-hop band is replaced by
*"Nobody's asked for it after you — it goes back to Aditi"* in `--ink-2`, no colour.

---

## 7. The chain strip

Inline, compact, ~full width × 28px. A shrunk relative of `/network`'s timeline. Appears
under an item on `/shelf` and inside the expanded answer.

```
  Sep 1                                                        Jan 1
  ├──▓▓▓▓▓──░░░──▓▓▓▓▓▓▓▓──░░──▓▓▓▓──▓▓▓▓▓▓──░░░░░──▓▓▓──────────┤
     Ugo    7d   Wes        Otto    Ben      Luca   12d   Cleo
                 ▲ you
```

- Held spans: `--seal-fill`. Gaps: `--signal-fill`. Trough: `--paper-sunk`. All `--r-0`.
- Handoff points: 1px full-height `--ink` tick.
- **Gaps ≥5 days get a label** (`7d idle`) in `--signal`, mono 10px. Shorter gaps stay
  unlabelled — the colour is enough and labels would collide.
- **Your own hop gets a `▲ you` marker** in `--ink`. On `/shelf` this is what makes a chain
  personal rather than abstract.
- Scale is honestly proportional to real time. A 7-day gap and a 12-day gap must differ.

---

## 8. Handoff slip

A small agreement between two people. Should look screenshot-able, because it will be.

```
╔═══════════════════════════════════════════════╗
║  HAND OFF BY                                  ║
║  Sunday Oct 5                                 ║
╠═══════════════════════════════════════════════╣
║  power drill — black&decker                   ║
║  to  Wes Z.  ·  King St N                     ║
║                                               ║
║  you paid  $16   ·   4 days   ·   Oct 2–5     ║
╠═══════════════════════════════════════════════╣
║        [ CONFIRM HANDED OFF ]                 ║
╚═══════════════════════════════════════════════╝
```

- `--paper-raised`, 1px `--rule-strong`, `--r-2`.
- The date is the largest thing on it — Data display, `--ink`.
- **Overdue** → the date turns `--signal` and the eyebrow reads `HAND OFF BY · 2 DAYS LATE`.
  Never a red banner, never a modal. The number carries it.
- Confirmed → the whole slip drops to 55% opacity with a `--seal` check. It stays visible;
  it's a receipt.

---

## 9. Earnings readout & rate input

**Earnings** (`/shelf`, per item). No charts — four bars of unrelated units would be worse
than a number column.

```
  YOUR DRILL

  $149        earned this term
  6           people
  0           days in a closet
  $4 /day     your rate          [edit]
```

Figures Data display, `--amber` for money, `--ink` for counts, `--signal` if closet-days
> 0. Labels `--ink-2` meta.

**Rate input** — the one place a user touches money.

```
  YOUR RATE
  ┌─────────┐
  │ $  4    │ /day       suggested $4 for tools
  └─────────┘
  A drill like this earns about $150 a term.
```

Mono, `--paper-sunk`, bottom rule only. The suggestion comes from
`config.json → pricing.ratesByClass`. **Never auto-fill silently** — show the suggestion as
text beside an editable field, so the number is theirs.

---

## 10. Need composer & empty states

The input is plain language, not a form. That's load-bearing: the matcher reads free text,
so a category dropdown would throw away the signal it runs on.

```
  WHAT DO YOU NEED?

  ┌─────────────────────────────────────────────────────┐
  │ need a drill saturday, hanging some shelves         │
  └─────────────────────────────────────────────────────┘

  from  [ Oct 2 ]   to  [ Oct 5 ]        [ FIND IT ]

  people usually write like: "carpet cleaner before my
  inspection, 2 days" · "air mattress, friend visiting"
```

One textarea, two native `<input type="date">`, one button. The examples are real seed
phrasings — they teach the input format by showing it.

**No match** — copy, never illustration:

```
  Nobody near you has a drill free that weekend.

  Two people have one free the week after —
  Oct 9–12 and Oct 11–15.

  [ Ask for Oct 9–12 instead ]     [ Post it anyway ]
```

Always offer the nearest real alternative with its actual dates. "No results found" is
never acceptable when the engine knows exactly which windows almost worked.

---

## 11. `/network` — restyling the existing board

`app/board.tsx` works. Don't rebuild it; re-token it. In priority order:

1. **Swap the palette** to tokens — `bg-emerald-500` → `--seal-fill`, `bg-rose-500` →
   `--signal-fill`, `bg-sky-200` → `--paper-sunk` with a 1px `--rule`, neutrals → ink scale.
   Straight substitution, ~15 minutes, and it's most of the visual gain.
2. **Mono every number** — scores, day counts, dates, the ms readout.
3. **`--r-0` on all spans.** Rounded timeline bars misrepresent the data at small widths.
4. **Add money** to the summary line, since that's now the story:
   `34/90 earning · $5,056 this term · 9,716 idle days = $38,864 left on the table`.
5. Item shelf chips → 1px `--rule`, `--r-1`, active = `--ink` fill.

Keep: the layout, the item-bar-above-people-rows ordering (fixed in Pivot 2 for a reason),
the `×` remove control, the live recompute readout. **The `recomputed in 10.1ms` line is a
feature** — it's the proof the DP is live. Give it mono and `--ink-2`, don't hide it.

---

## 12. Motion, accessibility, copy

**Motion.** `--dur-state: 90ms` · `--dur-enter: 160ms` · `--dur-sheet: 240ms` · ease
`cubic-bezier(.2,.7,.3,1)`.

- The answer card enters once, 160ms, opacity + 4px rise. Nothing else animates on arrival.
- Booking = a stamp press: `scale(1.04) → 1` over 120ms. The one piece of delight, on the
  one action that matters.
- **Banned:** scroll reveals, parallax, ambient loops, shimmer, page transitions.
- `prefers-reduced-motion: reduce` → all durations 1ms.

**Accessibility.**
- Body text ≥4.5:1; `--ink-3` only ≥18.66px bold or non-text. §3 ratios are measured.
- **Idle/held is never colour alone** — the chain strip labels gaps in words, the slip
  states the date, the readout names "days in a closet."
- Focus: 2px `--ink` ring, 2px offset, everywhere. Never `outline: none`.
- Targets ≥44×44.
- The chain strip needs a text equivalent: *"Held by six people. Idle 7 days in October and
  12 days in December."*
- Label every field; never placeholder-as-label. The composer's placeholder is an example,
  and it has a visible label above it.

**Copy.** Plain, specific, slightly dry. This is where "not slop" actually shows.

| Don't | Do |
|---|---|
| 🎉 Match found! | Aditi has one. Thu–Sun, $16. |
| Oops! Something went wrong | Couldn't save that. Try again? |
| Browse available items near you | Nobody near you has a drill free that weekend. |
| Item returned successfully ✅ | Handed off to Wes, Oct 5. |
| Maximize your earnings! | Your drill earned $149 this term. |
| 92% match | matches on drill, same tools class · 0.768 |
| Payment processing | You pay Aditi $16 directly. Relay never touches the money. |

Never exclamatory. No emoji in chrome. **Always name the date** — "soon" is not a time,
"Sunday Oct 5" is. Errors say what failed and what to do.

---

## 13. Screens

```
┌──────────────────────────────────────────────────────────────┐
│  RELAY            need  ·  handoffs (2)  ·  shelf  ·  network │
│                                              you: Priya S. ▾  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   WHAT DO YOU NEED?                                          │
│   ┌────────────────────────────────────────────────────┐     │
│   │ need a drill saturday, hanging some shelves        │     │
│   └────────────────────────────────────────────────────┘     │
│   from [Oct 2]  to [Oct 5]              [ FIND IT ]           │
│                                                              │
│   ┌──────────────── the answer card, §6 ───────────────┐     │
│   └────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

Display headline is the only oversized type. No hero image, no gradient, no illustration.
The nav badge on `handoffs` is a plain mono count in `--ink`: slips due in the next two days.

| Route | Job |
|---|---|
| `/hello` | Who's using Relay: start as a new student, or continue as someone already on the network. Stacked lockup |
| `/start` | First run, three answers: neighbourhood, pickup windows, away dates. Nothing else is asked |
| `/` | Need composer (§10) → answer cards (§6). Aside: next handoff, recent asks, how the answer is chosen. Near misses each say why, with the nearest dates that would work |
| `/handoffs` | Two stacks, `TO GIVE` then `TO COLLECT`, slips (§8) in date order. `/handoffs/[id]` is the receipt, signed with the primary stamp |
| `/shelf` | Your items, each with rate, chain strip (§7) and earnings (§9), with the lend form beside them |
| `/you` | Where and when you can meet, editable, and everything Relay remembers, each list clearable |
| `/network` | The board, re-tokened (§11) |

Old marketplace URLs (`/wants`, `/post`, `/listings/*`, `/notifications`, `/chains`, `/account`,
`/login/demo`, `/onboarding`) redirect to the screen that does that job now (`next.config.ts`).

### Memory

Relay remembers a person so the next visit is shorter, and shows them all of it.

| Remembered | Used for | Shown and cleared on |
|---|---|---|
| Neighbourhood, pickup windows, away dates | Routing: laid over the person before the DP runs, so availability and walking distance are real | `/you`, editable |
| Last 8 asks, with their dates | Recent asks on `/`, and the default borrow length for the next one | `/`, `/you` |
| "Not this one" | That item is left out of future answers | `/you`, restorable one by one |
| Handoffs marked done | Kept out of the handoff list | `/you` |
| Visits | "Welcome back" instead of "Welcome" | `/you` |

Stored server-side in `data/runtime.json`, beside the engine's rows (`lib/relay/memory.ts`).
**Rule:** nothing is remembered that the person can't see on `/you`, and nothing there is used
for anything else.

**Mobile (375px):** everything is already single-column. The answer card goes full-bleed
with 16px gutters; the price block moves below the person line rather than floating right;
the chain strip scrolls horizontally inside its own `overflow-x:auto` container — the page
body never scrolls sideways.

---

## 14. Tokens — `app/globals.css`

Extends the existing file; keeps its committed-light-theme decision.

```css
@import "tailwindcss";

html { color-scheme: light; }

:root {
  --paper: #F2EFE6;
  --paper-raised: #FBF9F4;
  --paper-sunk: #E7E2D6;

  --ink: #1C1A15;
  --ink-2: #57534A;
  --ink-3: #8A8478;
  --rule: rgba(28, 26, 21, .14);
  --rule-strong: rgba(28, 26, 21, .30);

  /* in use · idle · money — nothing else gets colour */
  --seal: #2F5D3A;
  --seal-fill: #3E7A4C;
  --signal: #B83417;
  --signal-fill: #C6371B;
  --amber: #8A5A00;
  --amber-fill: #E0A43A;

  --r-0: 0px;
  --r-1: 2px;
  --r-2: 4px;
  --shadow-sheet: 0 8px 24px -8px rgba(28, 26, 21, .28);

  --dur-state: 90ms;
  --dur-enter: 160ms;
  --dur-sheet: 240ms;
  --ease: cubic-bezier(.2, .7, .3, 1);
}

@theme inline {
  --color-paper: var(--paper);
  --color-paper-raised: var(--paper-raised);
  --color-paper-sunk: var(--paper-sunk);
  --color-ink: var(--ink);
  --color-ink-2: var(--ink-2);
  --color-ink-3: var(--ink-3);
  --color-seal: var(--seal);
  --color-seal-fill: var(--seal-fill);
  --color-signal: var(--signal);
  --color-signal-fill: var(--signal-fill);
  --color-amber: var(--amber);
  --color-amber-fill: var(--amber-fill);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);

  --radius-0: var(--r-0);
  --radius-1: var(--r-1);
  --radius-2: var(--r-2);
}

body {
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-sans), system-ui, sans-serif;
  font-variation-settings: "wdth" 100;
}

/* every comparable number */
.data { font-family: var(--font-mono), ui-monospace, monospace; font-variant-numeric: tabular-nums; }

/* width as a hierarchy axis — §4 */
.t-display { font-variation-settings: "wdth" 115; font-weight: 700; letter-spacing: -.025em; }
.t-title   { font-variation-settings: "wdth" 105; font-weight: 650; letter-spacing: -.015em; }
.t-item    { font-variation-settings: "wdth"  88; font-weight: 600; }
.t-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    transition-duration: 1ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

---

## 15. Build order

Not everything ships. **Stop when the clock runs out.**

| # | Build | Why here |
|---|---|---|
| 1 | **Tokens + fonts** (§14) | 45 min, and it's the whole difference between "designed" and "template" |
| 2 | **Answer card** (§6) | The product |
| 3 | **Need composer** (§10) | The only way to reach the answer card |
| 4 | **Re-token `/network`** (§11) | ~15 min of substitution for most of the visual gain |
| 5 | **Handoff slip** (§8) | Makes the chain an obligation |
| — | | **← cut line. The demo lands here** |
| 6 | Chain strip (§7) | Beautiful, and `/network` already tells the story |
| 7 | Earnings readout (§9) | Sells the supply side — build if `/shelf` exists |
| 8 | No-match state (§10) | Only if the demo path can hit it |

---

## 16. Review checklist

- [ ] Any colour on screen that isn't **in use**, **idle**, or **money**?
- [ ] Any `border-radius` above 4px? Any `box-shadow` outside a dropdown?
- [ ] Is every comparable number mono and tabular?
- [ ] Does every item with a future say **what happens to it next**?
- [ ] Does every date appear as an actual date, not "soon"?
- [ ] Exactly one primary button per screen?
- [ ] Does it work at 375px without the page scrolling sideways?
- [ ] Focus rings everywhere? Reduced motion honoured?
- [ ] Any exclamation mark or emoji in the chrome?
- [ ] Would you believe a person who has actually borrowed something built this?

---

*Companion: [PROJECT.md](PROJECT.md).*
