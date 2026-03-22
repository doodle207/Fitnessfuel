# FitTrack Pro

## Overview

A complete fitness companion web app with workout tracking, nutrition, progress monitoring, and achievement badges. Built with a sleek dark theme featuring violet/cyan accents.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (Tailwind CSS, Shadcn/UI, Recharts, Framer Motion)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/       # Express API server
│   └── fitness-app/      # React + Vite frontend (served at /)
├── lib/
│   ├── api-spec/         # OpenAPI spec + Orval codegen config
│   ├── api-client-react/ # Generated React Query hooks
│   ├── api-zod/          # Generated Zod schemas from OpenAPI
│   ├── replit-auth-web/  # Browser auth hook (useAuth)
│   └── db/               # Drizzle ORM schema + DB connection
├── scripts/
│   └── src/seed-exercises.ts  # Exercise library seed data
```

## Features

1. **Auth + Onboarding**: Replit auth (PKCE via DB-backed `oauth_states` table) + Google OAuth. Profile creation invalidates query cache before redirect.
2. **Dashboard**: Row 1 = stats strip; Row 2 = LEFT: Macro rings (Protein/Carbs/Fat) + Hydration (API-synced), RIGHT: Recent Workout + Streaks. Water data fetched from and posted to `/api/progress/water`. Profile icon (top-right) links to profile page.
3. **Workout Tracker**: Log sets/reps/weight by muscle group and exercise, smart progression suggestions. Muscle group cards use uploaded anatomical images. Recent workouts shown as read-only history (no longer navigate to active workout). Finished workouts detected by `durationMinutes > 0` and shown with a completed summary view.
4. **Progress Tracking**: Body weight chart (date sent as YYYY-MM-DD), measurements, achievements. Locked badges clickable — show a toast with badge name/requirement + 🔒 indicator.
5. **Diet/Nutrition**: Country picker (auto-regenerates plan on change), macro targets (Protein/Carbs/Fat) shown with progress bars, food log, water tracker (API-synced), AI meal plan (country-specific foods, diet preference filter)
6. **Achievements**: 10 badges across workout, streak, strength, and nutrition categories
7. **Exercise Library**: 143 exercises (20 per muscle group: Chest, Back, Legs, Shoulders, Arms, Core, Cardio, Full Body) seeded to the database
8. **Menstruation Cycle Tracker**: Female users see a full Cycle Tracker widget at the top of the Dashboard showing current phase (Menstruation/Follicular/Ovulation/Luteal), cycle day, next period countdown, a phase progress bar, and a personalized fitness tip. Period start/end dates are entered in the Profile edit modal (only visible when gender = female).

## Database Schema

- `users` (Replit auth users)
- `sessions` (auth sessions)
- `user_profiles` (fitness profile)
- `exercises` (library of 33 exercises)
- `favorite_exercises` (user favorites)
- `workouts` (workout sessions)
- `workout_sets` (individual sets)
- `bodyweight_logs`
- `measurements`
- `water_logs`
- `meal_plans`
- `meals`
- `food_logs`
- `achievements`

## TypeScript & Composite Projects

- `lib/*` packages are composite and emit declarations via `tsc --build`.
- Root `tsconfig.json` is a solution file for libs only.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — full typecheck with project references
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client and Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes
- `pnpm --filter @workspace/scripts run seed-exercises` — seed exercise library
