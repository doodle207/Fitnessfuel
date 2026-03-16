import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { bodyweightLogsTable, measurementsTable, waterLogsTable, progressPhotosTable, workoutsTable, workoutSetsTable, exercisesTable } from "@workspace/db/schema";
import { AddBodyweightLogBody, AddMeasurementBody, LogWaterBody } from "@workspace/api-zod";
import { eq, and, desc, asc, max } from "drizzle-orm";
import { z } from "zod/v4";

const router: IRouter = Router();

router.get("/progress/bodyweight", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const logs = await db.select().from(bodyweightLogsTable)
    .where(eq(bodyweightLogsTable.userId, req.user.id))
    .orderBy(asc(bodyweightLogsTable.date));
  res.json(logs.map(l => ({ ...l, date: l.date.toString(), createdAt: l.createdAt.toISOString() })));
});

router.post("/progress/bodyweight", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const body = AddBodyweightLogBody.parse(req.body);
  const inserted = await db.insert(bodyweightLogsTable).values({ userId: req.user.id, ...body }).returning();
  const l = inserted[0];
  res.status(201).json({ ...l, date: l.date.toString(), createdAt: l.createdAt.toISOString() });
});

router.get("/progress/measurements", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const logs = await db.select().from(measurementsTable)
    .where(eq(measurementsTable.userId, req.user.id))
    .orderBy(desc(measurementsTable.date));
  res.json(logs.map(l => ({ ...l, date: l.date.toString(), createdAt: l.createdAt.toISOString() })));
});

router.post("/progress/measurements", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const body = AddMeasurementBody.parse(req.body);
  const inserted = await db.insert(measurementsTable).values({ userId: req.user.id, ...body }).returning();
  const l = inserted[0];
  res.status(201).json({ ...l, date: l.date.toString(), createdAt: l.createdAt.toISOString() });
});

router.get("/progress/water", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const today = new Date().toISOString().split("T")[0];
  const logs = await db.select().from(waterLogsTable)
    .where(and(eq(waterLogsTable.userId, req.user.id), eq(waterLogsTable.date, today)))
    .orderBy(waterLogsTable.loggedAt);
  const totalMl = logs.reduce((s, l) => s + l.amountMl, 0);
  res.json({ date: today, totalMl, goalMl: 3000, logs: logs.map(l => ({ id: l.id, amountMl: l.amountMl, loggedAt: l.loggedAt.toISOString() })) });
});

router.post("/progress/water", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const body = LogWaterBody.parse(req.body);
  await db.insert(waterLogsTable).values({ userId: req.user.id, amountMl: body.amountMl, date: body.date });
  const logs = await db.select().from(waterLogsTable)
    .where(and(eq(waterLogsTable.userId, req.user.id), eq(waterLogsTable.date, body.date)))
    .orderBy(waterLogsTable.loggedAt);
  const totalMl = logs.reduce((s, l) => s + l.amountMl, 0);
  res.json({ date: body.date, totalMl, goalMl: 3000, logs: logs.map(l => ({ id: l.id, amountMl: l.amountMl, loggedAt: l.loggedAt.toISOString() })) });
});

// Strength progress: max weight per muscle group per workout date
router.get("/progress/strength", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = req.user.id;

  const rows = await db
    .select({
      date: workoutsTable.date,
      muscleGroup: exercisesTable.muscleGroup,
      exerciseName: exercisesTable.name,
      maxWeight: max(workoutSetsTable.weightKg),
    })
    .from(workoutSetsTable)
    .innerJoin(workoutsTable, eq(workoutSetsTable.workoutId, workoutsTable.id))
    .innerJoin(exercisesTable, eq(workoutSetsTable.exerciseId, exercisesTable.id))
    .where(eq(workoutsTable.userId, userId))
    .groupBy(workoutsTable.date, exercisesTable.muscleGroup, exercisesTable.name)
    .orderBy(asc(workoutsTable.date));

  // Group by muscle group → array of { date, maxWeight, exercise }
  const grouped: Record<string, { date: string; maxWeight: number; exercise: string }[]> = {};
  for (const row of rows) {
    const mg = row.muscleGroup;
    if (!grouped[mg]) grouped[mg] = [];
    grouped[mg].push({ date: row.date.toString(), maxWeight: Number(row.maxWeight) || 0, exercise: row.exerciseName });
  }

  // Return compound/major exercises per group
  const compoundPriority: Record<string, string[]> = {
    Chest: ["Flat Bench Press", "Incline Bench Press"],
    Back: ["Conventional Deadlift", "Barbell Bent-Over Row", "Pull-Ups"],
    Legs: ["Back Squat", "Romanian Deadlift", "Leg Press"],
    Shoulders: ["Barbell Overhead Press", "Military Press"],
    Arms: ["Barbell Curl", "Skull Crushers (EZ Bar)"],
    Core: ["Ab Wheel Rollout", "Cable Crunches"],
    Cardio: [],
    "Full Body": ["Clean and Press", "Thruster"],
  };

  const result: Record<string, { date: string; maxWeight: number; exercise: string }[]> = {};
  for (const [mg, entries] of Object.entries(grouped)) {
    const priority = compoundPriority[mg] ?? [];
    const prioritized = entries.filter(e => priority.includes(e.exercise));
    result[mg] = (prioritized.length > 0 ? prioritized : entries)
      .reduce((acc: { date: string; maxWeight: number; exercise: string }[], cur) => {
        const existing = acc.find(a => a.date === cur.date);
        if (!existing || cur.maxWeight > existing.maxWeight) {
          return [...acc.filter(a => a.date !== cur.date), cur];
        }
        return acc;
      }, [])
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  res.json(result);
});

// Progress photos
const AddPhotoBody = z.object({
  photoDataUrl: z.string(),
  label: z.string().optional(),
  date: z.string(),
});

router.get("/progress/photos", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const photos = await db.select().from(progressPhotosTable)
    .where(eq(progressPhotosTable.userId, req.user.id))
    .orderBy(desc(progressPhotosTable.date));
  res.json(photos.map(p => ({ ...p, date: p.date.toString(), createdAt: p.createdAt.toISOString() })));
});

router.post("/progress/photos", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const body = AddPhotoBody.parse(req.body);
  const inserted = await db.insert(progressPhotosTable).values({ userId: req.user.id, ...body }).returning();
  const p = inserted[0];
  res.status(201).json({ ...p, date: p.date.toString(), createdAt: p.createdAt.toISOString() });
});

router.delete("/progress/photos/:id", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.delete(progressPhotosTable).where(and(eq(progressPhotosTable.id, parseInt(req.params.id)), eq(progressPhotosTable.userId, req.user.id)));
  res.json({ success: true });
});

export default router;
