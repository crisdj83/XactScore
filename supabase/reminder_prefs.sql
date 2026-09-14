-- Match reminder prefs + Expo push tokens (App Store / mobile notifications).
-- Run once in the Supabase SQL Editor.

-- A) User prefs (default 2 hours = 120 minutes)
alter table public.users
  add column if not exists reminder_lead_minutes integer not null default 120;

alter table public.users
  add column if not exists reminders_enabled boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'users_reminder_lead_minutes_check'
  ) then
    alter table public.users
      add constraint users_reminder_lead_minutes_check
      check (reminder_lead_minutes in (60, 120, 180, 240));
  end if;
end $$;

-- B) Expo push tokens (separate from web push_subscriptions)
create table if not exists public.expo_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expo_push_tokens_token_unique unique (token)
);

create index if not exists expo_push_tokens_user_idx
  on public.expo_push_tokens (user_id);

alter table public.expo_push_tokens enable row level security;

drop policy if exists "Users can view their own expo tokens" on public.expo_push_tokens;
create policy "Users can view their own expo tokens"
  on public.expo_push_tokens for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own expo tokens" on public.expo_push_tokens;
create policy "Users can insert their own expo tokens"
  on public.expo_push_tokens for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own expo tokens" on public.expo_push_tokens;
create policy "Users can update their own expo tokens"
  on public.expo_push_tokens for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own expo tokens" on public.expo_push_tokens;
create policy "Users can delete their own expo tokens"
  on public.expo_push_tokens for delete to authenticated
  using ((select auth.uid()) = user_id);

-- C) Keep account wipe in sync
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

  delete from public.contests where admin_id = uid;

  begin
    delete from public.content_reports
    where reporter_id = uid or target_user_id = uid;
  exception when undefined_table then null;
  end;

  begin
    delete from public.user_blocks
    where blocker_id = uid or blocked_id = uid;
  exception when undefined_table then null;
  end;

  begin
    delete from public.expo_push_tokens where user_id = uid;
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

  delete from public.users where id = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
