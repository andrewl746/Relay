-- Run this in the Supabase SQL Editor after 0001_init.sql.

alter table public.profiles rename column address to street;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists province text;
alter table public.profiles add column if not exists country text not null default 'Canada';
