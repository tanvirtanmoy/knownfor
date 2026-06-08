-- Persistent, shared rate limiting.
--
-- The MVP throttled the public feedback form with an in-memory Map, which on
-- Vercel's serverless runtime is per-instance and resets on every cold start —
-- so the "5 per hour" cap barely held. This replaces it with a Postgres-backed
-- fixed-window counter that every instance shares.

create table if not exists public.rate_limits (
  key          text primary key,
  count        int not null default 0,
  window_start timestamptz not null default now()
);

-- Only the SECURITY DEFINER function below (owned by the migration role) should
-- ever touch this table. Enable RLS with no policies so the anon/authenticated
-- roles cannot read or write it directly.
alter table public.rate_limits enable row level security;

-- Atomically register a hit against `p_key` and report whether it is allowed.
-- Fixed window: the first hit starts the window; once the window elapses the
-- counter resets on the next hit.
create or replace function public.check_rate_limit(
  p_key text,
  p_limit int,
  p_window_seconds int
)
returns table (allowed boolean, retry_after int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now          timestamptz := now();
  v_window       interval := make_interval(secs => p_window_seconds);
  v_count        int;
  v_window_start timestamptz;
begin
  insert into public.rate_limits as r (key, count, window_start)
  values (p_key, 1, v_now)
  on conflict (key) do update
    set count = case
                  when r.window_start < v_now - v_window then 1
                  else r.count + 1
                end,
        window_start = case
                  when r.window_start < v_now - v_window then v_now
                  else r.window_start
                end
  returning r.count, r.window_start into v_count, v_window_start;

  if v_count <= p_limit then
    allowed := true;
    retry_after := 0;
  else
    allowed := false;
    retry_after := greatest(
      0,
      ceil(extract(epoch from (v_window_start + v_window - v_now)))
    )::int;
  end if;

  return next;
end;
$$;

-- The feedback form is submitted by anon (token-gated) or authenticated users.
grant execute on function public.check_rate_limit(text, int, int)
  to anon, authenticated;
