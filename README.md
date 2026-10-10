# LifeOS

A personal command center for expenses, workouts, learning (automotive cybersecurity), content/reels, calendar and progress.
Built for one person, structured for many: every row has a `user_id` and Row Level Security.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres, Auth, Realtime) · Recharts · React Hook Form + Zod · date-fns-free date helpers · Lucide

## Features
Today dashboard with daily gauge and check-in · Calendar (month/week/day, color-coded categories) · Learning tracker with quick check-in, revision list and analytics ·
Workout A/B program, set-by-set logging, progression and PR detection · Expenses with budget and charts · Content pipeline with alternate-day rhythm and manual metrics ·
Analytics (week/month/custom) · Weekly and monthly reviews with reflections · Global search · CSV/JSON export · Quick Add · Settings · Demo data.

## Project structure
```
src/app            routes: (app)/* pages, login, api/export
src/features       one folder per module: schema (Zod), actions (server), queries, components, pure calc + tests
src/components     layout, shared UI, Quick Add, realtime refresh
src/lib            supabase clients (browser/server/middleware), date, csv, streak and format helpers
supabase/migrations  0001..0009 SQL, run in order
```

## Local setup
1. `npm install`
2. Create a free project at supabase.com.
3. `cp .env.example .env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API).
4. Run every file in `supabase/migrations/` in numeric order in the Supabase SQL editor (or `supabase db push`).
5. Authentication → Providers → Email enabled. For local testing turn off "Confirm email".
6. `npm run dev` → http://localhost:3000, create an account, then Settings → **Load demo data** if you want sample content.

## Commands
`npm run dev` · `npm run build` · `npm start` · `npm run typecheck` · `npm test`

## Environment variables
| Name | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | safe to expose, protected by RLS |
The service-role key is **never** used by the app and must not be added to Vercel as a public variable.

## Deploy (free tier)
1. Push the repo to GitHub and import it in Vercel (framework: Next.js, no custom build settings).
2. Add the two environment variables above (Production and Preview).
3. In Supabase → Authentication → URL Configuration: set **Site URL** to your Vercel URL and add `https://<your-app>.vercel.app/**` (and your preview domain if used) to **Redirect URLs**.
4. Supabase → Database → Replication: confirm `calendar_events, expenses, learning_sessions, workout_sessions, workout_sets, content_items, daily_checkins, revision_items` are in the `supabase_realtime` publication (the migrations add them).
5. Deploy. Open the site on a second device and sign in: the same data appears because the database is the source of truth.

## Security notes
- RLS is enabled on every table; policies allow only `auth.uid() = user_id`. Inserts default `user_id` to `auth.uid()`.
- Server code uses `auth.getUser()` (validated), never an unverified session.
- Inputs are validated with Zod on the client and again in every server action; search terms are sanitized; export and list-management endpoints use fixed allow-lists.
- CSV exports neutralize spreadsheet formulas. Security headers are set in `next.config.ts`. No secrets live in code.
- Demo and list-management SQL functions run with `security definer` but only ever act on `auth.uid()`.

## Backup
Settings → Your data → **Full backup (JSON)** or per-dataset CSV/JSON. Supabase also offers project backups on paid plans; on the free tier use the JSON export regularly.

## Verification checklist
Log in → Today → log a workout and sets → see progression → record learning and check-in → add an expense → see month totals → add a reel idea → schedule an alternate day → see it on the calendar → daily check-in → weekly/monthly analytics → refresh (data persists) → sign in on another device.

## Known limitations
- No restore-from-backup importer yet (export only).
- Reminders are stored as preferences; nothing is sent yet. The dashboard shows what is due.
- Content thumbnails are links, not uploads. Metrics are manual. A fixed A/B program only.
- Rename of categories isn't supported (add and remove instead). Learning sessions, workouts and check-ins can't be edited after saving.
- The first request after deploy is slower on free-tier cold starts.

## Future ideas
Nutrition, body weight, sleep, habits, job and interview tracking, AI learning summaries and quizzes, Instagram/YouTube analytics sync, Garmin/Google Fit, push reminders, an import/restore tool.
