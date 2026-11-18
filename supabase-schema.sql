-- URWA initial Supabase schema
-- Run once in Supabase Dashboard > SQL Editor > New query.
create extension if not exists pgcrypto;

create type public.urwa_role as enum ('student','teacher','admin');
create type public.account_status as enum ('pending','approved','suspended');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  phone text,
  role public.urwa_role not null default 'student',
  status public.account_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.halaqas (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  halaqa_id uuid not null references public.halaqas(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (teacher_id, halaqa_id)
);

create table public.student_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  halaqa_id uuid references public.halaqas(id) on delete set null,
  level text,
  programme text,
  preferred_session text,
  status public.account_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(student_id)
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  halaqa_id uuid not null references public.halaqas(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  class_date date not null default current_date,
  status text not null check (status in ('present','absent','late','excused')),
  recorded_by uuid not null references public.profiles(id),
  notes text,
  created_at timestamptz not null default now(),
  unique(halaqa_id, student_id, class_date)
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  halaqa_id uuid not null references public.halaqas(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id),
  title text not null,
  assignment_type text,
  instructions text,
  due_date date,
  created_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  content text,
  file_url text,
  submitted_at timestamptz not null default now(),
  feedback text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  unique(assignment_id, student_id)
);

create table public.hifdh_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  surah text,
  from_ayah integer,
  to_ayah integer,
  juz integer check (juz between 1 and 30),
  recorded_on date not null default current_date,
  notes text,
  recorded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.murajaah_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  surah text,
  juz integer check (juz between 1 and 30),
  pages text,
  completed_on date not null default current_date,
  quality text,
  notes text,
  recorded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  audience text not null default 'all' check (audience in ('all','students','teachers')),
  halaqa_id uuid references public.halaqas(id) on delete cascade,
  published_by uuid not null references public.profiles(id),
  published_at timestamptz not null default now()
);

-- New sign-ups can ONLY become students. Staff roles are assigned by an existing admin.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email, phone, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    new.email,
    new.raw_user_meta_data->>'phone',
    'student'::public.urwa_role,
    'pending'::public.account_status
  );
  insert into public.student_enrollments (student_id, level, programme, preferred_session, status)
  values (
    new.id,
    new.raw_user_meta_data->>'level',
    new.raw_user_meta_data->>'programme',
    new.raw_user_meta_data->>'preferred_session',
    'pending'::public.account_status
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.current_role()
returns public.urwa_role language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid())
$$;
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = (select auth.uid()) and role = 'admin' and status = 'approved')
$$;
create or replace function public.is_approved_teacher_of(target_halaqa uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p join public.teacher_assignments ta on ta.teacher_id=p.id
    where p.id=(select auth.uid()) and p.role='teacher' and p.status='approved' and ta.halaqa_id=target_halaqa
  )
$$;

alter table public.profiles enable row level security;
alter table public.halaqas enable row level security;
alter table public.teacher_assignments enable row level security;
alter table public.student_enrollments enable row level security;
alter table public.attendance enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.hifdh_records enable row level security;
alter table public.murajaah_records enable row level security;
alter table public.announcements enable row level security;

-- Profiles: users can read their own profile; admins can manage all. No self-role editing.
create policy "profile read self or admin" on public.profiles for select to authenticated using (id=(select auth.uid()) or public.is_admin());
create policy "admin update profiles" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "approved users read active halaqas" on public.halaqas for select to authenticated using (is_active and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.status='approved') or public.is_admin());
create policy "admins manage halaqas" on public.halaqas for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "teachers see own assignments or admin" on public.teacher_assignments for select to authenticated using (teacher_id=(select auth.uid()) or public.is_admin());
create policy "admins manage teacher assignments" on public.teacher_assignments for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "student sees own enrollment or admin or assigned teacher" on public.student_enrollments for select to authenticated using (
 student_id=(select auth.uid()) or public.is_admin() or (halaqa_id is not null and public.is_approved_teacher_of(halaqa_id))
);
create policy "student creates own enrollment" on public.student_enrollments for insert to authenticated with check (student_id=(select auth.uid()) and status='pending' and halaqa_id is null);
create policy "admins manage enrollments" on public.student_enrollments for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "attendance visible to student teacher admin" on public.attendance for select to authenticated using (student_id=(select auth.uid()) or public.is_admin() or public.is_approved_teacher_of(halaqa_id));
create policy "teacher records attendance" on public.attendance for insert to authenticated with check (recorded_by=(select auth.uid()) and public.is_approved_teacher_of(halaqa_id));
create policy "teacher updates attendance" on public.attendance for update to authenticated using (public.is_approved_teacher_of(halaqa_id) or public.is_admin()) with check (public.is_approved_teacher_of(halaqa_id) or public.is_admin());
create policy "admin manages attendance" on public.attendance for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "assignments visible to assigned halaqa" on public.assignments for select to authenticated using (public.is_admin() or public.is_approved_teacher_of(halaqa_id) or exists(select 1 from public.student_enrollments e where e.student_id=(select auth.uid()) and e.halaqa_id=assignments.halaqa_id and e.status='approved'));
create policy "assigned teacher creates assignments" on public.assignments for insert to authenticated with check (teacher_id=(select auth.uid()) and public.is_approved_teacher_of(halaqa_id));
create policy "teacher or admin updates assignments" on public.assignments for update to authenticated using (public.is_admin() or (teacher_id=(select auth.uid()) and public.is_approved_teacher_of(halaqa_id))) with check (public.is_admin() or (teacher_id=(select auth.uid()) and public.is_approved_teacher_of(halaqa_id)));
create policy "admin deletes assignments" on public.assignments for delete to authenticated using (public.is_admin());

create policy "submissions visible to owner teacher admin" on public.submissions for select to authenticated using (
 student_id=(select auth.uid()) or public.is_admin() or exists(select 1 from public.assignments a where a.id=submissions.assignment_id and public.is_approved_teacher_of(a.halaqa_id))
);
create policy "student submits own work" on public.submissions for insert to authenticated with check (student_id=(select auth.uid()) and exists(select 1 from public.assignments a join public.student_enrollments e on e.halaqa_id=a.halaqa_id where a.id=submissions.assignment_id and e.student_id=(select auth.uid()) and e.status='approved'));
create policy "student edits own submission or teacher reviews" on public.submissions for update to authenticated using (student_id=(select auth.uid()) or public.is_admin() or exists(select 1 from public.assignments a where a.id=submissions.assignment_id and public.is_approved_teacher_of(a.halaqa_id))) with check (student_id=(select auth.uid()) or public.is_admin() or exists(select 1 from public.assignments a where a.id=submissions.assignment_id and public.is_approved_teacher_of(a.halaqa_id)));

create policy "hifdh records visible to owner teacher admin" on public.hifdh_records for select to authenticated using (student_id=(select auth.uid()) or public.is_admin() or (recorded_by is not null and exists(select 1 from public.teacher_assignments ta join public.student_enrollments e on e.halaqa_id=ta.halaqa_id where ta.teacher_id=(select auth.uid()) and e.student_id=hifdh_records.student_id)));
create policy "hifdh owner or teacher inserts" on public.hifdh_records for insert to authenticated with check (student_id=(select auth.uid()) or public.is_admin() or (recorded_by=(select auth.uid()) and exists(select 1 from public.teacher_assignments ta join public.student_enrollments e on e.halaqa_id=ta.halaqa_id where ta.teacher_id=(select auth.uid()) and e.student_id=hifdh_records.student_id)));
create policy "murajaah records visible to owner teacher admin" on public.murajaah_records for select to authenticated using (student_id=(select auth.uid()) or public.is_admin() or exists(select 1 from public.teacher_assignments ta join public.student_enrollments e on e.halaqa_id=ta.halaqa_id where ta.teacher_id=(select auth.uid()) and e.student_id=murajaah_records.student_id));
create policy "murajaah owner or teacher inserts" on public.murajaah_records for insert to authenticated with check (student_id=(select auth.uid()) or public.is_admin() or (recorded_by=(select auth.uid()) and exists(select 1 from public.teacher_assignments ta join public.student_enrollments e on e.halaqa_id=ta.halaqa_id where ta.teacher_id=(select auth.uid()) and e.student_id=murajaah_records.student_id)));

create policy "announcements visible by audience" on public.announcements for select to authenticated using (
 public.is_admin() or audience='all' or (audience='students' and public.current_role()='student') or (audience='teachers' and public.current_role()='teacher') or (halaqa_id is not null and public.is_approved_teacher_of(halaqa_id))
);
create policy "admins publish announcements" on public.announcements for insert to authenticated with check (public.is_admin() and published_by=(select auth.uid()));
create policy "admins update announcements" on public.announcements for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete announcements" on public.announcements for delete to authenticated using (public.is_admin());

-- Seed the 22 URWA halaqa placeholders; assign teachers and students later from admin tools.
insert into public.halaqas(name) select 'Halaqa ' || lpad(n::text,2,'0') from generate_series(1,22) n on conflict(name) do nothing;

-- Realtime can be enabled later for inbox/notifications if needed.
