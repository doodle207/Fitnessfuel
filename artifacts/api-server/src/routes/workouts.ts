import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { workoutsTable, workoutSetsTable, exercisesTable, userProfilesTable } from "@workspace/db/schema";
import { CreateWorkoutBody, AddSetBody } from "@workspace/api-zod";
import { eq, and, desc, sql, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/workouts", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const workouts = await db.select().from(workoutsTable)
    .where(eq(workoutsTable.userId, userId))
    .orderBy(desc(workoutsTable.date), desc(workoutsTable.createdAt));

  const result = await Promise.all(workouts.map(async (w) => {
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

  res.json(result);
});

router.post("/workouts", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const body = CreateWorkoutBody.parse(req.body);
  const inserted = await db.insert(workoutsTable).values({ userId, ...body }).returning();
  const w = inserted[0];
  res.status(201).json({
    ...w,
    setCount: 0,
    exerciseCount: 0,
    date: w.date.toString(),
    createdAt: w.createdAt.toISOString(),
  });
});

router.get("/workouts/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const id = parseInt(req.params.id);
  const workout = await db.select().from(workoutsTable).where(and(eq(workoutsTable.id, id), eq(workoutsTable.userId, userId))).limit(1);
  if (workout.length === 0) {
    res.status(404).json({ error: "Workout not found" });
    return;
  }
  const sets = await db.select({
    id: workoutSetsTable.id,
    workoutId: workoutSetsTable.workoutId,
    exerciseId: workoutSetsTable.exerciseId,
    exerciseName: exercisesTable.name,
    muscleGroup: exercisesTable.muscleGroup,
    setNumber: workoutSetsTable.setNumber,
    reps: workoutSetsTable.reps,
    weightKg: workoutSetsTable.weightKg,
    notes: workoutSetsTable.notes,
  })
    .from(workoutSetsTable)
    .innerJoin(exercisesTable, eq(workoutSetsTable.exerciseId, exercisesTable.id))
    .where(eq(workoutSetsTable.workoutId, id));

  const w = workout[0];
  res.json({
    ...w,
    date: w.date.toString(),
    createdAt: w.createdAt.toISOString(),
    sets,
  });
});

// Finish a workout: auto-calculate calories burned
router.patch("/workouts/:id/finish", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = req.user.id;
  const id = parseInt(req.params.id);

  const profileRows = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);
  const bodyWeightKg = profileRows[0]?.weightKg ?? 75;

  const sets = await db.select().from(workoutSetsTable).where(eq(workoutSetsTable.workoutId, id));
  if (sets.length === 0) {
    res.json({ caloriesBurned: 0, durationMinutes: 0 });
    return;
  }

  // Estimate duration: each set ~2 min work + rest, minimum 20 min
  const totalSets = sets.length;
  const durationMinutes = Math.max(20, Math.min(90, totalSets * 3));

  // MET value: 5.0 for moderate weightlifting, 6.0 for heavy compound
  const totalVolume = sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
  const avgVolume = totalVolume / totalSets;
  const MET = avgVolume > 2000 ? 6.0 : avgVolume > 500 ? 5.0 : 3.5;

  // Mifflin-St Jeor calories burned formula
  const caloriesBurned = Math.round(MET * bodyWeightKg * (durationMinutes / 60));

  await db.update(workoutsTable)
    .set({ caloriesBurned, durationMinutes })
    .where(and(eq(workoutsTable.id, id), eq(workoutsTable.userId, userId)));

  res.json({ caloriesBurned, durationMinutes });
});

router.delete("/workouts/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const id = parseInt(req.params.id);
  await db.delete(workoutSetsTable).where(eq(workoutSetsTable.workoutId, id));
  await db.delete(workoutsTable).where(and(eq(workoutsTable.id, id), eq(workoutsTable.userId, userId)));
  res.json({ success: true });
});

router.post("/workouts/:workoutId/sets", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const workoutId = parseInt(req.params.workoutId);
  const body = AddSetBody.parse(req.body);
  const inserted = await db.insert(workoutSetsTable).values({ workoutId, ...body }).returning();
  res.status(201).json(inserted[0]);
});

export default router;
