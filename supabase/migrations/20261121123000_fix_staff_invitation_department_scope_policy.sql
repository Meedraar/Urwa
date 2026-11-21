-- Ensure a staff invitation can only target a non-leadership position
-- belonging to the same department named on the invitation.
drop policy if exists "staff_invitations_head_create" on public.department_staff_invitations;
create policy "staff_invitations_head_create"
on public.department_staff_invitations
for insert to authenticated
with check (
  invited_by = auth.uid()
  and public.is_department_leader(department_id)
  and status = 'pending_admin_approval'
  and exists (
    select 1 from public.department_positions p
    where p.id = department_staff_invitations.position_id
      and p.department_id = department_staff_invitations.department_id
      and p.is_active
      and not p.is_leadership
  )
);
