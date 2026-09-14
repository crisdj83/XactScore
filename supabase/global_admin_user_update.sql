-- Allow global admins to update any user row (avatar moderation from mobile).
-- Safe helper avoids recursive RLS on public.users.

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
