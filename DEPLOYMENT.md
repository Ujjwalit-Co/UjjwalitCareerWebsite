# Deployment Guide: Vercel + Hostinger DNS

This app should be deployed as the new careers platform, not as part of the legacy EJS app. The `legacy-UJJWALIT_BLOGS/` folder is excluded by `.vercelignore`.

## 1. Prepare Supabase

1. Open Supabase Dashboard.
2. Back up existing data if needed.
3. Run `supabase/schema.sql` in SQL Editor.
4. Confirm these tables exist: `opportunities`, `applications`, `students`, `certificates`, `documents`, `certificate_templates`.
5. Confirm storage buckets exist: `resumes`, `certificates`, `letters`, `templates`, `opportunity-assets`.
6. Create admin users from Authentication -> Users.

## 2. Deploy to Vercel

1. Push the repository to GitHub.
2. In Vercel, choose Add New Project and import this repository.
3. Framework preset: Next.js.
4. Build command: `npm run build`.
5. Output directory: leave default.
6. Add environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
```

7. Deploy.

## 3. Add Vercel Domains

In the Vercel project, open Settings -> Domains and add:

- `careers.ujjwalit.co.in`
- optional: `verify.ujjwalit.co.in`
- optional: `admin.ujjwalit.co.in`

Vercel will show DNS instructions. For Hostinger, use CNAME records for subdomains.

## 4. Configure Hostinger DNS

In Hostinger hPanel:

1. Go to Domains.
2. Select `ujjwalit.co.in`.
3. Open DNS / Nameservers -> DNS Zone.
4. Add or edit these records:

| Type | Name | Points to | TTL |
| --- | --- | --- | --- |
| CNAME | careers | cname.vercel-dns.com | default |
| CNAME | verify | cname.vercel-dns.com | default |
| CNAME | admin | cname.vercel-dns.com | default |

Do not change the root `ujjwalit.co.in` records unless you also want the main website to move to Vercel.

DNS can take a few minutes to several hours to propagate.

## 5. Verify Routing

After DNS propagation:

- Open `https://careers.ujjwalit.co.in`
- Confirm the Ujjwalit Developers Program page loads.
- Open `https://careers.ujjwalit.co.in/apply`
- Submit a test application.
- Log in at `https://admin.ujjwalit.co.in/login` if that domain is enabled.
- Create or close an opportunity in Admin -> Opportunities.
- Confirm the public page updates.

## 6. Production Checklist

- `.vercelignore` contains `legacy-UJJWALIT_BLOGS/**`.
- Supabase RLS is enabled on all app tables.
- Admin users are trusted accounts only.
- Resume bucket is private; certificate/template assets are public where intended.
- Vercel environment variables are production Supabase keys, not local placeholders.
- Test certificate verification with at least one issued certificate and QR code.

## 7. Future Notes

- Next.js 16 warns that `middleware.ts` is deprecated in favor of `proxy.ts`; migrate this before a future framework upgrade if required.
- Keep adding public programs/events through the admin dashboard rather than hardcoding cards.
- Store any new production image assets in `public/` or Supabase Storage, not in the legacy EJS folder.
