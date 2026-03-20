import { Router, type IRouter } from "express";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@workspace/db";
import { foodLogsTable } from "@workspace/db/schema";
import { z } from "zod/v4";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function getGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set");
  return new GoogleGenerativeAI(key);
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

async function identifyFoodsFromImage(imageBuffer: Buffer, mimeType: string): Promise<string[]> {
  const genAI = getGemini();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are a food recognition expert. Analyze this image and identify all distinct food items visible.
Return ONLY a JSON array of food names as plain strings. Be specific but concise.
Examples: ["dal tadka", "steamed rice", "roti"] or ["chicken curry", "naan"] or ["oatmeal", "banana"]
If no food is detected, return an empty array [].
Do not include any explanation, just the JSON array.`;

  const result = await withTimeout(
    model.generateContent([
      { inlineData: { data: imageBuffer.toString("base64"), mimeType } },
      prompt,
    ]),
    30000,
    "Gemini image identification"
  );

  const text = result.response.text().trim();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return Array.isArray(parsed) ? parsed.filter((v: any) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

interface FoodMacros {
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: "openfoodfacts" | "gemini_estimate";
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

async function estimateMacrosWithGemini(foodName: string): Promise<FoodMacros> {
  const genAI = getGemini();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Estimate the nutritional macros for a standard home-cooked serving of "${foodName}".
Consider a typical portion size (e.g., 1 bowl, 1 cup, 1 serving).
Return ONLY a JSON object with these exact keys (numbers only, no units):
{"calories": number, "proteinG": number, "carbsG": number, "fatG": number}
Be realistic for Indian/regional cuisines. No explanation, just JSON.`;

  const result = await withTimeout(
    model.generateContent(prompt),
    20000,
    "Gemini macro estimation"
  );
  const text = result.response.text().trim();
  const jsonMatch = text.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) {
    return { foodName, calories: 200, proteinG: 8, carbsG: 25, fatG: 7, source: "gemini_estimate" };
  }
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      foodName,
      calories: Math.round(Number(parsed.calories) || 200),
      proteinG: Math.round((Number(parsed.proteinG) || 8) * 10) / 10,
      carbsG: Math.round((Number(parsed.carbsG) || 25) * 10) / 10,
      fatG: Math.round((Number(parsed.fatG) || 7) * 10) / 10,
      source: "gemini_estimate",
    };
  } catch {
    return { foodName, calories: 200, proteinG: 8, carbsG: 25, fatG: 7, source: "gemini_estimate" };
  }
}

async function getMacrosForFood(foodName: string): Promise<FoodMacros> {
  const offResult = await fetchFromOpenFoodFacts(foodName);
  if (offResult) return offResult;
  return estimateMacrosWithGemini(foodName);
}

router.post(
  "/diet/analyze-image",
  upload.single("image"),
  async (req, res) => {
    console.log("[analyze-image] Incoming request, authenticated:", req.isAuthenticated());

    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!req.file) {
      console.log("[analyze-image] No file in request");
      res.status(400).json({ error: "No image uploaded" });
      return;
    }

    const rawMime = req.file.mimetype || "";
    const mimeType = rawMime.startsWith("image/") ? rawMime : "image/jpeg";
    console.log("[analyze-image] File received:", req.file.originalname, mimeType, req.file.size, "bytes");

    if (!req.file.buffer || req.file.buffer.length === 0) {
      res.status(400).json({ error: "Image data is empty. Please try again." });
      return;
    }

    if (!rawMime.startsWith("image/")) {
      res.status(400).json({ error: "File must be an image (JPG, PNG, WEBP, or HEIC)." });
      return;
    }

    let foodNames: string[];
    try {
      console.log("[analyze-image] Calling Gemini to identify foods...");
      foodNames = await identifyFoodsFromImage(req.file.buffer, mimeType);
      console.log("[analyze-image] Gemini identified foods:", foodNames);
    } catch (err: any) {
      const msg: string = err?.message ?? String(err);
      console.error("[analyze-image] Gemini identification error:", msg);
      if (msg.includes("GEMINI_API_KEY")) {
        res.status(503).json({ error: "Gemini API key not configured on the server." });
        return;
      }
      if (msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429")) {
        res.status(429).json({ error: "Gemini API quota exceeded. Please enable billing at aistudio.google.com or wait for the quota to reset." });
        return;
      }
      if (msg.includes("API_KEY_INVALID") || msg.includes("PERMISSION_DENIED") || msg.includes("403")) {
        res.status(403).json({ error: "Gemini API key is invalid or has been revoked. Please provide a new key." });
        return;
      }
      res.status(502).json({ error: `AI analysis failed: ${msg}` });
      return;
    }

    if (foodNames.length === 0) {
      console.log("[analyze-image] No food detected in image");
      res.status(422).json({ error: "No food detected in the image. Please try a clearer photo." });
      return;
    }

    let macroResults: FoodMacros[];
    try {
      console.log("[analyze-image] Looking up macros for:", foodNames);
      macroResults = await Promise.all(foodNames.map(name => getMacrosForFood(name)));
      console.log("[analyze-image] Macro results:", macroResults);
    } catch (err: any) {
      console.error("[analyze-image] Macro lookup error:", err?.message ?? err);
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

    console.log("[analyze-image] Sending response, total:", total);
    res.json({
      items: macroResults,
      total,
      combinedName: macroResults.map(m => m.foodName).join(", "),
    });
  }
);

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
  } catch (err: any) {
    console.error("[save-analyzed-food] Validation error:", err?.message ?? err);
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
    console.error("[save-analyzed-food] Database error:", err?.message ?? err);
    res.status(500).json({ error: "Failed to save food log." });
  }
});

export default router;
