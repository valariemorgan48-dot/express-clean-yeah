 # Express Solutions — Time Tracker (production app)

Next.js 14 (App Router) + Prisma/Postgres + NextAuth rebuild of the Express Solutions time-tracking prototype. Preserves the Industry design system look (Barlow/Barlow Condensed, steel-blue blueprint cards) and all prototyped behavior: employee clock in/out, manager weekly-hours view, and weekly-recurring shift assignment, computed on the Friday 12:00 AM–Thursday 11:59:59 PM work week.

## Stack
- **Next.js 14** (App Router, TypeScript)
- **Prisma** + **PostgreSQL** (works with Vercel Postgres, Neon, or Supabase)
- **NextAuth** (Credentials provider, JWT sessions, bcrypt password hashing)

## Local setup
1. `npm install`
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL` (a Postgres connection string) and `NEXTAUTH_SECRET` (`openssl rand -base64 32`).
3. `npx prisma migrate dev --name init`
4. `npm run db:seed` — creates a manager login (`priya@expresssolutions.com` / `manager123`) and 15 employee logins (`firstname.lastname@expresssolutions.com` / `employee123`).
5. `npm run dev` — open http://localhost:3000

## Deploying to Vercel
1. Push this repo to GitHub.
2. In Vercel: **New Project** → import the repo.
3. Add a Postgres database: Vercel's **Storage** tab → **Create Database** → Postgres (or connect Neon/Supabase) — this sets `DATABASE_URL` automatically, or paste it in yourself under **Environment Variables**.
4. Add env vars in the Vercel project settings: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (your production URL, e.g. `https://your-app.vercel.app`).
5. Deploy. After the first deploy, run migrations against production once (locally, pointed at the prod `DATABASE_URL`, or via a one-off Vercel CLI command): `npx prisma migrate deploy && npm run db:seed`.

## What's real vs. what's next
Implemented: auth + sessions, clock in/out persisted to the DB, weekly hours computed server-side on the correct work-week boundary, shift creation with weekly recurrence (auto-expands each work week via the templates table).

Not yet built (flagged as next steps in the original design handoff): GPS/photo verification on punches, timesheet edit/approval + audit trail, overtime/break rules, notifications, PTO requests, payroll export. The Prisma schema (`prisma/schema.prisma`) is the place to extend the data model for these.

## Project structure
- `app/` — routes (`/login`, `/employee/*`, `/manager/*`) and API routes (`app/api/*`)
- `lib/` — `auth.ts` (NextAuth config), `prisma.ts` (client singleton), `workweek.ts` (Fri–Thu boundary math)
- `components/` — `BlueprintCard`, `TopBar`, `BottomNav` (the Industry design system's visual components)
- `prisma/schema.prisma` — data model; `prisma/seed.ts` — demo data matching the prototype
