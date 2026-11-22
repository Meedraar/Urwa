-- URWA learning-level assessments and admin-approved progression.
-- Current learning levels are independent of profiles.admin_level (admin privilege).

create table if not exists public.learning_level_cycles (
  id uuid primary key default gen_random_uuid(),
  cycle_name text not null,
  starts_on date not null,
  ends_on date not null,
  status text not null default 'planned' check (status in ('planned','active','completed')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_on = (starts_on + interval '4 months' - interval '1 day')::date),
  unique (cycle_name)
);

create unique index if not exists learning_level_one_active_cycle
  on public.learning_level_cycles ((status)) where status = 'active';

create table if not exists public.educator_level_assignments (
  id uuid primary key default gen_random_uuid(),
  educator_id uuid not null references public.profiles(id) on delete cascade,
  cycle_id uuid not null references public.learning_level_cycles(id) on delete restrict,
  level text not null check (level in ('Qaida','Level 1 – Foundation','Level 2 – Growth','Level 3 – Mastery')),
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  unique (educator_id, cycle_id)
);

create table if not exists public.learning_assessments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  enrollment_id uuid not null references public.student_enrollments(id) on delete cascade,
  educator_id uuid not null references public.profiles(id) on delete restrict,
  halaqa_id uuid not null references public.halaqas(id) on delete restrict,
  cycle_id uuid not null references public.learning_level_cycles(id) on delete restrict,
  assessed_level text not null check (assessed_level in ('Qaida','Level 1 – Foundation','Level 2 – Growth','Level 3 – Mastery')),
  score numeric(5,2) not null check (score >= 0 and score <= 100),
  assessment_date date not null default current_date,
  notes text,
  recommendation text not null check (recommendation in ('promote','remain','demote','educator_review','admin_review')),
  recommended_level text check (recommended_level in ('Qaida','Level 1 – Foundation','Level 2 – Growth','Level 3 – Mastery')),
  review_status text not null default 'pending' check (review_status in ('pending','approved','rejected','review_required')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now()
);

create index if not exists learning_assessments_student_date
  on public.learning_assessments(student_id, assessment_date desc);
create index if not exists learning_assessments_review
  on public.learning_assessments(review_status, created_at desc);

alter table public.student_enrollments
  add column if not exists learning_cycle_id uuid references public.learning_level_cycles(id) on delete set null;

alter table public.learning_level_cycles enable row level security;
alter table public.educator_level_assignments enable row level security;
alter table public.learning_assessments enable row level security;

drop policy if exists "Admins manage learning cycles" on public.learning_level_cycles;
create policy "Admins manage learning cycles" on public.learning_level_cycles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Educators and admins read cycle assignments" on public.educator_level_assignments;
create policy "Educators and admins read cycle assignments" on public.educator_level_assignments
  for select to authenticated using (public.is_admin() or educator_id = (select auth.uid()));

drop policy if exists "Admins manage educator level assignments" on public.educator_level_assignments;
create policy "Admins manage educator level assignments" on public.educator_level_assignments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Students educators admins read assessments" on public.learning_assessments;
create policy "Students educators admins read assessments" on public.learning_assessments
  for select to authenticated using (
    public.is_admin()
    or student_id = (select auth.uid())
    or public.is_approved_teacher_of(halaqa_id)
  );

-- Assessment creation validates the active cycle, the approved educator and their
-- actual halaqa assignment. Recommendation is stored for admin review only.
create or replace function public.record_learning_assessment(
  target_enrollment_id uuid,
  assessment_score numeric,
  assessment_notes text default null,
  assessment_day date default current_date
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_enrollment public.student_enrollments%rowtype;
  v_profile public.profiles%rowtype;
  v_cycle public.learning_level_cycles%rowtype;
  v_level text;
  v_next text;
  v_recommendation text;
  v_status text := 'pending';
  v_id uuid;
begin
  if v_user is null then raise exception 'Sign in is required'; end if;
  if assessment_score is null or assessment_score < 0 or assessment_score > 100 then
    raise exception 'Assessment score must be between 0 and 100';
  end if;

  select * into v_enrollment from public.student_enrollments
    where id = target_enrollment_id and status = 'approved';
  if not found then raise exception 'Approved student enrollment not found'; end if;

  select * into v_profile from public.profiles where id = v_user;
  if not found or v_profile.status <> 'approved' or
     not (v_profile.role = 'admin' or
       (v_profile.role = 'teacher' and exists (
         select 1 from public.teacher_assignments ta
         where ta.teacher_id = v_user and ta.halaqa_id = v_enrollment.halaqa_id
       ))) then
    raise exception 'You are not authorised to assess this student';
  end if;

  select * into v_cycle from public.learning_level_cycles
    where status = 'active' and assessment_day between starts_on and ends_on;
  if not found then raise exception 'There is no active learning cycle for this assessment date'; end if;

  v_level := coalesce(v_enrollment.level, 'Qaida');
  if v_level not in ('Qaida','Level 1 – Foundation','Level 2 – Growth','Level 3 – Mastery') then
    raise exception 'Student has an unrecognised learning level; ask an administrator to review it';
  end if;

  if assessment_score > 85 then
    if v_level = 'Qaida' then
      v_next := 'Level 1 – Foundation'; v_recommendation := 'promote';
    elsif v_level = 'Level 1 – Foundation' then
      v_next := 'Level 2 – Growth'; v_recommendation := 'promote';
    elsif v_level = 'Level 2 – Growth' then
      v_next := 'Level 3 – Mastery'; v_recommendation := 'promote';
    else
      v_next := v_level; v_recommendation := 'educator_review';
    end if;
  elsif assessment_score >= 80 then
    v_next := v_level; v_recommendation := 'remain';
  else
    if v_level = 'Qaida' or v_level = 'Level 1 – Foundation' then
      v_next := null; v_recommendation := 'admin_review'; v_status := 'review_required';
    elsif v_level = 'Level 2 – Growth' then
      v_next := 'Level 1 – Foundation'; v_recommendation := 'demote';
    else
      v_next := 'Level 2 – Growth'; v_recommendation := 'demote';
    end if;
  end if;

  insert into public.learning_assessments (
    student_id,enrollment_id,educator_id,halaqa_id,cycle_id,assessed_level,
    score,assessment_date,notes,recommendation,recommended_level,review_status
  ) values (
    v_enrollment.student_id,v_enrollment.id,v_user,v_enrollment.halaqa_id,
    v_cycle.id,v_level,assessment_score,assessment_day,assessment_notes,
    v_recommendation,v_next,v_status
  ) returning id into v_id;

  return v_id;
end;
$$;

-- Only an administrator can decide. Approval applies the recommended student
-- level; rejecting or reviewing leaves the current placement unchanged.
create or replace function public.review_learning_assessment(
  target_assessment_id uuid,
  approve_recommendation boolean,
  decision_notes text default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_assessment public.learning_assessments%rowtype;
begin
  if not public.is_admin() then raise exception 'Only an administrator can review recommendations'; end if;

  select * into v_assessment from public.learning_assessments
    where id = target_assessment_id for update;
  if not found then raise exception 'Assessment not found'; end if;
  if v_assessment.review_status not in ('pending','review_required') then
    raise exception 'This assessment has already been reviewed';
  end if;
  if approve_recommendation and (v_assessment.recommended_level is null or
      v_assessment.recommendation in ('admin_review','educator_review')) then
    raise exception 'This result requires an administrator placement decision, not automatic approval';
  end if;

  update public.learning_assessments
    set review_status = case when approve_recommendation then 'approved' else 'rejected' end,
        reviewed_by = auth.uid(), reviewed_at = now(), review_notes = decision_notes
    where id = target_assessment_id;

  if approve_recommendation then
    update public.student_enrollments
      set level = v_assessment.recommended_level,
          learning_cycle_id = v_assessment.cycle_id
      where id = v_assessment.enrollment_id;
  end if;
end;
$$;

revoke all on function public.record_learning_assessment(uuid,numeric,text,date) from public;
revoke all on function public.review_learning_assessment(uuid,boolean,text) from public;
grant execute on function public.record_learning_assessment(uuid,numeric,text,date) to authenticated;
grant execute on function public.review_learning_assessment(uuid,boolean,text) to authenticated;

grant select on public.learning_level_cycles, public.educator_level_assignments, public.learning_assessments to authenticated;
grant insert, update, delete on public.learning_level_cycles, public.educator_level_assignments to authenticated;
