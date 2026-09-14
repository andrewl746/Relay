# Relay pitch deck: design guide

Paste this into Claude Design with the pitch outline. The deck should look like it was cut
from the same material as the product, so a judge sees one thing when the slides hand off to
the live demo.

## 1. Context

- **Relay** routes the things students need once (a drill, a ladder, a carpet cleaner)
  through many borrowers across a term, instead of matching one person to one person.
- **Setting:** a hackathon judging slot. 3 minutes total: 2 for pitch and live demo, 1 for
  questions. Projected on a venue screen in a lit room.
- **So:** few slides, one idea each, readable from the back of the room, and nothing that
  competes with the demo.

## 2. The idea behind the look

Relay's logo is an open cardboard box, and the product moves physical objects between
people. The surface is **packaging**: kraft board, stencil-set headings, shipping-label
numbers, and a blue shipping stamp as the single colour.

It is **not skeuomorphic**. No fake lighting, no bevels, no brown-tinted everything.
Cardboard comes from one real board texture at very low opacity, plus structure: hairline
edges, labels, tape. Everything else is warm paper and ink.

If a judge asks "why does it look like this", the one-line answer is: *the logo is a box,
so the surface is packaging, with a blue shipping stamp as the only colour.*

## 3. Canvas

- 16:9 at **1920 × 1080**.
- Outer margin 120px left/right, 96px top/bottom. 12-column grid, 32px gutters.
- **Left-aligned text.** Centre only the title and closing slides.
- One idea per slide. Body copy at most about 20 words. If a slide needs a paragraph, it
  needs to be two slides or a diagram.

## 4. Colour

Light palette only for the deck: dark slides wash out on a projector in a lit room. The
product has a matching dark theme; don't use it here.

| Token | Hex | Use |
|---|---|---|
| `bg` | `#FAF8F5` | Slide background. Warm white, **not beige** |
| `surface` | `#FFFFFF` | Cards, which sit *above* the page |
| `surface-2` | `#F4F1EC` | Inset wells, table stripes, rows inside a card |
| `border` | `#E7E2DA` | Hairlines, card edges |
| `border-strong` | `#D2CABE` | Dotted routes, chip outlines, dividers that must read |
| `ink` | `#1C1917` | Headings and body (16.5:1 on bg) |
| `ink-2` | `#57534E` | Secondary text, captions (7.2:1) |
| `ink-3` | `#8A837B` | Only for large bold text or non-text marks (3.5:1) |
| `accent` | `#1A56DB` | **The one colour.** Key words, links, the parcel, one highlighted bar (5.8:1 on bg) |
| `accent-tint` | `#E8EEFC` | Highlighter wash behind a short phrase; selected rows |
| `on-accent` | `#FFFFFF` | Text on an accent fill (6.2:1) |
| `done` | `#2D6A4F` | Muted green, **only** for a completed tick or "confirmed" state |

Rules:

- **One accent per slide, used once or twice.** If everything is blue, nothing is.
- Accent fills always take white text. Never black text on blue, never blue text on blue.
- **No other hues.** No red for problems, no green for growth charts, no yellow. Emphasis
  comes from the accent, weight, or size.
- **Numbered step badges** may vary the accent by *hue*, not lightness, so white text keeps
  its contrast: ≈`#0067D1` (01), `#1A56DB` (02), ≈`#5049D9` (03).
- No gradients anywhere, except inside the Parcel mascot artwork.

## 5. Texture

- Behind every slide: the uploaded `cardboard-bg.jpg`, tiled at about 520px wide, at
  **5% opacity** over `#FAF8F5`. It should read as the tooth of paper. If you can clearly
  see cardboard, it's too strong.
- Never put the texture on cards; cards stay clean white.

## 6. Type

Three faces, all on Google Fonts:

| Role | Face | Setting |
|---|---|---|
| Headings, display | **Merriweather** | 700, letter-spacing −0.02em, balanced line breaks. If the width axis is available, `wdth` 112 for display |
| Body, labels, buttons | **Archivo** | 400 body, 600 labels and emphasis |
| Numbers, prices, times, dates | **IBM Plex Mono** | 500–600, tabular figures |

Scale at 1920 × 1080:

| Style | Size / line height |
|---|---|
| Title-slide display | 120px / 1.1 |
| Slide heading | 64px / 1.15 |
| Big stat | 160px / 1.0, Plex Mono 600 |
| Body | 32px / 1.45 |
| Label (small text above a value) | 24px / 1.4, Archivo 600, `ink-2` |
| Caption, source line | 22px, `ink-2` |

Rules:

- **Sentence case everywhere.** No ALL-CAPS labels, no wide-tracked eyebrows. That look was
  tried and removed from the product because it reads as dashboard chrome.
- **Every price, count, time and date is Plex Mono** (`$4/day`, `Oct 2–5`, `16:00`,
  and any stat from the outline). Mono numbers are the shipping-label detail; they are how the deck says
  "this is real data".
- No one-word last lines on headings.

## 7. Surfaces and structure

- **Cards ("boards")**: `#FFFFFF`, 1px `#E7E2DA` border, **8px radius**, soft lift shadow
  `0 1px 2px rgba(28,25,23,.04), 0 2px 8px rgba(28,25,23,.05)`. Don't outline and shadow
  heavily at the same time.
- **Inset wells** inside a card: `#F4F1EC`, no border, 8px radius.
- **Buttons**: 4px radius. Small filter or status chips may be fully rounded; cards and
  buttons never are.
- **Rules**: 1px hairlines in `border`. A 2px accent top rule over a column is the one
  "heavier" divider, used for a row of three reassurance points.
- **Packing tape** (optional accent, at most once per slide): a translucent beige strip
  `rgba(210,202,190,.5)` with slightly darker ends `rgba(168,160,148,.4)`, about 84 × 26px
  (scale to about 160 × 48 on slides), rotated **−2.2°**, laid across the top edge of one card.
  Nobody tapes a box straight.
- **Stamp** (optional, closing slide): a small bordered label in `surface-2`, rotated
  **−1.5°**, like a rubber stamp. Example: "Free to join".
- **Highlighter**: `accent-tint` wash tight behind two to four words, like `$4 a day`, with
  3px padding. Not a gradient, not a glow.

## 8. Signature visuals

### The relay route (use it; it's the pitch in one picture)

Relay computes a **route, not a match**. Draw it the way the landing page does:

- A **dotted path**: `border-strong`, 2.5px stroke, round caps, dash pattern `0 9` (dots).
- **Stops**: 12px circles, `bg` fill, 2px `ink-3` stroke. Label each with a first name in
  Archivo and a date range in Plex Mono (Maya · `Oct 2–5`).
- **The parcel**: an 18px accent square, 3px radius, with a faint cross of tape in `bg`
  at 60% opacity. It sits on the current stop. If the deck animates, it travels stop to stop
  and **pauses at each one**.
- The path snakes gently down or across (S-curves), never a straight line and never a hub
  diagram. It's one object handed along, not a network.

### Timeline for the pivots

- A horizontal route (same dotted style) with four stops at **08:00, 10:00, 12:00, 16:00**
  in Plex Mono.
- Under each stop: what changed (ink) and, smaller, what was kept (`ink-2`).
- Mark the pivot that hit hardest with the accent parcel sitting on it. Only one accent.

### Steps

- Three columns. Each has a 72px square badge with 4px radius, a hue-shifted accent fill (§4),
  white Plex Mono `01` / `02` / `03`, then a 36px Archivo 600 title and a short `ink-2` line.

### Item and price rows

- A white card or inset well: object name in Archivo 600 on the left, price in Plex Mono 600
  on the right, unit smaller in `ink-2` (`$4` `/day`). Use real items: power drill $4/day,
  carpet cleaner $12/day, step ladder $5/day, projector $8/day, mini fridge $45.

### Big numbers

- One number per slide at 160px Plex Mono, with a label under it in Archivo, `ink-2`.
  Up to three numbers in a row if they belong together. No sparklines or decorative charts.

## 9. Diagrams and charts

- Flat, 2–2.5px strokes, round joins. Everything in `ink`, `ink-3` and `border-strong`,
  with the accent on **the one thing the slide is about**.
- Bars: all `border-strong` except the highlighted bar in accent. Direct labels on the bars,
  no legend.
- Axes as hairlines, tick labels in Plex Mono `ink-2`.
- **Never**: pie charts, 3D, drop-shadowed charts, gradients, glowing lines, network hairballs.
- Icons, if any: simple line icons, 1.25–1.5px stroke at 24px (scale evenly), `ink-3`.
  No emoji, no clip-art, no stock icon packs in colour.

## 10. Parcel, the mascot

Parcel is Relay's original onboarding guide: an open kraft box with a face and a strip of
blue tape. Upload the PNGs (`parcel-hi`, `parcel-thinking`, `parcel-pointing`,
`parcel-cheer`).

- **Use sparingly: two appearances at most.**
  - `hi` or `pointing` on the title or demo hand-off slide
  - `cheer` on the closing slide
- About 160–220px tall. Always sitting on something (the baseline, a card edge), never
  floating mid-slide.
- Never recolour, stretch, outline, or add effects. Keep the soft shadow ellipse it comes with.
- Parcel doesn't talk in the deck. No speech bubbles full of pitch copy.
- **Do not use `grok-bot-cloud-neutral-blue.png`** from the repo; that isn't Relay's artwork.

## 11. Logo

- Upload `relay-black.png`: black mark on transparency, aspect 837 : 266.
- Use it in **ink** (`#1C1917`) on the light background. It can be tinted to the accent only
  on the closing slide.
- Title slide: about 96px tall. Other slides: optional, 40px tall, top-left in the margin.
- Clear space of at least the mark's height on all sides. No containers or badges around it.

## 12. Motion (only if the output animates)

- Slide-ins of 10px upward with a fade, **180–260ms**, and a slight overshoot at most. No
  bounce, spin or zoom.
- The route parcel moves stop to stop and pauses at each (about 2s per hop).
- Nothing loops on a slide that has text to read, except the parcel.

## 13. Words on slides

- **Concrete over abstract**: "a drill for one Saturday, $4 a day", not "a peer-to-peer
  resource-sharing platform".
- Second person, plain verbs, short sentences.
- Say **"retrieve-and-rerank"**, not "AI-powered" or "transformer pipeline".
- If the routing algorithm comes up: **"exact within an item, greedy across items."**
  Never "globally optimal".
- **No money moves through Relay.** Don't draw payment flows or wallets.
- No buzzword headings ("Revolutionizing…"), no exclamation marks, no emoji.

## 14. Don't

- The old dark "industrial / tactical logistics" theme: black backgrounds, neon, HUD
  chrome. It was abandoned.
- The old burnt-sienna or red accent, or beige-on-beige surfaces.
- Several bright primaries (red, blue and yellow blocks). One accent only.
- ALL-CAPS eyebrow labels with wide letter-spacing.
- Gradients, glow, heavy drop shadows, glassmorphism.
- Stock photos of smiling students, or photos of real cardboard boxes as backgrounds.
- Full-bleed screenshots with no frame. If you show the product, put the screenshot on a
  white card with the standard border and lift, at most 70% of the slide width.

## 15. Files to upload with this guide

All six images are in `docs/pitch/images/`:

| File | What |
|---|---|
| `relay-black.png` | Logo mark |
| `cardboard-bg.jpg` | Background texture (5% opacity) |
| `parcel-hi.png`, `parcel-thinking.png`, `parcel-pointing.png`, `parcel-cheer.png` | Mascot, transparent 1024px |

Also available, not needed for upload: Parcel as SVG in `docs/pitch/`, and the exact font
files in `app/fonts/*.woff2` if Google Fonts isn't available.
