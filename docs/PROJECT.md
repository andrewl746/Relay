# Relay — Project Document

**Event:** PivotHacks · Builder's Club, Waterloo ON · 12 hours · 8:00 AM → 8:00 PM
**Starting problem:** Problem 8 — **Resource Sharing.**
**Current user (Pivot 2):** a university student living independently for the first time.
**Companions:** [DESIGN.md](DESIGN.md) — visual system · [../PIVOTS.md](../PIVOTS.md) — live pivot log.

> ### One-liner
> You need a drill for one Saturday afternoon. Someone four doors down owns one, isn't
> using it, and will rent it to you for **$4 a day**. Relay computes where that drill goes
> for the whole term — so it's never in a closet, the owner makes something back, and you
> always know who you hand it to next.

**Relay** is the product. **Chain** is the engine inside it — the part that computes the
route. Two names, one project, and the distinction matters: a marketplace matches one
person to one person, and Relay routes one object through a dozen people across a term.

---

## 1. Read this first

Adaptability & Pivot Response is **30 of 100** — more than Technical Execution (25). Judges
ask, verbatim: *which pivot hit hardest · what did you remove · **what did you intentionally
not change** · why does the product look like this.*

The live answers are in **[PIVOTS.md](../PIVOTS.md)**. §3 below is its standing companion.

---

## 2. The problem

Someone moves into their own place for the first time. Within a month they discover they
need, on separate occasions and each for about one afternoon:

> a drill · a stud finder · a step ladder · a hand truck · a carpet cleaner · an air
> mattress when someone visits · a suitcase · a stand mixer for one birthday · a space
> heater in February · a sewing machine to hem one pair of pants

Buying all of it costs more than the furniture. Renting it from a hardware store means a
deposit, a bus, and a return trip inside business hours. So the actual outcomes are: buy a
$60 drill and use it twice, or don't hang the shelf.

Meanwhile, in the same building, **there are already four drills.** Each one is used twice
a year and sits in a closet for the other 363 days.

### Why it doesn't solve itself

Everyone knows a neighbour would probably lend them a drill. Almost nobody asks, because:

| Friction | What actually happens |
|---|---|
| You don't know who has one | Posting "does anyone have a drill" in a group chat of 200 gets two replies and one is a joke |
| Asking for a favour has a social cost | A free loan is a debt. Most people would rather pay $8 and owe nothing |
| The owner gets nothing and risks their stuff | So they say yes once, grudgingly, and hope you don't ask again |
| Nobody knows when it comes back | The drill leaves and is gone for five weeks |

The friction is not "finding an object." It's that **a one-off loan between strangers has no
structure** — no price, no end date, and no idea where the thing goes next.

---

## 3. Decision ledger — what we are *not* changing

Judges reward intentional non-changes. These are load-bearing; a pivot has to beat the
reasoning, not merely be newer.

| Decision | Why it holds |
|---|---|
| **The date is the primary key** | Has survived every pivot. Furniture at a term boundary, a drill for one Saturday, a sublet — all of them are *windows of time that have to line up* |
| **We compute a route, not a match** | One-to-one matching is a solved, unremarkable problem. The chain is the reason this is worth building |
| **No money moves through us** | Pricing made this tempting to revisit. Relay displays and totals; the two people settle it. Every payment feature is a regulator and hours we don't have |
| **No domain vocabulary in `lib/types.ts`** | Pivot 2 changed the users completely and the type layer didn't notice. That is the whole reason we could absorb it in an hour |
| **The provider seam stays** | Swapping or abandoning a model provider is one env var, never a refactor |
| **Precompute at build time, never at request time** | A 4-second spinner in a 2-minute demo is fatal |

---

## 4. The insight

**An object that gets used twice a year isn't underused by a little. It's idle 99% of the
time, and idleness is the entire cost.**

So don't ask *"who has a drill."* Ask *"where should this drill be, every day, for the next
four months?"* That reframing is the product:

- It turns a lookup into a **schedule**.
- It makes the borrower's job trivial: you get a name, a window, and **who you pass it to
  next**, so the handoff is already arranged before you have it.
- It gives the owner a reason to say yes: the thing earns while they aren't using it.
- And it gives the optimizer something real to minimize — **days in a closet**, which with
  pricing become **dollars**.

---

## 5. Who it's for

**The Borrower** — first year in their own place. Needs a specific object for a specific
afternoon, has never rented anything, and does not want to owe anyone a favour. Their
question is *"can I get a drill by Saturday"*, not *"what's available near me."*

**The Owner** — a student two years older, in the same building, with a drill, a suitcase,
and a carpet cleaner they bought once. They are not trying to run a business. They will say
yes if it's **low-effort, bounded, and pays something.** Their fear is that the thing leaves
and never comes back.

**Relay's job** is to make the owner's yes cheap and the borrower's ask structured. Nobody
negotiates; the schedule already exists.

---

## 6. Pricing

New in Pivot 2, and it turned out to fuse with the engine rather than sit beside it.

### How it works

- **The owner sets a daily rate** when they list an item. Relay suggests one from the item's
  class — `config.json → pricing.ratesByClass`.
- The borrower pays **`rate × days`**, agreed up front, with the return date already set by
  the chain.
- **Relay never handles the money.** We display the amount, total it, and record it against
  the handoff. The two people settle it between themselves. This is principle 3 in §3 and it
  is not a placeholder for a payments integration — it's the decision.

Suggested defaults, per day:

| Class | Rate | | Class | Rate |
|---|---|---|---|---|
| cleaning (carpet cleaner) | $12 | | garment (sewing machine) | $5 |
| moving (hand truck) | $8 | | climate (space heater) | $5 |
| av (projector) | $8 | | tools (drill) | **$4** |
| outdoor (camping stove) | $6 | | travel (suitcase) | $3 |
| party (stand mixer) | $6 | | bike, office | $3 |
| ladder, guest | $5 | | power, safety | $2 |

### The economics, from the actual seeded network

Measured against `data/dataset.json`, at the $4 default:

```
90 items · 34 currently earning · 129 handoffs · longest chain 13 holders
1,264 rented days    =  $5,056 earned
9,716 idle days      =  $38,864 left on the table
                        $149 average per earning item, per term
```

**$149 per item is the number that sells this.** A $60 drill pays for itself two and a half
times over in one term, across six borrowers, while the owner still uses it whenever they
want. That's the pitch to the supply side, and supply is the hard side of this market.

> **Honesty about "idle."** Idle days are not pure waste — the owner is entitled to their own
> drill, and an item at 100% utilization is one the owner can never use. So the KPI is **not**
> utilization. It's *did this thing pay for itself*, and *how many days did it spend in a
> closet that someone was actively asking for*. Don't put "11.5% utilization" on screen; it
> measures the wrong thing and invites the wrong question.

### Pricing and the objective — the part that matters

The DP already minimized idle days (`λ · gapDays`). With a rate, **λ stops being a tuned
magic constant and becomes the item's actual daily rate.** Foregone revenue *is* the cost of
a gap. Proposed objective, in dollars:

```
hopValue = matchScore × rate × hopDays     # confidence-discounted revenue
gapCost  = rate × gapDays                  # revenue lost to a closet
value    = Σ hopValue − Σ gapCost − μ$ × crossAreaMoves
```

`matchScore` stays load-bearing — without it the optimizer routes to whoever books the
longest window regardless of fit. Read it as a confidence discount: *"we're 77% sure this
is the right object for this person, so count 77% of the rent."*

> **Status: specced, not built.** It's an isolated ~30-minute diff to `lib/assign.ts`
> (multiply score by `rate × days`, replace `λ` with the rate). **Do it after Pivot 3**, not
> before — the current constants are tuned and working, and Pivot 3 may moot the change.
> Until then, pricing is display-only and the objective is unchanged.

---

## 7. Architecture — Relay over Chain

```
┌────────────────────────── RELAY · the product ──────────────────────────┐

  /            need something        → one answer: who, where, which days,
                                       and who you hand it to next
  /handoffs    what you owe, by when → turns a chain into an obligation
  /shelf       what you lend / hold  → "your drill: 6 people, $149, 0 closet days"
  /network     the board (exists)    → proof it's a route, not a lookup
        │                                    │
        │ server actions (write)             │ RSC (read)
        ▼                                    ▼
  lib/relay/actions.ts ───────────► lib/relay/store.ts            ← NEW
    postNeed · lendItem                 data/runtime.json
    acceptHandoff · markReturned             │
        │        merges seed rows + user rows │
        ▼                                    ▼
┌────────────────────── CHAIN · the engine, untouched ────────────────────┐
   lib/providers   embed / rerank          ← the seam (stub | snowflake)
   lib/match       retrieve top-K, rerank
   lib/assign      interval-scheduling DP + greedy across items
   lib/vector      cosine
└─────────────────────────────────────────────────────────────────────────┘
        ▲
        │ build-time precompute
   scripts/seed → scripts/prepare → data/{dataset,matches}.json
```

### The one new idea: `lib/relay/store.ts`

It merges user-created needs and items into the seeded dataset before handing it to the
engine. **Chain never learns which rows came from a person and which came from the seed** —
it just receives a larger `Dataset` and `MatchTable`. That single seam is what turns a batch
pipeline into a backend.

It's cheap because the whole match path for one new row is **2.6 ms, measured**: embed the
text, retrieve over all 90 items, rerank, append the pairs, persist, rerun the DP.
Synchronous, no network, no spinner.

```
postNeed(text, from, to)
  → StubProvider.embed(text)                    ~0.1ms
  → cosine over items, take top 10              ~0.4ms
  → rerank → { score, reason } per candidate    ~2ms
  → append pairs to matches, append need to runtime.json
  → assignAll() → the answer
```

### Why the read path stays precomputed

Embedding and reranking the *seeded* corpus happens in `scripts/prepare.ts` and lands in
JSON. Only the DP runs live, which is why "remove this person" recomputes in ~10 ms. If we
swap in a real model provider, the seed stays precomputed and only user-generated rows pay
the network cost — one row at a time, on a user action that already feels like work.

### Identity

`currentUser()` from a cookie, plus a person picker in the header. **No auth.** ~20 minutes,
and it demos better than a login screen. Not a shortcut we're hiding — say it in the Q&A.

### Stack notes

Next.js 16.3.5 App Router, React 19, Tailwind v4, TypeScript. No database: seed loads from
JSON into memory, `n` is in the low hundreds. No vector DB: cosine over an in-memory array
at n=90 is microseconds.

> Next 16 renamed `middleware.ts` → `proxy.ts` and moved caching to Cache Components
> (`cacheComponents: true` + `use cache`). Read `node_modules/next/dist/docs/` before
> touching either — see [AGENTS.md](../AGENTS.md).

---

## 8. The engine

What Chain actually computes, and what we may honestly claim about it.

**Stage 1 — embed.** Item and need text → vectors. Precomputed for seed data, live for user
rows. `StubProvider` is a hashed bag of features (token hashes, character trigrams for typo
tolerance, and a small concept table), *not* a language model. Say that plainly.

**Stage 2 — retrieve.** Cosine, top 10 per need. Optimizes **recall, not precision** — junk
in the top 10 is expected and is what stage 3 is for.

**Stage 3 — rerank.** One provider call per need over its 10 candidates, returning a score
in [0,1] and a short reason string (*"matches on stand, mixer, same party class"*). The
reason strings are shown in the UI — they're the honest surface of the model's output.

**Stage 4 — assign.** Weighted interval scheduling, per item, by dynamic programming:

```
sort candidate needs by needUntil ascending
dp[i] = max over j where needUntil[j] ≤ needFrom[i] of
          dp[j] + score[i] − λ·gapDays(j,i) − μ·distance(j,i)
```

with two hard constraints from Pivot 2: `maxIdleDays` (nobody has storage, so an over-long
gap makes a chain *impossible*, not merely expensive) and `minMatchScore` (a hop has to
actually solve someone's problem).

Across items: iterate **scarcest-first**, run the DP per item, mark needs consumed.

> **Say this exactly when asked:** *exact within an item, greedy across items.* Do not claim
> global optimality. O(n²) in candidate needs per item, which is dozens — this is
> microseconds and does not need optimizing.

**Call it retrieve-and-rerank**, not "a transformer pipeline." Someone on that panel will
know the difference.

---

## 9. The product — screens

| Screen | The job | The line that earns it |
|---|---|---|
| **`/` need something** | Plain-language box + when you need it → one answer | *"Aditi has one. Beechwood, 4 min. Free Thu–Sun, $16 for 4 days. **You'd pass it to Wes on Sunday.**"* |
| **`/handoffs`** | The queue of what you owe and when | *"Give the drill to Wes by Sunday."* Turns a diagram into an obligation |
| **`/shelf`** | What you lend, with its computed schedule; what you're holding | *"Your drill: booked through 6 people, $149 this term, 0 days in a closet."* |
| **`/network`** | The existing board | Proof it's a computed route. Demo it **second**, as the explanation |

**The answer card is the product.** Everything else supports it. The third line — *who you
pass it to next* — is the one thing no marketplace, lending library, or group chat can say,
and it should be the most prominent element on the card after the name.

---

## 10. Data model

Runtime shape. `lib/types.ts` is unchanged from Pivot 1 and should stay that way.

```ts
Person  { id, label, location, awayFrom, awayUntil }
Item    { id, holderId, rawText, embedding, freeFrom, freeUntil }
Need    { id, personId, rawText, embedding, needFrom, needUntil }

Candidate { needId, cosine, matchScore, reason }
Hop       { needId, personId, from, to, matchScore, reason, gapDays, distance }
Chain     { itemId, hops[], totalGapDays, totalDistance, totalMatchScore, value }
```

### Additions for pricing and the write path

```ts
Item      + ratePerDay: number          // owner-set; default from pricing.ratesByClass
          + kind?: 'thing' | 'place'    // defaults to 'thing'; see §11

Hop       + cost: number                // ratePerDay × days, derived, never stored

Handoff   {                             // a materialized Hop with a state — NEW
            id, itemId, fromPersonId, toPersonId,
            from, to, cost,
            state: 'proposed' | 'accepted' | 'held' | 'returned'
          }
```

`data/runtime.json` holds user-created `needs`, `items`, and `handoffs`, plus the match
pairs generated for them. Everything else stays in the precomputed seed files.

> A `Handoff` is just a `Hop` the two people have agreed to. The DP keeps proposing hops;
> accepting one pins it. Don't build a second scheduler.

---

## 11. Where this goes next

**Rooms.** The extension the model is already shaped for, and the most valuable one.

A place to live is an item that doesn't move. Everything in the engine applies unchanged:

| Concept | A drill | A room |
|---|---|---|
| `freeFrom` / `freeUntil` | while the owner doesn't need it | while the tenant is away |
| `gapDays` | days in a closet | **days vacant** |
| `ratePerDay` | $4 | rent |
| `distance` penalty | crossing neighbourhoods | **always 0** — it doesn't move |
| `maxIdleDays` | nobody has storage | not applicable |
| a chain | 13 borrowers over a term | subletters, term after term |

So a student renting out their room over a co-op term is **the same computation with bigger
numbers** — and the idle-day cost is rent, which is the largest recurring number in a
student's life. `config.json → kinds.reserved` already names `place`; `Item.kind` is
specced above and defaults to `'thing'`.

**Not v1 scope.** It needs the legal surface that Pivot 1 specced and Pivot 2 retired
(landlord consent, the sublet/assignment distinction, fair-housing constraints on listing
and selection — see PIVOTS.md, *Retired scope*). But nothing in the engine or the data model
blocks it, and that is a deliberate property rather than an accident. It is also the correct
answer to *"what would you build next with more time."*

**Also queued:** condition photos at handoff (the deposit artifact, and it matters more for
rooms than drills) · item provenance · a real model provider (§13).

---

## 12. Pivot-proof surfaces

Pivots change *who* you serve and *what matters*. The system is split so that lands in data,
not in the engine.

**Core — do not touch:** `lib/types.ts` · the DP recurrence · the provider interface · the
build-time/request-time split.

**Configuration — minutes:** `config.json` (vocabulary, penalties, constraints, pricing) and
`scripts/seed.ts` phrasing pools.

| Pivot shape | Response | Touched | Budget |
|---|---|---|---|
| New user group | Edit `config.json`, reseed | config + seed | **15 min** ✅ *used at Pivot 2* |
| New constraint (cost, trust, accessibility) | New term or cap in the objective | `lib/assign.ts` | **20 min** ✅ *used at Pivot 2* |
| New stakeholder | A role reading the same chains | one view | 20 min |
| Remove a feature | Drop rerank; chains still compute on raw cosine | one stage | **5 min** |
| Scope cut | Demo one chain instead of the network | 5 min |
| Monetization / pricing | Rate per item, revenue in the objective | §6 | **30 min** |

**If a pivot can be absorbed in config, seed and copy, absorb it there** — and say so out
loud in the pitch. That's the adaptability point, and it's worth more than the feature.

---

## 13. Snowflake track

Separate 30-point prize (Use of Snowflake 30 · Product Value 25 · Technical 20 · Creativity
15 · Demo 10). The handbook warns that bolting on a chatbot scores nothing. Ours isn't
bolted on: **retrieval and reranking are the product's core loop**, and they already sit
behind `MatchProvider`.

Best fit, in order:

1. **Rerank** — `SNOWFLAKE.CORTEX.COMPLETE` over the 10 retrieved candidates, returning a
   score and a reason. Highest value: the stub's concept classes are coarse, and this is
   where that shows (§15).
2. **Embeddings** — `EMBED_TEXT_1024` + `VECTOR_COSINE_SIMILARITY`, replacing the hashed bag
   of features wholesale.
3. **Rate suggestion** from the network's own completed-handoff history — warehouse
   analytics, which is what Snowflake is actually for, and it makes "why Snowflake and not
   just an LLM API" easy to answer: *the data is already there, so the inference runs where
   the data is.*

**Two rules that decide whether it scores:**

- **Precompute the seed corpus; never embed at request time during the demo.**
- **The score must feed the DP, not just render.** It already does — it's `score[i]` in the
  recurrence. Say that; it's the difference between AI and a caption.

**Decide at Pivot 3, in or out.** The seam makes it a one-file change either way, which is
the only reason it's safe to attempt at all.

---

## 14. Build plan

~7 hours of build once pivots and demo prep are subtracted. Everything below the cut line is
genuinely optional.

| | Block | Est |
|---|---|---|
| 1 | Design tokens + fonts (DESIGN.md §14) — stop looking like default Tailwind | 45m |
| 2 | `lib/relay/store.ts` + `currentUser()` + person picker | 1h |
| 3 | **`/` need composer → live match → answer card** | 1.5h |
| 4 | `/handoffs` queue + accept action | 1h |
| 5 | `/shelf` + lend-an-item form, with rate | 45m |
| 6 | Restyle `/network`, wire nav | 45m |
| — | **← cut line. The demo lands without anything below** | |
| 7 | Pricing into the objective (§6) · real provider (§13) · condition photos | — |
| — | **19:15–20:00 — freeze, seed the demo path, rehearse the 2 minutes three times** | |

**Protect the last 45 minutes.** Three minutes of judging is not enough time to recover from
a broken build.

---

## 15. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Stub match quality** — *"I need a drill"* currently ranks a screwdriver set (0.598) above an actual drill (0.585) | **High** — it's the demo's money shot | Hand-tune the `tools` class, or wire a real provider (§13). The seam exists for exactly this |
| Pivot 4 at 16:00 tempts a rebuild | High | §12 budgets; response must fit in 90 minutes |
| Demo breaks during judging | High | Freeze 19:15, seed the exact path, rehearse three times |
| "34/90 placed" reads as failure | Medium | Reframe: 56 items nobody needs *this term*. Lead with $149/item, never with utilization (§6) |
| Write path corrupts `runtime.json` mid-demo | Medium | Keep a pristine copy; one command to restore |
| Half-entering Snowflake | Medium | Decide at Pivot 3 — in or out, no middle |

---

## 16. The pitch — 2 minutes

*Started here → learned this → changed this → ended up here → why it matters.* Do **not**
spend 90 seconds on the problem.

> **1. Start (20s).** "Problem 8, resource sharing. We started with students throwing out
> furniture at co-op move-out."
>
> **2. The pivot (30s).** "Then our user became someone living on their own for the first
> time — and that changed what an *item* is. Not furniture you inherit at a term boundary.
> The drill you need for one afternoon and can't justify buying. In the same building there
> are already four drills, each used twice a year." *(Then: one thing you deliberately kept
> — §3. That's worth as much as the change.)*
>
> **3. What we built (20s).** "Relay. You say what you need and when. We don't just find a
> drill — we compute where that drill goes for the whole term."
>
> **4. Demo (40s).**
> - Type *"need a drill saturday, hanging shelves."* → **Aditi has one, Beechwood, Thu–Sun,
>   $16. You pass it to Wes on Sunday.**
> - `/shelf`: **"Your drill: 6 people, $149 this term, 0 days in a closet."** *"A $60 drill
>   pays for itself two and a half times, and she still uses it whenever she wants."*
> - `/network`: the board. Remove a person → the chain breaks, storage days jump, recomputed
>   in 10ms. *"That's the optimizer, live."*
>
> **5. Why it matters (10s).** "Every building already owns everything in it. The problem
> was never supply — it was that nobody knew the schedule. We computed the schedule."

### Judge Q&A

| Question | Answer |
|---|---|
| Which pivot hit hardest? | Pivot 2 — it changed what an object *is*, which changed the clock, the constraints, and the business model. PIVOTS.md |
| What did you remove? | An entire marketplace spec — listings, claims, price decay, bundles, fraud ladder. PIVOTS.md *Retired scope* |
| **What did you intentionally not change?** | `lib/types.ts`, not one line. The DP recurrence. The provider seam. "No money moves through us." §3 |
| Why this technical approach? | Domain vocabulary lives in `config.json`, so a new user group is a config edit and a reseed — 15 minutes, and we used it |
| Is it optimal? | **Exact within an item, greedy across items.** Not globally optimal |
| Where's the AI? | Retrieve-and-rerank. The score is `score[i]` in the DP recurrence — it changes the route, it isn't a caption |
| What would you build next? | Rooms. A place to live is an item that doesn't move; the engine is unchanged and the idle-day cost becomes rent. §11 |
| Hardest decision? | Keeping the chain engine instead of the marketplace we'd fully specced |

---

## 17. Open questions

1. **Snowflake — in or out?** Decide at Pivot 3. §13.
2. **Pricing into the objective** — specced in §6, ~30 min, deliberately deferred until after
   Pivot 3.
3. **Does the borrower ever pay to hold a booking?** It would cut no-shows and it violates
   §3. Left unbuilt and unresolved on purpose.
4. **What happens when a chain breaks in real life** — someone doesn't hand it on. The DP
   assumes compliance. Right answer is probably that the next hop just re-runs, but we
   haven't designed it.

---

*Retired scope and the full pivot history: [PIVOTS.md](../PIVOTS.md).*
