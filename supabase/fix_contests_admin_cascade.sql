-- Fix: contests.admin_id blocked auth user deletion ("Database error deleting user").
-- Run once in the Supabase SQL Editor.

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
