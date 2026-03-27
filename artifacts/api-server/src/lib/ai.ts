import OpenAI from "openai";

let _textClient: OpenAI | null = null;
let _visionClient: OpenAI | null = null;

function getGroqModel(): string {
  return process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
}

function useGroq(): boolean {
  return !!(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim());
}

export function getAI(): OpenAI {
  if (_textClient) return _textClient;
  if (useGroq()) {
    _textClient = new OpenAI({
      apiKey: process.env.GROQ_API_KEY!,
      baseURL: "https://api.groq.com/openai/v1",
    });
    console.log("[AI] Using Groq:", getGroqModel());
  } else {
    const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.GEMINI_API_KEY || "";
    const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "https://api.openai.com/v1";
    console.log("[AI] OpenAI config - Key present:", !!apiKey, "Base URL:", baseURL);
    if (!apiKey) {
      console.warn("[AI] WARNING: No OpenAI API key found! AI features will not work. Set AI_INTEGRATIONS_OPENAI_API_KEY.");
    }
    _textClient = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL,
    });
    console.log("[AI] Using Replit AI proxy / OpenAI");
  }
  return _textClient;
}

function getVisionAI(): OpenAI {
  if (_visionClient) return _visionClient;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "";
  if (!apiKey) {
    console.warn("[AI Vision] WARNING: No OpenAI API key found! Vision features will not work.");
  }
  _visionClient = new OpenAI({
    apiKey: apiKey,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "https://api.openai.com/v1",
  });
  return _visionClient;
}

function getTextModel(): string {
  if (useGroq()) return getGroqModel();
  return "gpt-4o";
}

export async function chatComplete(
  systemPrompt: string,
  userPrompt: string,
  options?: { max_tokens?: number; temperature?: number }
): Promise<string> {
  const ai = getAI();
  const resp = await ai.chat.completions.create({
    model: getTextModel(),
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.max_tokens ?? 1024,
  });
  return resp.choices[0]?.message?.content?.trim() || "";
}

export async function chatCompleteWithHistory(
  systemPrompt: string,
  history: { role: "user" | "assistant"; content: string }[],
  userMessage: string
): Promise<string> {
  const ai = getAI();
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map(h => ({ role: h.role as "user" | "assistant", content: h.content })),
    { role: "user", content: userMessage },
  ];
  const resp = await ai.chat.completions.create({
    model: getTextModel(),
    messages,
    temperature: 0.7,
    max_tokens: 1024,
  });
  return resp.choices[0]?.message?.content?.trim() || "";
}

export interface FoodItem {
  name: string;
  grams: number;
}

export async function analyzeImageForFood(imageBase64: string, mimeType: string): Promise<FoodItem[]> {
  const ai = getVisionAI();
  const resp = await ai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: "high" },
          },
          {
            type: "text",
            text: `You are a professional nutritionist and food recognition expert analyzing a meal photo.

For EACH distinct food item visible in the image:
1. Identify it precisely (e.g. "cooked white basmati rice", "chicken tikka masala", "plain roti", "dal tadka", "mixed vegetable curry")
2. Estimate the serving weight in grams using visual cues like:
   - Plate/bowl size (standard dinner plate ≈ 25cm diameter)
   - Typical restaurant/home portion sizes
   - Food density and thickness
   - How much of the plate/bowl is filled

Return ONLY valid JSON — an array of objects like:
[
  {"name": "cooked white basmati rice", "grams": 200},
  {"name": "chicken tikka masala curry", "grams": 180},
  {"name": "plain roti/chapati", "grams": 40}
]

Rules:
- Be specific about cooking method (boiled, fried, baked, etc.)
- Include any visible sauces, gravies, or garnishes
- Use realistic home/restaurant serving weights
- If the item fills a full bowl: 200–350g; half bowl: 100–200g; small portion: 50–100g
- If no food is visible, return []
- Return ONLY the JSON array, no explanation`,
          },
        ],
      },
    ],
    max_tokens: 512,
    temperature: 0.1,
  });
  const text = resp.choices[0]?.message?.content?.trim() || "[]";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((v: any) => v && typeof v.name === "string" && typeof v.grams === "number")
      .map((v: any) => ({ name: v.name.trim(), grams: Math.max(10, Math.round(Number(v.grams))) }));
  } catch {
    return [];
  }
}

export async function estimateFoodMacros(foodName: string, weightGrams?: number): Promise<{
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}> {
  const weightStr = weightGrams ? `exactly ${weightGrams}g` : "a standard serving (estimate a realistic weight)";
  const ai = getAI();
  const resp = await ai.chat.completions.create({
    model: getTextModel(),
    messages: [
      {
        role: "system",
        content: `You are a precise nutritionist with expertise in food composition databases.
Calculate macronutrients accurately using standard nutritional data (USDA, IFCT, or equivalent).
Consider cooking methods and regional variations. Always return realistic values.
Return ONLY valid JSON — no text, no markdown, no explanation.`,
      },
      {
        role: "user",
        content: `Calculate the exact macros for ${weightStr} of: "${foodName}"

Consider:
- The specific cooking method if mentioned (boiled, fried, roasted, etc.)
- Water content changes during cooking
- Regional recipe variations for Indian/Asian dishes

Return ONLY this JSON (numbers only, no strings):
{"calories": <number>, "proteinG": <number>, "carbsG": <number>, "fatG": <number>}

Example for 200g cooked basmati rice: {"calories": 260, "proteinG": 5.4, "carbsG": 56, "fatG": 0.6}`,
      },
    ],
    temperature: 0.1,
    max_tokens: 128,
  });
  const text = resp.choices[0]?.message?.content?.trim() || "";
  const jsonMatch = text.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) return { calories: 200, proteinG: 8, carbsG: 25, fatG: 7 };
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      calories: Math.round(Number(parsed.calories) || 200),
      proteinG: Math.round((Number(parsed.proteinG) || 8) * 10) / 10,
      carbsG: Math.round((Number(parsed.carbsG) || 25) * 10) / 10,
      fatG: Math.round((Number(parsed.fatG) || 7) * 10) / 10,
    };
  } catch {
    return { calories: 200, proteinG: 8, carbsG: 25, fatG: 7 };
  }
}
