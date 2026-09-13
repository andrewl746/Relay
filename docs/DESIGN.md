# Relay — Design Document

**Companion:** [PROJECT.md](PROJECT.md) — product, scope, build plan, pitch.
**Scope of this doc:** the visual system. Tokens, type, components, screens, motion, a11y,
copy. Everything here is meant to be built, not admired.

---

## 1. The idea

> **A marketplace that looks like a departure board and reads like a well-typeset lease.**

Relay is not a shopping app. Nothing here is being merchandised — every listing is
*leaving*, on a date, at a price that is falling. The interface should feel like a
**timetable and a set of documents**, because that is literally what the product is: windows
of time, and the paperwork of handing something over.

### What we are explicitly rejecting

Every one of these is banned. If a screenshot contains one, it's wrong.

| Banned | Why |
|---|---|
| Purple / indigo / blue-cyan gradients | The universal tell of an unconsidered project |
| Gradient mesh blobs, glassmorphism, frosted panels | Decoration standing in for hierarchy |
| `border-radius: 12px` on everything | Nothing in this product is soft. A lease isn't rounded |
| Drop shadows as the hierarchy mechanism | We have rules, weight and paper tone. Use those |
| Inter, or any default UI grotesque | It is the visual equivalent of not deciding |
| Emoji as interface icons | Fine in user content. Never in chrome |
| Centered hero + two buttons + floating blob | Every landing page since 2021 |
| Skeleton shimmer loaders | Sparkle for a wait we can just design honestly |
| Star ratings, badge clusters, "✨ AI-powered" copy | Trust theatre |
| Card grids with equal-weight cards | Our whole thesis is that listings are **not** equal — some are about to be thrown out |

### What we're doing instead

**Paper and ink.** A warm newsprint ground, near-black ink, hairline rules. The chrome is
achromatic — **colour is a semantic channel, never decoration.**

**Colour means exactly three things:**

| Colour | Meaning | Used for |
|---|---|---|
| **Signal** (red-orange) | time running out | countdowns ≤24h, final call, expiry |
| **Amber** | money moving | price-decay rungs, scheduled drops |
| **Seal** (green) | executed, confirmed | completed handoffs, both-party confirmations |

Everything else — every button, every filter, every nav item — is ink on paper. A screen
with no urgency on it has **no colour on it at all**, and that's what makes the red mean
something when it appears.

**Data is monospaced.** Every number a user compares — price, countdown, dimensions, dates,
coverage % — is IBM Plex Mono with tabular figures, so columns align and digits don't jitter
as they tick. Prose numbers stay in the text face.

**Rows, not cards.** The feed is a ledger. Rows compare on a single axis; cards imply equal
weight and hide the ranking. See §7.

---

## 2. Principles

1. **Time is the loudest thing on screen.** Before price, before photo, before title. If a
   user learns one fact from a row, it's *when this disappears*.
2. **Colour is information.** Three meanings, no decoration. A calm screen is a correct screen.
3. **Density is respect.** These users are scanning 40 listings in 3 minutes on a phone
   between classes. Whitespace that costs a row costs a match.
4. **Documents, not dashboards.** Condition reports, manifests, and provenance chains should
   look like things you'd print and hand to a landlord — because you will.
5. **The interface should look cheap to trust.** Slick reads as commercial and commercial
   reads as scam in a peer market. Plain, typeset, honest.
6. **Nothing moves unless something changed.** No scroll-triggered reveals, no ambient
   motion. Movement is a signal, and we have few enough signals to keep it that way.

---

## 3. Colour

### Light — "paper"

| Token | Hex | Role | Contrast on `--paper` |
|---|---|---|---|
| `--paper` | `#F2EFE6` | page ground, warm newsprint | — |
| `--paper-raised` | `#FBF9F4` | sheets, modals, the one elevated surface | — |
| `--paper-sunk` | `#E7E2D6` | photo wells, inputs, inset areas | — |
| `--ink` | `#1C1A15` | primary text | **15.2:1** |
| `--ink-2` | `#57534A` | secondary text, meta | **6.7:1** |
| `--ink-3` | `#8A8478` | tertiary — **≥18.66px bold or non-text only** | 3.2:1 |
| `--rule` | `rgba(28,26,21,.14)` | hairlines between rows | — |
| `--rule-strong` | `rgba(28,26,21,.30)` | section dividers, stamped boxes | — |
| `--signal` | `#B83417` | **time** — text on paper | **5.2:1** |
| `--signal-fill` | `#C6371B` | final-call fills, paper text on top | 5.2:1 inverted |
| `--amber` | `#8A5A00` | **money** — text | **5.2:1** |
| `--amber-fill` | `#E0A43A` | decay rung markers, fills only | — |
| `--seal` | `#2F5D3A` | **confirmed** | **6.6:1** |

### Dark — "night board"

Not an inversion. A departure board after midnight: still warm, still paper-grained, ink and
ground swapped, signals brightened to survive the dark ground.

| Token | Hex | Contrast on `--paper` |
|---|---|---|
| `--paper` | `#151410` | — |
| `--paper-raised` | `#201E18` | — |
| `--paper-sunk` | `#0F0E0A` | — |
| `--ink` | `#EDE9DE` | **15.4:1** |
| `--ink-2` | `#A8A296` | **7.4:1** |
| `--ink-3` | `#6F6A5F` | 3.5:1 — large/non-text only |
| `--rule` | `rgba(237,233,222,.16)` | — |
| `--rule-strong` | `rgba(237,233,222,.32)` | — |
| `--signal` | `#FF6B4A` | **6.6:1** |
| `--amber` | `#E8A33D` | **8.7:1** |
| `--seal` | `#6FB37E` | **7.9:1** |

> **Rule:** never define a colour only inside a media query. Every token gets its light value
> on bare `:root`, then is *redefined* for dark. See §15.

### Where colour is forbidden

Navigation · buttons · filter chips (unresolved) · links · form fields · avatars · category
tags · empty states. All ink.

---

## 4. Typography

Two families. One of them does a job nobody expects.

### The families

**Archivo** — variable, weights 100–900, **width axis 62–125%**. Free on Google Fonts.
**IBM Plex Mono** — 400/500/600, tabular figures by default.

### The distinctive move: width as a hierarchy axis

Most interfaces build hierarchy from size and weight alone. We add **width**, from a single
variable font:

```
  wdth 115%   ▸  display        EVERYTHING HERE IS LEAVING
  wdth 105%   ▸  page titles    Sublets · Fall 2025
  wdth 100%   ▸  body, UI       the workhorse
  wdth  88%   ▸  listing titles IKEA MICKE desk, 142cm, white
```

Condensed listing titles are doing real work — they're how a classified ad fits a whole
object into one line — and the extra characters per row are worth actual matches. It's one
font file and it reads as deliberate, which is the entire point.

### Scale

| Role | Family | Size / LH | Weight | Width | Tracking |
|---|---|---|---|---|---|
| Display | Archivo | `clamp(34px, 5.5vw, 54px)` / 1.02 | 700 | 115% | −0.025em |
| H1 | Archivo | 28 / 1.15 | 650 | 105% | −0.015em |
| H2 | Archivo | 20 / 1.25 | 600 | 100% | −0.01em |
| **Listing title** | Archivo | 17 / 1.25 | 600 | **88%** | 0 |
| Body | Archivo | 15 / 1.55 | 400 | 100% | 0 |
| Meta | Archivo | 13 / 1.4 | 500 | 100% | 0.01em |
| Eyebrow / label | Archivo | 11 / 1 | 700 | 100% | **0.14em**, uppercase |
| **Data** | Plex Mono | 14 / 1.2 | 500 | — | 0 |
| **Data large** | Plex Mono | 22 / 1 | 600 | — | −0.01em |
| Data display | Plex Mono | 32 / 1 | 600 | — | −0.02em |

### Rules

- **Every comparable number is Plex Mono with `font-variant-numeric: tabular-nums`.** Price,
  countdown, dimensions, coverage %, dates, report numbers. Non-negotiable: a countdown in
  proportional figures visibly jitters every second and it looks broken.
- Prose numbers ("four terms", "3 roommates") stay in Archivo.
- **Uppercase only** for eyebrows and labels ≤11px, always with 0.14em tracking. Never for
  headlines, never for buttons.
- Sentence case everywhere else. No Title Case Buttons.
- Max measure 68ch for body copy.

```tsx
// app/layout.tsx — Next 16 / next-font
import { Archivo, IBM_Plex_Mono } from "next/font/google";

const archivo = Archivo({
  variable: "--font-sans",
  subsets: ["latin"],
  axes: ["wdth"],              // unlocks 62–125%; weight is included by default
});

const plex = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
```

---

## 5. Space, rules, radius, elevation

**Space** — 4px base: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`. Nothing between.

**Radius** — and this alone kills the template look:

```
--r-0: 0      thumbnails, fills, stamps, the term bar
--r-1: 2px    buttons, inputs, chips
--r-2: 4px    sheets and modals only
```

**Nothing is rounder than 4px. Ever.**

**Rules over shadows.** Hierarchy comes from hairlines, type weight, and paper tone. Exactly
two shadows exist in the entire system:

```
--shadow-sheet: 0 8px 24px -8px rgba(28,26,21,.28);   /* dropdowns, modals */
/* and: none */
```

A `box-shadow` on a listing row is a bug.

**Borders:** `1px solid var(--rule)` between rows · `1px solid var(--rule-strong)` for
stamped boxes and manifests · `2px solid var(--ink)` for the one primary button on a screen.

**Grid:** content max 1120px. Feed at ≥1024px is `1fr 320px` — ledger + sidebar (filters,
your wants). Below that, single column, 16px gutters, full-bleed rows.

---

## 6. The countdown — the most-repeated element in the app

Four tiers. Colour is the *second* signal; the words carry it alone.

| Tier | When | Rendering | Colour |
|---|---|---|---|
| **Open** | > 7 days | `14 Dec` · Plex Mono 14/500 | `--ink-3` |
| **Soon** | 24h – 7d | `3d 04h` · Plex Mono 14/600 | `--ink` |
| **Today** | < 24h | `TODAY · 18:00` · Plex Mono 14/600 | `--signal` |
| **Final** | < 3h | `FINAL 2h 11m` · inverted block, 2px padding, `--r-0` | paper on `--signal-fill` |
| **Gone** | past | `GONE` · strikethrough | `--ink-3` |

**Never colour-only.** Tier is legible in greyscale from the words and the weight — which is
also what makes it work for the ~8% of male users with a colour vision deficiency, on the
one element they read most.

**Implementation trap** (also in PROJECT.md §9): the server emits an **ISO timestamp**; the
client computes the remainder. A rendered `2d 14h` must never enter a cached response.

```
Open      14 Dec
Soon      3d 04h
Today     TODAY · 18:00
Final     ███ FINAL 2h 11m ███
Gone      G̶O̶N̶E̶
```

---

## 7. The ledger row — the core unit

Not a card. A row. Rows compare on one axis, and comparison is the job.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ┌────────┐  IKEA MICKE desk, 142cm, white              $45  →  $28          │
│ │        │  DESK · good · 142×50×75cm                  ◆──◆──●──○  amber    │
│ │ photo  │  ▸ E2 Village · 700m                                              │
│ │ 76×76  │  ├──────────■■■■■■■──────────┤              TODAY · 18:00        │
│ └────────┘  Aug 25            Jan 05                   ↑ signal, mono       │
└──────────────────────────────────────────────────────────────────────────────┘
   ↑ 0 radius,     ↑ Archivo 88% width, 17/600         ↑ right rail, all mono
     paper-sunk      meta in 13/500 ink-2                and right-aligned
     well
```

**Anatomy, left to right:**

1. **Thumbnail** — 76×76 desktop / 64×64 mobile. `--r-0`. Sits in a `--paper-sunk` well with
   a 1px inner rule. Square crop, no filter, no overlay.
2. **Title** — Archivo `wdth 88%`, 17/600, one line, ellipsis. Condensed so a real object
   description fits.
3. **Meta line** — category · condition · dimensions. 13/500, `--ink-2`, `·` separated.
4. **Location** — neighbourhood + fuzzed distance. Never an address.
5. **Term bar** (§8) — inline, 160px, the overlap shaded. This is the row's signature.
6. **Right rail** — price (with the decay ladder beneath it) over the countdown. Mono,
   tabular, right-aligned so every row's digits form a column.

**Row states:**

| State | Treatment |
|---|---|
| Default | `--paper` |
| Hover | `--paper-raised`, 90ms |
| **Matches your wants** | 2px `--ink` left edge + `MATCH` eyebrow. Not a coloured background |
| **Final call** | 2px `--signal-fill` left edge, countdown inverted |
| Claimed | 55% opacity, `CLAIMED` eyebrow, still visible — never hidden |
| Gone | 40% opacity, title struck through |

**Hard rule: no `box-shadow`, no radius, no background tint on a row.** Separation is a
`1px solid var(--rule)` bottom border and nothing else.

---

## 8. Term bar & exchange zone — the signature component

The single most distinctive thing in the interface, and the visual form of PROJECT.md §7.3.
Nothing else in any student marketplace looks like this.

**Inline (in a row)** — 160×20px, one bar:

```
├──────────■■■■■■■■■■■■■■──────┤
Aug 25                      Jan 05
```

**Expanded (listing detail)** — two bars plus the zone between them:

```
  THEIR PLACE IS FREE
  ├────────────────────────────────────────┤
  Aug 25                                Jan 05

  YOUR TERM
        ├──────────────────────────────┤
      Sep 03                        Dec 20

  EXCHANGE ZONE
        ███████████████████████████████
        Sep 03 ────────────────── Dec 20

        ┌───────────────────────────────────┐
        │  100% COVER · 108 days            │
        │  Their place is free 25 days      │
        │  longer than you need it.         │
        └───────────────────────────────────┘
```

**Construction:**
- Bars are 8px tall, `--r-0`, `--paper-sunk` ground with a 1px `--rule-strong` outline.
- Available span: solid `--ink-2`.
- **Exchange zone: solid `--ink`**, the darkest thing in the component. It's the answer.
- Gaps (`gap_head` / `gap_tail`) render in `--signal` with a **label in words** —
  *"starts 6 days after you arrive"* — because a red sliver alone is not an explanation.
- Endpoints in Plex Mono 11, `--ink-3`.
- Today's position: a 1px full-height `--ink` tick, no label.

**Coverage readout** — the number is the point:

| Coverage | Label | Treatment |
|---|---|---|
| ≥98% | `100% COVER` | `--ink`, boxed in `--rule-strong` |
| 85–98% | `92% · starts 6d late` | `--ink`, gap called out in `--signal` |
| 50–85% | `64% PARTIAL` | `--ink-2` |
| <50% | `31%` | `--ink-3` |

**Scale honestly.** Bar width is proportional to real elapsed time across the union of both
windows. A 4-month window and a 12-month lease must not render the same length — the whole
component is a lie if they do.

---

## 9. The other signature components

### 9.1 Decay ladder

Price movement, inline, ~120×16px. Not a chart widget — a rule with ticks.

```
$60      $40      $25     free
◆────────◆────────●───────○
                  ↑ now
```

- Passed rungs: `--ink-3`, hollow.
- Current rung: solid `--amber-fill` dot, price in `--amber`.
- Future rungs: `--ink-3` outline, price in `--ink-3`.
- Under it, when a drop is imminent: `↓ $25 in 4h` in `--amber`, Plex Mono 13.

The **next drop is the hook** (PROJECT.md §7.5). Give it room.

### 9.2 Bundle manifest

The one place that deliberately breaks the ledger, because contrast *is* emphasis.

```
╔══════════════════════════════════════════════════════════╗
║  WHOLE ROOM · 217 Erb St W, Room 2                       ║
║  Sep 01 — Dec 19 · furnished · sublet                    ║
╠══════════════════════════════════════════════════════════╣
║  ☑  Room, private, 11×10                    rent   $680/mo ║
║  ☑  IKEA MICKE desk, 142cm                  sale     $45 ║
║  ☑  Desk chair, black                       sale     $20 ║
║  ☑  Double mattress + frame                 sale    $120 ║
║  ☑  Mini fridge                             rent   $15/mo ║
║  ☑  Floor lamp                              sale     $10 ║
╠══════════════════════════════════════════════════════════╣
║  BUNDLE          $1,240        parts total  $1,510       ║
║  You save $270 and you don't rent a van.                 ║
╠══════════════════════════════════════════════════════════╣
║            [  CLAIM THE WHOLE ROOM  ]                    ║
╚══════════════════════════════════════════════════════════╝
```

- `--paper-raised`, 1px `--rule-strong` border, `--r-2`.
- Item rows are mono, right-aligned prices, tabular — it must read as an **inventory
  manifest**, because that's what it is.
- The `rent` / `sale` column is plain text, not a badge. Badges are noise.
- Struck-through parts total in `--ink-3`; bundle price in `--ink`, Data display 32px.

### 9.3 Condition report — the carbon copy

Two columns, timestamped, both signatures. Should look like something you'd print.

```
┌─────────────────────────────────┬─────────────────────────────────┐
│ MOVE-IN                         │ MOVE-OUT                        │
│ Sep 03 2025 · 14:22             │ Dec 19 2025 · 10:05             │
│ ┌────┐┌────┐┌────┐┌────┐        │ ┌────┐┌────┐┌────┐┌────┐        │
│ │kitc││bath││bed ││main│        │ │kitc││bath││bed ││main│        │
│ └────┘└────┘└────┘└────┘        │ └────┘└────┘└────┘└────┘        │
│ scuff on L wall, tap drips      │ scuff unchanged, tap fixed      │
│                                 │                                 │
│ ✓ Maya K.      ✓ Dev R.         │ ✓ Maya K.      ✓ Dev R.         │
└─────────────────────────────────┴─────────────────────────────────┘
  REPORT #RLY-8842-F25 · both parties hold an identical copy
```

- Checkmarks in `--seal` — the only green in the app, and it means *executed*.
- `unconfirmed` state: the missing signature line renders as a `--signal` rule with the
  words **"not confirmed by the other party."** Loud on purpose.
- Report number in Plex Mono, letterspaced. It's an artifact; give it a serial.
- Print stylesheet is not optional here — this is the page someone hands a landlord.

### 9.4 Provenance chain

```
  DESK · IKEA MICKE, white
  ┌──┐   ┌──┐   ┌──┐   ┌──┐
  │F23│──│W24│──│S25│──│F25│
  └──┘   └──┘   └──┘   └──┘
  Maya K. Dev R. Priya S.  you?
          ·      (rented)

  4 terms · 3 hands · ~28 kg kept out of landfill
```

Term boxes in Plex Mono 11, 1px `--rule-strong`, `--r-0`, connected by a 1px rule. The final
box is dashed with `you?` in `--ink-3`. Diversion figure in `--ink-2` with an *estimate*
footnote — don't overclaim a number you made up from a category table.

### 9.5 Wants checklist

A notepad, not a form.

```
  YOUR LIST · Fall 2025 · Waterloo

  ☑  P̶l̶a̶c̶e̶,̶ ̶S̶e̶p̶ ̶3̶ ̶–̶ ̶D̶e̶c̶ ̶2̶0̶,̶ ̶u̶n̶d̶e̶r̶ ̶$̶8̶0̶0̶     matched Sep 1
  ☐  Desk                     under $60    ● 3 matches
  ☐  Desk chair               under $40    ○ none yet
  ☐  Mini fridge, to rent     under $20/mo ● 1 match
  ☐  Floor lamp               under $15    ○ none yet
  ┊
  +  add something
```

Filled items strike through and drop to the bottom in `--ink-3`. Match count is a filled dot
in `--ink` (unread) or hollow `--ink-3` (seen). The `┊` continuation and the dotted `+ add`
row keep it feeling like a list you keep, not a form you submit.

### 9.6 Verified stamp

Rubber stamp, not a blue check. 1.5px `--rule-strong` box, `--r-0`, rotated **−1.5°**,
Archivo 10/700 uppercase 0.14em.

```
┌───────────────┐
│ ✓ UWATERLOO   │   verified 3 mo ago
└───────────────┘
```

Listing verification (lease proof, PROJECT.md §7.9) uses the same stamp reading
`LEASE ON FILE`. The rotation is the whole joke — it's the one imperfect thing in a system
of straight rules, and it reads as a physical mark rather than a platform badge.

### 9.7 Buttons & fields

- **Primary:** `--ink` fill, `--paper` text, `--r-1`, 44px tall, Archivo 15/600. **One per
  screen.**
- **Secondary:** 1px `--rule-strong`, transparent, `--ink` text.
- **Tertiary:** text + 1px underline offset 3px.
- **Destructive:** secondary shape, `--signal` text. Never a red fill — red is time.
- **Fields:** `--paper-sunk`, no border, 1px `--rule` bottom only, `--r-1` top corners. Focus
  = 2px `--ink` bottom rule + 2px offset focus ring. Labels above, 11px eyebrow.
- **Chips:** 1px `--rule`, `--r-1`, 28px. Active = `--ink` fill, paper text. No colour.

---

## 10. Photography & empty states

- Square crop, `--r-0`, on a `--paper-sunk` well with a 1px inner rule. **No filters, no
  overlays, no gradient scrims.** These are phone photos of a desk in a bedroom and dressing
  them up reads as dishonest.
- Aspect: 1:1 in rows, 4:3 in detail, 16:9 for the one room hero.
- **No photo** → the category word set in Archivo `wdth 115%`, 700, `--ink-3` on
  `--paper-sunk`, optically centred. A word, not a grey camera icon.
- Interior photos get the §11.4 consent checkbox at upload.

**Empty states are copy, not illustration.** No spot illustrations, no mascot.

```
  Nothing in Desks right now.

  Want one? Add it to your list and we'll tell you
  the moment someone posts — most desks show up
  in the last two weeks of term.

  [ Add desk to my list ]
```

---

## 11. Motion

Little, and only when something changed.

| Token | Value | Use |
|---|---|---|
| `--dur-state` | 90ms | hover, focus, chip toggle |
| `--dur-enter` | 160ms | rows entering, tooltips |
| `--dur-sheet` | 240ms | modals, drawers |
| `--ease` | `cubic-bezier(.2,.7,.3,1)` | everything except countdowns |

- **Countdown:** digits update on a `linear` tick. **Split-flap animation only on a tier
  change** (Soon → Today → Final): a single 240ms vertical flip. Once, not continuously —
  a board that flaps constantly is a toy.
- **Claim:** a stamp press. `scale(1.06) → 1` over 120ms, settling with a 1.5° rotation on
  the seal. The one piece of delight in the app, on the one action that matters.
- **Price drop:** the current rung dot slides one position, 160ms. No confetti.
- **Banned:** scroll-triggered reveals, parallax, ambient looping, skeleton shimmer, page
  transitions.

```css
@media (prefers-reduced-motion: reduce) {
  /* all durations → 1ms; split-flap becomes an instant swap */
  /* countdowns tick per minute instead of per second */
}
```

That last line matters: a per-second countdown is itself motion, and for a
vestibular-sensitive user a page full of them is hostile.

---

## 12. Voice & copy

Plain, specific, a little dry. Copy is where "not slop" actually shows — more than any
colour choice.

| Don't | Do |
|---|---|
| 🎉 Your listing is live! | **Listed.** Gone by Sat 12pm unless someone claims it. |
| Oops! Something went wrong | Couldn't save that photo. Try again? |
| Amazing deals near you ✨ | 41 things leaving campus this week |
| Sold! | Claimed by Dev R. Meet at MC lobby, Sat 11am. |
| No results found | Nothing in Desks right now. Add it to your list and we'll ping you. |
| Price reduced! | $60 → $40 at 6pm today. Then free at midnight. |
| Verified user ✅ | Verified uwaterloo.ca · 3 months ago |
| Complete your profile to unlock features | You need a school email to claim things. Takes 30 seconds. |
| 92% match | 92% cover — starts 6 days after you arrive |

**Rules**
- Never exclamatory. No emoji in chrome.
- **Always name the date.** "Soon" is not a time; "Saturday noon" is.
- State consequences plainly: *"the decay clock keeps running while you hold this."*
- Errors say what failed and what to do. Never "an error occurred."
- Safety copy is specific and unhedged: *"Relay never handles money. Never send a deposit
  before you've seen the place."*
- Numbers in copy: use the word for small counts in prose ("four terms"), digits in any
  comparable data.

---

## 13. Screens

### 13.1 Feed — the departure board

```
┌────────────────────────────────────────────────────────────────────┐
│ RELAY          Waterloo ▾        Sublets  Furniture  My list   ⊙   │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  EVERYTHING HERE IS LEAVING                                        │
│  41 listings · 6 gone by tonight                                   │
│                                                                    │
│  [All] [Sublets] [Desks] [Matches my term] [Under $50] [Free]      │
├────────────────────────────────────────────────────────────────────┤
│  FINAL CALL — 3 items                                              │
│  ██ [img]  Double mattress + frame       $0 free   FINAL 2h 11m   │
│  ██ [img]  Desk chair, black             $10→$0    FINAL 2h 40m   │
├────────────────────────────────────────────────────────────────────┤
│  ▌ MATCH  [img]  Room, 217 Erb St W      $680/mo   TODAY · 18:00  │
│                  sublet · furnished · 700m                         │
│                  ├────■■■■■■■■■■■■────┤  100% cover                │
│    [img]  IKEA MICKE desk, 142cm         $45→$28   3d 04h         │
│    [img]  Mini fridge, to rent           $15/mo    5d 12h         │
│    [img]  Room in shared, 4-person       $540/mo   14 Dec         │
└────────────────────────────────────────────────────────────────────┘
```

Display headline is the only oversized type on the page. The count line does the work a
subtitle usually fakes. No hero image, no gradient, no illustration.

### 13.2 Listing detail — `place`

```
┌────────────────────────────────────────────────────────────────────┐
│ ← back                                                             │
│ ┌──────────────────────────┐  Room, 217 Erb St W                  │
│ │                          │  SUBLET · FURNISHED · 1 of 4          │
│ │      photo 16:9          │                                       │
│ │                          │  $680 /mo        TODAY · 18:00        │
│ └──────────────────────────┘  ◆────◆────●───○  ↓ $610 in 4h       │
│ [▫][▫][▫][▫]                                                      │
│                               THEIR PLACE IS FREE                  │
│                               ├──────────────────────────┤         │
│                               YOUR TERM                            │
│                                   ├──────────────────┤             │
│                               ┌──────────────────────────┐         │
│                               │ 100% COVER · 108 days    │         │
│                               └──────────────────────────┘         │
│                                                                    │
│                               ┌───────────────┐  ┌──────────────┐ │
│                               │ ✓ UWATERLOO   │  │ LEASE ON FILE│ │
│                               └───────────────┘  └──────────────┘ │
│                               Maya K. · 4 handoffs · verified 3mo  │
│                                                                    │
│                               [   CLAIM THIS ROOM   ]              │
│                               [ Ask a question ]                   │
├────────────────────────────────────────────────────────────────────┤
│  Landlord consent: OBTAINED                                        │
│  Deposit expected: $680, paid directly to Maya. Relay never        │
│  handles money — never send one before you've seen the place.      │
├────────────────────────────────────────────────────────────────────┤
│  Comes with 5 things →  [manifest]                                 │
└────────────────────────────────────────────────────────────────────┘
```

The safety band is ink on `--paper-sunk`, always present on `place`, never dismissible, never
a red alert box. Permanent and calm reads as policy; red reads as an edge case.

### 13.3 Mobile feed (375px)

```
┌──────────────────────────┐
│ RELAY   Waterloo ▾    ⊙  │
├──────────────────────────┤
│ EVERYTHING HERE          │
│ IS LEAVING               │
│ 41 · 6 gone tonight      │
│ [All][Sublets][Match]→   │
├──────────────────────────┤
│ ██ ┌──┐ Double mattress  │
│    │▫▫│ $0 free          │
│    └──┘ FINAL 2h 11m     │
├──────────────────────────┤
│ ▌  ┌──┐ Room, 217 Erb    │
│    │▫▫│ sublet·furn·700m │
│    └──┘ ├──■■■■■──┤ 100% │
│         $680/mo          │
│         TODAY · 18:00    │
└──────────────────────────┘
```

Thumb 64px, term bar full row width beneath the meta, price and countdown stacked right. The
row stays a row — it never becomes a card.

---

## 14. Responsive & accessibility

**Breakpoints:** `<640` single column · `640–1023` single column, wider gutters ·
`≥1024` ledger + 320px sidebar · `≥1280` cap content at 1120px.

**Accessibility — the non-negotiables:**

- Body text ≥ 4.5:1; `--ink-3` only at ≥18.66px bold or for non-text. Ratios in §3 are
  measured, not estimated.
- **Urgency is never colour alone** — the words carry it (§6).
- Focus: 2px `--ink` ring, 2px offset, on every interactive element. Never `outline: none`.
- Targets ≥44×44px, including the filter chips.
- `prefers-reduced-motion` handled properly, including countdown cadence (§11).
- Countdowns use `aria-live="off"` with an accessible label that states the **absolute
  time** — a screen reader announcing a ticking number every second is unusable.
- Photo wells get real alt text from the listing title, not "image".
- The term bar needs a text equivalent: *"Available Aug 25 to Jan 5. Covers 100% of your
  term."*
- Forms: label every field, never placeholder-as-label.

---

## 15. Tokens — paste into `app/globals.css`

Replaces the existing file. Follows the `@theme inline` pattern already in the repo
(Tailwind v4).

```css
@import "tailwindcss";

:root {
  /* ground */
  --paper: #F2EFE6;
  --paper-raised: #FBF9F4;
  --paper-sunk: #E7E2D6;

  /* ink */
  --ink: #1C1A15;
  --ink-2: #57534A;
  --ink-3: #8A8478;
  --rule: rgba(28, 26, 21, .14);
  --rule-strong: rgba(28, 26, 21, .30);

  /* semantic — time, money, executed. nothing else gets colour */
  --signal: #B83417;
  --signal-fill: #C6371B;
  --amber: #8A5A00;
  --amber-fill: #E0A43A;
  --seal: #2F5D3A;

  /* geometry */
  --r-0: 0px;
  --r-1: 2px;
  --r-2: 4px;
  --shadow-sheet: 0 8px 24px -8px rgba(28, 26, 21, .28);

  /* motion */
  --dur-state: 90ms;
  --dur-enter: 160ms;
  --dur-sheet: 240ms;
  --ease: cubic-bezier(.2, .7, .3, 1);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --paper: #151410;
    --paper-raised: #201E18;
    --paper-sunk: #0F0E0A;
    --ink: #EDE9DE;
    --ink-2: #A8A296;
    --ink-3: #6F6A5F;
    --rule: rgba(237, 233, 222, .16);
    --rule-strong: rgba(237, 233, 222, .32);
    --signal: #FF6B4A;
    --signal-fill: #FF6B4A;
    --amber: #E8A33D;
    --amber-fill: #E8A33D;
    --seal: #6FB37E;
    --shadow-sheet: 0 8px 24px -8px rgba(0, 0, 0, .6);
  }
}

:root[data-theme="dark"] {
  --paper: #151410;
  --paper-raised: #201E18;
  --paper-sunk: #0F0E0A;
  --ink: #EDE9DE;
  --ink-2: #A8A296;
  --ink-3: #6F6A5F;
  --rule: rgba(237, 233, 222, .16);
  --rule-strong: rgba(237, 233, 222, .32);
  --signal: #FF6B4A;
  --signal-fill: #FF6B4A;
  --amber: #E8A33D;
  --amber-fill: #E8A33D;
  --seal: #6FB37E;
  --shadow-sheet: 0 8px 24px -8px rgba(0, 0, 0, .6);
}

@theme inline {
  --color-paper: var(--paper);
  --color-paper-raised: var(--paper-raised);
  --color-paper-sunk: var(--paper-sunk);
  --color-ink: var(--ink);
  --color-ink-2: var(--ink-2);
  --color-ink-3: var(--ink-3);
  --color-signal: var(--signal);
  --color-signal-fill: var(--signal-fill);
  --color-amber: var(--amber);
  --color-amber-fill: var(--amber-fill);
  --color-seal: var(--seal);

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

/* every comparable number, everywhere */
.data {
  font-family: var(--font-mono), ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
}

/* width as a hierarchy axis — §4 */
.t-display { font-variation-settings: "wdth" 115; font-weight: 700; letter-spacing: -.025em; }
.t-title   { font-variation-settings: "wdth" 105; font-weight: 650; letter-spacing: -.015em; }
.t-listing { font-variation-settings: "wdth"  88; font-weight: 600; }
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

## 16. Build order for the design

12 hours. Not everything here ships. **In priority order — stop when the clock runs out:**

| # | Build | Why it's here |
|---|---|---|
| 1 | **Tokens + fonts** (§15) | 20 minutes, and it's the entire difference between "designed" and "template" |
| 2 | **Ledger row** (§7) | The app is mostly this component |
| 3 | **Countdown** (§6) | The thesis, on screen, in every row |
| 4 | **Term bar, inline + expanded** (§8) | The thing nobody else has. **Do not cut this** |
| 5 | **Feed layout** (§13.1) | Display headline, count line, filter chips |
| 6 | **Listing detail** (§13.2) | Including the safety band |
| 7 | **Decay ladder** (§9.1) | Small, high-impact, sells the pricing idea instantly |
| — | | **← if the clock dies here, the demo still lands** |
| 8 | Bundle manifest (§9.2) | The best transaction, but the feed tells the story without it |
| 9 | Wants checklist (§9.5) | |
| 10 | Verified stamp (§9.6) | 10 minutes, disproportionate charm |
| 11 | Condition report (§9.3) | Highest product value, lowest demo value in 2 minutes |
| 12 | Provenance chain (§9.4) | Pure garnish — real if sustainability becomes the pivot |

**Dark mode is free** if you use the tokens from hour one and expensive if you retrofit it at
hour ten. Use the tokens.

---

## 17. Review checklist

Before calling any screen done:

- [ ] Is there any colour on screen that isn't time, money, or confirmation?
- [ ] Any `border-radius` above 4px?
- [ ] Any `box-shadow` that isn't a dropdown or modal?
- [ ] Is every comparable number mono and tabular?
- [ ] Does every urgency state read correctly in greyscale?
- [ ] Is there exactly one primary button?
- [ ] Does it work at 375px without a card grid appearing?
- [ ] Does a screen with nothing urgent on it have **no colour at all**?
- [ ] Any copy with an exclamation mark or an emoji in the chrome?
- [ ] Does every date appear as an actual date, not "soon"?
- [ ] Focus rings on everything? Reduced-motion honoured?
- [ ] Would you believe this was built by a person who has rented an apartment?

---

*Companion: [PROJECT.md](PROJECT.md).*
