-- Run this in the Supabase SQL Editor after 0002_split_address.sql.

alter table public.profiles drop constraint if exists profiles_onboarding_step_check;
alter table public.profiles add constraint profiles_onboarding_step_check
  check (onboarding_step in ('profile', 'verify', 'interests', 'wants', 'complete'));

create table if not exists public.wants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  text text not null,
  max_price_cents int,
  created_at timestamptz not null default now()
);

alter table public.wants enable row level security;

create policy "wants are self-readable" on public.wants
  for select using (auth.uid() = user_id);

create policy "wants are self-writable" on public.wants
  for insert with check (auth.uid() = user_id);

create policy "wants are self-deletable" on public.wants
  for delete using (auth.uid() = user_id);

create index if not exists wants_user_id_idx on public.wants (user_id);
