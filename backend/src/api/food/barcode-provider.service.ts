const OPEN_FOOD_FACTS_BASE_URL = 'https://world.openfoodfacts.org/api/v2/product';
const FETCH_TIMEOUT_MS = 5000;

type MissingField = 'name' | 'calories' | 'protein' | 'carbs' | 'fat';
type BarcodeSource = 'local' | 'open_food_facts';

interface OpenFoodFactsProduct {
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  quantity?: string;
  serving_size?: string;
  nutriments?: Record<string, number | string | undefined>;
}

interface OpenFoodFactsResponse {
  status?: number;
  product?: OpenFoodFactsProduct;
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function firstNumber(nutriments: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = numberValue(nutriments[key]);
    if (value !== undefined) return value;
  }
  return undefined;
}

function missingFields(result: {
  name?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}): MissingField[] {
  const missing: MissingField[] = [];
  if (!result.name) missing.push('name');
  if (result.calories === undefined) missing.push('calories');
  if (result.protein === undefined) missing.push('protein');
  if (result.carbs === undefined) missing.push('carbs');
  if (result.fat === undefined) missing.push('fat');
  return missing;
}

export interface BarcodeLookupResult {
  barcode: string;
  found: boolean;
  source: BarcodeSource;
  productId?: string;
  name?: string;
  brand?: string;
  servingSizeG?: number;
  packageSize?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  vitaminC?: number;
  isSaveReady: boolean;
  minimumNutrition?: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  missingFields?: MissingField[];
  provenance: {
    provider: BarcodeSource;
    fetchedAt: string;
    lastVerifiedAt: string | null;
  };
  message?: string;
}

export async function lookupBarcodeProduct(barcode: string): Promise<BarcodeLookupResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const fetchedAt = new Date().toISOString();

  try {
    const response = await fetch(`${OPEN_FOOD_FACTS_BASE_URL}/${encodeURIComponent(barcode)}.json`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'u-app/1.0 barcode-mvp',
      },
    });

    if (!response.ok) {
      return fallback(barcode, fetchedAt, 'Khong the tra cuu ma vach luc nay');
    }

    const payload = await response.json() as OpenFoodFactsResponse;
    if (payload.status !== 1 || !payload.product) {
      return fallback(barcode, fetchedAt, 'Chua tim thay san pham tu ma vach nay');
    }

    const product = payload.product;
    const nutriments = product.nutriments ?? {};
    const name = product.product_name || product.product_name_en;
    const calories = firstNumber(nutriments, ['energy-kcal_100g', 'energy-kcal']);
    const protein = firstNumber(nutriments, ['proteins_100g', 'proteins']);
    const carbs = firstNumber(nutriments, ['carbohydrates_100g', 'carbohydrates']);
    const fat = firstNumber(nutriments, ['fat_100g', 'fat']);
    const result = {
      name,
      calories,
      protein,
      carbs,
      fat,
    };
    const missing = missingFields(result);
    const isSaveReady = missing.length === 0;

    return {
      barcode,
      found: true,
      source: 'open_food_facts',
      productId: barcode,
      name,
      brand: product.brands,
      packageSize: product.quantity,
      servingSizeG: numberValue(product.serving_size?.match(/[\d.]+/)?.[0]),
      calories,
      protein,
      carbs,
      fat,
      fiber: firstNumber(nutriments, ['fiber_100g', 'fiber']),
      sugar: firstNumber(nutriments, ['sugars_100g', 'sugars']),
      sodium: firstNumber(nutriments, ['sodium_100g', 'sodium']),
      vitaminC: firstNumber(nutriments, ['vitamin-c_100g', 'vitamin-c']),
      isSaveReady,
      minimumNutrition: isSaveReady
        ? {
          name: name!,
          calories: calories!,
          protein: protein!,
          carbs: carbs!,
          fat: fat!,
        }
        : undefined,
      missingFields: missing,
      provenance: {
        provider: 'open_food_facts',
        fetchedAt,
        lastVerifiedAt: null,
      },
      message: isSaveReady ? 'Da tim thay san pham' : 'San pham thieu du lieu dinh duong co ban',
    };
  } catch {
    return fallback(barcode, fetchedAt, 'Nha cung cap ma vach dang cham, vui long thu lai');
  } finally {
    clearTimeout(timeout);
  }
}

function fallback(barcode: string, fetchedAt: string, message: string): BarcodeLookupResult {
  return {
    barcode,
    found: false,
    source: 'open_food_facts',
    isSaveReady: false,
    missingFields: ['name', 'calories', 'protein', 'carbs', 'fat'],
    provenance: {
      provider: 'open_food_facts',
      fetchedAt,
      lastVerifiedAt: null,
    },
    message,
  };
}
