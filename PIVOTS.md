# Pivot log

**Live document. Update at 10:00, 12:00 and 16:00, while it's fresh.**

Adaptability & Pivot Response is **30 of 100 points** — more than Technical Execution (25).
Judges ask these questions directly, and most teams have no answer. Four minutes of upkeep
per pivot is the cheapest scoring on the board.

The last field is worth the most.

---

## Pivot 1 — 08:00 · team-specific

**What dropped:**
Problem 8 — Resource Sharing. Useful items sit unused while someone nearby needs the same
thing. Applied to a university campus: students need somewhere to offload furniture and
school materials during co-op terms.

**What we considered:**
A campus marketplace with listings, prices and claims, keyed to co-op term dates — fully
specced, roughly 1,100 lines. A donation board. A computed handoff-chain engine that
sequences one item through many people over time.

**What we chose:**
Both, in layers. **Relay** is the product; **Chain** is the engine underneath it. The
marketplace spec gave us the problem framing and the user research; the chain engine gave
us the thing that is actually hard and actually different. A marketplace matches one person
to one person. Chain routes one object through a dozen people across a term.

**What we deliberately did NOT change, and why:**
The date stayed the primary key. Every version of this product — furniture at a term
boundary, a drill for one Saturday, a sublet — is a question about *windows of time that
have to line up*. That's the through-line and it has survived every pivot since.

> **Correction (12:00):** an earlier draft of this entry said the chain engine was *"not
> pursued."* That was wrong when it was written — the engine was already being built on a
> parallel branch and is now the core of the project. Left visible rather than quietly
> edited, because a pivot log you silently rewrite is worth nothing.

---

## Pivot 2 — 10:00

**What dropped:**
The primary user is now **a university student living independently for the first time.**
Not someone rotating out on co-op — someone who has just moved into their own place and
has never done any of this before.

**What we considered:**
Keeping the co-op marketplace and changing only the copy. Narrowing to a pure wants-board.
Changing what an *item* fundamentally is.

**What we chose:**
The third, and it was the right read. For someone furnishing a first apartment, the painful
objects aren't the ones you inherit at a term boundary — they're the ones **you need once
and cannot justify buying.** A drill for one afternoon of shelves. A carpet cleaner before
an inspection. A suitcase twice a year. So:

- **The object changed.** Item pools became drill, dolly, carpet cleaner, projector, stand
  mixer, suitcase, ladder. 15 hand-written descriptions rewritten in lending voice.
- **The clock changed.** Windows went from 4-month terms to days and weeks; people now stay
  put for the term instead of rotating out. `config.json` + reseed, the pre-decided
  "new user group" response, ~15 minutes as budgeted.
- **The constraints changed.** `maxIdleDays` became a *hard* cap between holders — a
  first-year's apartment has no storage, so an over-long gap makes a chain impossible
  rather than merely expensive. `minMatchScore` floors each hop so recall-stage noise can't
  inflate the objective. λ and μ both raised, because a day of storage costs more when the
  windows are days.
- **Pricing arrived.** Owners set a daily rate. This turned out to *fuse* with the engine
  rather than sit beside it: the DP already minimized idle days, and idle days are now
  literally foregone revenue. The objective stopped being an abstract score and started
  being dollars.

**What we deliberately did NOT change, and why:**

- **`lib/types.ts` — not one line.** That was the entire point of keeping domain vocabulary
  out of the type layer. The users changed completely and the types didn't notice.
- **The DP itself.** A new user group is a data problem, not an algorithm problem. We
  changed the constants, not the recurrence.
- **The provider seam.** Still one env var to swap or abandon a model provider.
- **"No money moves through us."** Pricing made this tempting to revisit. We didn't —
  Relay displays and totals the amount; the two people settle it between themselves.

**Time spent adapting:** ~1h for config + reseed + constraints; the product reframing
(Relay over Chain, pricing) came after.

---

## Pivot 3 — 12:00

**What dropped:**
The simplistic binary location matching (same neighbourhood vs different). The assumption that anyone is available to pick up or hand off an item at any time.

**What we considered:**
Leaving availability to text processing, hoping the NLP would catch "only mornings". Leaving distance as abstract.

**What we chose:**
Hard constraints on time and space. 
- **Distance:** Added real-world mock coordinates for neighbourhoods and introduced a Haversine distance penalty.
- **Availability & Pickup Windows:** An item handoff simply cannot happen if either the giver or receiver is marked as "away", or if they do not share an overlapping "pickup window" (morning, afternoon, evening).
- **Urgency:** Needs now have urgency ('low', 'medium', 'high'), applying a scaling multiplier to the DP match score to prioritize urgent requests.

**What we deliberately did NOT change, and why:**
The `chainForItem` DP core structure. The DP already elegantly loops through intervals. By injecting `sharePickupWindow` and `isAvailable` checks right inside the DP transitions, impossible chains get structurally pruned (`-Infinity`) without redesigning the algorithm. The date is still the primary key.

**Time spent adapting:**
~25m on typing constraints, config and algorithm updates.

> Also decide here: **Snowflake track, in or out.** We are wiring Snowflake.


---

## Pivot 4 — 16:00 · four hours left · FINAL

**What dropped:**
> *"Your solution must now support voice input for one meaningful part of the experience.
> The user should be able to complete at least one core action by speaking instead of
> typing or clicking through a form. The voice interaction must affect actual product
> functionality. A microphone button that records audio without using it does not count."*

**What we considered:**

1. **Voice-post an item.** Speak "lending my drill, four dollars a day, pickup at V1" and
   have it fill the posting form. Most impressive, and the one most likely to die on
   stage: it needs the spoken sentence parsed into five typed fields, and our LLM
   extraction path (Backboard) is blocked on billing.
2. **A voice assistant screen.** A page you talk to. This is the bolted-on chatbot shape
   the handbook explicitly says scores badly, and it is the thing the pivot text is
   warning against — a microphone that produces a transcript and no product effect.
3. **Voice into the two inputs that already drive the engine** — the board search and
   your wants list.

**What we chose:**
The third, in about 40 minutes of the 90 we had budgeted.

The two text inputs in this app are not incidental: the search box is the query side of
the matcher, and a row on your wants list is literally a `Need` the routing engine plans
against. So speech goes straight into those fields and then **submits the form**. Saying
*"bookshelf"* runs the real search and returns the bookcase; saying *"somewhere to put my
books"* puts a real row on your list that the matcher then works on. Delete the button and
the only thing that changes is that you have to type — which is the test the pivot text
actually set.

Implementation is the browser's own `SpeechRecognition`. No dependency, no API key, no
audio uploaded to us, nothing recorded or stored, and it degrades to nothing at all on
Firefox rather than sitting there dead. `components/hub/voice-input.tsx`, ~180 lines
including the types the DOM lib doesn't ship.

The one genuinely fiddly part is documented in the file: assigning `.value` on a React
controlled input is invisible to React, so the transcript is written through the prototype
setter and dispatched as a real `input` event — which is why it works on both the
uncontrolled search field and the controlled wants field with no per-form special-casing.

**What we deliberately did NOT change, and why:**

- **No new dependency, no new service.** Adding a speech SDK at 16:00 on a 12-hour build
  is how you lose the demo. The platform already had it.
- **No redesign around voice.** The pivot text says outright you don't need to; a second
  input method on two fields is the whole change. Every other screen is untouched.
- **The engine.** Voice is an input method. It produces the same `Need` text a keyboard
  produces, and the DP never learns where the words came from — the same reason Pivot 2
  cost an hour: the layers don't know about each other.

**What we cut to protect the demo:**

- **Voice-driven posting** (option 1). It needs entity extraction we can't reach today.
- **Continuous / wake-word listening.** One press, one sentence, one action.
- **Server-side transcription** as a fallback for Firefox. The button hides itself instead.

**Time spent adapting:** ~40 minutes, inside the pre-decided 90-minute cap.

> **Rule decided in advance, not at 4 PM:** whatever Pivot 4 says, the response must be
> finishable in **90 minutes**. With four hours on the clock the correct move is almost
> always *narrow* or *reframe*, never *rebuild*. Spend ≤15 minutes deciding, then commit.

---

## Retired scope

Removed deliberately, kept here because "what did you remove and why" is a scored question.
Full text is in git history at commit `87a4eea` if anyone wants it.

| Retired | Why |
|---|---|
| Sublets, leases, landlord consent, Ontario RTA handling | Pivot 2's user has just signed their first lease; they aren't subletting anything. Housing returns as a *later* item kind, not as v1 scope — see PROJECT.md §11 |
| Price decay ladders toward free | Built for "the alternative is a dumpster." A rental has no dumpster — the owner keeps the drill. Replaced by a flat daily rate |
| Claims, holds, expiry-driven urgency feed | A marketplace ranks listings. Relay computes a route; there is no feed to rank |
| Room bundles | The bundle was one leaver's whole room. Wrong unit for lending |
| Fraud/scam ladder, verified-listing stamps | Proportionate to $2,400 deposit fraud. Not to a $4/day drill |
| Condition photos, item provenance | Good ideas, still good ideas. Below the cut line on time, not on merit |

---

## Standing answers

**What we did not change, across the whole day** — [docs/PROJECT.md §3](docs/PROJECT.md),
the decision ledger. Lead with *"the date is the primary key"*; it's the one thing that has
survived every pivot.

**Pre-decided pivot responses** — [docs/PROJECT.md §12](docs/PROJECT.md).
