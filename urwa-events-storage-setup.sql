-- URWA Events Gallery — Supabase Storage setup
-- Project: qtiffwoqimtuchjrnjaa
-- Public URLs serve gallery media. The policy below only permits listing
-- objects for the gallery; it does not grant upload, update, or delete access.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'urwa-events',
  'urwa-events',
  true,
  104857600,
  array[
    'image/jpeg','image/png','image/webp','image/gif','image/avif',
    'video/mp4','video/webm','video/quicktime','video/x-m4v','video/ogg'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- The gallery uses Storage .list() to populate its event collections.
-- Restrict this SELECT policy to the object.list operation only.
drop policy if exists "URWA events are publicly viewable" on storage.objects;
create policy "URWA events are publicly viewable"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'urwa-events'
  and storage.allow_only_operation('object.list')
);

-- No public INSERT, UPDATE, or DELETE policy is created.
-- Upload/manage event media through the Supabase Dashboard as an authorised admin.
