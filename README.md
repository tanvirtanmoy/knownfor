# KnownFor

**Discover what you are known for through the people you work with.**

KnownFor is a personal reputation platform. People collect short, authentic
one-sentence feedback from colleagues, managers, clients, mentors and
collaborators, then approve what appears on a public profile wall.

This repo is a production-ready MVP. Out of the box it seeds two profiles: your
own owner profile (clean, ready for real feedback) and a neutral **Jane Doe**
example profile used by the landing page's "View example profile" link. The
schema, routing and queries are multi-tenant from day one.

---

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** for styling
- **Supabase** (Postgres + Auth + Row Level Security)
- **Zod** + **React Hook Form** patterns for validation
- **Vercel** for deployment

---

## Project structure

```
app/
  page.tsx                      Landing page
  [slug]/page.tsx               Public profile + feedback wall
  [slug]/feedback/page.tsx      Feedback submission form
  [slug]/feedback/thanks/...    Thank-you page
  login/page.tsx                Admin sign-in
  admin/page.tsx                Moderation dashboard
  admin/profile/page.tsx        Profile settings
components/                     FeedbackCard, FeedbackForm, ProfileHeader, …
lib/
  supabase/                     Browser + server + service-role clients
  validators/                   Zod schemas (feedback, profile)
  actions/                      Server actions (public submit, admin moderation)
  ai/summarize-feedback.ts      AI summary service (stubbed, ready to wire up)
types/database.ts              Hand-maintained DB types
supabase/
  migrations/                   0001_init.sql, 0002_rls.sql
  seed.sql                      Owner profile (clean) + Jane Doe example feedback
middleware.ts                  Session refresh + /admin guard
```

---

## 1. Install dependencies

```bash
npm install
```

Copy the env template and fill it in (values come from step 2):

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=https://knownfor.eu
```

---

## 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Once created, open **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server only — keep secret)

---

## 3. Run the migrations

Open **SQL Editor** in the Supabase dashboard and run, in order:

1. `supabase/migrations/0001_init.sql` — tables, indexes, triggers
2. `supabase/migrations/0002_rls.sql` — Row Level Security policies

> Using the Supabase CLI instead? `supabase db push` will apply everything in
> `supabase/migrations/`.

---

## 4. Create the first admin user

Each public `users` row links to a Supabase **Auth** user, so create the auth
users first:

1. Dashboard → **Authentication → Users → Add user**.
2. Add your **admin** user (this is your login). Tick **Auto Confirm User** so
   you can log in immediately.
3. Add a second user `jane.doe@example.com` (any password — it only exists to
   host the public example profile). Tick **Auto Confirm User** too.

---

## 5. Seed the profiles

1. Open `supabase/seed.sql` and make sure `admin_email` matches your admin email
   from step 4.
2. Run the file in the **SQL Editor**.

This creates your owner profile (clean — no fake feedback, so real feedback can
come in) plus a neutral **Jane Doe** example profile with five sample approved
feedback entries. The landing page's "View example profile" links to `/jane`, so
visitors explore the demo without seeing your real name. If the
`jane.doe@example.com` auth user doesn't exist yet, the seed skips the example
and prints a notice — create that user and re-run to populate it.

---

## 6. Run locally

```bash
npm run dev
```

- Landing: <http://localhost:3000>
- Example profile: <http://localhost:3000/jane>
- Leave feedback (example): <http://localhost:3000/jane/feedback>
- Your profile: <http://localhost:3000/tanvir> (replace with your slug)
- Admin: <http://localhost:3000/admin> (redirects to `/login`)

Useful checks:

```bash
npm run typecheck
npm run build
```

---

## 7. Deploy to Vercel

1. Push this repo to GitHub.
2. [vercel.com](https://vercel.com) → **New Project** → import the repo.
3. Add the four environment variables (same as `.env.local`) under
   **Settings → Environment Variables**. Set `NEXT_PUBLIC_SITE_URL` to your
   production domain (`https://knownfor.eu`).
4. Deploy.

---

## 8. Connect the knownfor.eu domain

1. Vercel project → **Settings → Domains → Add** → `knownfor.eu`.
2. At your registrar, point DNS as Vercel instructs:
   - Apex `knownfor.eu` → `A` record `76.76.21.21` (or the value Vercel shows),
   - `www` → `CNAME` `cname.vercel-dns.com`.
3. Wait for DNS + automatic SSL to provision.
4. Add `https://knownfor.eu` to Supabase **Authentication → URL Configuration →
   Site URL / Redirect URLs**.

---

## Security model (RLS)

- **Anyone** can *insert* feedback, but only as `pending`, non-public,
  `source = 'public_form'`. Pre-approved spam is impossible.
- **The public** can only *read* feedback that is `approved` **and** `is_public`.
  Public queries also select only safe columns — `ip_hash` and `user_agent` are
  never returned to visitors.
- **The profile owner** (authenticated, `auth.uid() = profile_user_id`) can read,
  approve, hide, reject, edit and delete their own feedback.
- IPs are salted-hashed (never stored raw). A best-effort in-memory rate limit
  caps submissions per IP/profile.

---

## Optional integrations

All optional — the app runs fully without them.

- **AI summaries.** Set `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`, default
  `gpt-4o-mini`). In `/admin`, click **Generate summary** to build a short,
  human description of what you're known for from your approved feedback; it's
  saved to `profile_summaries` and shown on your public profile. Without a key,
  a deterministic local heuristic is used instead.
- **Email notifications.** Set `RESEND_API_KEY`, `NOTIFY_EMAIL_TO` and
  `NOTIFY_EMAIL_FROM` ([resend.com](https://resend.com)) to get an email each
  time new feedback is submitted. Missing any of the three → notifications are
  silently skipped.
- **Private feedback links + QR.** No config needed. The feedback form is
  reachable only with a valid token (`/<slug>/feedback?k=<token>`); the public
  profile never links to it. In `/admin` you generate one or more share links —
  each with a copy-able URL and a locally generated QR code (no third-party QR
  service) — and can revoke any link at any time. Tokens are validated
  server-side with the service-role client, so they stay unenumerable. Visiting
  the form without a valid token shows a "private link" message instead.

## Testing

```bash
npm test          # run the Vitest suite once
npm run test:watch
```

Covers validators, the rate limiter, sanitisation/IP hashing, and the summary
heuristic — everything that doesn't require a live database.

## Future / not in the MVP

The schema and code leave room for: multi-user signup, organizations/teams,
AI-generated trait extraction + summaries (`lib/ai/summarize-feedback.ts`),
private/anonymous collection, PDF export, LinkedIn share cards, custom themes,
paid plans and feedback campaigns.

To enable AI summaries later, implement the OpenAI branch inside
`summarizeFeedback()` and persist results to the `profile_summaries` table.
