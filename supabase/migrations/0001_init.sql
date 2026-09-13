-- Run this once in the Supabase dashboard: SQL Editor → New query → paste → Run.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  university_id text,
  living_situation text check (living_situation in ('on_campus', 'off_campus')),
  address text,
  postal_code text,
  university_email text,
  university_email_verified boolean not null default false,
  interests text[] not null default '{}',
  onboarding_step text not null default 'profile'
    check (onboarding_step in ('profile', 'verify', 'interests', 'complete')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are self-readable" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles are self-updatable" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles are self-insertable" on public.profiles
  for insert with check (auth.uid() = id);

-- A row is created automatically the moment someone signs in with Google.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.email_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  code_hash text not null,
  attempts int not null default 0,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.email_verifications enable row level security;

create policy "verification codes are self-readable" on public.email_verifications
  for select using (auth.uid() = user_id);

create policy "verification codes are self-writable" on public.email_verifications
  for insert with check (auth.uid() = user_id);

create policy "verification codes are self-updatable" on public.email_verifications
  for update using (auth.uid() = user_id);

create index if not exists email_verifications_user_id_idx on public.email_verifications (user_id);
