import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { userProfilesTable } from "@workspace/db/schema";
import { CreateProfileBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/profile", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const profile = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);
  if (profile.length === 0) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  const p = profile[0];
  res.json({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  });
});

router.post("/profile", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  
  try {
    // Parse and validate the body, providing defaults for optional fields
    // Convert empty strings to null for date fields (PostgreSQL DATE columns reject "")
    const body = CreateProfileBody.parse({
      ...req.body,
      dietPreference: req.body.dietPreference || "non-veg",
      periodStartDate: req.body.periodStartDate || null,
      periodEndDate: req.body.periodEndDate || null,
    });
    
    const existing = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);

    let profile;
    if (existing.length > 0) {
      const updated = await db.update(userProfilesTable)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(userProfilesTable.userId, userId))
        .returning();
      profile = updated[0];
    } else {
      const inserted = await db.insert(userProfilesTable)
        .values({ userId, ...body })
        .returning();
      profile = inserted[0];
    }

    res.json({
      ...profile,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error("[profile POST]", error?.message || error);
    res.status(400).json({ error: error?.message || "Failed to save profile" });
  }
});

export default router;
