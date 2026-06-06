-- KnownFor — seed data.
--
-- Two profiles:
--   * Tanvir  — the real owner profile, linked to your admin auth user.
--               Seeded clean (no fake feedback) so real feedback can come in.
--   * Jane Doe — a neutral public example/demo profile used by the landing page
--               ("View example profile" → /jane). Seeded with sample feedback.
--
-- Each profile row links to an auth user (users.id references auth.users.id),
-- so both auth users must exist first:
--   admin_email   → create via Supabase Auth (this is your login).
--   example_email → create an auth user "jane.doe@example.com" (any password;
--                   it only exists to host the demo profile).
--
-- 👉 Set admin_email to the email you used for the admin auth user.

do $$
declare
  admin_email    text := 'tanmoy.tanvir001@gmail.com';
  example_email  text := 'jane.doe@example.com';
  v_user_id      uuid;
  v_jane_id      uuid;
begin
  -- ----- Real owner profile (Tanvir), clean -----
  select id into v_user_id from auth.users where email = admin_email;
  if v_user_id is null then
    raise exception
      'No auth user found for %. Create the admin user first, then update admin_email in seed.sql.',
      admin_email;
  end if;

  insert into public.users (
    id, email, username, full_name, headline, bio, location, public_slug
  ) values (
    v_user_id,
    admin_email,
    'tanvir',
    'Tanvir Tanmoy',
    'Data Engineer',
    'I build reliable data platforms, analytics solutions, and production workflows that help teams trust and use their data.',
    'Eindhoven, Netherlands',
    'tanvir'
  )
  on conflict (id) do update set
    username    = excluded.username,
    full_name   = excluded.full_name,
    headline    = excluded.headline,
    bio         = excluded.bio,
    location    = excluded.location,
    public_slug = excluded.public_slug;

  -- ----- Example/demo profile (Jane Doe) -----
  select id into v_jane_id from auth.users where email = example_email;
  if v_jane_id is null then
    raise notice
      'No auth user for % — skipping the Jane Doe example profile. Create that auth user, then re-run this seed to populate the public example.',
      example_email;
  else
    insert into public.users (
      id, email, username, full_name, headline, bio, location, public_slug
    ) values (
      v_jane_id,
      example_email,
      'jane',
      'Jane Doe',
      'Product Designer',
      'I design calm, human software and help teams turn fuzzy ideas into things people love to use.',
      'Amsterdam, Netherlands',
      'jane'
    )
    on conflict (id) do update set
      username    = excluded.username,
      full_name   = excluded.full_name,
      headline    = excluded.headline,
      bio         = excluded.bio,
      location    = excluded.location,
      public_slug = excluded.public_slug;

    if not exists (select 1 from public.feedback where profile_user_id = v_jane_id) then
      insert into public.feedback
        (profile_user_id, sentence, giver_name, giver_role, giver_company, relationship, allow_name_public, status, is_public, source, approved_at)
      values
        (v_jane_id, 'Jane has a rare talent for turning messy ideas into something simple and usable.', 'Liam Becker', 'Product Manager', 'Northwind', 'colleague',   true,  'approved', true, 'seed', now()),
        (v_jane_id, 'Working with Jane means deadlines stop being stressful.',                         null,          null,              null,       'manager',     false, 'approved', true, 'seed', now()),
        (v_jane_id, 'She listens first, then designs, and our users can feel the difference.',           null,          null,              null,       'stakeholder', false, 'approved', true, 'seed', now()),
        (v_jane_id, 'Jane is the person you want in the room when things get complicated.',           'Aisha Khan',  'Head of Operations', null,    'client',      true,  'approved', true, 'seed', now()),
        (v_jane_id, 'Generous with feedback and always lifts the whole team up.',                     null,          null,              null,       'mentor',      false, 'approved', true, 'seed', now());
    end if;
  end if;
end $$;
