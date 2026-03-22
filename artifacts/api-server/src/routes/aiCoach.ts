import { Router, type IRouter } from "express";
import { chatComplete, chatCompleteWithHistory } from "../lib/ai";
import { db } from "@workspace/db";
import { foodLogsTable, workoutsTable, userProfilesTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

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
      athlete: 1.9, "extra active": 1.9,
    };
    const tdee = Math.round(bmr * (actMult[profile.activityLevel || "moderate"] ?? 1.55));
    const goalMult: Record<string, number> = {
      "fat loss": -500, "weight loss": -500,
      "muscle gain": 300,
      "recomposition": 0,
      "strength": 200,
      "endurance": 100,
      "general fitness": 0, "maintenance": 0,
      "athletic performance": 200,
    };
    calTarget = tdee + (goalMult[profile.fitnessGoal || "maintenance"] ?? 0);
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

  return `You are the AI fitness coach inside CaloForgeX — an elite, energetic, and supportive fitness companion. You are passionate about helping people reach their goals. Your personality is:
- MOTIVATING: You hype people up, celebrate small wins, and use encouraging language
- DIRECT: You give specific, actionable advice based on actual data — never generic fluff
- SUPPORTIVE: You understand struggles and never shame anyone, but you push them to be better
- ENERGETIC: Your tone is upbeat and confident — like a best friend who's also a certified trainer

NEVER say "As an AI" or anything robotic. Speak naturally like a passionate coach who genuinely cares.

USER PROFILE:
- Name: ${p?.name || "Champ"}
- Age: ${p?.age || "unknown"}, Gender: ${p?.gender || "unknown"}
- Weight: ${p?.weightKg || "unknown"} kg, Height: ${p?.heightCm || "unknown"} cm
- Goal: ${p?.fitnessGoal || "general fitness"}
- Activity Level: ${p?.activityLevel || "moderate"}
- Experience: ${p?.experienceLevel || "beginner"}
- Diet: ${p?.dietPreference || "non-veg"}
- Country: ${p?.country || "USA"}

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
- Reference their actual numbers — be specific!
- Celebrate progress, push when they're slacking
- Keep responses concise (under 150 words) and impactful
- Use emojis sparingly to add energy 💪🔥
- If data is missing, give the best advice you can`;
}

router.get("/ai-coach/insights", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const ctx = await getUserContext(req.user.id);
    const systemPrompt = buildSystemPrompt(ctx);

    const prompt = `Generate a personalized daily coaching report. Return ONLY valid JSON with this exact structure:
{
  "todaysFocus": "one sentence — the single most important thing to focus on today (motivating!)",
  "coachFeedback": "2-3 sentences of specific, encouraging feedback based on actual data",
  "warningAlert": "one sentence warning if something is off. Empty string if all good.",
  "quickTip": "one short, actionable tip specific to their goal",
  "nextBestAction": "one concrete action they should take right now",
  "weeklyStatus": "one sentence summarizing their week — honest but encouraging",
  "moodEmoji": "a single emoji that matches the coaching tone (🔥 💪 ⚠️ 😤 ✅ 🚀 etc)"
}

Base every field on their actual numbers. Be motivating and energetic!`;

    const text = await chatComplete(systemPrompt, prompt);
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
      todaysFocus: "Let's crush it today! Start by logging your meals and hitting your protein target 💪",
      coachFeedback: "Every champion starts somewhere. Log your food consistently and watch the magic happen. Your body will thank you!",
      warningAlert: "",
      quickTip: "Drink a big glass of water right now, then log your next meal. Small wins build big results! 🔥",
      nextBestAction: "Open the Diet tab and log what you've eaten today — let's see where you stand!",
      weeklyStatus: "We're just getting started — consistency is key. Let's build that streak! 🚀",
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
    const systemPrompt = buildSystemPrompt(ctx);

    const chatHistory = Array.isArray(history) ? history.slice(-8) : [];
    const mappedHistory = chatHistory.map((h: any) => ({
      role: h.role === "user" ? "user" as const : "assistant" as const,
      content: h.content,
    }));

    const reply = await chatCompleteWithHistory(systemPrompt, mappedHistory, message);
    res.json({ reply: reply || "Keep pushing! Log your meals and workouts — I'll give you better insights with more data. 💪" });
  } catch (err: any) {
    console.error("[ai-coach/chat]", err?.message ?? err);
    res.json({ reply: "I'm having a moment — but don't let that stop you! Keep logging your workouts and meals. Every rep counts! 💪🔥" });
  }
});

router.post("/ai-coach/meal-plan", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const ctx = await getUserContext(req.user.id);
    const p = ctx.profile;
    if (!p) {
      res.status(400).json({ error: "Profile required" });
      return;
    }

    const systemPrompt = `You are a certified nutritionist creating personalized meal plans. Create realistic, practical meal plans based on the user's data.`;

    const prompt = `Create a personalized daily meal plan for:
- Age: ${p.age}, Gender: ${p.gender}, Weight: ${p.weightKg}kg, Height: ${p.heightCm}cm
- Goal: ${p.fitnessGoal}, Activity: ${p.activityLevel}
- Diet: ${p.dietPreference}, Country: ${p.country || "USA"}
- Daily calories target: ${ctx.targets.calories} kcal
- Protein target: ${ctx.targets.protein}g

Return ONLY valid JSON:
{
  "dailyCalories": number,
  "proteinG": number,
  "carbsG": number,
  "fatG": number,
  "meals": [
    {
      "mealType": "breakfast|lunch|snack|dinner",
      "name": "meal name",
      "calories": number,
      "proteinG": number,
      "carbsG": number,
      "fatG": number,
      "foods": [{"name": "food", "amount": "portion", "calories": number}]
    }
  ]
}

Include 4 meals (breakfast, lunch, snack, dinner). Use foods common in ${p.country || "USA"}. Make it practical and delicious!`;

    const text = await chatComplete(systemPrompt, prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid response");

    const plan = JSON.parse(jsonMatch[0]);
    res.json(plan);
  } catch (err: any) {
    console.error("[ai-coach/meal-plan]", err?.message ?? err);
    res.status(500).json({ error: "Failed to generate meal plan" });
  }
});

export default router;
