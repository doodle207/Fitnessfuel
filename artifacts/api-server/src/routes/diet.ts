import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { mealPlansTable, mealsTable, foodLogsTable, userProfilesTable } from "@workspace/db/schema";
import { AddFoodLogBody } from "@workspace/api-zod";
import { eq, and, desc } from "drizzle-orm";

const router: IRouter = Router();

function calculateMacros(profile: { weightKg: number; heightCm: number; age: number; gender: string; activityLevel: string; fitnessGoal: string }) {
  const { weightKg, heightCm, age, gender, activityLevel, fitnessGoal } = profile;
  let bmr = gender === "male"
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    "very active": 1.725,
  };
  let tdee = bmr * (activityMultipliers[activityLevel] || 1.55);

  if (fitnessGoal === "weight loss") tdee -= 500;
  else if (fitnessGoal === "muscle gain") tdee += 300;

  const dailyCalories = Math.round(tdee);
  const proteinG = Math.round(weightKg * 2);
  const fatG = Math.round((dailyCalories * 0.25) / 9);
  const carbsG = Math.round((dailyCalories - proteinG * 4 - fatG * 9) / 4);

  return { dailyCalories, proteinG, carbsG, fatG };
}

function generateMeals(dailyCalories: number, proteinG: number, carbsG: number, fatG: number) {
  const mealTemplates = [
    {
      mealType: "breakfast",
      name: "Power Breakfast",
      calorieFraction: 0.25,
      foods: [
        { name: "Oatmeal", amount: "1 cup", calories: 150 },
        { name: "Eggs", amount: "3 whole", calories: 210 },
        { name: "Banana", amount: "1 medium", calories: 105 },
        { name: "Greek Yogurt", amount: "150g", calories: 100 },
      ],
    },
    {
      mealType: "lunch",
      name: "Performance Lunch",
      calorieFraction: 0.35,
      foods: [
        { name: "Chicken Breast", amount: "200g", calories: 330 },
        { name: "Brown Rice", amount: "1 cup", calories: 215 },
        { name: "Mixed Vegetables", amount: "2 cups", calories: 80 },
        { name: "Olive Oil", amount: "1 tbsp", calories: 120 },
      ],
    },
    {
      mealType: "snack",
      name: "Recovery Snack",
      calorieFraction: 0.15,
      foods: [
        { name: "Protein Shake", amount: "1 scoop", calories: 120 },
        { name: "Almonds", amount: "30g", calories: 170 },
        { name: "Apple", amount: "1 medium", calories: 95 },
      ],
    },
    {
      mealType: "dinner",
      name: "Evening Fuel",
      calorieFraction: 0.25,
      foods: [
        { name: "Salmon", amount: "200g", calories: 412 },
        { name: "Sweet Potato", amount: "1 medium", calories: 103 },
        { name: "Broccoli", amount: "2 cups", calories: 55 },
        { name: "Quinoa", amount: "0.5 cup", calories: 111 },
      ],
    },
  ];

  return mealTemplates.map((t, i) => ({
    id: i + 1,
    mealType: t.mealType,
    name: t.name,
    calories: Math.round(dailyCalories * t.calorieFraction),
    proteinG: Math.round(proteinG * t.calorieFraction),
    carbsG: Math.round(carbsG * t.calorieFraction),
    fatG: Math.round(fatG * t.calorieFraction),
    foods: t.foods,
  }));
}

router.get("/diet/meal-plan", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const plans = await db.select().from(mealPlansTable)
    .where(eq(mealPlansTable.userId, userId))
    .orderBy(desc(mealPlansTable.generatedAt))
    .limit(1);

  if (plans.length === 0) {
    res.status(404).json({ error: "No meal plan found" });
    return;
  }

  const plan = plans[0];
  const mealRows = await db.select().from(mealsTable).where(eq(mealsTable.mealPlanId, plan.id));
  
  res.json({
    ...plan,
    generatedAt: plan.generatedAt.toISOString(),
    meals: mealRows.map(m => ({ ...m, foods: JSON.parse(m.foods) })),
  });
});

router.post("/diet/meal-plan", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;

  const profile = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);
  if (profile.length === 0) {
    res.status(400).json({ error: "Profile required to generate meal plan" });
    return;
  }

  const { dailyCalories, proteinG, carbsG, fatG } = calculateMacros(profile[0]);
  
  const planInserted = await db.insert(mealPlansTable).values({
    userId, dailyCalories, proteinG, carbsG, fatG,
  }).returning();
  const plan = planInserted[0];

  const meals = generateMeals(dailyCalories, proteinG, carbsG, fatG);
  const mealRows = await db.insert(mealsTable).values(
    meals.map(m => ({
      mealPlanId: plan.id,
      mealType: m.mealType,
      name: m.name,
      calories: m.calories,
      proteinG: m.proteinG,
      carbsG: m.carbsG,
      fatG: m.fatG,
      foods: JSON.stringify(m.foods),
    }))
  ).returning();

  res.json({
    ...plan,
    generatedAt: plan.generatedAt.toISOString(),
    meals: mealRows.map(m => ({ ...m, foods: JSON.parse(m.foods) })),
  });
});

router.get("/diet/food-log", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const today = new Date().toISOString().split("T")[0];
  const logs = await db.select().from(foodLogsTable)
    .where(and(eq(foodLogsTable.userId, userId), eq(foodLogsTable.date, today)))
    .orderBy(foodLogsTable.loggedAt);
  res.json(logs.map(l => ({ ...l, date: l.date.toString(), loggedAt: l.loggedAt.toISOString() })));
});

router.post("/diet/food-log", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const body = AddFoodLogBody.parse(req.body);
  const inserted = await db.insert(foodLogsTable).values({ userId, ...body }).returning();
  const l = inserted[0];
  res.status(201).json({ ...l, date: l.date.toString(), loggedAt: l.loggedAt.toISOString() });
});

router.delete("/diet/food-log/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const id = parseInt(req.params.id);
  await db.delete(foodLogsTable).where(eq(foodLogsTable.id, id));
  res.json({ success: true });
});

export default router;
