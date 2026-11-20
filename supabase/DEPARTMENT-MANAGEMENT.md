# URWA Department Management System

## Architecture decision
One shared department system with six separate workspaces. Administration has central oversight. This is not six separate applications.

## Departments
- Event Team
- Social Media Team
- Finance Team
- Halaqa Management Team
- Recruitment Team
- Student Affairs & Welfare Team

## Membership and leadership
- A member may hold only one active department membership at a time.
- Department Head and Assistant Head are appointed directly by URWA Administration.
- Other positions are open to applications and require Administration approval.
- Transfers require a separate request and approval.
- Membership and leadership are reviewed annually. Annual renewal requests and evaluation records are stored separately.

## Workspace modules
- Tasks and assignments
- Department channels and cross-department collaboration conversations
- Reports and review notes
- Announcements and calendar events
- Membership directory
- Student welfare case handling with restricted access

## Database objects
Core tables:
`departments`, `department_positions`, `department_applications`, `department_memberships`, `department_transfers`, `department_tasks`, `department_task_assignees`, `department_conversations`, `department_conversation_participants`, `department_messages`, `department_reports`, `department_announcements`, `department_events`, `department_reviews`, `department_renewal_requests`, `student_welfare_cases`.

Authorization helpers:
- `is_active_department_member(uuid)`
- `is_department_leader(uuid)`
- `has_active_department_membership(uuid)`
- `can_access_department_conversation(uuid)`
- `can_manage_welfare_cases()`
- `can_view_department_profile(uuid)`
- `get_department_collaboration_directory()`

All department tables have Row Level Security enabled. Policies target authenticated sessions. Welfare case access is limited to the student who submitted the case, the assigned staff member, authorised Student Affairs & Welfare staff, and URWA Administration.

## Applied Supabase migrations
The following migrations are recorded in the existing Supabase project `qtiffwoqimtuchjrnjaa`:
- `20261120175141_create_urwa_department_management_system`
- `20261120175209_harden_department_access_and_integrity`
- `20261120175247_add_collaboration_directory_and_task_updates`
- `20261120175428_enforce_one_department_channel`
- `20261120175521_add_annual_renewals_and_member_evaluations`
- `20261120175532_sync_annual_membership_renewals`

The Supabase migration history is the applied database record. Do not rerun these migrations against the same database. For future schema changes, create a new forward-only migration.

## Frontend
- Public department directory: `departments.html`
- Authenticated workspace: `portal/departments/index.html`
- Workspace logic: `js/departments-portal.js`
- Workspace styles: `css/departments-portal.css`

## Deployment boundary
This work is being prepared on GitHub branch `feature/department-management`. Do not deploy or merge to `main` until the user explicitly approves.
