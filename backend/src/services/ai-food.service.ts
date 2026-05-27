export interface NutritionResult {
  foods: Array<{
    name: string;
    weightG: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    vitamins: Record<string, number>; // { vitaminC: 15, vitaminA: 80, ... }
    minerals: Record<string, number>; // { sodium: 350, potassium: 200, ... }
    tags: string[];
  }>;
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  aiProvider: "logmeal" | "gemini" | "manual";
  imageUrl: string | null;
  commentVi: string;
}

const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const USER_PROMPT = `Bạn là chuyên gia dinh dưỡng. Phân tích ảnh bữa ăn này và trả về ONLY một JSON object (không có markdown, không có text khác) với cấu trúc sau:
{
  "foods": [
    {
      "name": "tên món ăn tiếng Việt",
      "weightG": 150,
      "calories": 250,
      "protein": 10,
      "carbs": 30,
      "fat": 8,
      "fiber": 3,
      "sugar": 5,
      "vitamins": {
        "vitaminC": 15.0,
        "vitaminA": 80.0
      },
      "minerals": {
        "sodium": 350.0,
        "potassium": 200.0,
        "calcium": 80.0,
        "iron": 2.5
      },
      "tags": ["tag1"]
    }
  ],
  "totals": { "calories": 250, "protein": 10, "carbs": 30, "fat": 8 },
  "commentVi": "Nhận xét ngắn bằng tiếng Việt: món này tốt/không tốt ở điểm nào, có nên ăn nhiều không, và gợi ý điều chỉnh nếu cần."
}
Quy tắc quan trọng:
- calories = kcal; protein/carbs/fat/fiber/sugar = gram
- vitamins: đơn vị mg hoặc mcg tùy loại. Chỉ liệt kê vitamin có hàm lượng đáng kể (> 0). Các loại phổ biến: vitaminC, vitaminA, vitaminD, vitaminE, vitaminK, vitaminB1, vitaminB2, vitaminB3, vitaminB12, folate
- minerals: đơn vị mg hoặc mcg tùy loại. Chỉ liệt kê khoáng chất có hàm lượng đáng kể (> 0). Các loại phổ biến: sodium, potassium, calcium, magnesium, phosphorus, iron, zinc, selenium
- Nếu không có vitamin/khoáng chất đáng kể thì để: "vitamins": {}, "minerals": {}
- commentVi: 1-3 câu tiếng Việt, dễ hiểu, tập trung vào lợi ích/rủi ro khi ăn nhiều và khuyến nghị thực tế cho bữa này
- Ước tính dựa trên ảnh thực tế. Chỉ trả về JSON, không giải thích thêm.`;

function buildFallbackComment(result: {
  foods: Array<{ name: string; tags: string[] }>;
  totals: { calories: number; protein: number; carbs: number; fat: number };
}): string {
  const foodNames = result.foods.map((f) => f.name).slice(0, 3).join(", ");
  const highCalories = result.totals.calories >= 700;
  const highFat = result.totals.fat >= 25;
  const lowProtein = result.totals.protein < 15;

  if (highCalories || highFat) {
    return `${foodNames || "Bữa ăn này"} khá nhiều năng lượng${highFat ? " và chất béo" : ""}. Bạn vẫn có thể ăn nhưng nên giảm khẩu phần hoặc cân bằng thêm rau, nước và vận động nếu ăn thường xuyên.`;
  }

  if (lowProtein) {
    return `${foodNames || "Bữa ăn này"} tương đối nhẹ nhưng lượng đạm chưa cao. Có thể bổ sung thêm trứng, đậu, thịt nạc hoặc sữa hạt phù hợp để no lâu hơn.`;
  }

  return `${foodNames || "Bữa ăn này"} có mức dinh dưỡng khá cân bằng. Nên giữ khẩu phần vừa phải và ưu tiên thêm rau hoặc thực phẩm ít chế biến nếu ăn thường xuyên.`;
}

export async function analyzeImage(imageBuffer: Buffer): Promise<NutritionResult> {
  const apiKey = process.env.GEMINI_API_KEY ?? "";
  if (!apiKey) throw new Error("GEMINI_API_KEY chưa được cấu hình");

  const base64 = imageBuffer.toString("base64");
  const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent`;

  // No responseMimeType — JSON mode breaks vision requests on some model versions.
  // Instead we embed the instruction directly in the prompt.
  const body = {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: "image/jpeg", data: base64 } },
          { text: USER_PROMPT },
        ],
      },
    ],
    generationConfig: { maxOutputTokens: 4096, temperature: 0.1 },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API lỗi ${response.status}: ${errText.slice(0, 300)}`);
  }

  const json = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
    promptFeedback?: { blockReason?: string };
  };

  // Surface prompt-level blocks (e.g. SAFETY)
  if (json.promptFeedback?.blockReason) {
    throw new Error(`Gemini từ chối ảnh: ${json.promptFeedback.blockReason}`);
  }

  const candidate = json.candidates?.[0];

  // Surface candidate-level blocks
  if (
    candidate?.finishReason &&
    candidate.finishReason !== "STOP" &&
    candidate.finishReason !== "MAX_TOKENS"
  ) {
    throw new Error(`Gemini dừng bất thường: ${candidate.finishReason}`);
  }

  // Gemini may split output across multiple parts — join them all.
  const rawText = (candidate?.content?.parts ?? [])
    .map((p: { text?: string }) => p.text ?? "")
    .join("");

  if (!rawText.trim()) {
    console.error("[Gemini] empty response. Full API response:", JSON.stringify(json, null, 2));
    throw new Error("Gemini trả về kết quả rỗng");
  }

  console.log("[Gemini] raw text (first 500 chars):", rawText.slice(0, 500));

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("[Gemini] no JSON object found in response:", rawText);
    throw new Error("Gemini không trả về JSON. Vui lòng thử lại.");
  }

  let raw: { foods?: Array<Record<string, unknown>>; totals?: Record<string, unknown>; commentVi?: unknown; comment?: unknown };
  try {
    raw = JSON.parse(jsonMatch[0]) as typeof raw;
  } catch (parseErr) {
    console.error("[Gemini] JSON.parse failed on:", jsonMatch[0].slice(0, 300), parseErr);
    throw new Error("Không đọc được kết quả từ Gemini. Vui lòng thử lại.");
  }

  if (!raw.foods || raw.foods.length === 0) {
    throw new Error("Không nhận dạng được thức ăn trong ảnh");
  }

  const foods = raw.foods.map((item) => {
    // Accept nested vitamins/minerals objects from new prompt format.
    // Also handle legacy flat fields (vitaminC, sodium) in case Gemini ignores the new format.
    const rawVitamins = (item.vitamins && typeof item.vitamins === "object" && !Array.isArray(item.vitamins)
      ? item.vitamins
      : {}) as Record<string, unknown>;
    const rawMinerals = (item.minerals && typeof item.minerals === "object" && !Array.isArray(item.minerals)
      ? item.minerals
      : {}) as Record<string, unknown>;

    // Fallback: promote legacy flat fields into nested objects
    if (!rawVitamins.vitaminC && item.vitaminC) rawVitamins.vitaminC = item.vitaminC;
    if (!rawMinerals.sodium && item.sodium) rawMinerals.sodium = item.sodium;

    const vitamins: Record<string, number> = {};
    for (const [k, v] of Object.entries(rawVitamins)) {
      const n = Number(v);
      if (n > 0) vitamins[k] = n;
    }

    const minerals: Record<string, number> = {};
    for (const [k, v] of Object.entries(rawMinerals)) {
      const n = Number(v);
      if (n > 0) minerals[k] = n;
    }

    return {
      name: String(item.name ?? "Món ăn"),
      weightG: Number(item.weightG) || 0,
      calories: Number(item.calories) || 0,
      protein: Number(item.protein) || 0,
      carbs: Number(item.carbs) || 0,
      fat: Number(item.fat) || 0,
      fiber: Number(item.fiber) || 0,
      sugar: Number(item.sugar) || 0,
      vitamins,
      minerals,
      tags: Array.isArray(item.tags) ? (item.tags as unknown[]).map(String) : [],
    };
  });

  const rt = (raw.totals ?? {}) as Record<string, unknown>;
  const totals = {
    calories: Number(rt.calories) || foods.reduce((s, f) => s + f.calories, 0),
    protein:  Number(rt.protein)  || foods.reduce((s, f) => s + f.protein, 0),
    carbs:    Number(rt.carbs)    || foods.reduce((s, f) => s + f.carbs, 0),
    fat:      Number(rt.fat)      || foods.reduce((s, f) => s + f.fat, 0),
  };

  const commentVi =
    typeof raw.commentVi === "string" && raw.commentVi.trim().length > 0
      ? raw.commentVi.trim()
      : typeof raw.comment === "string" && raw.comment.trim().length > 0
        ? raw.comment.trim()
        : buildFallbackComment({ foods, totals });

  return { foods, totals, aiProvider: "gemini", imageUrl: null, commentVi };
}
