-- Centralize all non-admin URWA membership approvals under Admin.
-- Departmental review fields remain informational; they cannot activate accounts.

create or replace function public.admin_review_membership_application(
  target_user_id uuid,
  decision text,
  decision_notes text default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles%rowtype;
  v_status text;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Only an approved URWA administrator can review membership applications';
  end if;

  if decision not in ('approve','reject') then
    raise exception 'Decision must be approve or reject';
  end if;

  select * into v_profile
  from public.profiles
  where id = target_user_id
  for update;

  if not found then raise exception 'Applicant profile was not found'; end if;
  if v_profile.role not in ('student','teacher','department_member') then
    raise exception 'This account type cannot be approved through the membership queue';
  end if;
  if v_profile.status <> 'pending' then raise exception 'This application is no longer pending'; end if;

  v_status := case when decision = 'approve' then 'approved' else 'cancelled' end;

  update public.profiles set status = v_status, updated_at = now()
  where id = target_user_id;

  if v_profile.role = 'student' then
    update public.student_enrollments
    set status = v_status::public.account_status,
        reviewed_by = auth.uid(), reviewed_at = now(),
        admin_decision = decision, admin_decided_by = auth.uid(), admin_decided_at = now()
    where student_id = target_user_id and status = 'pending'::public.account_status;
  elsif v_profile.role = 'teacher' then
    update public.teacher_applications
    set status = v_status, admin_decision = decision,
        admin_decided_by = auth.uid(), admin_decided_at = now()
    where id = target_user_id;
  elsif v_profile.role = 'department_member' then
    update public.department_applications
    set status = v_status, admin_decision = decision,
        admin_decided_by = auth.uid(), admin_decided_at = now(),
        reviewed_by = auth.uid(), reviewed_at = now(),
        review_notes = coalesce(decision_notes, review_notes)
    where applicant_id = target_user_id and status = 'pending';
  end if;
end;
$$;

revoke all on function public.admin_review_membership_application(uuid,text,text) from public, anon;
grant execute on function public.admin_review_membership_application(uuid,text,text) to authenticated;
