# Setup — getting every service working

Four external services. **Only Supabase is required to run the app**; the other
three degrade gracefully and the app keeps working without them.

| Service | What it does here | Required? | Time |
|---|---|---|---|
| **Supabase** | Google sign-in, profiles, onboarding state | **Yes** — no real auth without it | ~10 min |
| **Resend** | Emails the 6-digit university-email code | Only for `.edu` verification | ~5 min |
| **Backboard** | Pulls urgency + pickup windows out of free text | No — falls back to `medium` | ~5 min |
| **Snowflake** | Embeddings / rerank / vector search | No — falls back to the local stub | ~15 min |

Everything lives in **`.env.local`** (gitignored). Start from `.env.example`.

> **Current state:** `.env.local` exists but `SNOWFLAKE_ACCOUNT`, `SNOWFLAKE_PAT`
> and `BACKBOARD_API_KEY` are **empty**, and the Supabase variables are **missing
> entirely**. So right now: dev-login only, stub matching, no email.

---

## 1. Supabase — sign-in and profiles

Powers Google OAuth, the `profiles` table, and the onboarding steps. Without it,
`getCurrentUser()` silently falls back to the demo user-picker at `/login/demo`,
which is why the app still runs today.

### 1.1 Create the project

1. [supabase.com](https://supabase.com) → **New project**.
2. Pick a region close to you; save the database password somewhere.
3. Wait for it to finish provisioning (~2 min).

### 1.2 Copy the two keys

**Settings → API**, then add to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<the anon / public key>
```

Both are `NEXT_PUBLIC_` and that is correct — the anon key is *meant* to be public.
Row-level security is what protects the data, and the migration below enables it.
**Do not** put the `service_role` key in this file; it bypasses RLS entirely.

### 1.3 Run the migrations

**SQL Editor → New query.** Paste and run, in order:

1. [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) —
   `profiles` + `email_verifications`, RLS policies, and a trigger that creates a
   profile row the moment someone first signs in.
2. [`supabase/migrations/0002_split_address.sql`](supabase/migrations/0002_split_address.sql) —
   splits `address` into street/city/province/country.

### 1.4 Turn on Google sign-in

1. **Authentication → Providers → Google → Enable.**
2. It shows you a **callback URL** like
   `https://<your-ref>.supabase.co/auth/v1/callback`. Copy it.
3. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   **Create credentials → OAuth client ID → Web application**, and paste that URL
   into **Authorized redirect URIs**.
4. Copy the Google **Client ID** and **Client secret** back into the Supabase
   Google provider form and save.
5. Back in Supabase: **Authentication → URL Configuration → Redirect URLs**, add
   `http://localhost:4287/**`. Miss this and sign-in bounces to a blank page.

> Port **4287**, not 3000. It is set in `package.json` and `.claude/launch.json`.

### 1.5 Verify

Restart `npm run dev`, open `http://localhost:4287/login`, sign in with Google.
You should land in onboarding. Check **Table Editor → profiles** for your row.

---

## 2. Resend — the verification email

Sends the 6-digit code that proves you own a university address. Codes are
hashed (SHA-256) before storage, expire in 10 minutes, and allow 5 attempts —
see `lib/onboarding/otp.ts`.

1. [resend.com](https://resend.com) → sign up → **API Keys → Create**.
2. Add to `.env.local`:

```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=onboarding@resend.dev
```

`onboarding@resend.dev` is Resend's shared sandbox sender and works immediately,
but **it will only deliver to the address you signed up with**. For the demo,
either verify a domain (Resend → Domains, needs DNS) or make sure the address you
test with is your own.

**Without this key**, `sendVerificationEmail()` throws `RESEND_API_KEY is not set`
and the verify step fails — so if you are demoing onboarding, this is effectively
required.

---

## 3. Backboard — urgency + pickup windows from free text

When someone types *"need a drill saturday morning, kind of urgent"*, Backboard
extracts `urgency: 'high'` and `pickupWindows: ['morning']` via a tool call, and
those feed the Pivot 3 constraints in the DP.

1. Get an API key from your Backboard dashboard.
2. Add to `.env.local`:

```bash
BACKBOARD_API_KEY=...
```

**Without it**, `getBackboardClient()` returns `null`, urgency defaults to
`medium`, and everything else works — the call is already wrapped in
`try/catch` in `lib/relay/actions.ts`. That fallback is deliberate: the need
composer must never fail because a third party is down mid-demo.

---

## 4. Snowflake — embeddings and rerank

**Read this before spending time here.**

### 4.1 What we already verified

Cortex's AI functions are **gated on trial accounts**. Tested on *both* the
standard 30-day trial and the **120-day student trial** the handbook promises:

| Function | Result |
|---|---|
| `AI_EMBED` | ❌ *"not available for trial accounts"* |
| `AI_COMPLETE` | ❌ same |
| `SNOWFLAKE.CORTEX.EMBED_TEXT_768` | ❌ same |
| `SNOWFLAKE.CORTEX.COMPLETE` | ❌ same |
| `VECTOR_COSINE_SIMILARITY` | ✅ **works** |

`ALTER ACCOUNT SET CORTEX_ENABLED_CROSS_REGION = 'ANY_REGION'` runs cleanly and
changes nothing — it is a SKU gate, not a region problem.

**So: ask an organizer.** If Cortex is gated on the trial they handed out, every
Snowflake-track team is blocked and they need to know. That conversation is worth
more than any workaround.

### 4.2 If Cortex gets unlocked

1. **Snowsight → your name → Settings → Authentication → Programmatic access
   tokens → Generate.** Copy it once; it is not shown again.
2. Account identifier is in the Snowsight URL:
   `app.snowflake.com/<org>/<account>` → `<org>-<account>`.
3. Add to `.env.local`:

```bash
MATCH_PROVIDER=snowflake
SNOWFLAKE_ACCOUNT=nakkqzo-wk53488
SNOWFLAKE_PAT=<your token>
SNOWFLAKE_EMBED_MODEL=snowflake-arctic-embed-l-v2.0
SNOWFLAKE_CHAT_MODEL=claude-sonnet-4-5
```

4. **Verify in 5 seconds, before anything else:**

```bash
npm run check
```

It embeds one need, retrieves over three items, reranks, and asserts the actual
drill ranks first. If it fails you know immediately, instead of finding out 80%
of the way through a four-minute pipeline run.

5. **Re-embed everything.** The stub is 256 dimensions and Cortex is 768 or 1024,
   and `cosine()` compares over `min(len)` — mixing them does not crash, it
   silently returns meaningless numbers:

```bash
npm run seed && npm run pipeline && npm run check:store
```

### 4.3 The fallback that works today

`VECTOR_COSINE_SIMILARITY` is available, so the corpus and the *retrieval* can
still live in Snowflake even with Cortex gated — only the embedding function
stays local. [`snowflake/schema.sql`](snowflake/schema.sql) creates
`RELAY.CORE.{PEOPLE,ITEMS,NEEDS}` with `VECTOR(FLOAT,256)` columns; run it in a
Snowsight worksheet. The tables already exist on account `nakkqzo-wk53488`.

That is a defensible answer to *"why Snowflake and not an LLM API"* — the data is
already there, and the search runs where the data is.

---

## 5. Full `.env.local`

```bash
# --- Supabase (required) ---
NEXT_PUBLIC_SUPABASE_URL=https://your-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# --- Resend (needed for university-email verification) ---
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=onboarding@resend.dev

# --- Backboard (optional; urgency defaults to medium without it) ---
BACKBOARD_API_KEY=

# --- Snowflake (optional; falls back to the local stub) ---
MATCH_PROVIDER=stub
SNOWFLAKE_ACCOUNT=
SNOWFLAKE_PAT=
SNOWFLAKE_EMBED_MODEL=snowflake-arctic-embed-l-v2.0
SNOWFLAKE_CHAT_MODEL=claude-sonnet-4-5
```

**Restart `npm run dev` after editing** — Next reads env at boot.

---

## 6. Checks

```bash
npm run typecheck     # tsc --noEmit
npm run check         # match provider: embed, retrieve, rerank, drill ranks first
npm run check:store   # write path: a new need is embedded, matched and routed
npm run chains        # print computed chains
npm run reset         # wipe runtime.json before a demo run
```

Run `npm run check` after **any** change to embedding weights or the provider.

## 7. Troubleshooting

| Symptom | Cause |
|---|---|
| Sign-in redirects to a blank page | `http://localhost:4287/**` missing from Supabase **Redirect URLs** |
| `RESEND_API_KEY is not set` | Expected — add the key or skip the verify step |
| Verification email never arrives | `onboarding@resend.dev` only delivers to your own signup address |
| Matching got worse after a provider swap | Mixed embedding dimensions. `npm run seed && npm run pipeline` |
| `ERR_UNKNOWN_FILE_EXTENSION ".ts"` | Node < 22.18. The npm scripts already pass `--experimental-strip-types`; run them via `npm run`, not bare `node` |
| Every route 500s on a font error | Something reintroduced `next/font/google`. Fonts are self-hosted in `app/fonts/` on purpose |
| Profile row missing after first sign-in | `0001_init.sql` was not run — the trigger creates it |
