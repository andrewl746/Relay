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

**What we considered:**

**What we chose:**

**What we deliberately did NOT change, and why:**

**Time spent adapting:**

> Also decide here: **Snowflake track, in or out.** Half-entering costs real hours and
> scores nothing. The provider seam means it's a one-file change either way.

---

## Pivot 4 — 16:00 · four hours left

**What dropped:**

**What we considered:**

**What we chose:**

**What we deliberately did NOT change, and why:**

**What we cut to protect the demo:**

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
