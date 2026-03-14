import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { bodyweightLogsTable, measurementsTable, waterLogsTable } from "@workspace/db/schema";
import { AddBodyweightLogBody, AddMeasurementBody, LogWaterBody } from "@workspace/api-zod";
import { eq, and, desc, sum } from "drizzle-orm";

const router: IRouter = Router();

router.get("/progress/bodyweight", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const logs = await db.select().from(bodyweightLogsTable)
    .where(eq(bodyweightLogsTable.userId, userId))
    .orderBy(bodyweightLogsTable.date);
  res.json(logs.map(l => ({ ...l, date: l.date.toString(), createdAt: l.createdAt.toISOString() })));
});

router.post("/progress/bodyweight", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const body = AddBodyweightLogBody.parse(req.body);
  const inserted = await db.insert(bodyweightLogsTable).values({ userId, ...body }).returning();
  const l = inserted[0];
  res.status(201).json({ ...l, date: l.date.toString(), createdAt: l.createdAt.toISOString() });
});

router.get("/progress/measurements", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const logs = await db.select().from(measurementsTable)
    .where(eq(measurementsTable.userId, userId))
    .orderBy(desc(measurementsTable.date));
  res.json(logs.map(l => ({ ...l, date: l.date.toString(), createdAt: l.createdAt.toISOString() })));
});

router.post("/progress/measurements", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const body = AddMeasurementBody.parse(req.body);
  const inserted = await db.insert(measurementsTable).values({ userId, ...body }).returning();
  const l = inserted[0];
  res.status(201).json({ ...l, date: l.date.toString(), createdAt: l.createdAt.toISOString() });
});

router.get("/progress/water", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const today = new Date().toISOString().split("T")[0];
  const logs = await db.select().from(waterLogsTable)
    .where(and(eq(waterLogsTable.userId, userId), eq(waterLogsTable.date, today)))
    .orderBy(waterLogsTable.loggedAt);
  const totalMl = logs.reduce((sum, l) => sum + l.amountMl, 0);
  res.json({
    date: today,
    totalMl,
    goalMl: 2000,
    logs: logs.map(l => ({ id: l.id, amountMl: l.amountMl, loggedAt: l.loggedAt.toISOString() })),
  });
});

router.post("/progress/water", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const body = LogWaterBody.parse(req.body);
  await db.insert(waterLogsTable).values({ userId, amountMl: body.amountMl, date: body.date });
  
  const logs = await db.select().from(waterLogsTable)
    .where(and(eq(waterLogsTable.userId, userId), eq(waterLogsTable.date, body.date)))
    .orderBy(waterLogsTable.loggedAt);
  const totalMl = logs.reduce((sum, l) => sum + l.amountMl, 0);
  res.json({
    date: body.date,
    totalMl,
    goalMl: 2000,
    logs: logs.map(l => ({ id: l.id, amountMl: l.amountMl, loggedAt: l.loggedAt.toISOString() })),
  });
});

export default router;
