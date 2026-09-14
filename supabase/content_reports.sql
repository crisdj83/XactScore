-- UGC reports for App Store Guideline 1.2 (Safety - User Generated Content).
create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users (id) on delete cascade,
  kind text not null check (kind in ('message', 'reply', 'user')),
  target_id uuid not null,
  target_user_id uuid references public.users (id) on delete set null,
  reason text not null check (char_length(reason) between 3 and 500),
  created_at timestamptz not null default now(),
  status text not null default 'open' check (status in ('open', 'reviewed', 'actioned', 'dismissed'))
);

create index if not exists content_reports_created_at_idx
  on public.content_reports (created_at desc);

create index if not exists content_reports_status_idx
  on public.content_reports (status);

alter table public.content_reports enable row level security;

drop policy if exists "Users can insert their own reports" on public.content_reports;
create policy "Users can insert their own reports"
  on public.content_reports for insert to authenticated
  with check ((select auth.uid()) = reporter_id);

drop policy if exists "Users can view their own reports" on public.content_reports;
create policy "Users can view their own reports"
  on public.content_reports for select to authenticated
  using ((select auth.uid()) = reporter_id);
