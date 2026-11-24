-- Extend existing learner access rules to recognise every approved programme placement.
drop policy if exists "assignments visible to assigned halaqa" on public.assignments;
create policy "assignments visible to assigned halaqa"
on public.assignments for select to authenticated
using (
  public.is_admin()
  or public.is_approved_teacher_of(halaqa_id)
  or exists (
    select 1 from public.student_enrollments e
    where e.student_id = (select auth.uid())
      and e.halaqa_id = assignments.halaqa_id
      and e.status = 'approved'
  )
  or exists (
    select 1 from public.student_programme_enrollments e
    where e.student_id = (select auth.uid())
      and e.halaqa_id = assignments.halaqa_id
      and e.status = 'approved'
  )
);

drop policy if exists "student submits own work" on public.submissions;
create policy "student submits own work"
on public.submissions for insert to authenticated
with check (
  student_id = (select auth.uid())
  and (
    exists (
      select 1 from public.assignments a
      join public.student_enrollments e on e.halaqa_id = a.halaqa_id
      where a.id = submissions.assignment_id
        and e.student_id = (select auth.uid())
        and e.status = 'approved'
    )
    or exists (
      select 1 from public.assignments a
      join public.student_programme_enrollments e on e.halaqa_id = a.halaqa_id
      where a.id = submissions.assignment_id
        and e.student_id = (select auth.uid())
        and e.status = 'approved'
    )
  )
);

drop policy if exists "hifdh records visible to owner teacher admin" on public.hifdh_records;
create policy "hifdh records visible to owner teacher admin"
on public.hifdh_records for select to authenticated
using (
  student_id = (select auth.uid())
  or public.is_admin()
  or exists (
    select 1 from public.teacher_assignments ta
    join public.student_programme_enrollments e on e.halaqa_id = ta.halaqa_id
    where ta.teacher_id = (select auth.uid())
      and e.student_id = hifdh_records.student_id
      and e.status = 'approved'
  )
);

drop policy if exists "hifdh owner or teacher inserts" on public.hifdh_records;
create policy "hifdh owner or teacher inserts"
on public.hifdh_records for insert to authenticated
with check (
  student_id = (select auth.uid())
  or public.is_admin()
  or (
    recorded_by = (select auth.uid())
    and exists (
      select 1 from public.teacher_assignments ta
      join public.student_programme_enrollments e on e.halaqa_id = ta.halaqa_id
      where ta.teacher_id = (select auth.uid())
        and e.student_id = hifdh_records.student_id
        and e.status = 'approved'
    )
  )
);

drop policy if exists "murajaah records visible to owner teacher admin" on public.murajaah_records;
create policy "murajaah records visible to owner teacher admin"
on public.murajaah_records for select to authenticated
using (
  student_id = (select auth.uid())
  or public.is_admin()
  or exists (
    select 1 from public.teacher_assignments ta
    join public.student_programme_enrollments e on e.halaqa_id = ta.halaqa_id
    where ta.teacher_id = (select auth.uid())
      and e.student_id = murajaah_records.student_id
      and e.status = 'approved'
  )
);

drop policy if exists "murajaah owner or teacher inserts" on public.murajaah_records;
create policy "murajaah owner or teacher inserts"
on public.murajaah_records for insert to authenticated
with check (
  student_id = (select auth.uid())
  or public.is_admin()
  or (
    recorded_by = (select auth.uid())
    and exists (
      select 1 from public.teacher_assignments ta
      join public.student_programme_enrollments e on e.halaqa_id = ta.halaqa_id
      where ta.teacher_id = (select auth.uid())
        and e.student_id = murajaah_records.student_id
        and e.status = 'approved'
    )
  )
);
