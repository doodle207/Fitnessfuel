import { Router, type IRouter } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@workspace/db";
import { foodLogsTable, workoutsTable, userProfilesTable } from "@workspace/db/schema";
import { eq, gte, desc } from "drizzle-orm";

const router: IRouter = Router();

function getGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set");
  return new GoogleGenerativeAI(key);
}

async function getUserContext(userId: string) {
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [profile] = await db
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.userId, userId))
    .limit(1);

  const recentWorkouts = await db
    .select()
    .from(workoutsTable)
    .where(eq(workoutsTable.userId, userId))
    .orderBy(desc(workoutsTable.date))
    .limit(14);

  const recentFoodLogs = await db
    .select()
    .from(foodLogsTable)
    .where(eq(foodLogsTable.userId, userId))
    .orderBy(desc(foodLogsTable.loggedAt))
    .limit(50);

  const todayFoodLogs = recentFoodLogs.filter((l) => l.date?.toString() === today || l.loggedAt?.toISOString().split("T")[0] === today);
  const weekWorkouts = recentWorkouts.filter((w) => w.date >= weekAgo);

  const todayCalories = todayFoodLogs.reduce((s, l) => s + (l.calories || 0), 0);
  const todayProtein = Math.round(todayFoodLogs.reduce((s, l) => s + (l.proteinG || 0), 0));
  const todayCarbs = Math.round(todayFoodLogs.reduce((s, l) => s + (l.carbsG || 0), 0));
  const todayFat = Math.round(todayFoodLogs.reduce((s, l) => s + (l.fatG || 0), 0));

  const lastWorkoutDate = recentWorkouts[0]?.date ?? null;
  const daysSinceLastWorkout = lastWorkoutDate
    ? Math.floor((Date.now() - new Date(lastWorkoutDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  let bmr = 0;
  let calTarget = 2000;
  let proteinTarget = 120;

  if (profile) {
    const w = profile.weightKg || 70;
    const h = profile.heightCm || 170;
    const a = profile.age || 25;
    const g = profile.gender || "male";
    bmr = Math.round(10 * w + 6.25 * h - 5 * a + (g === "female" ? -161 : 5));
    const actMult: Record<string, number> = {
      sedentary: 1.2, light: 1.375, "lightly active": 1.375,
      moderate: 1.55, "moderately active": 1.55,
      active: 1.725, "very active": 1.725,
    };
    const tdee = Math.round(bmr * (actMult[profile.activityLevel || "moderate"] ?? 1.55));
    calTarget = profile.fitnessGoal === "weight loss" ? tdee - 500
      : profile.fitnessGoal === "muscle gain" ? tdee + 300
      : tdee;
    proteinTarget = Math.round(w * 2.2);
  }

  return {
    profile,
    today: {
      calories: todayCalories,
      protein: todayProtein,
      carbs: todayCarbs,
      fat: todayFat,
      foodItems: todayFoodLogs.length,
    },
    targets: { calories: calTarget, protein: proteinTarget },
    weekly: {
      workoutsCount: weekWorkouts.length,
      lastWorkoutDaysAgo: daysSinceLastWorkout,
      totalWorkouts: recentWorkouts.length,
    },
  };
}

function buildSystemPrompt(ctx: Awaited<ReturnType<typeof getUserContext>>) {
  const p = ctx.profile;
  const today = ctx.today;
  const targets = ctx.targets;
  const weekly = ctx.weekly;

  return `You are an elite AI fitness coach inside FitTrackPro. You are direct, motivating, and data-driven. Never give generic advice — always base your response on the user's actual data below.

USER PROFILE:
- Name: ${p?.name || "User"}
- Age: ${p?.age || "unknown"}, Gender: ${p?.gender || "unknown"}
- Weight: ${p?.weightKg || "unknown"} kg, Height: ${p?.heightCm || "unknown"} cm
- Goal: ${p?.fitnessGoal || "maintenance"}
- Activity Level: ${p?.activityLevel || "moderate"}
- Experience: ${p?.experienceLevel || "beginner"}
- Diet: ${p?.dietPreference || "non-veg"}

TODAY'S NUTRITION:
- Calories eaten: ${today.calories} / ${targets.calories} kcal target
- Protein: ${today.protein}g / ${targets.protein}g target
- Carbs: ${today.carbs}g, Fat: ${today.fat}g
- Food items logged: ${today.foodItems}

WORKOUT DATA (last 7 days):
- Workouts this week: ${weekly.workoutsCount}
- Days since last workout: ${weekly.lastWorkoutDaysAgo !== null ? weekly.lastWorkoutDaysAgo : "unknown"}
- Total workouts tracked: ${weekly.totalWorkouts}

COACHING RULES:
- Be specific, not generic. Reference their actual numbers.
- Be direct and slightly strict when they're slacking.
- Be supportive when they're doing well.
- Keep responses concise and impactful — no fluff.
- If data is missing, give the best advice you can with what's available.
- Never say things like "As an AI..." — just coach them directly.`;
}

router.get("/ai-coach/insights", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const ctx = await getUserContext(req.user.id);
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemPrompt = buildSystemPrompt(ctx);

    const prompt = `${systemPrompt}

Generate a personalized daily coaching report. Return ONLY valid JSON with this exact structure:
{
  "todaysFocus": "one sentence — the single most important thing for this user to focus on today",
  "coachFeedback": "2-3 sentences of specific feedback based on their actual data",
  "warningAlert": "one sentence warning if something is off (protein low, no workout in 3+ days, etc). Empty string if everything is fine.",
  "quickTip": "one short, actionable tip specific to their goal and current data",
  "nextBestAction": "one concrete action they should take in the next hour",
  "weeklyStatus": "one sentence summarizing their week — honest and direct",
  "moodEmoji": "a single emoji that matches the coaching tone (🔥 💪 ⚠️ 😤 ✅ etc)"
}

Base every field on their actual numbers. No filler text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response format");

    const insights = JSON.parse(jsonMatch[0]);
    res.json({ ...insights, context: ctx.today });
  } catch (err: any) {
    console.error("[ai-coach/insights]", err?.message ?? err);

    const ctx = await getUserContext(req.user.id).catch(() => ({
      today: { calories: 0, protein: 0, carbs: 0, fat: 0, foodItems: 0 },
      targets: { calories: 2000, protein: 120 },
      weekly: { workoutsCount: 0, lastWorkoutDaysAgo: null, totalWorkouts: 0 },
      profile: null,
    }));

    res.json({
      todaysFocus: "Log your meals and hit your protein target today.",
      coachFeedback: "Start tracking consistently. Every data point helps your coach give better advice.",
      warningAlert: "",
      quickTip: "Drink water, log your first meal, and plan tonight's workout.",
      nextBestAction: "Open the Diet tab and log what you ate so far today.",
      weeklyStatus: "Not enough data yet — start logging to unlock full coaching.",
      moodEmoji: "💪",
      context: ctx.today,
    });
  }
});

router.post("/ai-coach/chat", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { message, history } = req.body;
  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "Message required" });
    return;
  }

  try {
    const ctx = await getUserContext(req.user.id);
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemPrompt = buildSystemPrompt(ctx);

    const chatHistory = Array.isArray(history) ? history.slice(-8) : [];

    const conversationText = chatHistory
      .map((h: any) => `${h.role === "user" ? "User" : "Coach"}: ${h.content}`)
      .join("\n");

    const fullPrompt = `${systemPrompt}

${conversationText ? `RECENT CONVERSATION:\n${conversationText}\n\n` : ""}User: ${message}

Respond as the AI coach. Be direct, specific, and reference their data. Keep it under 150 words. No generic advice.`;

    const result = await model.generateContent(fullPrompt);
    const reply = result.response.text().trim();
    res.json({ reply });
  } catch (err: any) {
    console.error("[ai-coach/chat]", err?.message ?? err);
    res.json({ reply: "I'm having trouble connecting right now. Make sure you're logging your workouts and meals consistently — that's the foundation." });
  }
});

export default router;
