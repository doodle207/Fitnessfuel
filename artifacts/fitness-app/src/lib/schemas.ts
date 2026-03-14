import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.coerce.number().min(16).max(120),
  gender: z.enum(["male", "female", "other"]),
  heightCm: z.coerce.number().min(100).max(300),
  weightKg: z.coerce.number().min(30).max(300),
  fitnessGoal: z.enum(["weight loss", "muscle gain", "maintenance", "endurance"]),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
  activityLevel: z.enum(["sedentary", "light", "moderate", "very active"]),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export const workoutSetSchema = z.object({
  reps: z.coerce.number().min(1, "At least 1 rep required"),
  weightKg: z.coerce.number().min(0, "Weight cannot be negative"),
  notes: z.string().optional(),
});

export type WorkoutSetFormData = z.infer<typeof workoutSetSchema>;
