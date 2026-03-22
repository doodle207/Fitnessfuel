# CaloForgeX

## Overview

A complete fitness companion web app with workout tracking, AI-powered nutrition, progress monitoring, and achievement badges. Built with a sleek dark theme featuring violet/cyan accents. Formerly known as FitTrack Pro.

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
- **AI (text)**: Groq (`GROQ_API_KEY` → `https://api.groq.com/openai/v1`, model: `llama-3.3-70b-versatile`) when key is set; falls back to Replit AI proxy (`AI_INTEGRATIONS_OPENAI_BASE_URL` + `AI_INTEGRATIONS_OPENAI_API_KEY`, model: `gpt-4o`)
- **AI (vision/image)**: Always uses Replit AI proxy + `gpt-4o` (Groq doesn't support vision)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/       # Express API server
│   │   └── src/lib/ai.ts # OpenAI helper (chat, image analysis, macro estimation)
│   └── fitness-app/      # React + Vite frontend (served at /)
│       └── public/logo.jpeg  # CaloForgeX logo
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

1. **Auth + Onboarding**: Replit auth (PKCE via DB-backed `oauth_states` table) + Google OAuth. Welcome screen with CaloForgeX branding + CTA (stored in localStorage `cfx_welcomed`). Onboarding: 7 fitness goals, country dropdown (15 countries), athlete activity level (1.9 multiplier), age input fix (text+inputMode).
2. **Dashboard**: Timezone-based greeting (country→timezone map). Net Calories = Eaten - Burned (totalBurned = workout + step calories). Calorie overview with goal/TDEE/eaten/burned cards and central net cal badge. Macro rings (Protein/Carbs/Fat). Hydration tracker (API-synced). Workout streaks & weekly volume chart. Period cycle tracker redesigned with 4 phases (Menstruation/Follicular/Ovulation/Luteal), phase-specific colors, tips, and progress bar. Non-intrusive ad banners between sections.
3. **Workout Tracker**: Log sets/reps/weight by muscle group and exercise, smart progression suggestions. Muscle group cards use uploaded anatomical images.
4. **Progress Tracking**: Body weight chart, measurements, achievements. Locked badges show toast with requirement.
5. **Diet/Nutrition**: Smart food logging (food name + weight → AI macro estimation via `/api/diet/estimate-food`). Country removed from diet page (uses profile.country). Macro progress bars (protein/carbs/fat with targets). Food log with camera AI scan. Hydration tracker. AI meal plan sidebar.
6. **AI Coach**: 3 tabs: Daily Coaching (insights), Chat (conversational AI with quick questions), Meal Plan (generate personalized plans based on country/diet/goal). Powered by Groq (or OpenAI fallback). Usage limit badges shown (2 chats/day, 1 meal plan/week). UpgradeModal pops up when limit hit.
11. **Freemium System**: Free limits: 2 AI chats/day, 2 food scans/day, 1 meal plan/week. `checkLimit` middleware on `/api/ai-coach/chat`, `/api/ai-coach/meal-plan`, `/api/diet/analyze-image`. DB tables: `subscriptions`, `coupon_redemptions`, `usage_tracking`. Premium bypass via 7-day coupon redemption (`COUPON_VOUCHER` env secret, one-time globally).
12. **UpgradeModal**: Full-screen modal with Upgrade Plan tab (pricing tiers) and Coupon tab (redeem code). Trigger types: `aiChat`, `scan`, `mealPlan`, `general`. Shows usage counters.
13. **Pricing Page** (`/pricing`): Plan comparison (Free vs Premium ₹199/mo), coupon redemption, active plan status. Linked from desktop sidebar as "Premium" nav item.
14. **Google Login**: Always visible on login screen (disabled/grayed out when not configured). Replit login shown below.
7. **Profile**: Country field, 7 fitness goals, athlete activity level, period cycle dates (female only), diet preference.
8. **Ad Banners**: Non-intrusive `AdBanner` component with 3 variants, placed between dashboard sections and in diet/AI coach pages.
9. **Achievements**: 10 badges across workout, streak, strength, and nutrition categories.
10. **Exercise Library**: 143 exercises seeded to the database.

## Database Schema

Key tables: `user_profiles` (includes `country` column), `workouts`, `workout_exercises`, `exercise_sets`, `food_logs`, `water_logs`, `body_measurements`, `exercises` (seeded), `oauth_states`, `sessions`.

## Key Formulas

- **BMR**: Mifflin-St Jeor (10×weight + 6.25×height - 5×age + gender offset)
- **TDEE**: BMR × activity multiplier (sedentary 1.2, light 1.375, moderate 1.55, active/very active 1.725, athlete 1.9)
- **Calorie Target**: TDEE + goal adjustment (weight loss -500, muscle gain +300, performance +200, recomposition -100)
- **Net Calories**: Eaten - Burned (workout + step calories)
- **Protein Target**: weight × 2.2g
- **Steps**: 0.04 kcal per step

## Activity Level Mapping

On save: `active` → `"very active"`, `athlete` → `"athlete"` (stored as-is in DB)
