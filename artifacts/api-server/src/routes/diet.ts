import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { mealPlansTable, mealsTable, foodLogsTable, userProfilesTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod/v4";

const router: IRouter = Router();

// ── Country-specific food databases ──────────────────────────────────────────
type FoodItem = { name: string; calories: number; proteinG: number; carbsG: number; fatG: number; fiberG?: number; sodiumMg?: number; amount: string };

const countryFoods: Record<string, Record<string, FoodItem[]>> = {
  India: {
    breakfast: [
      { name: "Idli (3 pieces)", calories: 120, proteinG: 4, carbsG: 24, fatG: 0.5, fiberG: 1, sodiumMg: 180, amount: "3 pieces" },
      { name: "Sambar", calories: 130, proteinG: 6, carbsG: 22, fatG: 1.5, fiberG: 3, sodiumMg: 350, amount: "1 bowl" },
      { name: "Poha", calories: 250, proteinG: 5, carbsG: 45, fatG: 4, fiberG: 2, sodiumMg: 280, amount: "1 bowl" },
      { name: "Masala Oats", calories: 220, proteinG: 7, carbsG: 38, fatG: 3, fiberG: 4, sodiumMg: 200, amount: "1 bowl" },
      { name: "Upma", calories: 200, proteinG: 5, carbsG: 33, fatG: 5, fiberG: 2, sodiumMg: 300, amount: "1 bowl" },
      { name: "Whole Wheat Paratha", calories: 130, proteinG: 3, carbsG: 20, fatG: 4, fiberG: 2, sodiumMg: 120, amount: "1 piece" },
      { name: "Curd (Dahi)", calories: 98, proteinG: 8, carbsG: 6, fatG: 4, fiberG: 0, sodiumMg: 90, amount: "1 cup" },
    ],
    lunch: [
      { name: "Dal Tadka", calories: 220, proteinG: 13, carbsG: 35, fatG: 2.5, fiberG: 6, sodiumMg: 400, amount: "1 bowl" },
      { name: "Steamed Rice", calories: 200, proteinG: 4, carbsG: 44, fatG: 0.5, fiberG: 0.5, sodiumMg: 5, amount: "1 cup" },
      { name: "Chicken Curry", calories: 280, proteinG: 30, carbsG: 5, fatG: 15, fiberG: 1, sodiumMg: 500, amount: "200g" },
      { name: "Rajma", calories: 230, proteinG: 15, carbsG: 40, fatG: 2, fiberG: 8, sodiumMg: 350, amount: "1 bowl" },
      { name: "Paneer Bhurji", calories: 280, proteinG: 18, carbsG: 5, fatG: 20, fiberG: 0.5, sodiumMg: 380, amount: "100g" },
      { name: "Roti", calories: 90, proteinG: 3, carbsG: 18, fatG: 1, fiberG: 2, sodiumMg: 80, amount: "1 piece" },
      { name: "Chole", calories: 270, proteinG: 14, carbsG: 45, fatG: 4, fiberG: 9, sodiumMg: 420, amount: "1 bowl" },
    ],
    snack: [
      { name: "Roasted Chana", calories: 180, proteinG: 10, carbsG: 28, fatG: 3, fiberG: 7, sodiumMg: 80, amount: "50g" },
      { name: "Sprouted Moong Salad", calories: 120, proteinG: 9, carbsG: 18, fatG: 1, fiberG: 4, sodiumMg: 100, amount: "1 cup" },
      { name: "Peanuts", calories: 170, proteinG: 7, carbsG: 5, fatG: 14, fiberG: 2, sodiumMg: 50, amount: "30g" },
      { name: "Banana", calories: 89, proteinG: 1, carbsG: 23, fatG: 0.3, fiberG: 2.5, sodiumMg: 1, amount: "1 medium" },
    ],
    dinner: [
      { name: "Dal Khichdi", calories: 300, proteinG: 11, carbsG: 55, fatG: 4, fiberG: 5, sodiumMg: 300, amount: "1 bowl" },
      { name: "Grilled Fish (Pomfret)", calories: 200, proteinG: 35, carbsG: 0, fatG: 6, fiberG: 0, sodiumMg: 350, amount: "150g" },
      { name: "Egg Bhurji", calories: 210, proteinG: 14, carbsG: 4, fatG: 15, fiberG: 0.5, sodiumMg: 300, amount: "2 eggs" },
      { name: "Sabzi (Mixed Veg)", calories: 120, proteinG: 4, carbsG: 18, fatG: 4, fiberG: 4, sodiumMg: 200, amount: "1 bowl" },
    ],
  },
  USA: {
    breakfast: [
      { name: "Oatmeal with Berries", calories: 220, proteinG: 7, carbsG: 40, fatG: 3, fiberG: 5, sodiumMg: 100, amount: "1 bowl" },
      { name: "Scrambled Eggs (3)", calories: 210, proteinG: 18, carbsG: 2, fatG: 15, fiberG: 0, sodiumMg: 300, amount: "3 eggs" },
      { name: "Greek Yogurt (Non-fat)", calories: 130, proteinG: 17, carbsG: 9, fatG: 0.5, fiberG: 0, sodiumMg: 90, amount: "170g" },
      { name: "Whole Wheat Toast", calories: 140, proteinG: 5, carbsG: 27, fatG: 2, fiberG: 3, sodiumMg: 260, amount: "2 slices" },
      { name: "Protein Pancakes", calories: 300, proteinG: 25, carbsG: 35, fatG: 5, fiberG: 2, sodiumMg: 350, amount: "3 pancakes" },
    ],
    lunch: [
      { name: "Grilled Chicken Breast", calories: 165, proteinG: 31, carbsG: 0, fatG: 3.5, fiberG: 0, sodiumMg: 350, amount: "100g" },
      { name: "Brown Rice", calories: 215, proteinG: 5, carbsG: 45, fatG: 1.5, fiberG: 2, sodiumMg: 10, amount: "1 cup" },
      { name: "Broccoli (Steamed)", calories: 55, proteinG: 4, carbsG: 11, fatG: 0.5, fiberG: 5, sodiumMg: 30, amount: "1 cup" },
      { name: "Turkey Wrap", calories: 350, proteinG: 30, carbsG: 35, fatG: 8, fiberG: 3, sodiumMg: 700, amount: "1 wrap" },
      { name: "Tuna Salad (Canned)", calories: 180, proteinG: 30, carbsG: 2, fatG: 5, fiberG: 0, sodiumMg: 400, amount: "150g" },
      { name: "Sweet Potato", calories: 103, proteinG: 2, carbsG: 24, fatG: 0.1, fiberG: 3.5, sodiumMg: 40, amount: "1 medium" },
    ],
    snack: [
      { name: "Almonds", calories: 170, proteinG: 6, carbsG: 6, fatG: 15, fiberG: 3, sodiumMg: 0, amount: "30g" },
      { name: "Protein Shake", calories: 130, proteinG: 25, carbsG: 5, fatG: 1.5, fiberG: 0, sodiumMg: 160, amount: "1 scoop" },
      { name: "Apple", calories: 95, proteinG: 0.5, carbsG: 25, fatG: 0.3, fiberG: 4, sodiumMg: 2, amount: "1 medium" },
      { name: "Cottage Cheese", calories: 110, proteinG: 14, carbsG: 5, fatG: 2.5, fiberG: 0, sodiumMg: 380, amount: "1/2 cup" },
    ],
    dinner: [
      { name: "Salmon Fillet", calories: 208, proteinG: 28, carbsG: 0, fatG: 10, fiberG: 0, sodiumMg: 280, amount: "150g" },
      { name: "Quinoa", calories: 222, proteinG: 8, carbsG: 39, fatG: 3.5, fiberG: 5, sodiumMg: 15, amount: "1 cup" },
      { name: "Ground Beef (90% lean)", calories: 176, proteinG: 26, carbsG: 0, fatG: 8, fiberG: 0, sodiumMg: 220, amount: "100g" },
      { name: "Mixed Greens Salad", calories: 45, proteinG: 2, carbsG: 8, fatG: 0.5, fiberG: 2.5, sodiumMg: 50, amount: "2 cups" },
    ],
  },
  UK: {
    breakfast: [
      { name: "Porridge Oats with Honey", calories: 240, proteinG: 6, carbsG: 44, fatG: 4, fiberG: 4, sodiumMg: 60, amount: "1 bowl" },
      { name: "Scrambled Eggs on Toast", calories: 280, proteinG: 15, carbsG: 28, fatG: 10, fiberG: 2, sodiumMg: 380, amount: "2 eggs + 2 toast" },
      { name: "Smoked Salmon Bagel", calories: 350, proteinG: 22, carbsG: 42, fatG: 8, fiberG: 2, sodiumMg: 620, amount: "1 bagel" },
    ],
    lunch: [
      { name: "Chicken Tikka Masala", calories: 320, proteinG: 28, carbsG: 12, fatG: 16, fiberG: 2, sodiumMg: 550, amount: "300g" },
      { name: "Tuna Jacket Potato", calories: 340, proteinG: 25, carbsG: 55, fatG: 3, fiberG: 5, sodiumMg: 420, amount: "1 potato" },
      { name: "Prawn Salad", calories: 180, proteinG: 20, carbsG: 8, fatG: 7, fiberG: 2, sodiumMg: 350, amount: "1 bowl" },
    ],
    snack: [
      { name: "Hobnob Biscuit", calories: 70, proteinG: 1, carbsG: 10, fatG: 3, fiberG: 0.5, sodiumMg: 50, amount: "1 biscuit" },
      { name: "Cheddar Cheese", calories: 110, proteinG: 7, carbsG: 0.1, fatG: 9, fiberG: 0, sodiumMg: 170, amount: "30g" },
    ],
    dinner: [
      { name: "Roast Chicken Breast", calories: 180, proteinG: 33, carbsG: 0, fatG: 4, fiberG: 0, sodiumMg: 330, amount: "150g" },
      { name: "Roasted Vegetables", calories: 120, proteinG: 3, carbsG: 22, fatG: 3, fiberG: 5, sodiumMg: 150, amount: "1 cup" },
      { name: "Baked Cod with Peas", calories: 240, proteinG: 35, carbsG: 15, fatG: 4, fiberG: 5, sodiumMg: 300, amount: "200g" },
    ],
  },
  Japan: {
    breakfast: [
      { name: "Miso Soup", calories: 40, proteinG: 3, carbsG: 5, fatG: 1, fiberG: 1, sodiumMg: 550, amount: "1 bowl" },
      { name: "Steamed Rice", calories: 200, proteinG: 4, carbsG: 44, fatG: 0.5, fiberG: 0.5, sodiumMg: 5, amount: "1 cup" },
      { name: "Grilled Salmon", calories: 200, proteinG: 28, carbsG: 0, fatG: 9, fiberG: 0, sodiumMg: 280, amount: "150g" },
      { name: "Tamago (Egg) Tofu", calories: 90, proteinG: 8, carbsG: 3, fatG: 5, fiberG: 0, sodiumMg: 150, amount: "100g" },
    ],
    lunch: [
      { name: "Chicken Katsu (no bread)", calories: 300, proteinG: 28, carbsG: 15, fatG: 12, fiberG: 1, sodiumMg: 450, amount: "150g" },
      { name: "Soba Noodles", calories: 220, proteinG: 9, carbsG: 44, fatG: 1, fiberG: 3, sodiumMg: 400, amount: "1 bowl" },
      { name: "Edamame", calories: 120, proteinG: 11, carbsG: 9, fatG: 5, fiberG: 5, sodiumMg: 5, amount: "1 cup" },
    ],
    snack: [
      { name: "Onigiri (Tuna)", calories: 180, proteinG: 9, carbsG: 33, fatG: 2, fiberG: 0.5, sodiumMg: 280, amount: "1 piece" },
      { name: "Mochi (1 piece)", calories: 95, proteinG: 1, carbsG: 22, fatG: 0.5, fiberG: 0, sodiumMg: 30, amount: "1 piece" },
    ],
    dinner: [
      { name: "Yakitori Chicken (skewer)", calories: 90, proteinG: 12, carbsG: 4, fatG: 2.5, fiberG: 0, sodiumMg: 300, amount: "1 skewer" },
      { name: "Tofu Steak", calories: 160, proteinG: 14, carbsG: 5, fatG: 9, fiberG: 1, sodiumMg: 200, amount: "150g" },
      { name: "Beef Gyudon Bowl", calories: 420, proteinG: 22, carbsG: 60, fatG: 10, fiberG: 1, sodiumMg: 680, amount: "1 bowl" },
    ],
  },
  Mexico: {
    breakfast: [
      { name: "Huevos Rancheros", calories: 320, proteinG: 18, carbsG: 28, fatG: 14, fiberG: 4, sodiumMg: 600, amount: "2 eggs" },
      { name: "Avocado Toast", calories: 230, proteinG: 6, carbsG: 22, fatG: 13, fiberG: 6, sodiumMg: 280, amount: "1 toast" },
      { name: "Chilaquiles (1 portion)", calories: 380, proteinG: 14, carbsG: 50, fatG: 14, fiberG: 4, sodiumMg: 650, amount: "1 bowl" },
    ],
    lunch: [
      { name: "Grilled Chicken Taco", calories: 260, proteinG: 22, carbsG: 22, fatG: 8, fiberG: 3, sodiumMg: 480, amount: "2 tacos" },
      { name: "Black Beans", calories: 220, proteinG: 14, carbsG: 40, fatG: 1, fiberG: 14, sodiumMg: 300, amount: "1 cup" },
      { name: "Guacamole", calories: 150, proteinG: 2, carbsG: 8, fatG: 13, fiberG: 5, sodiumMg: 200, amount: "100g" },
    ],
    snack: [
      { name: "Jicama with Lime", calories: 50, proteinG: 1, carbsG: 12, fatG: 0.1, fiberG: 6, sodiumMg: 20, amount: "1 cup" },
      { name: "Corn Tortilla", calories: 58, proteinG: 1.5, carbsG: 12, fatG: 0.5, fiberG: 1.5, sodiumMg: 30, amount: "1 piece" },
    ],
    dinner: [
      { name: "Carne Asada (Lean)", calories: 250, proteinG: 30, carbsG: 0, fatG: 13, fiberG: 0, sodiumMg: 420, amount: "150g" },
      { name: "Chicken Enchilada", calories: 320, proteinG: 24, carbsG: 30, fatG: 10, fiberG: 3, sodiumMg: 750, amount: "2 pieces" },
    ],
  },
  Brazil: {
    breakfast: [
      { name: "Pão de Queijo (3 pieces)", calories: 210, proteinG: 8, carbsG: 28, fatG: 8, fiberG: 0.5, sodiumMg: 200, amount: "3 pieces" },
      { name: "Açaí Bowl", calories: 280, proteinG: 4, carbsG: 50, fatG: 8, fiberG: 6, sodiumMg: 30, amount: "1 bowl" },
    ],
    lunch: [
      { name: "Rice & Beans (Feijão)", calories: 350, proteinG: 14, carbsG: 65, fatG: 2, fiberG: 10, sodiumMg: 350, amount: "1 plate" },
      { name: "Grilled Picanha", calories: 300, proteinG: 28, carbsG: 0, fatG: 20, fiberG: 0, sodiumMg: 350, amount: "150g" },
      { name: "Farofa", calories: 150, proteinG: 1, carbsG: 30, fatG: 4, fiberG: 2, sodiumMg: 200, amount: "50g" },
    ],
    snack: [
      { name: "Brigadeiro (1 piece)", calories: 90, proteinG: 1, carbsG: 16, fatG: 3, fiberG: 0, sodiumMg: 30, amount: "1 piece" },
      { name: "Coconut Water", calories: 45, proteinG: 0.5, carbsG: 11, fatG: 0, fiberG: 0, sodiumMg: 100, amount: "1 cup" },
    ],
    dinner: [
      { name: "Moqueca (Fish Stew)", calories: 280, proteinG: 28, carbsG: 8, fatG: 14, fiberG: 2, sodiumMg: 450, amount: "300g" },
      { name: "Chicken Strogonoff", calories: 350, proteinG: 28, carbsG: 15, fatG: 18, fiberG: 1, sodiumMg: 550, amount: "300g" },
    ],
  },
};

// Default fallback
const defaultFoods = countryFoods.USA;

function getCountryFoods(country: string) {
  return countryFoods[country] ?? defaultFoods;
}

// ── Macro calculator ──────────────────────────────────────────────────────────
function calculateMacros(profile: { weightKg: number; heightCm: number; age: number; gender: string; activityLevel: string; fitnessGoal: string }) {
  const { weightKg, heightCm, age, gender, activityLevel, fitnessGoal } = profile;
  let bmr = gender === "male"
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  const multipliers: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, "very active": 1.725 };
  let tdee = bmr * (multipliers[activityLevel] || 1.55);
  if (fitnessGoal === "weight loss") tdee -= 500;
  else if (fitnessGoal === "muscle gain") tdee += 300;
  const dailyCalories = Math.round(tdee);
  const proteinG = Math.round(weightKg * 2);
  const fatG = Math.round((dailyCalories * 0.25) / 9);
  const carbsG = Math.round((dailyCalories - proteinG * 4 - fatG * 9) / 4);
  return { dailyCalories, proteinG, carbsG, fatG };
}

function buildMeals(country: string, dailyCalories: number, proteinG: number, carbsG: number, fatG: number) {
  const foods = getCountryFoods(country);
  const fractions = { breakfast: 0.25, lunch: 0.35, snack: 0.15, dinner: 0.25 };
  return Object.entries(fractions).map(([type, frac], i) => {
    const mealFoods = foods[type] ?? [];
    return {
      id: i + 1,
      mealType: type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} (${country})`,
      calories: Math.round(dailyCalories * frac),
      proteinG: Math.round(proteinG * frac),
      carbsG: Math.round(carbsG * frac),
      fatG: Math.round(fatG * frac),
      foods: mealFoods.slice(0, 5).map(f => ({ name: f.name, amount: f.amount, calories: f.calories })),
    };
  });
}

// ── Routes ────────────────────────────────────────────────────────────────────
router.get("/diet/meal-plan", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const plans = await db.select().from(mealPlansTable)
    .where(eq(mealPlansTable.userId, req.user.id))
    .orderBy(desc(mealPlansTable.generatedAt)).limit(1);
  if (plans.length === 0) { res.status(404).json({ error: "No meal plan found" }); return; }
  const plan = plans[0];
  const mealRows = await db.select().from(mealsTable).where(eq(mealsTable.mealPlanId, plan.id));
  res.json({ ...plan, generatedAt: plan.generatedAt.toISOString(), meals: mealRows.map(m => ({ ...m, foods: JSON.parse(m.foods) })) });
});

const GeneratePlanBody = z.object({ country: z.string().default("USA") });

router.post("/diet/meal-plan", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { country } = GeneratePlanBody.parse(req.body);
  const profile = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, req.user.id)).limit(1);
  if (profile.length === 0) { res.status(400).json({ error: "Profile required" }); return; }
  const { dailyCalories, proteinG, carbsG, fatG } = calculateMacros(profile[0]);
  const planInserted = await db.insert(mealPlansTable).values({ userId: req.user.id, dailyCalories, proteinG, carbsG, fatG }).returning();
  const plan = planInserted[0];
  const meals = buildMeals(country, dailyCalories, proteinG, carbsG, fatG);
  const mealRows = await db.insert(mealsTable).values(
    meals.map(m => ({ mealPlanId: plan.id, mealType: m.mealType, name: m.name, calories: m.calories, proteinG: m.proteinG, carbsG: m.carbsG, fatG: m.fatG, foods: JSON.stringify(m.foods) }))
  ).returning();
  res.json({ ...plan, generatedAt: plan.generatedAt.toISOString(), meals: mealRows.map(m => ({ ...m, foods: JSON.parse(m.foods) })) });
});

// Food database endpoint by country
router.get("/diet/foods", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const country = (req.query.country as string) || "USA";
  const foods = getCountryFoods(country);
  const all: (FoodItem & { mealType: string })[] = [];
  for (const [mealType, items] of Object.entries(foods)) {
    for (const item of items) all.push({ ...item, mealType });
  }
  res.json(all);
});

const AddFoodLogBodyExtended = z.object({
  date: z.string(),
  foodName: z.string(),
  calories: z.number(),
  proteinG: z.number().optional(),
  carbsG: z.number().optional(),
  fatG: z.number().optional(),
  fiberG: z.number().optional(),
  sodiumMg: z.number().optional(),
  servingSize: z.string().optional(),
  mealType: z.string(),
});

router.get("/diet/food-log", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const today = new Date().toISOString().split("T")[0];
  const logs = await db.select().from(foodLogsTable)
    .where(and(eq(foodLogsTable.userId, req.user.id), eq(foodLogsTable.date, today)))
    .orderBy(foodLogsTable.loggedAt);
  res.json(logs.map(l => ({ ...l, date: l.date.toString(), loggedAt: l.loggedAt.toISOString() })));
});

router.post("/diet/food-log", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const body = AddFoodLogBodyExtended.parse(req.body);
  const inserted = await db.insert(foodLogsTable).values({ userId: req.user.id, ...body }).returning();
  const l = inserted[0];
  res.status(201).json({ ...l, date: l.date.toString(), loggedAt: l.loggedAt.toISOString() });
});

router.delete("/diet/food-log/:id", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.delete(foodLogsTable).where(eq(foodLogsTable.id, parseInt(req.params.id)));
  res.json({ success: true });
});

export default router;
