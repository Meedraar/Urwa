# URWA — Urwatul Wuthqaa

**The Firmest Handhold**

URWA is an Islamic learning and community platform for students, teachers (Ablas), administrators and the wider community.

## Current application setup

- **GitHub repository:** `Meedraar/Urwa`
- **Frontend:** static HTML, CSS and JavaScript
- **Backend:** Supabase project `qtiffwoqimtuchjrnjaa`
- **Supabase URL:** `https://qtiffwoqimtuchjrnjaa.supabase.co`
- **Hosting:** Vercel (connected to this GitHub repository)

The browser client is configured in `js/supabase.js` with the Supabase publishable key. Publishable keys are designed for public clients; never commit a Supabase secret or service-role key.

## Important deployment notes

- Vercel should deploy the repository root as a static site; no build command is required for the current HTML/CSS/JS application.
- Push changes to `main` to trigger the connected Vercel deployment.
- Configure the production domain and local development URLs in Supabase Authentication → URL Configuration.
- Confirm the new Supabase project has the required URWA tables, RLS policies, functions and Auth settings before testing sign-in and dashboards.

## Application areas

- Public pages: home, about, programmes, classes, teachers, events, departments, contact and enrolment.
- Student portal: registration, sign-in, password recovery and dashboard.
- Teacher portal: sign-in and dashboard.
- Admin portal: sign-in, dashboard and department tracker.

## Security

- Keep Row Level Security enabled on all exposed tables.
- Public registration must not allow users to assign privileged roles.
- Use database policies to enforce student, teacher and administrator permissions.
- Never put service-role keys, database passwords or other secrets in frontend code or GitHub.
