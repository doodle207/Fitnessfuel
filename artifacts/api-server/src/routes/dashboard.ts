import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { workoutsTable, workoutSetsTable, exercisesTable } from "@workspace/db/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;

  const allWorkouts = await db.select().from(workoutsTable)
    .where(eq(workoutsTable.userId, userId))
    .orderBy(desc(workoutsTable.date), desc(workoutsTable.createdAt));

  const totalWorkouts = allWorkouts.length;
  const totalCaloriesBurned = allWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);

  const sortedByDate = [...allWorkouts].sort((a, b) => new Date(b.date.toString()).getTime() - new Date(a.date.toString()).getTime());
  
  let currentStreak = 0;
  let weeklyStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const workoutDates = [...new Set(allWorkouts.map(w => w.date.toString()))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  for (let i = 0; i < workoutDates.length; i++) {
    const workoutDate = new Date(workoutDates[i]);
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    if (workoutDate.toDateString() === expected.toDateString()) {
      currentStreak++;
    } else {
      break;
    }
  }

  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);
  weeklyStreak = allWorkouts.filter(w => new Date(w.date.toString()) >= oneWeekAgo).length;

  const recentWorkouts = await Promise.all(sortedByDate.slice(0, 5).map(async (w) => {
    const sets = await db.select().from(workoutSetsTable).where(eq(workoutSetsTable.workoutId, w.id));
    const exerciseIds = new Set(sets.map(s => s.exerciseId));
    return {
      ...w,
      setCount: sets.length,
      exerciseCount: exerciseIds.size,
      date: w.date.toString(),
      createdAt: w.createdAt.toISOString(),
    };
  }));

  // Personal records
  const allSets = await db.select({
    exerciseId: workoutSetsTable.exerciseId,
    exerciseName: exercisesTable.name,
    weightKg: workoutSetsTable.weightKg,
    date: workoutsTable.date,
  })
    .from(workoutSetsTable)
    .innerJoin(workoutsTable, eq(workoutSetsTable.workoutId, workoutsTable.id))
    .innerJoin(exercisesTable, eq(workoutSetsTable.exerciseId, exercisesTable.id))
    .where(eq(workoutsTable.userId, userId));

  const prMap = new Map<number, { exerciseId: number; exerciseName: string; weightKg: number; date: string }>();
  for (const s of allSets) {
    const existing = prMap.get(s.exerciseId);
    if (!existing || s.weightKg > existing.weightKg) {
      prMap.set(s.exerciseId, {
        exerciseId: s.exerciseId,
        exerciseName: s.exerciseName,
        weightKg: s.weightKg,
        date: s.date.toString(),
      });
    }
  }
  const personalRecords = Array.from(prMap.values()).slice(0, 5);

  // Weekly volume last 7 days
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyVolume = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayWorkouts = allWorkouts.filter(w => w.date.toString() === dateStr);
    
    let volume = 0;
    for (const w of dayWorkouts) {
      const sets = await db.select().from(workoutSetsTable).where(eq(workoutSetsTable.workoutId, w.id));
      volume += sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
    }
    weeklyVolume.push({
      day: days[d.getDay()],
      volume,
      workouts: dayWorkouts.length,
    });
  }

  res.json({
    totalWorkouts,
    weeklyStreak,
    currentStreak,
    totalCaloriesBurned,
    recentWorkouts,
    personalRecords,
    weeklyVolume,
  });
});

export default router;
