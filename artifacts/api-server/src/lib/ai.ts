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

export async function analyzeImageForFood(imageBase64: string, mimeType: string): Promise<string[]> {
  const ai = getVisionAI();
  const resp = await ai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${imageBase64}` },
          },
          {
            type: "text",
            text: `You are a food recognition expert. Identify all distinct food items visible in this image.
Return ONLY a JSON array of food names as plain strings. Be specific but concise.
Examples: ["dal tadka", "steamed rice", "roti"] or ["chicken curry", "naan"]
If no food is detected, return an empty array [].`,
          },
        ],
      },
    ],
    max_tokens: 256,
  });
  const text = resp.choices[0]?.message?.content?.trim() || "[]";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return Array.isArray(parsed) ? parsed.filter((v: any) => typeof v === "string") : [];
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
  const weightStr = weightGrams ? `${weightGrams}g` : "a standard serving";
  const ai = getAI();
  const resp = await ai.chat.completions.create({
    model: getTextModel(),
    messages: [
      {
        role: "system",
        content: "You are a nutritionist. Estimate macros accurately for the given food and portion size. Return ONLY valid JSON.",
      },
      {
        role: "user",
        content: `Estimate the nutritional macros for ${weightStr} of "${foodName}".
Return ONLY a JSON object: {"calories": number, "proteinG": number, "carbsG": number, "fatG": number}
Be realistic and accurate. No explanation.`,
      },
    ],
    temperature: 0.3,
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
