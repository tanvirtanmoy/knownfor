-- Private-by-default profiles + tokenized "view links".
--
-- Until now every profile with a public_slug was world-readable at /<slug>.
-- This migration introduces a visibility switch so a user can keep their wall
-- private and share it through an unguessable, revocable link (/v/<token>)
-- instead of exposing it to the whole internet (and search engines).
--
--   * users.is_public = false  → /<slug> 404s; only /v/<token> can render it.
--   * users.is_public = true   → classic public profile at /<slug> (+ sitemap).
--
-- Existing profiles are grandfathered to public so nothing they've already
-- shared silently disappears; brand-new accounts default to private.

-- ---------------------------------------------------------------------------
-- 1) Visibility column
-- ---------------------------------------------------------------------------
alter table public.users
  add column if not exists is_public boolean not null default false;

-- Grandfather everyone who already has a live public profile.
update public.users set is_public = true where public_slug is not null;

-- ---------------------------------------------------------------------------
-- 2) Tighten RLS so private profiles (and their feedback/summaries) are not
--    readable by the public cookie/anon client. The service-role client used
--    by the /v/<token> page bypasses RLS, so token holders still see the wall.
-- ---------------------------------------------------------------------------

-- users: public read now requires is_public. Owners must still read their own
-- (private) row for the dashboard, so add an explicit self-read policy.
drop policy if exists "users_public_read" on public.users;
create policy "users_public_read"
  on public.users for select
  using (is_public = true);

create policy "users_self_read"
  on public.users for select
  to authenticated
  using (auth.uid() = id);

-- feedback: public wall rows are only readable when the parent profile is public.
drop policy if exists "feedback_public_read_approved" on public.feedback;
create policy "feedback_public_read_approved"
  on public.feedback for select
  using (
    status = 'approved'
    and is_public = true
    and exists (
      select 1 from public.users u
      where u.id = feedback.profile_user_id
        and u.is_public = true
    )
  );

-- feedback_tags: same parent-profile gate.
drop policy if exists "feedback_tags_public_read" on public.feedback_tags;
create policy "feedback_tags_public_read"
  on public.feedback_tags for select
  using (
    exists (
      select 1
      from public.feedback f
      join public.users u on u.id = f.profile_user_id
      where f.id = feedback_tags.feedback_id
        and f.status = 'approved'
        and f.is_public = true
        and u.is_public = true
    )
  );

-- profile_summaries: only readable for public profiles.
drop policy if exists "profile_summaries_public_read" on public.profile_summaries;
create policy "profile_summaries_public_read"
  on public.profile_summaries for select
  using (
    exists (
      select 1 from public.users u
      where u.id = profile_summaries.profile_user_id
        and u.is_public = true
    )
  );

-- ---------------------------------------------------------------------------
-- 3) Tokenized view links
-- ---------------------------------------------------------------------------
create table if not exists public.profile_view_links (
  id              uuid primary key default gen_random_uuid(),
  profile_user_id uuid not null references public.users(id) on delete cascade,
  token           text not null unique,
  label           text,
  revoked         boolean not null default false,
  expires_at      timestamptz,
  view_count      integer not null default 0,
  last_viewed_at  timestamptz,
  created_at       timestamptz not null default now()
);

create index if not exists profile_view_links_owner_idx
  on public.profile_view_links (profile_user_id);
create index if not exists profile_view_links_token_idx
  on public.profile_view_links (token);

alter table public.profile_view_links enable row level security;

-- Owner manages their own view links. There is deliberately no anon/public
-- read policy: tokens are validated server-side with the service-role client so
-- they stay unenumerable.
create policy "profile_view_links_owner_all"
  on public.profile_view_links for all
  to authenticated
  using (auth.uid() = profile_user_id)
  with check (auth.uid() = profile_user_id);

-- Platform super-admins (see is_admin() from 0004) can read/manage all links.
create policy "profile_view_links_admin_all"
  on public.profile_view_links for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
