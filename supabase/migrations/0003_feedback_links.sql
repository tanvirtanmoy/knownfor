-- Tokenized private feedback links.
--
-- The public feedback form is reachable only with a valid, non-revoked token
-- (`/<slug>/feedback?k=<token>`). Owners generate and revoke these links from
-- /admin. Token validation for anonymous visitors happens server-side with the
-- service-role client, so the anon role never needs read access to this table —
-- that keeps tokens unenumerable.

create table if not exists public.feedback_links (
  id              uuid primary key default gen_random_uuid(),
  profile_user_id uuid not null references public.users(id) on delete cascade,
  token           text not null unique,
  label           text,
  revoked         boolean not null default false,
  use_count       integer not null default 0,
  last_used_at    timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists feedback_links_profile_idx
  on public.feedback_links (profile_user_id);
create index if not exists feedback_links_token_idx
  on public.feedback_links (token);

alter table public.feedback_links enable row level security;

-- Owner-only access. No anon policy on purpose (see header note).
drop policy if exists feedback_links_owner_all on public.feedback_links;
create policy feedback_links_owner_all
  on public.feedback_links
  for all
  to authenticated
  using (auth.uid() = profile_user_id)
  with check (auth.uid() = profile_user_id);
