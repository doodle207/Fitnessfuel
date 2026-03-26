import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { exercisesTable } from "@workspace/db/schema";
import { count } from "drizzle-orm";

/**
 * Creates all database tables if they don't exist.
 * Safe to run on every server startup — all statements use IF NOT EXISTS.
 */
async function createTables() {
  // Enable pgcrypto for gen_random_uuid()
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

  // Auth tables (required for Replit Auth)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sessions (
      sid VARCHAR PRIMARY KEY,
      sess JSONB NOT NULL,
      expire TIMESTAMP NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire)
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR UNIQUE,
      first_name VARCHAR,
      last_name VARCHAR,
      profile_image_url VARCHAR,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS oauth_states (
      state VARCHAR PRIMARY KEY,
      provider VARCHAR NOT NULL DEFAULT 'replit',
      code_verifier TEXT NOT NULL,
      nonce TEXT NOT NULL,
      return_to TEXT NOT NULL DEFAULT '/',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMP NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "IDX_oauth_states_expires" ON oauth_states (expires_at)
  `);

  // Fitness tables
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      height_cm REAL NOT NULL,
      weight_kg REAL NOT NULL,
      fitness_goal TEXT NOT NULL,
      experience_level TEXT NOT NULL,
      activity_level TEXT NOT NULL,
      diet_preference TEXT NOT NULL DEFAULT 'non-veg',
      period_start_date DATE,
      period_end_date DATE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS exercises (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      muscle_group TEXT NOT NULL,
      secondary_muscles TEXT,
      equipment TEXT NOT NULL DEFAULT 'Bodyweight',
      instructions TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'Intermediate',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS favorite_exercises (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      exercise_id INTEGER NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS workouts (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      muscle_group TEXT,
      date DATE NOT NULL,
      duration_minutes INTEGER,
      calories_burned INTEGER,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS workout_sets (
      id SERIAL PRIMARY KEY,
      workout_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      set_number INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      weight_kg REAL NOT NULL,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bodyweight_logs (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      weight_kg REAL NOT NULL,
      date DATE NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS measurements (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      date DATE NOT NULL,
      chest_cm REAL,
      waist_cm REAL,
      hips_cm REAL,
      bicep_cm REAL,
      thigh_cm REAL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS water_logs (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount_ml INTEGER NOT NULL,
      date DATE NOT NULL,
      logged_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS meal_plans (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      daily_calories INTEGER NOT NULL,
      protein_g INTEGER NOT NULL,
      carbs_g INTEGER NOT NULL,
      fat_g INTEGER NOT NULL,
      generated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS meals (
      id SERIAL PRIMARY KEY,
      meal_plan_id INTEGER NOT NULL,
      meal_type TEXT NOT NULL,
      name TEXT NOT NULL,
      calories INTEGER NOT NULL,
      protein_g INTEGER NOT NULL,
      carbs_g INTEGER NOT NULL,
      fat_g INTEGER NOT NULL,
      foods TEXT NOT NULL DEFAULT '[]'
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS food_logs (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      date DATE NOT NULL,
      food_name TEXT NOT NULL,
      calories INTEGER NOT NULL,
      protein_g INTEGER,
      carbs_g INTEGER,
      fat_g INTEGER,
      fiber_g INTEGER,
      sodium_mg INTEGER,
      serving_size TEXT,
      meal_type TEXT NOT NULL,
      logged_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS progress_photos (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      photo_data_url TEXT NOT NULL,
      label TEXT,
      date DATE NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS achievements (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      key TEXT NOT NULL,
      earned_at TIMESTAMP
    )
  `);

  // Add password_hash column to users if missing (email/password auth)
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR`);

  // Add new columns to user_profiles if missing (safe migration for existing deployments)
  await db.execute(sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'USA'`);
  await db.execute(sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS diet_preference TEXT NOT NULL DEFAULT 'non-veg'`);
  await db.execute(sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS period_start_date DATE`);
  await db.execute(sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS period_end_date DATE`);

  // Subscriptions table (premium access)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      is_premium BOOLEAN NOT NULL DEFAULT FALSE,
      plan_name TEXT NOT NULL DEFAULT 'free',
      expiry_date TIMESTAMP,
      payment_provider TEXT,
      coupon_used TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Coupon redemptions table (one-time use tracking)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS coupon_redemptions (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      coupon_code TEXT NOT NULL,
      redeemed_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, coupon_code)
    )
  `);

  // OTP table for email verification
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS email_otps (
      id SERIAL PRIMARY KEY,
      email VARCHAR NOT NULL,
      otp_code VARCHAR(6) NOT NULL,
      is_used BOOLEAN NOT NULL DEFAULT FALSE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "IDX_email_otps_email" ON email_otps (email)`);

  // Add cycle_regularity to user_profiles if missing
  await db.execute(sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS cycle_regularity TEXT DEFAULT 'regular'`);

  // Usage tracking table (daily/weekly limits for free users)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS usage_tracking (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      ai_chats_today INTEGER NOT NULL DEFAULT 0,
      scans_today INTEGER NOT NULL DEFAULT 0,
      meal_plans_this_week INTEGER NOT NULL DEFAULT 0,
      future_body_simulator_uses_this_week INTEGER NOT NULL DEFAULT 0,
      last_daily_reset DATE,
      last_weekly_reset DATE
    )
  `);
}

/**
 * Seeds exercises if the table is empty.
 * Imports from the local seed data (no CLI needed).
 */
async function seedExercisesIfEmpty() {
  const [{ value }] = await db.select({ value: count() }).from(exercisesTable);
  if (Number(value) > 0) {
    console.log(`[dbInit] Exercises already seeded (${value} rows). Skipping.`);
    return;
  }

  console.log("[dbInit] Seeding exercises...");
  // Dynamically import the seed data to avoid circular dep issues
  const { default: seedExercises } = await import("./seedData");
  await db.insert(exercisesTable).values(seedExercises);
  console.log(`[dbInit] Seeded ${seedExercises.length} exercises.`);
}

/**
 * Main initialization entry point. Call this before starting the HTTP server.
 */
export async function initDatabase() {
  try {
    console.log("[dbInit] Initializing database schema...");
    await createTables();
    console.log("[dbInit] All tables ready.");
    await seedExercisesIfEmpty();
  } catch (err: any) {
    console.error("[dbInit] Database initialization failed:", err?.message ?? err);
    // Don't crash the server — tables may already exist from a previous run
  }
}
