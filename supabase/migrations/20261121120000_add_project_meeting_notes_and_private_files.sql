-- Adds private project meeting notes and file storage.
create table if not exists public.department_project_meeting_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.department_projects(id) on delete cascade,
  title text not null,
  notes text not null,
  meeting_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.department_project_meeting_notes enable row level security;
drop policy if exists "Project members read meeting notes" on public.department_project_meeting_notes;
create policy "Project members read meeting notes" on public.department_project_meeting_notes for select to authenticated using (public.is_department_project_member(project_id));
drop policy if exists "Project members create meeting notes" on public.department_project_meeting_notes;
create policy "Project members create meeting notes" on public.department_project_meeting_notes for insert to authenticated with check (public.is_department_project_member(project_id) and created_by = auth.uid());
drop policy if exists "Project leads update meeting notes" on public.department_project_meeting_notes;
create policy "Project leads update meeting notes" on public.department_project_meeting_notes for update to authenticated using (public.is_department_project_lead(project_id)) with check (public.is_department_project_lead(project_id));
drop policy if exists "Project leads delete meeting notes" on public.department_project_meeting_notes;
create policy "Project leads delete meeting notes" on public.department_project_meeting_notes for delete to authenticated using (public.is_department_project_lead(project_id));
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('urwa-project-files','urwa-project-files',false,10485760,array['application/pdf','image/png','image/jpeg','image/webp','text/plain','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "Project members read project files" on storage.objects;
create policy "Project members read project files" on storage.objects for select to authenticated using (bucket_id='urwa-project-files' and public.is_department_project_member(((storage.foldername(name))[1])::uuid));
drop policy if exists "Project members upload project files" on storage.objects;
create policy "Project members upload project files" on storage.objects for insert to authenticated with check (bucket_id='urwa-project-files' and public.is_department_project_member(((storage.foldername(name))[1])::uuid));
drop policy if exists "Project leads delete project files" on storage.objects;
create policy "Project leads delete project files" on storage.objects for delete to authenticated using (bucket_id='urwa-project-files' and public.is_department_project_lead(((storage.foldername(name))[1])::uuid));
