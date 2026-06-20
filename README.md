# Ujjwalit Developers Program Platform

Next.js 16 app for the Ujjwalit Developers Program, internship applications, event registrations, admin-managed opportunities, document generation, and verifiable certificates.

The legacy EJS app in `legacy-UJJWALIT_BLOGS/` is reference-only. Vercel deployment excludes it through `.vercelignore`; do not import runtime code from that folder.

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS v4, Framer Motion, GSAP dependency available, Lucide icons
- Supabase Postgres, Auth, Storage, Row Level Security
- PDF and QR generation with `pdf-lib` and `qrcode`
- Resend for email workflows

## Main Routes

- `/careers` - public Ujjwalit Developers Program site
- `/careers/apply` - student application/registration form
- `/verify` and `/verify/[certificateId]` - certificate verification
- `/admin/login` and `/admin/dashboard` - admin console
- `/admin/dashboard/opportunities` - create, edit, open, close, and archive internships/events/projects

Subdomain routing is handled by `middleware.ts`:

- `careers.ujjwalit.co.in` -> `/careers`
- `verify.ujjwalit.co.in` -> `/verify`
- `admin.ujjwalit.co.in` -> `/admin`

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

Local subdomain testing:

- `http://localhost:3000/?subdomain=careers`
- `http://localhost:3000/?subdomain=verify`
- `http://localhost:3000/?subdomain=admin`

## Database Setup

Run [supabase/schema.sql](supabase/schema.sql) in Supabase SQL Editor after backing up anything important. The schema creates:

- `opportunities` for admin-customizable internships, projects, and events
- `applications`, `students`, `documents`, `certificates`, `certificate_templates`
- Storage buckets for resumes, letters, certificates, templates, and opportunity assets
- RLS policies for public applications, public verification, and authenticated admin management

Create admin users from Supabase Dashboard -> Authentication -> Users.

## Development Notes

- Public opportunity cards come from `opportunities` where `status = open` and `visibility = public`.
- If Supabase is unavailable or the schema has not been run yet, `lib/opportunities.shared.ts` provides safe fallback content.
- Shared client-safe opportunity helpers live in `lib/opportunities.shared.ts`; server fetching lives in `lib/opportunities.ts`.
- Certificate verification depends on `certificate_id`, `verification_hash`, `verification_url`, and optional QR/PDF URLs.
- Keep UI assets used by the Next app in `public/`, not in `legacy-UJJWALIT_BLOGS/`.

## Quality Checks

```bash
npm run lint
npm run build
```

Known framework warnings to watch:

- Next.js 16 warns that `middleware.ts` should eventually be migrated to `proxy.ts`.
- A non-standard `NODE_ENV` in the shell can trigger a Next.js warning; deployment should use Vercel defaults.
