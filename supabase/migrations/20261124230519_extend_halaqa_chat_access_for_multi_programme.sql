-- Allow multi-programme students to access the groups for every approved placement.
drop policy if exists "Halaqa members can create chats" on public.halaqa_chats;
create policy "Halaqa members can create chats" on public.halaqa_chats for insert to authenticated
with check (
  (chat_type = 'group' and (
    exists (select 1 from public.student_enrollments e where e.student_id=(select auth.uid()) and e.halaqa_id=halaqa_chats.halaqa_id and e.status='approved')
    or exists (select 1 from public.student_programme_enrollments e where e.student_id=(select auth.uid()) and e.halaqa_id=halaqa_chats.halaqa_id and e.status='approved')
    or exists (select 1 from public.teacher_assignments a where a.teacher_id=(select auth.uid()) and a.halaqa_id=halaqa_chats.halaqa_id)
  ))
  or (chat_type = 'private' and (
    (student_id=(select auth.uid())
      and (exists (select 1 from public.student_enrollments e where e.student_id=(select auth.uid()) and e.halaqa_id=halaqa_chats.halaqa_id and e.status='approved')
        or exists (select 1 from public.student_programme_enrollments e where e.student_id=(select auth.uid()) and e.halaqa_id=halaqa_chats.halaqa_id and e.status='approved'))
      and exists (select 1 from public.teacher_assignments a where a.teacher_id=halaqa_chats.teacher_id and a.halaqa_id=halaqa_chats.halaqa_id))
    or (teacher_id=(select auth.uid())
      and exists (select 1 from public.teacher_assignments a where a.teacher_id=(select auth.uid()) and a.halaqa_id=halaqa_chats.halaqa_id)
      and (exists (select 1 from public.student_enrollments e where e.student_id=halaqa_chats.student_id and e.halaqa_id=halaqa_chats.halaqa_id and e.status='approved')
        or exists (select 1 from public.student_programme_enrollments e where e.student_id=halaqa_chats.student_id and e.halaqa_id=halaqa_chats.halaqa_id and e.status='approved')))
  ))
);

drop policy if exists "Halaqa members can view their chats" on public.halaqa_chats;
create policy "Halaqa members can view their chats" on public.halaqa_chats for select to authenticated
using (
  (chat_type='group' and (
    exists (select 1 from public.student_enrollments e where e.student_id=(select auth.uid()) and e.halaqa_id=halaqa_chats.halaqa_id and e.status='approved')
    or exists (select 1 from public.student_programme_enrollments e where e.student_id=(select auth.uid()) and e.halaqa_id=halaqa_chats.halaqa_id and e.status='approved')
    or exists (select 1 from public.teacher_assignments a where a.teacher_id=(select auth.uid()) and a.halaqa_id=halaqa_chats.halaqa_id)
  ))
  or (chat_type='private' and (student_id=(select auth.uid()) or teacher_id=(select auth.uid()))
    and exists (select 1 from public.teacher_assignments a where a.teacher_id=halaqa_chats.teacher_id and a.halaqa_id=halaqa_chats.halaqa_id)
    and (exists (select 1 from public.student_enrollments e where e.student_id=halaqa_chats.student_id and e.halaqa_id=halaqa_chats.halaqa_id and e.status='approved')
      or exists (select 1 from public.student_programme_enrollments e where e.student_id=halaqa_chats.student_id and e.halaqa_id=halaqa_chats.halaqa_id and e.status='approved')))
);

drop policy if exists "Participants can read halaqa messages" on public.halaqa_messages;
create policy "Participants can read halaqa messages" on public.halaqa_messages for select to authenticated
using (exists (select 1 from public.halaqa_chats c where c.id=halaqa_messages.chat_id and (
  (c.chat_type='group' and (
    exists (select 1 from public.student_enrollments e where e.student_id=(select auth.uid()) and e.halaqa_id=c.halaqa_id and e.status='approved')
    or exists (select 1 from public.student_programme_enrollments e where e.student_id=(select auth.uid()) and e.halaqa_id=c.halaqa_id and e.status='approved')
    or exists (select 1 from public.teacher_assignments a where a.teacher_id=(select auth.uid()) and a.halaqa_id=c.halaqa_id)))
  or (c.chat_type='private' and (c.student_id=(select auth.uid()) or c.teacher_id=(select auth.uid()))
    and exists (select 1 from public.teacher_assignments a where a.teacher_id=c.teacher_id and a.halaqa_id=c.halaqa_id)
    and (exists (select 1 from public.student_enrollments e where e.student_id=c.student_id and e.halaqa_id=c.halaqa_id and e.status='approved')
      or exists (select 1 from public.student_programme_enrollments e where e.student_id=c.student_id and e.halaqa_id=c.halaqa_id and e.status='approved')))
)));

drop policy if exists "Participants can send halaqa messages" on public.halaqa_messages;
create policy "Participants can send halaqa messages" on public.halaqa_messages for insert to authenticated
with check (sender_id=(select auth.uid()) and exists (select 1 from public.halaqa_chats c where c.id=halaqa_messages.chat_id and (
  (c.chat_type='group' and (
    exists (select 1 from public.student_enrollments e where e.student_id=(select auth.uid()) and e.halaqa_id=c.halaqa_id and e.status='approved')
    or exists (select 1 from public.student_programme_enrollments e where e.student_id=(select auth.uid()) and e.halaqa_id=c.halaqa_id and e.status='approved')
    or exists (select 1 from public.teacher_assignments a where a.teacher_id=(select auth.uid()) and a.halaqa_id=c.halaqa_id)))
  or (c.chat_type='private' and (c.student_id=(select auth.uid()) or c.teacher_id=(select auth.uid()))
    and exists (select 1 from public.teacher_assignments a where a.teacher_id=c.teacher_id and a.halaqa_id=c.halaqa_id)
    and (exists (select 1 from public.student_enrollments e where e.student_id=c.student_id and e.halaqa_id=c.halaqa_id and e.status='approved')
      or exists (select 1 from public.student_programme_enrollments e where e.student_id=c.student_id and e.halaqa_id=c.halaqa_id and e.status='approved')))
)));
