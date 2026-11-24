-- Support multiple programme placements per student without changing account approval.
create table if not exists public.student_programme_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  programme text not null check (programme in ('Quran Halaqa','Tajweed','Tafseer')),
  halaqa_id uuid references public.halaqas(id) on delete set null,
  teacher_id uuid references public.profiles(id) on delete set null,
  schedule text not null,
  status public.account_status not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  unique(student_id, programme),
  check (
    (programme = 'Quran Halaqa' and schedule in ('Morning','Evening')) or
    (programme = 'Tajweed' and schedule = 'Saturday & Sunday') or
    (programme = 'Tafseer' and schedule = 'Sunday')
  )
);

-- Preserve the original single-programme applications as their first programme placement.
insert into public.student_programme_enrollments
  (student_id, programme, halaqa_id, schedule, status, reviewed_by, reviewed_at)
select
  e.student_id,
  case when e.programme in ('Quran Halaqa','Tajweed','Tafseer') then e.programme else 'Quran Halaqa' end,
  e.halaqa_id,
  case
    when e.programme = 'Tajweed' then 'Saturday & Sunday'
    when e.programme = 'Tafseer' then 'Sunday'
    when e.preferred_session in ('Morning','Evening') then e.preferred_session
    else 'Morning'
  end,
  e.status,
  e.reviewed_by,
  e.reviewed_at
from public.student_enrollments e
where e.programme is not null
on conflict (student_id, programme) do nothing;

alter table public.student_programme_enrollments enable row level security;
grant select, insert, update, delete on public.student_programme_enrollments to authenticated;

create policy "students see own programme enrolments or admins or assigned teachers"
on public.student_programme_enrollments
for select to authenticated
using (
  student_id = (select auth.uid())
  or public.is_admin()
  or (halaqa_id is not null and public.is_approved_teacher_of(halaqa_id))
);

create policy "admins manage programme enrolments"
on public.student_programme_enrollments
for all to authenticated
using (public.is_admin())
with check (public.is_admin());
