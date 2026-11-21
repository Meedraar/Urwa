# URWA Roles, Admissions and Collaboration

## Agreed access model
- Roles: `student`, `teacher` (existing Abla role), `department_member`, `admin`.
- Department members have one primary department membership.
- Department heads are department members holding the `department_head` position.
- Department members see their own department's private records.
- Cross-department collaboration is project-scoped and requires approval by the receiving department head.
- Admins retain platform-wide oversight.

## Canonical departments
Admissions; Academic; Finance; Student Affairs; Communications; HR / Abla Affairs; IT / Technical; Events; Welfare; Marketing.

Existing department records were renamed in place where the mapping was clear so existing IDs and references remain stable. New departments were added without deleting legacy records.

## Supabase changes applied
1. `urwa_roles_departments_approvals_projects`
   - Added the `department_member` role.
   - Aligned the department directory to the ten agreed departments.
   - Added standard Department Head and Department Member positions where missing.
   - Added separate department recommendation and final administrator decision fields to student, Abla and department applications.
   - Added staff invitation, project, project membership, project request, project message and project task tables with RLS.
2. `urwa_approval_workflows_and_project_membership`
   - Added controlled Admissions and HR/Academic review RPCs.
   - Added an administrator-only final decision RPC.
   - Added review event history and automatic project membership after an approved cross-department request.
3. `urwa_department_role_sync_and_review_audit_security`
   - Synchronises a profile to `department_member` when it has an active department membership and back to `student` when its last active membership ends (admins and teachers are not overwritten).
   - Prevents client-authored review history entries.
4. `urwa_trusted_department_staff_invitation_signup`
   - Only a valid approved invitation can create a department-member account through the auth signup trigger.
5. `urwa_lock_down_new_helper_permissions`
   - Restricts direct execution of new helper/trigger functions.

## Edge Function
`send-department-staff-invitation` is deployed with JWT verification. It only sends an invitation when the caller is an approved admin and the invitation has already been approved.

## Frontend work on feature branch
- Department sign-in now expects the `department_member` role and routes to the existing department workspace.
- The department workspace rejects student and teacher roles; admin access remains available.
- Dashboard markup and visual styling were not redesigned.

## Remaining integration work
- Add department-head invitation form and admin invitation review/send controls to the department workspace.
- Wire Admissions review and final admin decision controls into the student admissions queue.
- Wire HR and Academic review stages plus final admin decision into the Abla application queue.
- Add project creation, receiving-head approval, project messaging and project task controls to the department workspace.
- Run authenticated end-to-end tests for all four roles and all account statuses before merging or deploying.

## Safety note
The Supabase schema and Edge Function changes are live. The website has not been deployed. The frontend changes are isolated on `feature/urwa-roles-admissions-collaboration`.
