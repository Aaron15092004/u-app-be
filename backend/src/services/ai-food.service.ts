// TODO Phase 4: implement LogMeal + GPT-4o-mini food analysis (D-14)

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
  }>;
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  aiProvider: 'logmeal' | 'openai' | 'manual';
  imageUrl: string;
}

export async function analyzeImage(
  imageBuffer: Buffer,
  imageUrl: string
): Promise<NutritionResult> {
  throw new Error('AI food analysis not implemented — implement in Phase 4');
}
