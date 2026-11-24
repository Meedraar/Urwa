-- URWA Events Gallery — Supabase Storage setup
-- Project: qtiffwoqimtuchjrnjaa
-- Public read is enabled so visitors can view the event gallery.
-- No public upload, update, or delete permissions are granted.

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

-- Public visitors need SELECT to list the files inside each event folder.
drop policy if exists "URWA events are publicly viewable" on storage.objects;
create policy "URWA events are publicly viewable"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'urwa-events');

-- Intentionally no anon INSERT, UPDATE, or DELETE policy.
-- Upload/manage event media through the Supabase Dashboard as an authorised admin.