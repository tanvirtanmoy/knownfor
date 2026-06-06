-- KnownFor — initial schema
-- Designed single-user for the MVP, but multi-tenant from day one:
-- everything hangs off profile_user_id and slug-based routing.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- users (one row per profile owner; id matches auth.users.id)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id                uuid primary key references auth.users (id) on delete cascade,
  email             text unique,
  username          text unique,
  full_name         text,
  headline          text,
  bio               text,
  location          text,
  profile_image_url text,
  public_slug       text unique,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- feedback
-- ---------------------------------------------------------------------------
create table if not exists public.feedback (
  id                uuid primary key default gen_random_uuid(),
  profile_user_id   uuid not null references public.users (id) on delete cascade,
  sentence          text not null,
  giver_name        text,
  giver_role        text,
  giver_company     text,
  relationship      text,
  allow_name_public boolean not null default false,
  status            text not null default 'pending'
                      check (status in ('pending', 'approved', 'hidden', 'rejected')),
  is_public         boolean not null default false,
  source            text not null default 'public_form',
  ip_hash           text,
  user_agent        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  approved_at       timestamptz,
  constraint feedback_sentence_length check (char_length(sentence) between 1 and 280)
);

create index if not exists feedback_profile_status_idx
  on public.feedback (profile_user_id, status, created_at desc);

create index if not exists feedback_public_wall_idx
  on public.feedback (profile_user_id, created_at desc)
  where status = 'approved' and is_public = true;

create trigger feedback_set_updated_at
  before update on public.feedback
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- feedback_tags (later: AI-extracted traits per feedback item)
-- ---------------------------------------------------------------------------
create table if not exists public.feedback_tags (
  id          uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback (id) on delete cascade,
  tag         text not null,
  created_at  timestamptz not null default now()
);

create index if not exists feedback_tags_feedback_idx
  on public.feedback_tags (feedback_id);

-- ---------------------------------------------------------------------------
-- profile_summaries (later: AI-generated summary + top traits)
-- ---------------------------------------------------------------------------
create table if not exists public.profile_summaries (
  id              uuid primary key default gen_random_uuid(),
  profile_user_id uuid not null references public.users (id) on delete cascade,
  summary         text,
  top_traits      jsonb,
  generated_at    timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists profile_summaries_profile_idx
  on public.profile_summaries (profile_user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Future: organizations / teams. Created now so routing & FKs can grow into it.
-- ---------------------------------------------------------------------------
create table if not exists public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id         uuid not null references public.users (id) on delete cascade,
  role            text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at      timestamptz not null default now(),
  primary key (organization_id, user_id)
);
