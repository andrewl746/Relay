-- Run this in the Supabase SQL Editor after 0007_claims.sql.
--
-- Only seeded demo accounts have a name anywhere in this app. A real account is
-- a Supabase uuid, and profiles are self-readable by RLS (0001_init.sql) — so a
-- seller cannot look up the name of the person who claimed their listing, and a
-- buyer cannot look up the name of whoever posted it. Both used to resolve out
-- of the seeded users array in lib/hub/mock-data.ts, which a real account is not
-- in. The board fell back to "A student", and /handoffs was worse: an unknown
-- name made withDetail() discard the handoff entirely, so a real account claimed
-- something and then found its own handoff list empty.
--
-- Record the name at the moment we legitimately have it — the poster's when they
-- post, the buyer's when they claim — instead of trying to read it back later
-- from a row RLS will not show us. Relaxing profiles to be world-readable would
-- have been the other option; that is a privacy change to every account, to
-- render two strings.

alter table public.listings add column if not exists seller_name text;
alter table public.claims add column if not exists buyer_name text;
