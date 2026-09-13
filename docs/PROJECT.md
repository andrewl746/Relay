# Relay — Project Document

**Event:** PivotHacks · Builder's Club, Waterloo ON · 12 hours · 8:00 AM → 8:00 PM
**Starting problem:** Problem 8 — **Resource Sharing.**
**Repo:** stock `create-next-app` (Next 16.3.5, React 19.2.8, Tailwind v4) — *disclose as a
starter template on submission, per event rules.*
**Companions:** [DESIGN.md](DESIGN.md) — visual system · [../PIVOTS.md](../PIVOTS.md) — live pivot log.

> **Relay** — one student hands off to the next, term after term: the same room, the same
> desk, the same four-month window. *(Name is swappable. Runner-up: "Baton".)*

> ### One-liner
> **Craigslist for co-op students, where everything is keyed to the term.**
> Sublet your place, sell or rent out your furniture, and hand it all to the person
> arriving as you leave — before the date you both already know.

---

## ⚠️ Read this first

The rubric is **Adaptability & Pivot Response: 30** — more than Technical Execution (25).
Judges will ask, verbatim:

- Which Pivot affected your project the most?
- What did you remove or deprioritize?
- **What did you intentionally decide *not* to change?**
- Why does your final product look the way it does?

This document is therefore structured to **answer those questions**, not just to describe
a product.

---

## 1. Pivot log → [PIVOTS.md](../PIVOTS.md)

**The live pivot log lives in one file at the repo root: [PIVOTS.md](../PIVOTS.md).**
Four fields per pivot, updated at 10:00, 12:00 and 16:00 while it's fresh. It is the raw
material for the 2-minute pitch (§13) and the single highest-value artifact in this repo.

Kept in its own file rather than in this document so there's exactly one place to update
under time pressure, and so it's the first thing a judge or teammate finds.

§2 below is its standing companion — the decisions we are *not* changing, with reasons.

---

## 2. Decision ledger — what we are *not* changing

Judges reward intentional non-changes as much as changes. These are load-bearing; a pivot
has to beat the reasoning, not just be newer.

| Decision | Why it holds |
|---|---|
| **The date is the primary key** | It's the only thing every other tool gets wrong, and it survives almost any change of user. Newcomers, grad students, seniors downsizing — all of them have a move-out date. |
| **Sort by time pressure, never by recency** | Recency-sorting is exactly why Facebook Marketplace fails this market. Reverting to it would delete our reason to exist. |
| **No money moves through us** | Every payment feature is a regulator, a fraud vector, and four hours we don't have. |
| **Never silently delete a cheap listing** | A desk at 15% of retail is the product working. Any "too cheap = scam" heuristic deletes our best inventory. |
| **Structured slots, not chat** | Freeform negotiation is where marketplaces break down. A slot is a commitment with a time attached (§7.12). |
| **One feed, one listing skeleton** | It's what lets a pivot change *what* is listed without touching ranking, matching, or the UI. See §5. |

---

## 3. The problem

Co-op rotates students through 4-month terms, three times a year, on the same handful of
dates. In Waterloo that's thousands of students vacating and thousands arriving in the same
four neighbourhoods in the same two weeks. The market is enormous, perfectly predictable,
and clears terribly.

**Housing.** The leaver is on a 12-month lease but gone for 4 of them: pay rent on an empty
room, break the lease, or scramble to sublet in the last ten days. The arriver can't find a
4-month place because the entire market is built for 12-month leases.

**Stuff.** The leaver curbs a $200 desk because moving it costs more than it's worth. The
arriver buys the same desk new, hauls it up three flights, and curbs it four months later.

### Why it doesn't clear on its own

**The two sides are never online at the same time.**

| | Leaver | Arriver |
|---|---|---|
| Starts thinking about it | T−10 days, panicked | T−6 weeks, from another city |
| Searches | Once — dumps it all in a group chat | Once, finds nothing, gives up, overpays for residence |
| Motivation | Stop the bleeding | Not be homeless |

By the time the leaver posts, the arriver has already solved it badly and stopped looking.

### What people use today

| Tool | Why it fails |
|---|---|
| Facebook Marketplace | Recency-sorted, no end dates, no `.edu` trust, scam-dense, can't say "I need a place Sept–Dec" |
| Kijiji | All of that, worse fraud, no student context |
| Facebook / Discord / WhatsApp groups | Unsearchable; a post from 2022 looks identical to one from today; no expiry, no matching |
| Places4Students | Built for 12-month leases; 4-month sublets are second-class |

None of them know what a co-op term is. That's the opening.

---

## 4. The insight

**Every transaction here has a hard date, and the date is public knowledge.**

Co-op terms start and end on the same few days for everyone at a school. So make the date
the primary key:

- **Rank** by time pressure, not recency.
- **Match** by window overlap, not keywords.
- **Price** decays toward a floor as the date closes — the alternative is an empty room or
  a landfill.
- **Bundle** naturally, because the room and the stuff in it leave on the same day.

Everything below follows from that one move.

### Two modes on the same data

The date-keyed behaviour shouldn't be the *only* behaviour, or the app is dead for ten
months of the year and looks abandoned to a first-time visitor in October.

| Mode | When | Behaviour |
|---|---|---|
| **Marketplace** | year-round, default | Ordinary listings for furniture and school materials. Browse, filter, claim. Sorted by relevance, deadlines optional |
| **Clearing** | during a hub's move-out window | Listings carry a deadline, the feed ranks by urgency instead of recency, price ladders activate, and matches are **pushed** to arrivers rather than searched for |

Same data, same listing skeleton, same components — the mode changes ranking, what's
emphasized, and whether push is on. A hub enters Clearing mode automatically from its term
presets (§7.3), and the feed says which mode it's in.

This also answers the cold-start problem: in Marketplace mode a new user in July sees a
queue of upcoming matches from wants lists (§7.7) instead of an empty feed.

---

## 5. Pivot-proof architecture

**The most important section in this document.** Pivots change *who* you serve and *what
matters*. So we split the system into an engine that never changes and a layer that's
cheap to swap.

### Core — do not touch

| Thing | Why it survives any pivot |
|---|---|
| **Listing skeleton** — owner, hub, window, price ladder, status, photos, location | Every marketplace-shaped pivot reuses this verbatim |
| **Window overlap math** (§7.3) | Any two-sided time-bounded match is this function |
| **Urgency ranking** (§7.4) | One formula, one call site |
| **Wants → match loop** (§7.7) | Works with zero supply; survives losing the marketplace entirely |

### Configuration — swap in minutes

Users · categories · what a "term" is · hub · transaction modes · copy · seed data.

**No domain vocabulary in code.** No type named `Student`, no field named `coopTerm`, no
hardcoded `"Waterloo"`. Those live in `config.json`:

```json
{
  "actor": "student",
  "actorPlural": "students",
  "cycle": "co-op term",
  "place": "Waterloo",
  "cycleBoundaries": ["2025-09-01", "2026-01-05", "2026-05-04"]
}
```

Every user-facing string reads from that file. **Grep for a hardcoded `"student"` before the
demo** — there should be zero hits outside `config.json` and the seed generator. When a pivot
says *"your users are now travel nurses,"* the change is a config edit plus a reseed.

### Pivot dry-runs

Cheap insurance, with budgets decided now rather than at 4 PM. If a pivot says:

| Pivot | Response | Touched | Budget |
|---|---|---|---|
| *"New user group"* — newcomers to Canada, grad students, travel nurses | Edit `config.json`, reseed. Terms become arrival dates; hub becomes a city | Config + seed | **15 min** |
| *"Now it's for seniors downsizing"* | Window = move-out date; wants list becomes the family's | Config + seed + copy | 15 min |
| *"New constraint"* — cost, trust, accessibility | New term in the ranking function (§7.4) | One formula | **20 min** |
| *"Add a stakeholder"* — landlord, residence life, sustainability office | New role reading the same listings; §7.13 dashboard already serves the institutional one | One view | **20 min** |
| *"Sustainability is what matters now"* | Provenance chain and diverted-kg move from footer to hero | Pure UI | 20 min |
| *"Remove a feature"* | Drop semantic matching; wants still match on category + window | Delete a stage | **5 min** |
| *"Drop the marketplace"* | Wants + matching stand alone as a want-board | Delete routes | 30 min |
| *"Make it mobile-first"* | Already is (DESIGN.md §14) | None | 0 |

**If a pivot can be absorbed in config, seed data and copy, absorb it there.** Say so out
loud in the pitch — that's the adaptability point, and it's worth more than the feature
would have been.

---

## 6. Who it's for

**The Leaver** — outbound co-op. A room on a lease, a pile of furniture, ten days, and a
new city to worry about. Wants to stop paying double rent and not move a mattress. Trades
money for speed.

**The Arriver** — inbound co-op. Needs a place and a starter kit, from 400 km away, six
weeks out, sight unseen. Their fear is fraud, not price.

**The Stayer** — on campus this term. Not the target user, but the **liquidity of last
resort**: when no arriver matches, a Stayer is the difference between a sale and a curb.

**The Landlord / primary tenant** — not a user, but their consent gates the sublet (§11.1).
Don't pretend they don't exist.

**The institution** — residence life, or a sustainability office. Not a user either, but
they're the one party who'd *pay* for this, and what they want is a number: items diverted
from landfill and money saved per campus (§7.13). Worth building the dashboard cheaply,
because "add a new stakeholder" is a likely pivot and this one is already half-answered.

---

## 7. Feature specifications

### 7.0 The taxonomy — two kinds × two deals

This is the model everything else hangs off.

```
kind:  place  |  thing
deal:  rent   |  sale
```

| | **rent** | **sale** |
|---|---|---|
| **place** | Sublet / lease takeover, **furnished or unfurnished**. The anchor. | *invalid* — we're not selling condos |
| **thing** | Desk for the term, returned in December. Mini-fridge, monitor, bike. | Desk sold outright. Mattress, textbooks. |

**`thing` + `rent` is not a novelty — it's the hinge.** An arriver on a 4-month term
doesn't want to *buy* a desk they'll have to dump in December. A leaver subletting
**unfurnished** can rent out the furniture separately instead of paying for storage. Both
sides come out ahead, and it's the reason `furnished` is a field and not a filter.

Rentals (either kind) additionally carry: `return_by`, a **disclosed** deposit, a required
condition report at both ends (§7.10), and a price expressed per-term or per-month.
Sales carry an absolute price that decays to $0.

### 7.1 Hubs and verification

A **hub** is a school. Hub is derived from email domain, never chosen from a dropdown.

**Verification is the auth system.** No passwords: enter your school email, get a signed
magic link, click it, you are signed in *and* verified in one step. One mechanism, one
failure mode, no password-reset flow to build.

- Session: signed JWT in an `httpOnly`, `SameSite=Lax`, `Secure` cookie, 14 days.
- Unverified users browse. They cannot list, claim, or message.
- Domain allowlist per hub in the DB. **Never suffix-match `*.uwaterloo.ca`** — that's a hole.

> **Demo note:** for judging, a "sign in as Maya (leaver) / Dev (arriver)" switcher beats a
> real email round-trip. Build the switcher first; the magic link is a 40-minute task that
> adds nothing to a 2-minute demo. Ship it only if the clock allows.

### 7.2 The listing skeleton

Every listing has: owner, hub, photos, **window**, **price + decay ladder**, status, fuzzed
location.

**`place` extras:** `arrangement` (sublet · assignment · room_in_shared · whole_unit),
`furnished` (none · partial · full), `rent_monthly`, `utilities_included`,
`deposit_expected`, `beds`, `baths`, `roommates_staying`, `address` *(stored precise,
**shown fuzzed to ~250 m** until a claim is accepted)*, `landlord_consent`
*(obtained · pending · not_required · unknown — **required, no default**, see §11.1)*,
`lease_proof` *(optional upload → Verified stamp)*.

**`thing` extras:** `category` (desk · chair · mattress · bedframe · dresser · shelf · sofa
· lamp · monitor · fridge · kitchen · lab kit · textbook · misc), `condition` (new · good · worn ·
needs_work — plain words, no stars), `dimensions_cm` *(matters enormously for "will it fit
through the door")*, `item_id` → the persistent item (§7.11).

**Lifecycle:**

```
draft → live → claimed → met → completed
                  ↓        ↓
       (hold expires / cancelled) → live
                                 ↓
                              expired
```

A **claim is a hold, not a purchase.** 24h, or until the pickup window opens, whichever is
sooner. **The decay clock never pauses during a hold** — otherwise claim-squatting becomes
a way to freeze a price, and someone will find that within a week.

### 7.3 Term windows and the exchange zone

The signature mechanic, and the thing to put on screen in the demo.

```
Leaver's place available   ├──────────────────────────────┤
                          Aug 25                        Jan 05

Arriver's co-op term              ├────────────────────────────┤
                                Sep 03                      Dec 20

Exchange zone                     ├────────────────────────┤
                                  coverage 100% · slack 25 days
```

```
overlap   = max(0, min(a_end, n_end) − max(a_start, n_start))     # days
coverage  = overlap / (n_end − n_start)                           # of the ARRIVER'S need
gap_head  = max(0, a_start − n_start)                             # days homeless on arrival
gap_tail  = max(0, n_end − a_end)
slack     = (a_end − a_start) − overlap                           # days the leaver pays for, empty
```

| Coverage | Label | Behaviour |
|---|---|---|
| ≥ 98% | **Full cover** | Push immediately |
| 85–98% | **Near fit** | Push, state the gap in words: *"starts 6 days after you arrive"* |
| 50–85% | **Partial** | Feed only, never pushed |
| < 50% | — | Filter-only |

`coverage` is measured against the **arriver's need**, not the leaver's window. A place free
for two of your four months is a 50% match however long the lease runs.

**`slack` is the leaver's motivator and we show it to them:** *"You're paying for 25 empty
days. Accepting a start 6 days earlier adds 4 matches."* That line is what makes supply
flexible, and flexibility is what clears the market.

**Term presets** per hub, so nobody types a date:

```
F25  Sep 01 – Dec 19      W26  Jan 05 – Apr 24      S26  May 04 – Aug 21
```

### 7.4 Urgency ranking

Naive `ORDER BY expires_at` floods the top with junk expiring in an hour that nobody wants.

```
pressure  = 1 / (1 + hours_left / 24)     # 0h→1.00  24h→0.50  72h→0.25  1wk→0.125
relevance = 0..1  from wants match, term overlap, distance, category follows
freshness = 1.0 for the first 6h after publish, linear to 0 by 24h

score = pressure × (0.55 + 0.45 × relevance) + 0.12 × freshness
```

Ties break on distance, then newest.

**`hours_left` means different things per deal, and that's correct:**
- **sale** → hours until `gone_by`. The deadline is the landfill.
- **rent** (place or thing) → hours until `window_start`. The deadline is the first day an
  empty room or an idle desk starts costing its owner money.

**Guards:** claimed and expired drop out · the `<3h` **Final call** band is pinned but
hard-capped at 3 items so dying listings can't eat the feed · `freshness` exists only so a
listing posted six weeks ahead — exactly what we want — gets seen once before pressure
kicks in.

**"Newest" is not an offered sort.** It's the one people reach for and the one that breaks
the product. "Posted today" exists as a *filter chip*, which serves the same human need
without reordering the world.

### 7.5 Price decay

> *Price decays toward free as the deadline approaches, because the seller's alternative is
> to throw it out.*

True for sales. Not for rentals, and the difference matters.

**Steps, not a slope.** A continuously ticking price creates a standoff — every buyer waits
one more minute, nobody moves until the last hour, and the handoff is rushed. Discrete,
pre-announced rungs force a decision at each step.

| Rung | When | `thing`+sale | `thing`+rent | `place` |
|---|---|---|---|---|
| 1 | publish → 50% of window | ask | ask | ask |
| 2 | 50% → 75% | −35% | −20% | −12% |
| 3 | 75% → last 8h / last 7d | −65% | −40% | −25% |
| 4 | final | **free** | floor | floor |

**Floors:** sale → **$0** ("free to a good home before Saturday" is a feature, the real
alternative is a landfill). Rentals → a seller-set minimum, defaulting to **70% of their
carrying cost** (rent share, or storage cost for a thing). Economically any rent beats an
empty room, but designing housing as a race to zero invites bad actors and demoralizes
supply. **The floor is a design decision, not a math result** — written down so nobody
"fixes" it later.

**Anti-gaming:** rung timestamps lock at publish · a seller may **lower or accelerate**,
never raise or delay · re-listing starts a fresh ladder but carries a visible `relisted ×2`
marker — transparency is cheaper than enforcement · scheduled drops notify everyone who
saved the listing (*"$60 → $40, 2h from now"*), which is the best re-engagement hook this
product has and costs nothing.

### 7.6 Bundles — the furnished-room manifest

> *Let a leaver post their whole room as a bundle, and let an arriver claim it in one action.*

With housing in scope this becomes **the product's best transaction**: a furnished sublet
where the room *and* its contents transfer in one motion. The arriver lands with a suitcase
and sleeps in a furnished room that night. Nobody rents a van.

A bundle = one `place` + N `things`, sharing a window. Members may mix `sale` and `rent`
deals — *keep the desk, give back the fridge* — which is exactly how furnished sublets
actually work.

- `all_or_nothing` (default when `furnished: full`) or `place_first` (sublet claimed first,
  remaining items open to the hub with the new tenant given right of first refusal).
- Show both numbers: `$1,240 — parts total $1,510`. The discount is the point; make it legible.
- A failed bundle claim returns every member to `live` with ladders intact and clocks never
  stopped.

**Why this wins the demo:** camera scan turns one photo of a room into a drafted manifest.
Photo → inventory → priced bundle → one claim. That's the whole product in forty seconds.

### 7.7 Wants lists and push matching

The arriver's half of the loop, and the fix for the timing mismatch in §3.

A **want** = `{ kind, deal, category | arrangement, keywords[], max_price, window, radius }`,
presented as a **checklist that strikes through as it fills**.

Matching runs on every publish and every rung change:

```
match_score = 0.45 × coverage       # §7.3
            + 0.25 × price_fit      # 1.0 at ≤ max_price, linear to 0 at 1.5×
            + 0.20 × category_fit   # exact, sibling, or semantic (§10)
            + 0.10 × proximity
```

**Notification discipline** — the fastest way to kill this product is to become a firehose:

- Immediate push **only** for `place` at Full cover or Near fit, **max 3/day**.
- Everything else batches into **one daily digest**.
- A scheduled price drop on something already in your list *is* worth an immediate ping.
  A new `thing` match is not.
- Dismissing teaches the filter — same `(category, seller)` suppressed for that want.
- No matches for 14 days → prompt to widen, and show the nearest three near-misses **with
  the reason**: *"$40 over budget", "starts 3 weeks late"*.

### 7.8 Camera scan

Narrow, useful, never authoritative.

**Single item:** photo → `{ category, title, condition, dimensions estimate, suggested
price band }` → prefills the form.

**Room mode (the one that matters):** one wide photo → detected inventory → user confirms
each line → drafted bundle manifest (§7.6).

**Non-negotiable rules:**
- The scan **drafts**; a human always confirms before publish.
- Confidence shown per field. Low confidence renders as an **empty field with a
  placeholder**, never a confident wrong guess.
- Prices are a **band with its basis** — *"$40–65, based on 7 desks sold in this hub"* —
  never a single authoritative number.
- Scan output is never a trust signal. It's a typing shortcut.

Server-side only; the key never reaches the client. Rate-limited per user per hour.

### 7.9 Trust, fraud, and the action ladder

Furniture fraud costs someone $60. **Sublet fraud costs someone $2,400 and a place to
live**, and it's among the most common scams aimed at students. This section is load-bearing.

**Price is not a fraud signal.** A desk at 15% of retail is the product working. What
actually correlates:

| Signal | Weight |
|---|---|
| Pushes payment off-platform before a viewing (e-transfer, crypto, gift cards) | **High** — the single strongest |
| "I'm abroad, my agent will show it" / offers to mail keys | **High** — classic remote-landlord scam |
| Photos with no EXIF, or reverse-image hits on listing sites | High |
| Same address or photo set across multiple hubs | High |
| Account < 48h old with ≥3 `place` listings | Medium |
| Contact info in the description | Medium |
| Description duplicated across listings | Medium |
| `landlord_consent: unknown` | Low — common and usually innocent; nudge, never punish |

**Action ladder** — escalate, never jump to the end:

1. Nothing *(default — most low scores are noise)*
2. **Inline buyer warning**, non-modal, at the moment of risk: *"Never send a deposit before
   seeing the place in person or on video. Relay never handles payments."*
3. Require in-person or video handoff before contact details unlock
4. **Hub-only suppression** — reachable by direct link, visible to its owner, just not ranked or pushed
5. **Human review queue**, with a stated SLA and a real appeal path

**Only step 5 removes a listing, and only a human does it.**

**Verified Listing stamp** — the positive counterweight: upload a lease page or utility bill
matching the address, get a stamp. It lets honest sellers out-compete scams instead of
making everyone suspect.

**Lowballing** is a buyer behaviour, not fraud: offers below 40% of the current rung require
a message. Sellers set "no offers below $X" once. We don't build a negotiation engine.

### 7.10 Condition reports — the rental backbone

Promoted from last place to a v1 feature, because this is where the real money is. A student
apartment deposit is **$1,000–2,500**, and the commonest reason it isn't returned is that
nobody documented the state of the place on the way in. Same mechanism protects a lent desk.

```
┌─ MOVE-IN ─────────────────────┬─ MOVE-OUT ────────────────────┐
│ Sep 03, 2025 · 14:22          │ Dec 19, 2025 · 10:05          │
│ [kitchen] [bath] [bed] [main] │ [kitchen] [bath] [bed] [main] │
│ Notes: scuff L wall, tap drip │ Notes: scuff unchanged        │
│ Confirmed: leaver ✓ arriver ✓ │ Confirmed: leaver ✓ arriver ✓ │
└───────────────────────────────┴───────────────────────────────┘
  Report #RLY-8842-F25 · both parties hold an identical copy
```

- Both parties confirm. A one-sided report is marked `unconfirmed` and says so, loudly.
- Photos timestamped **server-side** at upload. Client clocks are not trusted.
- **Immutable once both confirm.** Amendments append; they never edit.
- Both can export a PDF. **This is the artifact you hand a landlord**, and the reason to use
  Relay over a group chat *even when you already found each other*.

**We do not adjudicate disputes.** We produce the evidence and show both sets side by side.
Saying so plainly is honest and the correct legal posture.

### 7.11 Item history (provenance)

An `item` persists across listings. A completed claim appends a `provenance_event`; the next
leaver re-lists *from their inventory*, carrying the chain. Rentals append a return event
too, so a desk shows both owners and borrowers.

```
DESK · IKEA MICKE, white
F23 Maya K. → W24 Dev R. → S25 Priya S. (rented) → F25 you?
4 terms · 3 hands · ~28 kg kept out of landfill
```

One append-only table. Earns its place three ways: a real trust signal, a concrete
sustainability story, and the most screenshot-able thing in the app.

Weights are **labelled estimates**: desk 28 kg · mattress 23 · dresser 35 · sofa 45 ·
bookshelf 20 · chair 8 · monitor 4 · textbook 1.2. Chain shows term + first name, last
initial; anyone can hide their own link (renders `—`, count still holds).

### 7.12 Exchange options — structured handoffs instead of chat

**This is the replacement for messaging, not a companion to it.**

Freeform negotiation is where marketplaces break down: an endless stream of *"is this still
available"*, no commitment, and no-shows. So when a buyer claims, they don't open a blank
chat — they **pick from slots the seller already set**. Both sides get a confirmation with a
time and a place attached.

The seller picks one or more when publishing:

| Option | How it works |
|---|---|
| **Pickup at the seller's location** | Buyer picks a slot from the seller's stated windows. Address unlocks on acceptance |
| **Public campus meeting spot** | Seller offers the spot (SLC, DC atrium, E7 lobby), buyer picks the time |
| **Delivery** | Only if the seller offers it, with a stated radius and fee |

**Handoffs default to public campus locations rather than private residences.** For a
`thing`, there's no reason to send a stranger to someone's apartment; for a `place`, a
viewing obviously happens at the unit, so the default flips and the safety copy changes to
*"bring someone with you, and view before you pay anything."*

**Why this beats chat:** a slot is a commitment with a time attached. It also gives the
condition report (§7.10) a scheduled moment to attach itself to, and it keeps fraud in
structured fields where §7.9 can see it, instead of in free text where it hides.

**Chat, if we ever build it**, stays attached to a claimed item — never open messaging
between strangers. Opening a thread requires a template (*"Is this still available?"* ·
*"Can we do a video walkthrough?"*), free text unlocks only after the first reply, and
contact details unlock only on an accepted claim. It is the last thing on the build list
(§12) and probably never gets built.

### 7.13 Impact dashboard

Every claimed listing is one less item in a dumpster and one less thing an incoming student
buys new. Per hub:

```
WATERLOO · FALL 2025
  312 items diverted        ~4.1 tonnes kept out of landfill
  $18,400 saved             41 rooms subletted instead of sitting empty
```

Cheap to compute — a sum over `completed` claims and the category weight table (§7.11) —
and it's the number a **residence life or sustainability office** would care about, which
makes it the answer to a "new stakeholder" pivot (§5). Diversion weights are labelled
estimates; don't present them as measured.

---

## 8. Data model

Postgres. Enough to be unambiguous; not a migration file.

```
hub              id, name, email_domains[], geo_center, term_presets jsonb, digest_hour
user             id, hub_id, display_name, email_hash, verified_at, notify_prefs jsonb
item             id, canonical_title, category, weight_kg_est, first_seen_at

listing          id, kind('place'|'thing'), deal('rent'|'sale'), item_id?, seller_id,
                 hub_id, bundle_id?, title, description, photos[],
                 window_start, window_end, return_by?,
                 ask_price, floor_price, rungs jsonb,      -- locked at publish
                 lat, lng, lat_fuzzed, lng_fuzzed,
                 status, published_at, relist_count
place_detail     listing_id, arrangement, furnished, rent_monthly, utilities_included,
                 deposit_expected, beds, baths, roommates_staying,
                 address_full, landlord_consent, lease_proof_url?
thing_detail     listing_id, category, condition, dimensions_cm

bundle           id, seller_id, hub_id, title, claim_mode, price, window_start, window_end
want             id, user_id, hub_id, kind, deal, category?, arrangement?, keywords[],
                 max_price, window_start, window_end, radius_m, fulfilled_at?
match            want_id, listing_id, score, coverage, notified_at?, dismissed_at?
claim            id, listing_id?, bundle_id?, buyer_id, price_at_claim, state,
                 hold_expires_at, created_at
handoff          id, claim_id, kind('move_in'|'move_out'), photos jsonb, notes,
                 seller_confirmed_at?, buyer_confirmed_at?, report_no, created_at
provenance_event item_id, from_user_id, to_user_id, listing_id, deal, term_label, occurred_at
signal           listing_id, kind, weight, detected_at, resolved_at?
```

Constraints worth putting in the DB rather than app code:

```sql
CHECK (window_end > window_start)
CHECK (floor_price >= 0 AND floor_price <= ask_price)
CHECK (NOT (kind = 'place' AND deal = 'sale'))        -- §7.0
CHECK ((deal = 'rent') = (return_by IS NOT NULL))
UNIQUE (listing_id) WHERE status IN ('claimed','met')  -- one live claim per listing
```

---

## 9. Architecture

> **Next 16.3.5.** Conventions verified against `node_modules/next/dist/docs/`, not from
> memory. Two renames matter: **`middleware.ts` is now `proxy.ts`**, and caching runs
> through **Cache Components** (`cacheComponents: true` + `use cache`), not the old
> `fetch`-option model.

**Rendering.** App Router, Server Components by default. Client components confined to five
places: the countdown ticker, the term-window picker, camera capture, the map, the filter panel.

**Mutations.** Server Functions (`'use server'`). **Every one does its own authz** — the
Next docs are explicit that Server Functions are reachable by direct POST, not only through
your UI. No exceptions, no "the caller already checked."

**Data access layer.** `lib/dal.ts`, marked `server-only`. Every read goes through it and
returns DTOs. `address_full`, `email_hash`, and precise lat/lng must be *structurally*
incapable of reaching the client, not merely un-rendered.

**`proxy.ts`** — optimistic signed-out redirect only. Real authorization lives in the DAL;
the docs are explicit that proxy is not a session-management layer.

**Caching.** `cacheComponents: true`; hub and category shells get `use cache` +
`cacheLife('minutes')` + `cacheTag('hub:'+id)`; `revalidateTag` on publish, claim, and rung
change.

> **Trap, and the reason it's in this doc:** a countdown must **never** be rendered into
> cached HTML. The server emits an ISO timestamp; the client computes the remainder. Cache a
> rendered `2d 14h` once and you will serve `2d 14h` for an hour.

**Geo.** Fuzz **on write**, not on read — store `lat_fuzzed`/`lng_fuzzed` computed at publish
with a stable per-listing offset. Fuzzing at render time lets someone re-request and average
the jitter to recover the true point.

**Storage — no database for the hackathon build.** Seed data loads from JSON into memory at
boot. *n* is in the low hundreds; Postgres is pure setup cost with zero demo value, and the
schema in §8 is still the right *shape* for the objects in memory. Post-hack, that schema
goes to Postgres unchanged. **No vector DB either** — cosine similarity over an in-memory
array at n≈300 is microseconds. Do not install pgvector, Pinecone, Chroma, or FAISS.

**Auth — a user switcher, not a magic link.** "Sign in as Maya (leaver) / Dev (arriver)"
demos better than an email round-trip and costs 40 minutes less. §7.1's magic link is the
post-hack path, and it's written down so the shape is decided.

**Rate limits** on publishes, claims, and scans — cheap, and the only real protection in a
build with no auth.

### Seed data

The most under-rated hour of the build.

- **Hand-write ~15 listings in real human voice first** — typos, missing dimensions,
  inconsistent capitalization, brand names, pickup location mentioned mid-sentence. *Then*
  clone that pattern programmatically for the rest. Uniformly-phrased synthetic data makes
  semantic matching look broken and quietly costs points in three rubric categories at once.
- Use real Waterloo neighbourhoods: **Northdale, Lester, Sunnydale, Beechwood, King St N**.
- Real term boundaries matching `config.json` (§5).
- Target ~60 people, ~120 listings, ~90 wants. Generator, not hand-typed rows.

### Hard non-goals for the 12-hour build

Do not build, even if it looks easy: a database or ORM · a vector database · maps,
geocoding or routing APIs · real authentication or sessions · email or push delivery ·
payments or deposits · Docker, CI, or deployment config · tests · more than one seeded
campus.

If a pivot appears to require one of these, the correct response is almost always a narrower
reinterpretation that fits in 90 minutes.

---

## 10. Snowflake track

A **separate 30-point prize** (Use of Snowflake 30 · Product Value 25 · Technical 20 ·
Creativity 15 · Demo 10). The handbook warns that bolting on a chatbot won't score. Ours
doesn't have to be bolted on — **the matching problem *is* a vector-search problem**, which
is the honest answer to "why does AI belong in this product."

### Where it genuinely fits, best first

1. **Wants ↔ listing semantic matching** *(the core loop, §7.7)*
   A want reading *"cheap desk, big enough for two monitors, near Laurier"* should match a
   listing titled *"IKEA MICKE 142cm, white"*. Keyword matching cannot do that; embeddings
   can. Embed both sides with `SNOWFLAKE.CORTEX.EMBED_TEXT_768`, rank with
   `VECTOR_COSINE_SIMILARITY`, and feed the result into `category_fit` in the match score.
   **This is the strongest pitch: the AI is the product's core loop, not a feature next to it.**

2. **Camera scan → structured inventory** *(§7.8)*
   `SNOWFLAKE.CORTEX.COMPLETE` on the room photo, structured output into the listing schema.
   The demo's forty-second moment.

3. **Price bands from the hub's own history** *(§7.8)*
   *"$40–65, based on 7 desks sold in this hub."* This is warehouse analytics — literally
   what Snowflake is for — and it makes the "why Snowflake and not just an LLM API" answer
   easy: **the data already lives there, so the inference runs where the data is.**

4. **Scam-signal scoring on listing and message text** *(§7.9)* — weakest of the four; only
   if time is left over.

### Integration shape

Use the **SQL REST API** (`POST /api/v2/statements`) and call the Cortex functions in SQL.
One HTTP call shape covers embeddings, completion, and analytics — one auth path, one error
path, one thing to debug at 6 PM. *(Verify the exact endpoint and auth against the trial
resources handed out at the event; keypair JWT is the usual path.)*

```sql
-- matching, in one statement
SELECT l.id,
       VECTOR_COSINE_SIMILARITY(l.embedding, SNOWFLAKE.CORTEX.EMBED_TEXT_768('e5-base-v2', ?)) AS sim
FROM listings l
WHERE l.hub_id = ? AND l.status = 'live'
ORDER BY sim DESC LIMIT 20;
```

### Provider seam

Wrap it behind one interface, with a `LocalProvider` (any embedding + chat API) alongside
`SnowflakeProvider`, swapped by env var:

```ts
interface MatchProvider {
  embed(texts: string[]): Promise<number[][]>;
  rerank(want: string, candidates: string[]): Promise<{ score: number; reason: string }[]>;
}
```

This exists so that **abandoning the Snowflake track at noon is a one-line change rather
than a refactor** — which is the only reason it's safe to try at all.

### Two rules that decide whether this scores

1. **Precompute embeddings for all seed data at build time and cache them to JSON.** Never
   embed at request time during the demo. A 4-second spinner in a 2-minute demo is fatal.
2. **The match score must feed the ranking, not just render in the UI.** If the AI output
   only displays as a caption next to a result that was ordered by something else, a judge
   will notice, and it scores as a caption. It goes into `category_fit` in §7.7's formula
   and changes the order of the feed.

Call it **retrieve-and-rerank** when explaining it. It is not a "transformer pipeline," and
someone on that judging panel will know the difference.

**Decide by 12:00 whether you're entering this track.** Half-entering costs real hours and
scores nothing. If yes, #1 is the one to build — smallest diff, best story.

---

## 11. Legal and policy

Not decoration — these shape features. Engineering-side summary, **not legal advice**;
verify before any real launch.

**11.1 Subletting needs consent.** Ontario's `Residential Tenancies Act` distinguishes a
**sublet** (tenant returns) from an **assignment** (tenant doesn't), and generally bars a
landlord from unreasonably withholding consent — but the consent step exists, and skipping
it can void the arrangement and cost the arriver their housing.
→ `landlord_consent` is **required with no default**, renders on the listing, and `unknown`
shows a plain-language explainer. We never tell anyone consent isn't needed. It's a
disclosure, never a gate or a penalty.

**11.2 Housing discrimination.** Listing and tenant-selection features touch Ontario's Human
Rights Code (and the FHA in the US). Shared-accommodation exemptions are narrow; the safe
design is not to build the risky surface.
→ **No filters on protected characteristics** — not race, religion, national origin, family
status, disability, or sexual orientation. Ranking never uses any inferred demographic
attribute. Free-text descriptions get an advisory pre-publish nudge on discriminatory
phrasing, not a block.

**11.3 Payments.** Holding or transmitting funds raises money-transmission and FINTRAC
questions entirely out of scope. Deposits are **disclosed**, settled between the parties.
Every payment-adjacent surface carries: *"Relay never handles money. Never send a deposit
before you've seen the place."*

**11.4 Privacy.** School email is a strong identifier — store `email_hash` + domain, keep
the raw address only for sending. Interior photos of a shared unit are personal information
about roommates who never signed up: consent checkbox at upload, faces and documents flagged
for review, and deletion actually purges the photos.

---

## 12. Build plan — against the real schedule

~8.5 hours of build time once pivots, meals and the demo rehearsal are subtracted. The
handbook is explicit: **a smaller working prototype beats 15 unfinished features.**

| Clock | Block | Deliverable |
|---|---|---|
| 08:00–10:00 | **Pivot 1** | ✅ done — repo, scope, these docs |
| **10:00–10:20** | 🔄 **Pivot 2** | Absorb. Update [PIVOTS.md](../PIVOTS.md). Re-plan. **Timebox to 20 min** |
| 10:20–12:00 | **Foundation + feed** | `config.json` (§5), in-memory types, **seed generator** — hand-write 15 listings in real voice first (§9). Design tokens (DESIGN.md §15). **The ledger feed with urgency ranking.** User switcher instead of auth |
| **12:00–12:20** | 🔄 **Pivot 3** | Absorb. Update PIVOTS.md. **Decide the Snowflake track here — in or out** |
| 12:20–14:30 | **Term matching** | Window picker, exchange-zone component, coverage math, "Matches my term" filter, listing detail. *Eat during this block* |
| 14:30–16:00 | **Wants + the AI moment** | Wants checklist, match-on-publish, match inbox. Camera scan → prefilled form. Embeddings **precomputed and cached** (§10) |
| **16:00–16:15** | 🚨 **Pivot 4** | **Narrow or reframe. Do not rebuild.** ≤15 min to decide, response must fit in 90 min |
| 16:15–18:30 | **Absorb + claim** | Pivot 4 response. Claim hold, **exchange-option slot picker** (§7.12), confirmation with a time and a place |
| — | | **← cut line. Everything below is optional** |
| 18:30–19:15 | **Polish** | Empty states, reduced-motion pass, real copy (DESIGN.md §12), 375 px pass, impact dashboard, provenance chain |
| **19:15–20:00** | **Demo prep** | Seed the exact demo path. **Rehearse the 2 minutes out loud, three times.** Finish PIVOTS.md and §13 |

**Protect the last 45 minutes.** A demo that runs beats a feature nobody sees. Three minutes
of judging is not enough time to recover from a broken build.

---

## 13. The pitch — 2 minutes

Structure from the handbook: *started here → learned this → changed this → ended up here →
why it matters.* Do **not** spend 90 seconds on the problem.

> **1. Starting point (20s).** "We started with: students need somewhere to offload furniture
> during co-op terms. We looked at it and realized furniture is the symptom. The real thing
> is that co-op synchronizes an entire city — thousands of students leave and thousands
> arrive on the same two weeks, three times a year — and nothing is built for that. The
> room and the stuff in it leave on the same day."
>
> **2. What we built (20s).** "Relay. Craigslist for co-op students, except everything is
> keyed to the term. Sublet your place, sell or rent out your desk, hand it all off in one
> action."
>
> **3. The pivots (30s).** *(fill from §1 — name the one that hit hardest, what you changed,
> and **one thing you deliberately kept** with the reason. The kept decision is worth as
> much as the change.)*
>
> **4. Demo (40s).**
> - **The pile.** Feed sorted by urgency. *"Every other marketplace shows you the newest
>   post. This shows you what's about to be thrown away."*
> - **The match.** Switch to an arriver six weeks out. Their term bar and the leaver's
>   availability bar overlap — the exchange zone lights up. **100% cover.**
> - **The claim.** One action takes the room and everything in it — then they pick a pickup
>   slot the seller already set, and both sides get a time and a place. *"No 'is this still
>   available'. It's a commitment with a time attached."*
>
> **5. Why it matters (10s).** "Three times a year, a whole city's worth of furniture goes to
> the curb while the people who need it are sitting in another city, searching the wrong way.
> We made the date the primary key."

### Judge Q&A — prepared answers

| Question | Answer |
|---|---|
| Which pivot affected you most? | *(§1)* |
| What did you remove or deprioritize? | Chat as a product, ratings, payments, real auth. Each with a reason — see §2. |
| **What did you intentionally not change?** | **§2, the decision ledger.** Lead with "sort by time pressure, never recency" — it's the whole thesis. |
| Why this technical approach? | One listing skeleton + one ranking function meant pivots landed in seed data and copy, not in the engine. §5. |
| What would you build next? | Condition-report PDFs — the deposit artifact is the reason to use this over a group chat. |
| Hardest decision? | Whether `place` and `thing` share one feed. They do: coupling is the point. |
| Where does Snowflake fit? | §10 — matching *is* vector search; the AI is the core loop, not a feature beside it. |

---

## 14. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Pivot 4 lands at 16:00 and tempts a rebuild** | **Highest** | §5 dry-runs, and a standing rule: narrow or reframe, never rebuild, with 4 hours left |
| Demo breaks during judging | High | Freeze at 19:15, seed the exact demo path, rehearse three times |
| Deposit fraud costs a real student real money | Existential *(post-hack)* | §7.9 ladder, no in-app payments, warnings at the moment of risk |
| Scope: two kinds × two deals in 12 hours | High | One skeleton, one ranking function; divergence confined to detail pages |
| Half-entering the Snowflake track | Medium | Decide at 12:00 — in or out, no middle |
| Cold start | Medium *(post-hack)* | Seed one residence; wants lists work with zero supply |
| Supply and demand peak 6 weeks apart | Medium | That *is* the product (§7.7) |

---

## 15. Open questions

1. **Snowflake track: in or out?** Decide by 12:00. §10.
2. **Does the Stayer see `place` listings?** Liquidity for things, noise for places. Leaning
   things-yes, places-on-filter-only.
3. **Ratings** — deliberately omitted. At low volume they're a fraud magnet and a chilling
   effect. Is *completed handoffs + verification* enough of a trust signal? Leaning yes.
4. **Cross-hub for one city.** Waterloo and Laurier share a rental market almost entirely.
   Hub-local is right for v1 and wrong for this city specifically.
5. **Does an arriver ever pay to hold a claim?** It would cut no-shows and it violates §2.
   Left unbuilt and unresolved on purpose.

---

*Companion: [DESIGN.md](DESIGN.md) — the visual system.*
