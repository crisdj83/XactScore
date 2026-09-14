-- =============================================================================
-- XactScore — optimized schema for the current Next.js app
-- Safe to paste into the Supabase SQL Editor (idempotent).
-- Does NOT drop data. Aligns columns/indexes/RLS with what the app queries.
-- =============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1) Core tables (create if missing)
-- -----------------------------------------------------------------------------

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  username text unique,
  avatar_url text,
  pending_avatar_url text,
  favorite_team text,
  country text,
  quote text,
  is_global_admin boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.contests (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.users (id),
  name text not null,
  contest_key text unique not null,
  is_open boolean not null default true,
  is_public boolean not null default false,
  -- App uses season_length: 'full' | 'first_half' | 'second_half'
  season_length text not null default 'full'
    check (season_length in ('full', 'first_half', 'second_half')),
  -- Tiered scoring used by ranking / sync / rules
  points_exact numeric not null default 3,
  points_close numeric not null default 1.5,
  points_result numeric not null default 1,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.contest_members (
  contest_id uuid not null references public.contests (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default timezone('utc'::text, now()),
  primary key (contest_id, user_id)
);

-- Predictions store football-data.org match IDs (no local matches FK).
create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests (id) on delete cascade,
  match_id bigint not null,
  user_id uuid not null references public.users (id) on delete cascade,
  predicted_home_score integer,
  predicted_away_score integer,
  points numeric not null default 0,
  is_exact boolean not null default false,
  is_correct boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, contest_id, match_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests (id) on delete cascade,
  author_id uuid not null references public.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

create table if not exists public.message_replies (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  author_id uuid not null references public.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

create table if not exists public.message_reads (
  user_id uuid primary key references public.users (id) on delete cascade,
  last_read_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.match_reminders (
  user_id uuid not null references public.users (id) on delete cascade,
  match_id bigint not null,
  sent_at timestamptz not null default timezone('utc'::text, now()),
  primary key (user_id, match_id)
);

create table if not exists public.news_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 2) Upgrade existing columns (legacy → current app)
-- -----------------------------------------------------------------------------

-- users
alter table public.users add column if not exists pending_avatar_url text;
alter table public.users add column if not exists is_global_admin boolean not null default false;
alter table public.users add column if not exists quote text;
alter table public.users add column if not exists favorite_team text;
alter table public.users add column if not exists avatar_url text;
alter table public.users add column if not exists username text;
alter table public.users add column if not exists country text;

-- contests: prefer season_length over legacy duration
alter table public.contests add column if not exists season_length text;
alter table public.contests add column if not exists points_exact numeric;
alter table public.contests add column if not exists points_close numeric;
alter table public.contests add column if not exists points_result numeric;
alter table public.contests add column if not exists is_open boolean default true;
alter table public.contests add column if not exists is_public boolean not null default false;

-- Drop old check before migrating values (half → first_half, add second_half)
alter table public.contests drop constraint if exists contests_season_length_check;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'contests'
      and column_name = 'duration'
  ) then
    update public.contests
    set season_length = case
      when season_length in ('full', 'first_half', 'second_half') then season_length
      when season_length = 'half' then 'first_half'
      when duration = 'first_half' then 'first_half'
      when duration = 'second_half' then 'second_half'
      when duration = 'full_season' then 'full'
      else 'full'
    end
    where season_length is null
       or season_length not in ('full', 'first_half', 'second_half');
  else
    update public.contests
    set season_length = case
      when season_length in ('full', 'first_half', 'second_half') then season_length
      when season_length = 'half' then 'first_half'
      else 'full'
    end
    where season_length is null
       or season_length not in ('full', 'first_half', 'second_half');
  end if;
end $$;

update public.contests set points_exact = coalesce(points_exact, 3) where points_exact is null;
update public.contests set points_close = coalesce(points_close, 1.5) where points_close is null;
update public.contests set points_result = coalesce(points_result, 1) where points_result is null;

alter table public.contests alter column season_length set default 'full';
alter table public.contests alter column season_length set not null;
alter table public.contests alter column points_exact set default 3;
alter table public.contests alter column points_close set default 1.5;
alter table public.contests alter column points_result set default 1;

alter table public.contests
  add constraint contests_season_length_check
  check (season_length in ('full', 'first_half', 'second_half'));

-- predictions: ensure app columns exist; keep legacy columns if present
alter table public.predictions add column if not exists predicted_home_score integer;
alter table public.predictions add column if not exists predicted_away_score integer;
alter table public.predictions add column if not exists points numeric default 0;
alter table public.predictions add column if not exists is_exact boolean default false;
alter table public.predictions add column if not exists is_correct boolean default false;
alter table public.predictions add column if not exists updated_at timestamptz default timezone('utc'::text, now());

-- Backfill predicted_* from legacy home_score/away_score if those exist
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'predictions' and column_name = 'home_score'
  ) then
    update public.predictions
    set predicted_home_score = coalesce(predicted_home_score, home_score)
    where predicted_home_score is null;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'predictions' and column_name = 'away_score'
  ) then
    update public.predictions
    set predicted_away_score = coalesce(predicted_away_score, away_score)
    where predicted_away_score is null;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'predictions' and column_name = 'points_earned'
  ) then
    update public.predictions
    set points = coalesce(points, points_earned, 0)
    where points is null or points = 0;
  end if;
end $$;

-- No local matches FK (fixtures come from football-data.org)
alter table public.predictions drop constraint if exists predictions_match_id_fkey;

-- Unique conflict target used by upsert(..., onConflict: 'user_id,contest_id,match_id')
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'predictions_user_contest_match_key'
  ) then
    -- Drop older unique shapes if present
    alter table public.predictions drop constraint if exists predictions_contest_id_match_id_user_id_key;
    alter table public.predictions
      add constraint predictions_user_contest_match_key
      unique (user_id, contest_id, match_id);
  end if;
exception when others then
  -- Constraint may already exist under another name; ensure index instead
  create unique index if not exists predictions_user_contest_match_uidx
    on public.predictions (user_id, contest_id, match_id);
end $$;

-- -----------------------------------------------------------------------------
-- 3) Auth trigger: auto-create public.users on signup
-- -----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill any auth users missing from public.users
insert into public.users (id, email)
select id, email from auth.users
where id not in (select id from public.users)
on conflict (id) do nothing;

-- Set site owner / global admin (edit the email if needed)
update public.users
set is_global_admin = true
where lower(email) = 'cris.the.dj@gmail.com';

-- -----------------------------------------------------------------------------
-- 4) Performance indexes (match app query patterns)
-- -----------------------------------------------------------------------------

create index if not exists contest_members_user_idx on public.contest_members (user_id);
create index if not exists contest_members_contest_idx on public.contest_members (contest_id);
create index if not exists contests_contest_key_idx on public.contests (contest_key);
create index if not exists contests_admin_id_idx on public.contests (admin_id);
create index if not exists contests_is_public_idx on public.contests (is_public) where is_public = true;

create index if not exists predictions_contest_match_idx on public.predictions (contest_id, match_id);
create index if not exists predictions_contest_user_idx on public.predictions (contest_id, user_id);
create index if not exists predictions_match_idx on public.predictions (match_id);

create index if not exists messages_contest_created_at_idx on public.messages (contest_id, created_at desc);
create index if not exists messages_author_id_idx on public.messages (author_id);
create index if not exists message_replies_message_created_at_idx on public.message_replies (message_id, created_at);
create index if not exists message_replies_author_id_idx on public.message_replies (author_id);

create index if not exists news_posts_created_at_idx on public.news_posts (created_at desc);
create index if not exists users_is_global_admin_idx on public.users (is_global_admin) where is_global_admin = true;
create index if not exists users_pending_avatar_idx on public.users (id) where pending_avatar_url is not null;

-- -----------------------------------------------------------------------------
-- 5) Row Level Security
-- -----------------------------------------------------------------------------

alter table public.users enable row level security;
alter table public.contests enable row level security;
alter table public.contest_members enable row level security;
alter table public.predictions enable row level security;
alter table public.messages enable row level security;
alter table public.message_replies enable row level security;
alter table public.message_reads enable row level security;
alter table public.news_posts enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.match_reminders enable row level security;

-- USERS
drop policy if exists "Allow public read access" on public.users;
drop policy if exists "Allow users to insert their own profile" on public.users;
drop policy if exists "Allow users to update their own profile" on public.users;
drop policy if exists "users_select_authenticated" on public.users;
drop policy if exists "users_insert_own" on public.users;
drop policy if exists "users_update_own" on public.users;

create policy "users_select_authenticated"
  on public.users for select to authenticated using (true);

create policy "users_insert_own"
  on public.users for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "users_update_own"
  on public.users for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.is_global_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_global_admin from public.users where id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_global_admin() from public;
grant execute on function public.is_global_admin() to authenticated;

drop policy if exists "global_admins_can_update_any_user" on public.users;
create policy "global_admins_can_update_any_user"
  on public.users for update to authenticated
  using (public.is_global_admin())
  with check (public.is_global_admin());

-- CONTESTS
drop policy if exists "Allow public read access to contests" on public.contests;
drop policy if exists "Allow users to create contests" on public.contests;
drop policy if exists "Allow admin to update contest" on public.contests;
drop policy if exists "contests_select_authenticated" on public.contests;
drop policy if exists "contests_insert_as_admin" on public.contests;
drop policy if exists "contests_update_admin" on public.contests;
drop policy if exists "contests_delete_admin" on public.contests;

create policy "contests_select_authenticated"
  on public.contests for select to authenticated using (true);

create policy "contests_insert_as_admin"
  on public.contests for insert to authenticated
  with check ((select auth.uid()) = admin_id);

create policy "contests_update_admin"
  on public.contests for update to authenticated
  using ((select auth.uid()) = admin_id);

create policy "contests_delete_admin"
  on public.contests for delete to authenticated
  using ((select auth.uid()) = admin_id);

-- CONTEST MEMBERS
drop policy if exists "Allow public read access to members" on public.contest_members;
drop policy if exists "Allow users to join contests" on public.contest_members;
drop policy if exists "members_select_authenticated" on public.contest_members;
drop policy if exists "members_insert_self" on public.contest_members;
drop policy if exists "members_delete_self_or_admin" on public.contest_members;

create policy "members_select_authenticated"
  on public.contest_members for select to authenticated using (true);

create policy "members_insert_self"
  on public.contest_members for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "members_delete_self_or_admin"
  on public.contest_members for delete to authenticated
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1 from public.contests c
      where c.id = contest_members.contest_id
        and c.admin_id = (select auth.uid())
    )
  );

-- PREDICTIONS
-- Note: ranking/sync often use the service role (bypasses RLS).
-- Authenticated policies still protect normal client access.
drop policy if exists "Allow public read access to predictions" on public.predictions;
drop policy if exists "Allow users to manage own predictions" on public.predictions;
drop policy if exists "Users can insert their own predictions" on public.predictions;
drop policy if exists "Users can update their own predictions" on public.predictions;
drop policy if exists "Anyone can read predictions" on public.predictions;
drop policy if exists "predictions_select_contest_member" on public.predictions;
drop policy if exists "predictions_insert_own" on public.predictions;
drop policy if exists "predictions_update_own" on public.predictions;
drop policy if exists "predictions_delete_own" on public.predictions;

create policy "predictions_select_contest_member"
  on public.predictions for select to authenticated
  using (
    exists (
      select 1 from public.contest_members m
      where m.contest_id = predictions.contest_id
        and m.user_id = (select auth.uid())
    )
  );

create policy "predictions_insert_own"
  on public.predictions for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.contest_members m
      where m.contest_id = predictions.contest_id
        and m.user_id = (select auth.uid())
    )
  );

create policy "predictions_update_own"
  on public.predictions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "predictions_delete_own"
  on public.predictions for delete to authenticated
  using ((select auth.uid()) = user_id);

-- MESSAGES
drop policy if exists "Contest members can view messages" on public.messages;
drop policy if exists "Contest members can post messages" on public.messages;
drop policy if exists "Authors and contest admins can update messages" on public.messages;
drop policy if exists "Authors and contest admins can delete messages" on public.messages;

create policy "Contest members can view messages"
  on public.messages for select to authenticated
  using (
    exists (
      select 1 from public.contest_members
      where contest_members.contest_id = messages.contest_id
        and contest_members.user_id = (select auth.uid())
    )
  );

create policy "Contest members can post messages"
  on public.messages for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.contest_members
      where contest_members.contest_id = messages.contest_id
        and contest_members.user_id = (select auth.uid())
    )
  );

create policy "Authors and contest admins can update messages"
  on public.messages for update to authenticated
  using (
    author_id = (select auth.uid())
    or exists (
      select 1 from public.contest_members
      where contest_members.contest_id = messages.contest_id
        and contest_members.user_id = (select auth.uid())
        and contest_members.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.contest_members
      where contest_members.contest_id = messages.contest_id
        and contest_members.user_id = (select auth.uid())
    )
  );

create policy "Authors and contest admins can delete messages"
  on public.messages for delete to authenticated
  using (
    author_id = (select auth.uid())
    or exists (
      select 1 from public.contest_members
      where contest_members.contest_id = messages.contest_id
        and contest_members.user_id = (select auth.uid())
        and contest_members.role = 'admin'
    )
  );

-- MESSAGE REPLIES
drop policy if exists "Contest members can view message replies" on public.message_replies;
drop policy if exists "Contest members can post message replies" on public.message_replies;
drop policy if exists "Authors and contest admins can update message replies" on public.message_replies;
drop policy if exists "Authors and contest admins can delete message replies" on public.message_replies;

create policy "Contest members can view message replies"
  on public.message_replies for select to authenticated
  using (
    exists (
      select 1
      from public.messages
      join public.contest_members on contest_members.contest_id = messages.contest_id
      where messages.id = message_replies.message_id
        and contest_members.user_id = (select auth.uid())
    )
  );

create policy "Contest members can post message replies"
  on public.message_replies for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.messages
      join public.contest_members on contest_members.contest_id = messages.contest_id
      where messages.id = message_replies.message_id
        and contest_members.user_id = (select auth.uid())
    )
  );

create policy "Authors and contest admins can update message replies"
  on public.message_replies for update to authenticated
  using (
    author_id = (select auth.uid())
    or exists (
      select 1
      from public.messages
      join public.contest_members on contest_members.contest_id = messages.contest_id
      where messages.id = message_replies.message_id
        and contest_members.user_id = (select auth.uid())
        and contest_members.role = 'admin'
    )
  );

create policy "Authors and contest admins can delete message replies"
  on public.message_replies for delete to authenticated
  using (
    author_id = (select auth.uid())
    or exists (
      select 1
      from public.messages
      join public.contest_members on contest_members.contest_id = messages.contest_id
      where messages.id = message_replies.message_id
        and contest_members.user_id = (select auth.uid())
        and contest_members.role = 'admin'
    )
  );

-- MESSAGE READS
drop policy if exists "Users can manage their message read state" on public.message_reads;
create policy "Users can manage their message read state"
  on public.message_reads for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- NEWS POSTS (homepage updates; writes usually via service role)
drop policy if exists "news_posts_select_authenticated" on public.news_posts;
create policy "news_posts_select_authenticated"
  on public.news_posts for select to authenticated using (true);

-- PUSH SUBSCRIPTIONS
drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
drop policy if exists "push_subscriptions_update_own" on public.push_subscriptions;
drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;

create policy "push_subscriptions_select_own"
  on public.push_subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "push_subscriptions_insert_own"
  on public.push_subscriptions for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "push_subscriptions_update_own"
  on public.push_subscriptions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "push_subscriptions_delete_own"
  on public.push_subscriptions for delete to authenticated
  using ((select auth.uid()) = user_id);

-- -----------------------------------------------------------------------------
-- 6) Optional cleanup notes (DO NOT auto-drop; review manually)
-- -----------------------------------------------------------------------------
-- Legacy / unused by current app (safe to leave):
--   public.matches
--   public.suggestions
--   contests.duration, prediction_mode, visibility, points_mode, default_*_points
--   predictions.points_earned, predictions.home_score, predictions.away_score
--
-- After running, refresh PostgREST schema cache:
notify pgrst, 'reload schema';
