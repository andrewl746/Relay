# Relay — Brand Files

**Source:** `Relay student app logo design.zip` (high-resolution revision, Sep 13), unpacked into
`public/brand/`. The file guide from that zip is reproduced in §4.

One mark, three frame weights, plus icon cuts. Ink `#1C1A15` on paper `#F2EFE6`.
Type: Archivo 700 at width 64%, tracking 0.07em. Numbers and small labels: IBM Plex Mono.

**The stamp is always rotated −1.5° counter-clockwise.** Never straighten it, never tilt it
further, never mirror it.

Subtitle: **"Sharing is caring."** — set in Archivo 500 at width 86%, inside the frame under the
wordmark. The tagline *"One of these on the street, not one in every room."* is not part of the logo.

> **Settled:** the app runs on paper (`app/globals.css`, docs/DESIGN.md), which is what these ink
> marks are drawn for. If a dark surface is ever added, it needs light-on-dark cuts of the
> single-rule, stacked and wordmark lockups. Don't CSS-invert these files — the guide forbids
> recolouring.

---

## 1. Where each file is used in the app

| File | Used in | Notes |
|---|---|---|
| `relay-stamp-single-rule.png` | Site header on every signed-in screen · Supabase onboarding header | Drawn straight in the file, so every placement adds the −1.5° in CSS (`.stamp` inside the hub, `-rotate-[1.5deg]` elsewhere). Shown 28px tall ≈ 114px wide, above the 96px minimum |
| `relay-stamp-stacked.png` | Top of `/hello` and `/start` · above the card on `/login` and `/register` | Rotated in CSS. Shown 300px wide; much smaller and the "WATERLOO ON" line can't be read |
| `relay-wordmark-plain.png` | Hub footer, beside the money line | No tilt, transparent. The footer's top rule is the frame it sits inside |
| `relay-stamp-primary-ink-crop.png` | Bottom of the handoff receipt, `/handoffs/[id]` · README header | Crop of the primary ink cut (§2). Its ground is opaque paper, so it only belongs on paper |
| `relay-stamp-primary-reversed-crop.png` | README header in dark mode | Same crop, reversed cut |
| `relay-stamp-primary-reversed.png` | Link previews: `app/opengraph-image.png` | Cut to 1200:630 around the stamp and scaled down to 1200×630 (§2) |
| `relay-stamp-primary-ink.png` | Source for the crop | The 3068×1232 artboard itself isn't placed anywhere; see §3 |
| `relay-favicon-16.png` · `relay-favicon-32.png` | `app/favicon.ico` (both sizes) · `app/icon.png` (32) | The guide calls these the pixel-exact browser files |
| `relay-favicon-16@4x.png` · `relay-favicon-32@4x.png` · `relay-favicon-32-outline@4x.png` | **Not wired** | Same constructions for retina and print. Browser tabs use the plain files above |
| `relay-app-icon-512.png` | `app/apple-icon.png` · `app/manifest.ts` | |
| `relay-app-icon-64.png` | `app/manifest.ts`, declared as 256×256 | Rendered at 256px for a 64px slot |
| `relay-favicon-32-outline.png` | **Not used** | See §3 |

All placements use `next/image` with `unoptimized`, so the PNGs ship exactly as designed and
nothing depends on the image optimizer on venue wifi.

## 2. Files derived from the zip

- **`public/brand/relay-stamp-primary-{ink,reversed}-crop.png`** — the originals are 3068×1232
  artboards with the stamp small in the middle. The crops are 1184×892: the stamp's bounding box
  (x 1097–1974, y 325–910) plus 153px on every side, which is the required clear space
  (0.85 × a cap height of ~180px at this resolution).
- **`app/opengraph-image.png`** — the reversed artboard cut to the link-preview ratio around the
  stamp (2347×1232) and scaled down to 1200×630. The guide allows scaling lockups down freely.
- **`app/favicon.ico`** — the 16px and 32px PNGs packed unchanged into one `.ico`.

## 3. Known problems with the files as delivered

- **The outline favicons have a transparent interior** (both `relay-favicon-32-outline.png` and its
  `@4x`), not the paper interior the guide describes. An ink rule and an ink R on transparent vanish
  on exactly the ink or photographic grounds this cut exists for. Re-export with a paper interior
  before wiring it in.
- **`relay-stamp-primary-ink.png` has a 4px `#57534A` border** baked into the artboard edge. Use the
  crop anywhere that edge could show.

---

## 4. File guide (from the zip)

**relay-stamp-primary-ink.png**
The full stamp: double rule, subtitle, and the "Handed on __ / __" slot. This is the signature
version — use it where the mark is the main event and it can be seen at 200px wide or more:
about pages, posters, the printed handoff receipt, the back of a sticker sheet, slide 1 of a pitch.

**relay-stamp-primary-reversed.png**
Same lockup, paper on ink, with its dark ground included. Use on dark headers, projector slides,
and photos. Do not recolour it — the reversed cut only ever runs paper on `#1C1A15`.

**relay-stamp-single-rule.png**
One rule, no subtitle, no date slot. The everyday lockup: site header, email signature, tote,
anywhere the double frame would turn into noise below ~150px wide. This is the default for the
product UI.

**relay-stamp-stacked.png**
Frame with "Waterloo ON" beneath the rule. For square or near-square spaces — sticker, tag,
social avatar, the corner of a poster. Use when the city matters (campus posters, flyers on
the street).

**relay-wordmark-plain.png**
The word alone, no frame, no tilt. Use when the mark sits inside something already ruled or
boxed — a table header, a partner lockup, a document footer, embroidery. Never add your own
box: if it needs a frame, use one of the stamp files.

**relay-favicon-16.png** (16×16, plus relay-favicon-16@4x.png at 64×64)
Pressed square with a single condensed R. Browser tab, list rows, anywhere under 24px. The
inner rule is deliberately gone at this size.

**relay-favicon-32.png** (32×32, plus relay-favicon-32@4x.png at 128×128)
Same construction at 32px — retina tabs, bookmarks, small avatars.

**relay-favicon-32-outline.png** (32×32, plus relay-favicon-32-outline@4x.png at 128×128)
Outline press: ink rule, paper interior. For use *on* an ink or photographic ground where the
solid square would disappear, and for one-colour stamping onto physical objects.

**relay-app-icon-64.png** (rendered 256px, for a 64px slot)
The R with its frame restored — the inner rule returns above ~40px. Home-screen icon, app
switcher, store listing at small sizes.

**relay-app-icon-512.png** (512×512)
Largest icon cut, same construction. Store listings, README headers, anything needing a big
square icon.

### Clear space and minimum sizes

- Clear space: 0.85 × cap height on every side. Nothing sits inside it.
- Stamp lockups: minimum 96px wide (single rule), 150px wide (double rule with date slot).
- Icons: use the cut made for the size — never scale the 512 down to 16. The @4x files are the
  same construction for retina and print; the plain 16/32 files are pixel-exact for browser use.
- All lockups are rendered at 4× and can be scaled down freely; scaling up past 100% will soften
  the hairlines.

### Don't

- No colour in the logo. Green `#3E7A4C`, red `#C6371B` and amber `#E0A43A` mean in use, idle
  and money; they never decorate the mark.
- No rounded corners, shadows, gradients, or outlines added to the frame.
- No stretching: the width axis is set at 64% and stays there.
- No second tilt. −1.5° is the only imperfection in the system.
