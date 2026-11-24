create or replace function public.get_teacher_student_directory()
returns table(id uuid, full_name text, email text, halaqa_id uuid)
language sql stable security definer set search_path = ''
as $function$
  select distinct p.id, p.full_name, p.email, placements.halaqa_id
  from public.profiles p
  join (
    select e.student_id, e.halaqa_id from public.student_enrollments e where e.status = 'approved'::public.account_status
    union
    select e.student_id, e.halaqa_id from public.student_programme_enrollments e where e.status = 'approved'::public.account_status
  ) placements on placements.student_id = p.id
  join public.teacher_assignments ta on ta.halaqa_id = placements.halaqa_id
  where ta.teacher_id = (select auth.uid())
    and exists (select 1 from public.profiles me where me.id = (select auth.uid()) and me.role = 'teacher'::public.urwa_role and me.status = 'approved'::public.account_status);
$function$;
