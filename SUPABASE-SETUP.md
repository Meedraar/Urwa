# URWA — Supabase setup

## Active project

- **Project reference:** `qtiffwoqimtuchjrnjaa`
- **Project URL:** `https://qtiffwoqimtuchjrnjaa.supabase.co`
- **Client configuration:** `js/supabase.js`

The frontend uses the Supabase publishable key in `js/supabase.js`. This key is intended for browser use. Never place a secret or service-role key in the repository.

## Before launch

1. Confirm the new project contains the URWA schema required by the application: profiles, halaqas, student enrollments, teacher assignments, attendance, assignments, submissions, announcements, Hifdh/Muraja'ah records and department-management tables.
2. Confirm RLS is enabled and policies correctly scope records by authenticated user and role.
3. Configure Authentication → URL Configuration with the Vercel production URL and the local development URL used by VS Code.
4. Configure email confirmation and password recovery redirects for the production domain.
5. Create and approve administrator and teacher accounts using a secure admin-controlled process.
6. Test student registration, email verification, approval, student/teacher/admin sign-in, dashboard data, logout and password recovery.

## Important

This repository's frontend now points to the new Supabase project. That does not automatically copy tables, policies, Auth users or records from the old project. Verify and migrate the required schema and data separately before relying on the new backend in production. Keep the old project available until migration and testing are complete.
