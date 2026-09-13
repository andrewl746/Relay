-- Run in the Supabase SQL Editor after 0003_wants.sql.
--
-- Lets a signed-in user delete their own account without the app ever holding a
-- service_role key. SECURITY DEFINER runs as the function owner, but it only
-- ever deletes auth.uid() — the caller's own row — so there is no way to pass
-- someone else's id. Deleting from auth.users cascades to profiles, wants and
-- email_verifications via their existing ON DELETE CASCADE references.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
