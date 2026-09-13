# TODO — what's done, what isn't

Verified against the working tree, not assumed. Last checked at commit `7403d1b`.

**The one-line summary:** the engine is real and tested, auth is real, the write
path is real — but **the UI is still wired to hardcoded mock data**, so nothing a
user does on screen persists. That single gap is the highest-value work left.

---

## ✅ Done

### Engine (`lib/`, `scripts/`, `data/`)
- [x] Four-stage pipeline: **embed → retrieve → rerank → assign**
- [x] Weighted interval scheduling DP, greedy across items, **12ms** for the network
- [x] Provider seam — `stub` (offline, default) and `snowflake`, swapped by env var
- [x] Stub matcher: hashed tokens + char trigrams + concept classes
- [x] **Rent and sale.** Sale = a chain of length 1; ownership transfers, buyer can relist
- [x] **Loans return to the owner**; a *direct handoff* is the optimization when two loans are back to back (currently 51 direct / 43 via owner)
- [x] Pricing: per-day for loans, one-off for sales; `earnings()` and `idleDays()`
- [x] Pivot 3 constraints: Haversine distance, availability, pickup-window overlap, urgency multiplier
- [x] Deterministic seed — 60 people / 90 items / 231 needs / 2,310 scored pairs
- [x] Realistic loan windows (70% are 1–3 days)
- [x] `lib/relay/store.ts` — merges seed + runtime into one dataset for the engine
- [x] `lib/relay/actions.ts` — `postItem` / `addNeed` / `acceptHop`, each validating its own input
- [x] `lib/relay/runtime.ts` — JSON persistence, survives a dev restart
- [x] Checks: `npm run check` (provider), `npm run check:store` (write path end-to-end)

### Auth & onboarding
- [x] Supabase Google OAuth, with graceful fallback to the demo picker when unconfigured
- [x] `profiles` table + RLS + auto-create trigger (`0001_init.sql`, `0002_split_address.sql`)
- [x] Onboarding flow: profile → verify → interests
- [x] University email OTP — SHA-256 hashed, 10-min expiry, 5 attempts
- [x] `proxy.ts` refreshes the session cookie on every request *(Next 16: `proxy.ts`, not `middleware.ts`)*
- [x] Dev login now sets an **httpOnly** cookie server-side

### Design
- [x] Corrugated kraft theme — kraft ramp, flute texture, hard offset edges, stencil type
- [x] Kandinsky accents: cobalt / vermilion / cadmium, contrast-checked
- [x] `motion` 13.2 installed; `Conveyor` / `Crate` / `Stamp` / `PressBox` / `FlapIn` / `SlideUp`
- [x] Hero uses CSS keyframes, not JS — never depends on hydration
- [x] Landing page rewritten for students; fabricated stats removed
- [x] Fonts self-hosted (`app/fonts/`) — no build-time Google fetch
- [x] Logo wired in (`public/relay-black.png`)

### Docs
- [x] `HANDOFF.md`, `SETUP.md`, `PIVOTS.md` (1–3 filled), `docs/PROJECT.md`, `snowflake/schema.sql`

---

## 🔨 The critical gap

- [ ] **Repoint `lib/hub/data.ts` from `mock-data.ts` to `lib/relay/store.ts`**
      Its functions are already `async` for exactly this.
      Mapping: `Listing`→`Item`, `Want`→`Need`, `Claim`/`TimeSlot`→`Hop`, `User`→`Person`.
      **The DP already computes the pickup slot the claim flow currently fakes** — that
      is the integration that makes the engine visible in the product.
- [ ] **Wire the forms to `lib/relay/actions.ts`.** Right now every form collects React
      state, shows a fake confirmation, and writes nothing:
  - [ ] `post-item-form.tsx` → `postItem`
  - [ ] `wants-list.tsx` → `addNeed`
  - [ ] `claim-form.tsx` → `acceptHop`
  - [ ] `room-bundle-form.tsx` → decide: wire or delete (bundles are retired scope)
- [ ] **Delete `lib/hub/mock-data.ts`** once nothing imports it
- [ ] Reconcile the duplicate models — `lib/hub/types.ts` shadows `lib/types.ts`

---

## 📋 Not done

### Product
- [ ] `/handoffs` reads hardcoded rows — should read accepted hops
- [ ] Notifications are hardcoded
- [ ] No "no match" state (nearest alternative windows) — specced, never built
- [ ] Item history / provenance — data model supports it, no UI
- [ ] Condition photos at handoff
- [ ] Relisting a bought item
- [ ] Impact numbers (items diverted, money saved)

### Engine
- [ ] **Pricing into the DP objective.** Specced in `docs/PROJECT.md §6`:
      `hopValue = matchScore × rate × days`, `gapCost = rate × gapDays`.
      ~30 min, isolated to `lib/assign.ts`. Deliberately deferred — current constants are tuned
- [ ] Snowflake vector search as the retrieval stage (see Blocked)

### Design
- [ ] `/chains` board still uses raw Tailwind neutrals/emerald/rose — not re-tokened
- [ ] `app/(hub)` pages not visually reviewed since the retheme
- [ ] `app/(auth)/github-ui.css` retinted but not reviewed
- [ ] Mobile pass at 375px
- [ ] `docs/DESIGN.md` **still describes the dark tactical theme** — contradicts what's built

### Ops
- [ ] `PIVOTS.md` Pivot 4 entry (16:00) — blank
- [ ] Demo script + rehearsal
- [ ] Team names in README

---

## ⛔ Blocked

- [ ] **Snowflake Cortex.** `AI_EMBED`, `AI_COMPLETE`, `EMBED_TEXT_768` and
      `CORTEX.COMPLETE` are all gated on trial accounts — verified on both the 30-day
      *and* the 120-day student trial. `VECTOR_COSINE_SIMILARITY` works.
      **Action: ask an organizer.** If it's gated for everyone, every Snowflake-track
      team is blocked.
- [ ] **Keys.** `.env.local` has `SNOWFLAKE_ACCOUNT`, `SNOWFLAKE_PAT` and
      `BACKBOARD_API_KEY` **empty**, and the Supabase vars **missing entirely**.
      Until Supabase is filled in, sign-in is the demo picker. See `SETUP.md`.

---

## ⚠️ Known issues

| Issue | Notes |
|---|---|
| Two data models coexist | `lib/types.ts` (engine) vs `lib/hub/types.ts` (UI). Resolve by deleting the latter |
| `lib/hub/scheduling.ts` is a stub | Its own comment says so: *"the interval DP in lib/assign.ts is the real version"* |
| `loginAction` accepts any email | Comment says university restriction moved to onboarding; `isUniversityEmail()` exists and is used only in the verify step |
| Node < 22.18 | Scripts pass `--experimental-strip-types`. Run via `npm run`, never bare `node` |
| Mixing embedding providers corrupts silently | Stub 256d vs Cortex 768/1024d; `cosine()` uses `min(len)`. Always reseed after a swap |
| `docs/DESIGN.md` is stale | Describes the abandoned dark theme |

---

## Suggested order

1. Fill in Supabase keys → real sign-in *(15 min, `SETUP.md`)*
2. Repoint `lib/hub/data.ts` at the engine *(~1h — the big one)*
3. Wire post + wants forms to the real write path *(~45 min)*
4. Re-token `/chains` and sweep the hub pages *(~30 min)*
5. Update `docs/DESIGN.md` to the kraft theme *(~15 min)*
6. Pricing into the DP objective *(~30 min)*
7. **Freeze, seed the demo path, rehearse the two minutes three times**
