-- Run this in the Supabase SQL Editor after 0005_avatar.sql.
--
-- Posted listings used to live in a module-level array in lib/hub/mock-data.ts,
-- which meant they existed only inside one Node process: fine on a single dev
-- server, useless on any serverless host, where each instance gets its own copy
-- and is recycled without warning. This table is where they live now.
--
-- The seeded demo board stays in mock-data.ts — it is code, not user data. A row
-- here OVERRIDES a seed listing with the same id, which is how a claim or a
-- removal against a demo item survives a restart. See lib/hub/listing-store.ts.

create table if not exists public.listings (
  id text primary key,
  university_id text not null,
  -- Text, not a uuid FK to auth.users: dev-login demo accounts have short ids
  -- like 'u-marcus' and post too. Real accounts store their auth uid here.
  seller_id text not null,
  title text not null,
  description text not null default '',
  kind text not null default 'Item',
  category text not null,
  offer_type text not null,
  price_cents int,
  condition text not null,
  pickup_area text not null default '',
  expires_at timestamptz,
  is_bundle boolean not null default false,
  parent_id text,
  status text not null default 'available',
  created_at timestamptz not null default now(),
  photo_url text,
  urgency text,
  constraint listings_status_check check (status in ('available', 'claimed', 'removed')),
  constraint listings_urgency_check check (urgency is null or urgency in ('not-urgent', 'urgent', 'very-urgent'))
);

alter table public.listings enable row level security;

-- The board is public by design: you can see what is leaving before you sign up.
create policy "listings are readable by everyone" on public.listings
  for select using (true);

-- Writes are locked to the poster. The 'u-' escape hatch is the dev-login demo
-- namespace (seeded users have ids like 'u-marcus'); real accounts are uuids and
-- can only ever write rows carrying their own auth uid.
create policy "listings are writable by their seller" on public.listings
  for insert with check (auth.uid()::text = seller_id or seller_id like 'u-%');

create policy "listings are updatable by their seller" on public.listings
  for update using (auth.uid()::text = seller_id or seller_id like 'u-%');

create index if not exists listings_created_at_idx on public.listings (created_at desc);
create index if not exists listings_seller_id_idx on public.listings (seller_id);
