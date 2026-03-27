import { Router, type IRouter } from "express";
import multer from "multer";
import { analyzeImageForFood, estimateFoodMacros, type FoodItem } from "../lib/ai";
import { db } from "@workspace/db";
import { foodLogsTable } from "@workspace/db/schema";
import { z } from "zod/v4";
import { checkLimit } from "../middlewares/usageLimit";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

interface FoodMacros {
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: "openfoodfacts" | "ai_estimate";
}

async function fetchFromOpenFoodFacts(foodName: string): Promise<FoodMacros | null> {
  try {
    const query = encodeURIComponent(foodName);
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${query}&search_simple=1&action=process&json=1&page_size=3&fields=product_name,nutriments`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data: any = await res.json();
    const products = data?.products;
    if (!Array.isArray(products) || products.length === 0) return null;

    for (const product of products) {
      const n = product.nutriments;
      if (!n) continue;
      const cal = Number(n["energy-kcal_100g"] ?? n["energy-kcal"] ?? 0);
      const prot = Number(n["proteins_100g"] ?? 0);
      const carbs = Number(n["carbohydrates_100g"] ?? 0);
      const fat = Number(n["fat_100g"] ?? 0);
      if (cal > 0) {
        return {
          foodName: product.product_name || foodName,
          calories: Math.round(cal),
          proteinG: Math.round(prot * 10) / 10,
          carbsG: Math.round(carbs * 10) / 10,
          fatG: Math.round(fat * 10) / 10,
          source: "openfoodfacts",
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function getMacrosForFood(item: FoodItem): Promise<FoodMacros> {
  const offResult = await fetchFromOpenFoodFacts(item.name);
  if (offResult) {
    const scale = item.grams / 100;
    return {
      foodName: item.name,
      calories: Math.round(offResult.calories * scale),
      proteinG: Math.round(offResult.proteinG * scale * 10) / 10,
      carbsG: Math.round(offResult.carbsG * scale * 10) / 10,
      fatG: Math.round(offResult.fatG * scale * 10) / 10,
      source: "openfoodfacts",
    };
  }
  const macros = await estimateFoodMacros(item.name, item.grams);
  return { foodName: item.name, ...macros, source: "ai_estimate" };
}

router.post(
  "/diet/analyze-image",
  upload.single("image"),
  checkLimit("scan"),
  async (req, res) => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "No image uploaded" });
      return;
    }

    const rawMime = req.file.mimetype || "";
    const mimeType = rawMime.startsWith("image/") ? rawMime : "image/jpeg";

    if (!req.file.buffer || req.file.buffer.length === 0) {
      res.status(400).json({ error: "Image data is empty." });
      return;
    }

    let foodItems: FoodItem[];
    try {
      foodItems = await analyzeImageForFood(req.file.buffer.toString("base64"), mimeType);
    } catch (err: any) {
      console.error("[analyze-image] AI error:", err?.message ?? err);
      res.status(502).json({ error: `AI analysis failed: ${err?.message ?? "Unknown error"}` });
      return;
    }

    if (foodItems.length === 0) {
      res.status(422).json({ error: "No food detected in the image. Please try a clearer photo." });
      return;
    }

    let macroResults: FoodMacros[];
    try {
      macroResults = await Promise.all(foodItems.map(item => getMacrosForFood(item)));
    } catch (err: any) {
      res.status(502).json({ error: `Failed to look up nutrition data: ${err?.message ?? "Unknown error"}` });
      return;
    }

    const total = macroResults.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        proteinG: Math.round((acc.proteinG + item.proteinG) * 10) / 10,
        carbsG: Math.round((acc.carbsG + item.carbsG) * 10) / 10,
        fatG: Math.round((acc.fatG + item.fatG) * 10) / 10,
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
    );

    res.json({
      items: macroResults,
      total,
      combinedName: macroResults.map(m => m.foodName).join(", "),
    });
  }
);

const EstimateFoodBody = z.object({
  foodName: z.string(),
  weightGrams: z.number().optional(),
});

router.post("/diet/estimate-food", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const { foodName, weightGrams } = EstimateFoodBody.parse(req.body);
    const macros = await estimateFoodMacros(foodName, weightGrams);
    res.json({ foodName, weightGrams, ...macros });
  } catch (err: any) {
    console.error("[estimate-food]", err?.message ?? err);
    res.status(500).json({ error: "Failed to estimate food macros" });
  }
});

const SaveAnalyzedFoodBody = z.object({
  foodName: z.string(),
  calories: z.number(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
  mealType: z.string(),
  date: z.string(),
});

router.post("/diet/save-analyzed-food", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let body: ReturnType<typeof SaveAnalyzedFoodBody.parse>;
  try {
    body = SaveAnalyzedFoodBody.parse(req.body);
  } catch {
    res.status(400).json({ error: "Invalid request body." });
    return;
  }

  try {
    const inserted = await db
      .insert(foodLogsTable)
      .values({ userId: req.user.id, ...body })
      .returning();
    const l = inserted[0];
    res.status(201).json({ ...l, date: l.date.toString(), loggedAt: l.loggedAt.toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to save food log." });
  }
});

export default router;
