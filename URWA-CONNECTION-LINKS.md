# URWA — Connecting links

## URWA website pages

These are the local routes after the website is deployed at its main domain.

| Page | Route |
|---|---|
| Main website | `/index.html` |
| About URWA | `/about.html` |
| Programmes | `/programmes.html` |
| Classes | `/classes.html` |
| Teachers | `/teachers.html` |
| Events | `/events.html` |
| Contact | `/contact.html` |
| Enrolment | `/enroll.html` |
| Become an Abla | `/become-teacher.html` |
| Student portal home | `/portal/student/index.html` |
| Student registration | `/portal/student/student-register.html` |
| Student login | `/portal/student/student-login.html` |
| Student forgot password | `/portal/student/student-forgot-password.html` |
| Student set new password | `/portal/student/student-reset-password.html` |
| Student dashboard (protected) | `/portal/student/student-dashboard.html` |
| Abla portal home | `/portal/abla/index.html` |
| Abla login | `/portal/abla/teacher-login.html` |
| Abla dashboard (protected) | `/portal/abla/teacher-dashboard.html` |
| Admin portal home | `/portal/admin/index.html` |
| Admin login | `/portal/admin/login.html` |
| Admin dashboard (protected) | `/portal/admin/admin-dashboard.html` |

## Live Supabase project links

- Project dashboard: https://supabase.com/dashboard/project/kwqaorzvflrgepepfwwg
- SQL Editor: https://supabase.com/dashboard/project/kwqaorzvflrgepepfwwg/sql/new
- Table Editor: https://supabase.com/dashboard/project/kwqaorzvflrgepepfwwg/editor
- Authentication users: https://supabase.com/dashboard/project/kwqaorzvflrgepepfwwg/auth/users
- Authentication URL Configuration: https://supabase.com/dashboard/project/kwqaorzvflrgepepfwwg/auth/url-configuration
- API keys: https://supabase.com/dashboard/project/kwqaorzvflrgepepfwwg/settings/api-keys

## GitHub and Netlify

- Connected GitHub profile: https://github.com/aaliyanah56
- GitHub repositories: https://github.com/aaliyanah56?tab=repositories
- Netlify dashboard: https://app.netlify.com/

The GitHub connection did not return a repository named URWA or Urwatul Wuthqaa. No repository URL or deployed Netlify site domain is assumed in this file.

## Supabase Auth redirect URLs to configure after deployment

Set the Supabase Site URL to the final public website origin, for example `https://YOUR-URWA-SITE.netlify.app`.

Add these Redirect URLs (replace the example hostname with the real Netlify domain):

- `https://YOUR-URWA-SITE.netlify.app/**`
- `http://localhost:5500/**` (local testing only, if using VS Code Live Server on port 5500)

The student password-reset flow redirects to:

`https://YOUR-URWA-SITE.netlify.app/portal/student/student-reset-password.html`

Do not put the Supabase database password, secret key, or service-role key in these pages or in a public repository. The website uses only the project URL and publishable key.
