# Pulse — Accountability Dashboard (MVP scaffold)

This is a Next.js + Tailwind + Supabase scaffold for the **Top 3 + Minimum Wins** system.

## Quick start

```bash
pnpm i # or npm i / yarn
cp .env.example .env.local
npm run dev
```

### Configure Supabase
1. Create a project, copy URL and anon keys into `.env.local`.
2. Run the SQL in `supabase/schema.sql` (SQL Editor → New query).  
3. Create a **Service Role** key and add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`.

> RLS policies in the schema restrict rows to `auth.uid()`.

### Optional: Push reminders
- Create a OneSignal app, copy `NEXT_PUBLIC_ONESIGNAL_APP_ID` to `.env.local`.
- Add a backend job (Supabase Scheduled Function / CRON) to send morning/midday/evening pushes; see `docs/jobs.md` (TBD).

## What’s included
- `/` Dashboard with:
  - **Today’s Top 3**
  - Four category lists with quick add + checkbox toggle
  - **Energy filter** (All / Low)
  - Day navigation
- `/settings` basics: timezone and reminder times (non-persistent demo)
- API routes as stubs: `/api/dashboard`, `/api/tasks`, `/api/focus`
- Supabase schema ready to paste

## Next steps you can ship
- Wire `/api/*` to Supabase using RLS (see `supabase/schema.sql`).
- Implement weekly generator job (Supabase function/cron).
- Persist settings to `profiles` table.
- Add OneSignal SDK and permission prompt.

---

Generated 2025-08-10T11:57:04.814806Z
