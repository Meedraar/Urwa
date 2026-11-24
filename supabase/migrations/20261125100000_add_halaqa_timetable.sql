create table if not exists public.halaqa_timetable (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  halaqa_id uuid not null references public.halaqas(id) on delete cascade,
  title text not null,
  day_of_week text not null check (day_of_week in ('Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')),
  start_time time not null,
  end_time time not null,
  location text,
  meeting_link text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);
create index if not exists halaqa_timetable_halaqa_day_idx on public.halaqa_timetable(halaqa_id, day_of_week, start_time);
alter table public.halaqa_timetable enable row level security;
grant select, insert, update, delete on public.halaqa_timetable to authenticated;
drop policy if exists "students and teachers read assigned halaqa timetable" on public.halaqa_timetable;
create policy "students and teachers read assigned halaqa timetable" on public.halaqa_timetable for select to authenticated
using (
 public.is_admin()
 or exists (select 1 from public.teacher_assignments ta where ta.teacher_id=(select auth.uid()) and ta.halaqa_id=halaqa_timetable.halaqa_id)
 or exists (select 1 from public.student_programme_enrollments e where e.student_id=(select auth.uid()) and e.halaqa_id=halaqa_timetable.halaqa_id and e.status='approved')
 or exists (select 1 from public.student_enrollments e where e.student_id=(select auth.uid()) and e.halaqa_id=halaqa_timetable.halaqa_id and e.status='approved')
);
drop policy if exists "assigned teachers manage their timetable" on public.halaqa_timetable;
create policy "assigned teachers manage their timetable" on public.halaqa_timetable for all to authenticated
using (public.is_admin() or exists (select 1 from public.teacher_assignments ta where ta.teacher_id=(select auth.uid()) and ta.halaqa_id=halaqa_timetable.halaqa_id))
with check (teacher_id=(select auth.uid()) and exists (select 1 from public.teacher_assignments ta where ta.teacher_id=(select auth.uid()) and ta.halaqa_id=halaqa_timetable.halaqa_id));
