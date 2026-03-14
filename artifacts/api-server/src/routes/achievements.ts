import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { achievementsTable, workoutsTable, workoutSetsTable } from "@workspace/db/schema";
import { eq, count } from "drizzle-orm";

const router: IRouter = Router();

const ACHIEVEMENT_DEFINITIONS = [
  { key: "first_workout", name: "First Step", description: "Complete your first workout", icon: "🏃", category: "Workout Milestones", target: 1 },
  { key: "workouts_10", name: "Getting Started", description: "Complete 10 workouts", icon: "💪", category: "Workout Milestones", target: 10 },
  { key: "workouts_50", name: "Dedicated Athlete", description: "Complete 50 workouts", icon: "🏅", category: "Workout Milestones", target: 50 },
  { key: "workouts_100", name: "Century Club", description: "Complete 100 workouts", icon: "🏆", category: "Workout Milestones", target: 100 },
  { key: "streak_7", name: "Week Warrior", description: "Work out 7 days in a row", icon: "🔥", category: "Streak", target: 7 },
  { key: "streak_30", name: "Monthly Master", description: "Work out 30 days in a row", icon: "⚡", category: "Streak", target: 30 },
  { key: "pr_first", name: "Personal Best", description: "Set your first personal record", icon: "🎯", category: "Strength", target: 1 },
  { key: "heavy_lifter", name: "Heavy Lifter", description: "Lift over 100kg in a single set", icon: "🦾", category: "Strength", target: 1 },
  { key: "meal_plan", name: "Nutrition Aware", description: "Generate your first meal plan", icon: "🥗", category: "Nutrition", target: 1 },
  { key: "water_goal", name: "Hydration Hero", description: "Hit your daily water goal", icon: "💧", category: "Nutrition", target: 1 },
];

async function computeAchievements(userId: string) {
  const workouts = await db.select().from(workoutsTable).where(eq(workoutsTable.userId, userId));
  const totalWorkouts = workouts.length;
  
  const sets = await db.select().from(workoutSetsTable);
  const userSets = sets.filter(s => workouts.some(w => w.id === s.workoutId));
  const maxWeight = userSets.length > 0 ? Math.max(...userSets.map(s => s.weightKg)) : 0;

  const existing = await db.select().from(achievementsTable).where(eq(achievementsTable.userId, userId));
  const earnedMap = new Map(existing.map(a => [a.key, a.earnedAt]));

  const progress: Record<string, number> = {
    first_workout: Math.min(totalWorkouts, 1),
    workouts_10: Math.min(totalWorkouts, 10),
    workouts_50: Math.min(totalWorkouts, 50),
    workouts_100: Math.min(totalWorkouts, 100),
    streak_7: 0, // would need streak logic
    streak_30: 0,
    pr_first: userSets.length > 0 ? 1 : 0,
    heavy_lifter: maxWeight >= 100 ? 1 : 0,
    meal_plan: earnedMap.has("meal_plan") ? 1 : 0,
    water_goal: earnedMap.has("water_goal") ? 1 : 0,
  };

  // Auto-award newly earned achievements
  const toAward: string[] = [];
  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (progress[def.key] >= def.target && !earnedMap.has(def.key)) {
      toAward.push(def.key);
    }
  }

  if (toAward.length > 0) {
    for (const key of toAward) {
      await db.insert(achievementsTable).values({ userId, key, earnedAt: new Date() }).onConflictDoNothing();
    }
    const updated = await db.select().from(achievementsTable).where(eq(achievementsTable.userId, userId));
    updated.forEach(a => earnedMap.set(a.key, a.earnedAt));
  }

  return ACHIEVEMENT_DEFINITIONS.map((def, i) => ({
    id: i + 1,
    key: def.key,
    name: def.name,
    description: def.description,
    icon: def.icon,
    category: def.category,
    earnedAt: earnedMap.has(def.key) ? earnedMap.get(def.key)?.toISOString() || null : null,
    progress: Math.min(progress[def.key] || 0, def.target),
    target: def.target,
  }));
}

router.get("/achievements", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const achievements = await computeAchievements(req.user.id);
  res.json(achievements);
});

export default router;
