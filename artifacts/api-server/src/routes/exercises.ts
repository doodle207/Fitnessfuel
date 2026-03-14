import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { exercisesTable, favoriteExercisesTable, workoutSetsTable, workoutsTable } from "@workspace/db/schema";
import { eq, and, ilike, sql, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/exercises", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const { muscleGroup, search } = req.query as { muscleGroup?: string; search?: string };

  let query = db.select().from(exercisesTable);
  const conditions = [];
  if (muscleGroup && muscleGroup !== "All") {
    conditions.push(eq(exercisesTable.muscleGroup, muscleGroup));
  }
  if (search) {
    conditions.push(ilike(exercisesTable.name, `%${search}%`));
  }
  const exercises = conditions.length > 0
    ? await db.select().from(exercisesTable).where(and(...conditions))
    : await db.select().from(exercisesTable);

  const favorites = await db.select().from(favoriteExercisesTable).where(eq(favoriteExercisesTable.userId, userId));
  const favoriteIds = new Set(favorites.map(f => f.exerciseId));

  res.json(exercises.map(e => ({ ...e, isFavorite: favoriteIds.has(e.id) })));
});

router.get("/exercises/favorites", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const favorites = await db.select({ exerciseId: favoriteExercisesTable.exerciseId }).from(favoriteExercisesTable).where(eq(favoriteExercisesTable.userId, userId));
  if (favorites.length === 0) {
    res.json([]);
    return;
  }
  const ids = favorites.map(f => f.exerciseId);
  const exercises = await db.select().from(exercisesTable).where(sql`${exercisesTable.id} = ANY(${ids})`);
  res.json(exercises.map(e => ({ ...e, isFavorite: true })));
});

router.post("/exercises/:id/favorite", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const exerciseId = parseInt(req.params.id);

  const existing = await db.select().from(favoriteExercisesTable)
    .where(and(eq(favoriteExercisesTable.userId, userId), eq(favoriteExercisesTable.exerciseId, exerciseId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(favoriteExercisesTable)
      .where(and(eq(favoriteExercisesTable.userId, userId), eq(favoriteExercisesTable.exerciseId, exerciseId)));
  } else {
    await db.insert(favoriteExercisesTable).values({ userId, exerciseId });
  }

  res.json({ success: true });
});

router.get("/exercises/:id/progression", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const exerciseId = parseInt(req.params.id);

  const exercise = await db.select().from(exercisesTable).where(eq(exercisesTable.id, exerciseId)).limit(1);
  if (exercise.length === 0) {
    res.status(404).json({ error: "Exercise not found" });
    return;
  }

  const sets = await db.select({
    date: workoutsTable.date,
    weightKg: workoutSetsTable.weightKg,
    reps: workoutSetsTable.reps,
  })
    .from(workoutSetsTable)
    .innerJoin(workoutsTable, eq(workoutSetsTable.workoutId, workoutsTable.id))
    .where(and(eq(workoutSetsTable.exerciseId, exerciseId), eq(workoutsTable.userId, userId)))
    .orderBy(workoutsTable.date);

  const byDate = new Map<string, { maxWeight: number; totalVolume: number; sets: number }>();
  for (const s of sets) {
    const d = s.date.toString();
    const existing = byDate.get(d) || { maxWeight: 0, totalVolume: 0, sets: 0 };
    byDate.set(d, {
      maxWeight: Math.max(existing.maxWeight, s.weightKg),
      totalVolume: existing.totalVolume + s.weightKg * s.reps,
      sets: existing.sets + 1,
    });
  }

  const history = Array.from(byDate.entries()).map(([date, data]) => ({ date, ...data }));
  const pr = history.length > 0 ? Math.max(...history.map(h => h.maxWeight)) : null;
  const lastWeight = history.length > 0 ? history[history.length - 1].maxWeight : null;

  res.json({
    exerciseId,
    exerciseName: exercise[0].name,
    personalRecord: pr,
    lastWeight,
    history,
  });
});

export default router;
