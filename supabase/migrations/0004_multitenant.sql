-- KnownFor — multi-tenant onboarding + platform super-admin
--
-- Turns the single-tenant MVP into a self-serve platform:
--   * Anyone can sign up (Google / Microsoft / email) and gets their own profile.
--   * A brand-new auth user is auto-provisioned a public.users row.
--   * One platform super-admin (role = 'admin') can oversee & moderate everyone.

-- ---------------------------------------------------------------------------
-- 1. Role column on users
-- ---------------------------------------------------------------------------
alter table public.users
  add column if not exists role text not null default 'user'
    check (role in ('user', 'admin'));

-- ---------------------------------------------------------------------------
-- 2. Auto-provision a public.users row whenever an auth user is created.
--    Runs as security definer so it can write across the auth/public boundary.
--    public_slug stays NULL → the app sends them to /onboarding to pick a handle.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, profile_image_url)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 3. Super-admin helper. SECURITY DEFINER + stable so it can be used inside
--    RLS policies on public.users without recursing into those same policies.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- 4. Super-admin RLS — cross-user read + moderation.
--    These sit alongside the existing owner-scoped policies (policies are OR'd).
-- ---------------------------------------------------------------------------
drop policy if exists users_admin_all on public.users;
create policy users_admin_all
  on public.users for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists feedback_admin_all on public.feedback;
create policy feedback_admin_all
  on public.feedback for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists feedback_links_admin_read on public.feedback_links;
create policy feedback_links_admin_read
  on public.feedback_links for select
  to authenticated
  using (public.is_admin());

drop policy if exists profile_summaries_admin_all on public.profile_summaries;
create policy profile_summaries_admin_all
  on public.profile_summaries for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
