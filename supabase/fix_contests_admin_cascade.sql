-- Fix account deletion ("Database error deleting user").
-- 1) Make contests.admin_id cascade when a user is removed.
-- 2) Provide delete_own_account() so the app can wipe Auth + profile
--    even before the hardened Next.js API is deployed.
-- Run once in the Supabase SQL Editor.

-- A) Fix foreign key
alter table public.contests drop constraint if exists contests_admin_id_fkey;

do $$
declare
  cname text;
begin
  select con.conname into cname
  from pg_constraint con
  join pg_attribute att
    on att.attrelid = con.conrelid
   and att.attnum = any (con.conkey)
  where con.conrelid = 'public.contests'::regclass
    and con.contype = 'f'
    and con.confrelid = 'public.users'::regclass
    and att.attname = 'admin_id'
  limit 1;

  if cname is not null then
    execute format('alter table public.contests drop constraint %I', cname);
  end if;
end $$;

alter table public.contests
  add constraint contests_admin_id_fkey
  foreign key (admin_id) references public.users (id) on delete cascade;

-- B) In-database account wipe for the signed-in user
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
    raise exception 'Not authenticated';
  end if;

  -- Leagues this user administers (members/predictions/messages cascade from contests)
  delete from public.contests where admin_id = uid;

  -- Optional tables (ignore if missing)
  begin
    delete from public.content_reports
    where reporter_id = uid or target_user_id = uid;
  exception when undefined_table then null;
  end;

  begin
    delete from public.push_subscriptions where user_id = uid;
  exception when undefined_table then null;
  end;

  begin
    delete from public.match_reminders where user_id = uid;
  exception when undefined_table then null;
  end;

  begin
    delete from public.message_reads where user_id = uid;
  exception when undefined_table then null;
  end;

  begin
    delete from public.news_reads where user_id = uid;
  exception when undefined_table then null;
  end;

  begin
    delete from public.suggestions where user_id = uid;
  exception when undefined_table then null;
  end;

  -- Profile (cascades memberships, predictions, authored messages, etc.)
  delete from public.users where id = uid;

  -- Auth identity (permanent)
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
