-- KnownFor — Row Level Security
--
-- Principles:
--   * Anyone (anonymous) may submit feedback, but only as pending / not public.
--   * The public may read approved + public feedback only.
--   * The public may read profile rows (needed to render public profiles).
--   * A profile owner may fully manage their own profile + feedback.
--   * Private submission metadata (ip_hash, user_agent) is never selected by the
--     public app code — RLS is row-level, so column filtering happens in queries.

alter table public.users             enable row level security;
alter table public.feedback          enable row level security;
alter table public.feedback_tags     enable row level security;
alter table public.profile_summaries enable row level security;
alter table public.organizations     enable row level security;
alter table public.organization_members enable row level security;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
create policy "users_public_read"
  on public.users for select
  using (true);

create policy "users_owner_insert"
  on public.users for insert
  to authenticated
  with check (auth.uid() = id);

create policy "users_owner_update"
  on public.users for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- feedback
-- ---------------------------------------------------------------------------

-- Public wall: only approved & public rows are readable by anyone.
create policy "feedback_public_read_approved"
  on public.feedback for select
  using (status = 'approved' and is_public = true);

-- Owner can read everything for their own profile (incl. pending).
create policy "feedback_owner_read"
  on public.feedback for select
  to authenticated
  using (auth.uid() = profile_user_id);

-- Anyone (anon or authenticated) can submit, but only as a pending,
-- non-public public_form submission. Prevents pre-approved spam.
create policy "feedback_public_insert"
  on public.feedback for insert
  with check (
    status = 'pending'
    and is_public = false
    and source = 'public_form'
  );

-- Owner moderates their own feedback.
create policy "feedback_owner_update"
  on public.feedback for update
  to authenticated
  using (auth.uid() = profile_user_id)
  with check (auth.uid() = profile_user_id);

create policy "feedback_owner_delete"
  on public.feedback for delete
  to authenticated
  using (auth.uid() = profile_user_id);

-- ---------------------------------------------------------------------------
-- feedback_tags
-- ---------------------------------------------------------------------------
create policy "feedback_tags_public_read"
  on public.feedback_tags for select
  using (
    exists (
      select 1 from public.feedback f
      where f.id = feedback_tags.feedback_id
        and f.status = 'approved'
        and f.is_public = true
    )
  );

create policy "feedback_tags_owner_all"
  on public.feedback_tags for all
  to authenticated
  using (
    exists (
      select 1 from public.feedback f
      where f.id = feedback_tags.feedback_id
        and f.profile_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.feedback f
      where f.id = feedback_tags.feedback_id
        and f.profile_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- profile_summaries
-- ---------------------------------------------------------------------------
create policy "profile_summaries_public_read"
  on public.profile_summaries for select
  using (true);

create policy "profile_summaries_owner_all"
  on public.profile_summaries for all
  to authenticated
  using (auth.uid() = profile_user_id)
  with check (auth.uid() = profile_user_id);

-- ---------------------------------------------------------------------------
-- organizations / members (scaffolding; locked to members for now)
-- ---------------------------------------------------------------------------
create policy "organizations_member_read"
  on public.organizations for select
  to authenticated
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = organizations.id
        and m.user_id = auth.uid()
    )
  );

create policy "organization_members_self_read"
  on public.organization_members for select
  to authenticated
  using (user_id = auth.uid());
