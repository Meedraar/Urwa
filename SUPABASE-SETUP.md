# URWA — Supabase connection status

**Live Supabase project:** `https://kwqaorzvflrgepepfwwg.supabase.co`  
**Project ref:** `kwqaorzvflrgepepfwwg`

The live database has already been provisioned for URWA through the connected Supabase project integration. **Do not run `supabase-schema.sql` again on this project**; it is retained as a reference copy of the original schema.

## Connected backend

- Ten public tables: `profiles`, `halaqas`, `teacher_assignments`, `student_enrollments`, `attendance`, `assignments`, `submissions`, `hifdh_records`, `murajaah_records`, `announcements`.
- Row Level Security is enabled on every public table.
- All 22 URWA Halaqa placeholder records are present.
- New Auth users are automatically created as pending students; the `on_auth_user_created` trigger creates the profile and pending enrollment.
- The `anon` role cannot execute internal role/trigger helper functions or directly read public tables.
- Role-check RPCs are available only to signed-in users because they are used by RLS policies.

## Website authentication

`js/auth.js` initializes the Supabase JavaScript client with the project URL and public publishable key. It implements:

- Student email/password registration (student role only; pending approval).
- Student, Abla/teacher and administrator email/password login.
- Role and approval checks before redirecting to a portal dashboard.
- Dashboard guards that require an active session and matching approved role.
- Logout and live profile-name display.

Only the publishable key is included in the website. Never add a Supabase secret or `service_role` key to browser code, GitHub, or Netlify frontend variables.

## Required project-owner configuration

1. Open [URWA Authentication URL Configuration](https://supabase.com/dashboard/project/kwqaorzvflrgepepfwwg/auth/url-configuration). Set the Site URL to the final Netlify domain. Add the deployed domain wildcard (for example `https://YOUR-SITE.netlify.app/**`) and local test redirect (for example `http://localhost:5500/**`) to Redirect URLs. The student password-reset flow returns to `/portal/student/student-reset-password.html`.
2. Keep email confirmation enabled and configure reliable SMTP before public launch.
3. Invite the first administrator from **Authentication → Users**. After the invited user exists, promote only that account using SQL (replace the email):

```sql
update public.profiles
set role = 'admin', status = 'approved'
where email = 'YOUR-ADMIN-EMAIL';
```

4. Invite each Abla from Authentication, then assign the `teacher` role and `approved` status using the admin-controlled process. Assign each teacher to the correct Halaqa. Do not expose staff role selection in public registration.

## Still to be completed

- Configure the deployed site domain and email delivery in Supabase Auth.
- Deploy this project to the user's GitHub/Netlify website.
- Connect each dashboard's data panels and actions (admissions, student/teacher management, attendance, assignments, submissions, Hifdh/Muraja'ah and announcements) to live Supabase queries. The current dashboard panels remain presentation placeholders until that integration pass is complete.
- Test a real student signup, confirmation email, admin approval, login to each role portal and RLS behaviour using dedicated test accounts.


For the full list of URWA page routes and direct platform settings links, see [URWA-CONNECTION-LINKS.md](URWA-CONNECTION-LINKS.md).
