import OpenAI from 'openai';

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
    sodium: number;      // D-60
    vitaminC: number;    // D-60
    tags: string[];      // D-60
  }>;
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  aiProvider: 'logmeal' | 'openai' | 'manual';
  imageUrl: string | null;   // null in Phase 4 (D-62)
}

/**
 * Analyze a food image using GPT-4o-mini vision.
 * Returns a NutritionResult with all 10 nutritional fields + tags per food item.
 * Instantiates OpenAI client at call time (not module scope) to allow test env override (T-04-02-03).
 */
export async function analyzeImage(imageBuffer: Buffer): Promise<NutritionResult> {
  // Instantiate at call time — never at module scope — so test environments
  // can set process.env.OPENAI_API_KEY before this function runs (T-04-02-03).
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const base64 = imageBuffer.toString('base64');
  const dataUrl = `data:image/jpeg;base64,${base64}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Bạn là chuyên gia dinh dưỡng. Phân tích ảnh bữa ăn và trả về JSON với cấu trúc:
{
  "foods": [{
    "name": "string (tên món ăn tiếng Việt)",
    "weightG": number,
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number,
    "fiber": number,
    "sugar": number,
    "sodium": number,
    "vitaminC": number,
    "tags": ["string"]
  }],
  "totals": { "calories": number, "protein": number, "carbs": number, "fat": number }
}
Tất cả giá trị dinh dưỡng tính theo gram (ngoại trừ calories = kcal). Ước tính số lượng thực tế trong ảnh.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Phân tích các món ăn trong ảnh và trả về thông tin dinh dưỡng theo định dạng JSON đã yêu cầu.',
          },
          {
            type: 'image_url',
            image_url: { url: dataUrl },
          },
        ],
      },
    ],
    max_tokens: 1000,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('OpenAI trả về kết quả rỗng');

  // Parse and validate JSON response (T-04-02-02: normalize to prevent NaN/undefined)
  const raw = JSON.parse(content) as {
    foods?: Array<Record<string, unknown>>;
    totals?: Record<string, unknown>;
  };

  // Validate: foods array must be non-empty
  if (!raw.foods || raw.foods.length === 0) {
    throw new Error('Không nhận dạng được thức ăn trong ảnh');
  }

  // Normalize each food item — coerce numeric fields via Number() || 0 (Pitfall 5)
  const foods = raw.foods.map((item) => ({
    name: String(item.name ?? ''),
    weightG: Number(item.weightG) || 0,
    calories: Number(item.calories) || 0,
    protein: Number(item.protein) || 0,
    carbs: Number(item.carbs) || 0,
    fat: Number(item.fat) || 0,
    fiber: Number(item.fiber) || 0,
    sugar: Number(item.sugar) || 0,
    sodium: Number(item.sodium) || 0,
    vitaminC: Number(item.vitaminC) || 0,
    // Ensure tags is always an array of strings
    tags: Array.isArray(item.tags) ? (item.tags as unknown[]).map(String) : [],
  }));

  // Normalize totals — recalculate from foods if any totals field is missing
  const rawTotals = raw.totals ?? {};
  const totals = {
    calories: Number((rawTotals as Record<string, unknown>).calories) || foods.reduce((s, f) => s + f.calories, 0),
    protein: Number((rawTotals as Record<string, unknown>).protein) || foods.reduce((s, f) => s + f.protein, 0),
    carbs: Number((rawTotals as Record<string, unknown>).carbs) || foods.reduce((s, f) => s + f.carbs, 0),
    fat: Number((rawTotals as Record<string, unknown>).fat) || foods.reduce((s, f) => s + f.fat, 0),
  };

  return {
    foods,
    totals,
    aiProvider: 'openai',
    imageUrl: null,  // D-62: never store image in Phase 4
  };
}
