# Ujjwalit Developers Program Platform 

A full-stack platform for the Ujjwalit Developers Program: internship application handling, admin-managed opportunities, program pipeline management (accept → onboard → grade → complete), email workflows, and a tamper-proof certificate verification system with public student credential profiles.

Built on **Next.js 16 (App Router) + React 19 + TypeScript + Supabase** and deployed on Vercel.

The legacy EJS app in `legacy-UJJWALIT_BLOGS/` is reference-only. Vercel deployment excludes it through `.vercelignore`; do not import runtime code from that folder.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Styling | Tailwind CSS v4, Framer Motion, GSAP dependency, Lucide icons |
| Backend | Supabase (Postgres, Auth, Storage, Row Level Security) |
| Documents | `pdf-lib` for PDF generation, `qrcode` for QR codes |
| Email | Resend (SMTP workflows, templated, admin-configurable) |
| Fonts | Locally vendored TTFs (`lib/generators/fonts/`) — no runtime font fetch |

---

## Public Site

- `/` and `/careers` — public Ujjwalit Developers Program marketing site
- `/careers/apply` — student application / registration form
- `/careers/opportunities/[slug]` — public programme detail page
- `/careers/payment` — fee payment flow
- `/terms` and `/privacy` — legal pages

## Certificate Verification

- `/verify` — public registry search by **Certificate ID** (e.g. `UJ-WD-2026-001`) or **student code / slug / email**
- `/verify/[certificateId]` — tamper-proof verified certificate view (bento layout): identity block, program details, certificate hash, QR validation, and a live program description fetched from the `opportunities` record
- `/verify/student/[slug]` — public student credential profile composing the selected **Statement of Achievement** snippets (attendance & batch placeholders)

## Admin Console

- `/admin/login` — authenticated admin login
- `/admin/dashboard` — **Command Center**: quick actions with live count badges, an attention queue (pending applications, onboarding, ready-to-mark-complete, missing certificates), and a paginated **Records Browser** (Applications / Students / Certificates) with filters and on-demand CSV export. Records are fetched lazily — the browser loads one page at a time and only pulls the full filtered dataset when you click **Export CSV**.
- `/admin/dashboard/programmes` — programme pipelines: per-programme counts (pending applications, accepted, active, completed) with links to manage students
- `/admin/dashboard/programme/[slug]` — programme detail: manage students through the pipeline, edit grade/attendance, write letters of recommendation, issue certificates
- `/admin/dashboard/opportunities` — create, edit, open, close, and archive internships / events / projects
- `/admin/dashboard/students` — student roster with bulk delete and auto-accept workflows
- `/admin/dashboard/templates` — certificate template library: visual designer with field inspector, template picker on issue, **copy-as-type** (duplicate a design as Completion / Participation / Custom), default template selection
- `/admin/dashboard/statements` — Statement of Achievement snippet library
- `/admin/dashboard/emails` — email template editor (subject/body with `{{placeholders}}`), enable/disable per workflow, preview, and a **Send Test Email** action

The admin sidebar is a **collapsible icon rail** with a hover flyout; the collapsed state persists in `localStorage`. Each nav item has a distinct icon.

### Subdomain routing

Handled by `proxy.ts` (middleware):

- `careers.ujjwalit.co.in` → `/careers`
- `verify.ujjwalit.co.in` → `/verify`
- `admin.ujjwalit.co.in` → `/admin`

---

## Local Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Fill `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
```

Local subdomain testing (no DNS needed):

- `http://localhost:3000/?subdomain=careers`
- `http://localhost:3000/?subdomain=verify`
- `http://localhost:3000/?subdomain=admin`

---

## Database Setup

The canonical schema is `supabase/schema.sql`. Run it in the Supabase SQL Editor after backing up anything important. It creates:

- `opportunities` — admin-customizable internships, projects, and events
- `applications`, `students`, `documents`, `certificates`, `certificate_templates`
- `achievement_statements` / `student_achievement_statements` — Statement of Achievement snippets
- Storage buckets for resumes, letters, certificates, templates, and opportunity assets
- RLS policies for public applications, public verification, and authenticated admin management

Create admin users from Supabase Dashboard → Authentication → Users.

### Migrations

Apply the migrations in `supabase/migrations/` **in filename order** — `schema.sql` alone does not include them:

1. `2026_multi_templates_profiles.sql` — multi-template support, template profiles
2. `2026_public_programs_profile_remarks.sql` — RLS + remarks for the public profile
3. `2026_restructured_pipeline.sql` — restructured program pipeline (accepted → active → completed)
4. `2026_soa_statements.sql` — SOA snippet tables + seed snippets
5. `2026_student_achievement_statement.sql` — junction table for per-student statement selection
6. `2026_student_email_tracking.sql` — email tracking on student records
7. `2027_email_settings_and_cleanup.sql` — `email_templates` table + schema cleanup
8. `2028_backfill_paid_students_to_active.sql` — backfill paid students to `active` stage

---

## Development Notes

- Public opportunity cards come from `opportunities` where `status = open` and `visibility = public`.
- If Supabase is unavailable or the schema has not been run yet, `lib/opportunities.shared.ts` provides safe fallback content.
- Shared client-safe opportunity helpers live in `lib/opportunities.shared.ts`; server fetching lives in `lib/opportunities.ts`.
- Certificate verification depends on `certificate_id`, `verification_hash`, `verification_url`, and optional QR/PDF URLs. Each certificate gets a fresh ID/hash per track, year, and type.
- Certificate/letter PDF generation uses locally vendored TTFs in `lib/generators/fonts/` (Inter, Montserrat, Playfair Display, Great Vibes, Alex Brush) — no runtime font fetch.
- Certificate templates support placeholders: `{{name}}`, `{{program}}`/`{{track}}`/`{{track_name}}`, `{{id}}`, `{{date}}`/`{{issue_date}}`, `{{college}}`, `{{batch}}`/`{{batch_name}}`, `{{student_code}}`/`{{code}}`, `{{attendance}}`. Document templates additionally support `{{duration}}`, `{{offer_id}}`, `{{startDate}}`/`{{start_date}}`, `{{endDate}}`.
- Email templates support `{{name}}`, `{{track}}`, `{{code}}`, `{{certId}}`; statement snippets support `{{attendance}}`, `{{batch}}`. A `PlaceholderGuide` component surfaces these inline.
- The admin **Command Center** intentionally keeps dashboard fetches light: count aggregates for the attention queue, paginated record browsing, and full-dataset fetch only on CSV export.
- Keep UI assets used by the Next app in `public/`, not in `legacy-UJJWALIT_BLOGS/`.

---

## Quality Checks

```bash
npm run lint
npm run build
```

`npm run build` runs TypeScript type-checking as part of the production build.

Known framework warnings to watch:

- Next.js 16 uses `proxy.ts` for middleware (the legacy `middleware.ts` name is deprecated).
- A non-standard `NODE_ENV` in the shell can trigger a Next.js warning; deployment should use Vercel defaults.
