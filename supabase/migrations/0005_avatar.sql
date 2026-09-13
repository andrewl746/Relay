-- Run in the Supabase SQL Editor after 0004_delete_account.sql.
-- Lets someone override the photo Google gave us.
alter table public.profiles add column if not exists avatar_url text;
