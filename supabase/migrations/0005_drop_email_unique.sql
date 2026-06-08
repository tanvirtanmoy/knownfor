-- Bug fix: the auto-provision trigger (handle_new_user) inserts a public.users
-- row for every new auth user. If an email is ever reused across two auth
-- identities (e.g. signing in with both Google and Microsoft on the same
-- address, or an admin-created user whose email already exists) the UNIQUE(email)
-- constraint would abort the insert and break sign-up.
--
-- The user id (primary key, referencing auth.users) is the real identity key —
-- email does not need to be unique. Dropping the constraint removes the failure
-- mode entirely; the trigger's `on conflict (id) do nothing` still guards the PK.
alter table public.users drop constraint if exists users_email_key;
