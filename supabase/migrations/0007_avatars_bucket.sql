-- Profile photo storage.
--
-- A public-read bucket for avatars. Uploads go exclusively through the
-- updateProfile server action using the service role (createAdminClient), so we
-- deliberately add NO insert/update/delete policies on storage.objects for the
-- anon/authenticated roles — browsers cannot write here directly. Public read is
-- implicit for a public bucket: objects are served unauthenticated at
-- /storage/v1/object/public/avatars/<path>.
--
-- file_size_limit and allowed_mime_types are belt-and-braces: the server action
-- already validates size and type, but the bucket enforces it again at the edge.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
