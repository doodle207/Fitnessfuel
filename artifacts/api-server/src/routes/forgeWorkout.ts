import { Router, type IRouter, type Request, type Response } from "express";
import { getAI } from "../lib/ai";
import { db } from "@workspace/db";
import { userProfilesTable, workoutsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.post("/forge-workout/generate", async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { split } = req.body;

  const [profile] = await db
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.userId, userId))
    .limit(1);

  const recentWorkoutsRaw = await db
    .select()
    .from(workoutsTable)
    .where(eq(workoutsTable.userId, userId))
    .orderBy(desc(workoutsTable.date))
    .limit(6);

  const goal = profile?.goal || "muscle gain";
  const experience = profile?.experienceLevel || "Intermediate";
  const equipment = "Full gym — barbells, dumbbells, cables, machines";
  const time = 60;

  const recentWorkoutsText =
    recentWorkoutsRaw.length > 0
      ? recentWorkoutsRaw
          .map(
            (w) =>
              `- ${w.name} (${w.muscleGroup || "Mixed"}) on ${w.date}`
          )
          .join("\n")
      : "No recent workouts logged yet.";

  const userPrompt = `Workout Split: ${split || "Push Pull Legs"}
Goal: ${goal}
Experience Level: ${experience}
Available Time: ${time} minutes
Equipment Access: ${equipment}

Recent Workouts History:
${recentWorkoutsText}

Instructions:
- Generate a structured, gym-realistic workout plan
- Focus on compound movements first, then isolation exercises
- Include 5–7 exercises max
- Include sets, reps, and rest time
- Include the gym area/location for each exercise (e.g., Free Weights Area, Machine Section, Cable Station, Squat Rack Area)
- Mention the equipment name clearly
- Avoid repeating exact same exercises from recent workouts if possible
- Ensure progressive overload potential
- Keep it practical and commonly used in real gyms

Output format:

Feature: Forge Workout

Workout Name: [e.g., Legs Day – Hypertrophy Focus]

1. Exercise Name
   Area: [e.g., Squat Rack Area]
   Equipment: [e.g., Barbell]
   Sets: X
   Reps: X–X
   Rest: X sec

(Repeat for all exercises)

At the end include:
- Short note (1–2 lines) explaining the workout focus`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const ai = getAI();
    const stream = await ai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an elite fitness coach and workout programmer specialising in hypertrophy and strength. Generate structured, practical, gym-realistic workout plans. Be concise, precise, and motivating.",
        },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.75,
      max_tokens: 1200,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error("[forge-workout] Error:", err);
    res.write(`data: ${JSON.stringify({ error: "Failed to generate workout. Please try again." })}\n\n`);
    res.end();
  }
});

export default router;
