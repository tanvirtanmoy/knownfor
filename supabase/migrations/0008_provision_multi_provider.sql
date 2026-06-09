-- Capture name and profile photo from any OAuth provider's metadata.
--
-- Different providers use different claim keys:
--   * Google     → full_name, avatar_url
--   * LinkedIn   → name,      picture   (OpenID Connect / linkedin_oidc)
--   * Microsoft  → full_name/name
--
-- The app re-hosts the photo into our own avatars bucket on first login (so
-- LinkedIn's expiring signed URLs don't break later); this trigger just seeds a
-- sensible initial value regardless of which provider was used.
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
    coalesce(
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', '')
    ),
    coalesce(
      nullif(new.raw_user_meta_data->>'avatar_url', ''),
      nullif(new.raw_user_meta_data->>'picture', '')
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
