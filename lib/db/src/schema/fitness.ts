import { pgTable, text, serial, integer, real, timestamp, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userProfilesTable = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  heightCm: real("height_cm").notNull(),
  weightKg: real("weight_kg").notNull(),
  fitnessGoal: text("fitness_goal").notNull(),
  experienceLevel: text("experience_level").notNull(),
  activityLevel: text("activity_level").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserProfileSchema = createInsertSchema(userProfilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfilesTable.$inferSelect;

export const exercisesTable = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group").notNull(),
  secondaryMuscles: text("secondary_muscles"),
  equipment: text("equipment").notNull().default("Bodyweight"),
  instructions: text("instructions").notNull(),
  difficulty: text("difficulty").notNull().default("Intermediate"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Exercise = typeof exercisesTable.$inferSelect;

export const favoriteExercisesTable = pgTable("favorite_exercises", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  exerciseId: integer("exercise_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workoutsTable = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group"),
  date: date("date").notNull(),
  durationMinutes: integer("duration_minutes"),
  caloriesBurned: integer("calories_burned"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWorkoutSchema = createInsertSchema(workoutsTable).omit({ id: true, createdAt: true });
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Workout = typeof workoutsTable.$inferSelect;

export const workoutSetsTable = pgTable("workout_sets", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull(),
  exerciseId: integer("exercise_id").notNull(),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps").notNull(),
  weightKg: real("weight_kg").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWorkoutSetSchema = createInsertSchema(workoutSetsTable).omit({ id: true, createdAt: true });
export type InsertWorkoutSet = z.infer<typeof insertWorkoutSetSchema>;
export type WorkoutSet = typeof workoutSetsTable.$inferSelect;

export const bodyweightLogsTable = pgTable("bodyweight_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  weightKg: real("weight_kg").notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const measurementsTable = pgTable("measurements", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: date("date").notNull(),
  chestCm: real("chest_cm"),
  waistCm: real("waist_cm"),
  hipsCm: real("hips_cm"),
  bicepCm: real("bicep_cm"),
  thighCm: real("thigh_cm"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const waterLogsTable = pgTable("water_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  amountMl: integer("amount_ml").notNull(),
  date: date("date").notNull(),
  loggedAt: timestamp("logged_at").defaultNow().notNull(),
});

export const mealPlansTable = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  dailyCalories: integer("daily_calories").notNull(),
  proteinG: integer("protein_g").notNull(),
  carbsG: integer("carbs_g").notNull(),
  fatG: integer("fat_g").notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

export const mealsTable = pgTable("meals", {
  id: serial("id").primaryKey(),
  mealPlanId: integer("meal_plan_id").notNull(),
  mealType: text("meal_type").notNull(),
  name: text("name").notNull(),
  calories: integer("calories").notNull(),
  proteinG: integer("protein_g").notNull(),
  carbsG: integer("carbs_g").notNull(),
  fatG: integer("fat_g").notNull(),
  foods: text("foods").notNull().default("[]"),
});

export const foodLogsTable = pgTable("food_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: date("date").notNull(),
  foodName: text("food_name").notNull(),
  calories: integer("calories").notNull(),
  proteinG: integer("protein_g"),
  carbsG: integer("carbs_g"),
  fatG: integer("fat_g"),
  fiberG: integer("fiber_g"),
  sodiumMg: integer("sodium_mg"),
  servingSize: text("serving_size"),
  mealType: text("meal_type").notNull(),
  loggedAt: timestamp("logged_at").defaultNow().notNull(),
});

export const progressPhotosTable = pgTable("progress_photos", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  photoDataUrl: text("photo_data_url").notNull(),
  label: text("label"),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const achievementsTable = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  key: text("key").notNull(),
  earnedAt: timestamp("earned_at"),
});
