-- Run this in the Supabase SQL Editor after 0006_listings.sql.
--
-- Claims used to be written into data/runtime.json with writeFileSync. That is
-- a hard crash on any serverless host, where the filesystem outside /tmp is
-- read only: claiming a listing threw EROFS rather than degrading. It was also
-- per-instance, so a claim made on one request was invisible to the next.
--
-- Only the HUB's claims move here. The Relay engine (lib/relay/*) still keeps
-- its own state in runtime.json and reads it synchronously from a dozen places;
-- see lib/relay/runtime.ts, where writes now fail soft instead of throwing.

create table if not exists public.claims (
  id text primary key,
  listing_id text not null,
  slot_id text not null,
  -- Text, not a uuid FK: dev-login demo accounts claim too. See 0006_listings.
  buyer_id text not null,
  created_at timestamptz not null default now()
);

alter table public.claims enable row level security;

-- A handoff has two sides, and the seller has to see the claim someone else
-- made against their listing, so reads are not restricted to the buyer.
create policy "claims are readable by everyone" on public.claims
  for select using (true);

create policy "claims are writable by their buyer" on public.claims
  for insert with check (auth.uid()::text = buyer_id or buyer_id like 'u-%');

-- One claim per person per listing: the old in-memory check raced, and two
-- submits of the same form wrote two rows.
create unique index if not exists claims_listing_buyer_idx
  on public.claims (listing_id, buyer_id);
