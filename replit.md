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

1. **Auth + Onboarding**: Replit auth with user profile setup (name, age, gender, height, weight, goal, experience)
2. **Dashboard**: Total workouts, streak, calories burned, recent workouts, PRs, weekly volume chart
3. **Workout Tracker**: Log sets/reps/weight by muscle group and exercise, smart progression suggestions
4. **Exercise Library**: 33 exercises across 8 muscle groups, search/filter, favorites
5. **Progress Tracking**: Body weight chart, measurements, achievements
6. **Diet/Nutrition**: Personalized macro calculator, meal plan generator, food log, water tracker
7. **Achievements**: 10 badges across workout, streak, strength, and nutrition categories

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
