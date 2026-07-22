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

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const RETRYABLE_PROVIDER_STATUSES = new Set([408, 500, 502, 503, 504]);

// Failures that are a property of the model itself (retired, out of quota,
// rejects a config field): retrying the same model is pointless, but the next
// model on the ladder may well work.
const SKIP_MODEL_CODES = new Set(["AI_PROVIDER_CONFIGURATION_ERROR", "AI_PROVIDER_RATE_LIMITED"]);
const DEFAULT_REQUEST_TIMEOUT_MS = 20_000;
const DEFAULT_RETRY_DELAY_MS = 500;
const MAX_ATTEMPTS_PER_MODEL = 2;

// Gemini 2.5/3.x are thinking models: reasoning tokens are billed against
// maxOutputTokens BEFORE any answer text is emitted. A small budget (the old
// 1200) is consumed entirely by thinking, so the response comes back truncated
// or empty and JSON.parse fails. Keep this generous.
const MAX_OUTPUT_TOKENS = 8_192;

// Mobile clients (already shipped to the App Store) abort the /scan request at
// 45s, so the whole model/retry ladder must finish comfortably before that.
const TOTAL_BUDGET_MS = 38_000;
const MIN_ATTEMPT_BUDGET_MS = 6_000;

// Used when GEMINI_PRIMARY_MODEL / GEMINI_FALLBACK_MODEL are unset, and appended
// to the ladder so a retired model configured in the environment (Google returns
// 404 "no longer available") degrades to a working model instead of hard-failing.
const DEFAULT_MODELS = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-flash-latest"];

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

export class AiScanError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string,
    readonly retryable = false,
    readonly providerStatus?: number,
  ) {
    super(message);
    this.name = "AiScanError";
  }
}

function getModelLadder(): string[] {
  const configured = [
    process.env.GEMINI_PRIMARY_MODEL?.trim(),
    process.env.GEMINI_FALLBACK_MODEL?.trim(),
  ].filter((model): model is string => Boolean(model));

  // Configured models first, then the built-in defaults as a safety net.
  return [...new Set([...configured, ...DEFAULT_MODELS])];
}

function getRequestTimeoutMs(): number {
  const configured = Number(process.env.GEMINI_REQUEST_TIMEOUT_MS);
  return Number.isFinite(configured) && configured >= 1_000 && configured <= 40_000
    ? configured
    : DEFAULT_REQUEST_TIMEOUT_MS;
}

function getRetryDelayMs(attempt: number): number {
  const configured = Number(process.env.GEMINI_RETRY_DELAY_MS);
  const baseDelay = Number.isFinite(configured) && configured >= 0
    ? configured
    : DEFAULT_RETRY_DELAY_MS;
  return baseDelay * (attempt + 1);
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function unavailableError(providerStatus?: number): AiScanError {
  return new AiScanError(
    "Dịch vụ phân tích ảnh đang bận. Vui lòng thử lại sau ít phút.",
    503,
    "AI_TEMPORARILY_UNAVAILABLE",
    true,
    providerStatus,
  );
}

function imageRejectedError(): AiScanError {
  return new AiScanError(
    "Không nhận dạng được thức ăn trong ảnh. Hãy chụp rõ hơn và thử lại.",
    422,
    "AI_IMAGE_REJECTED",
  );
}

// Retryable: a garbled/truncated answer from one model says nothing about the
// next one, so the ladder should keep going instead of dead-ending on the user.
function invalidResponseError(): AiScanError {
  return new AiScanError(
    "Không đọc được kết quả phân tích. Vui lòng thử lại.",
    422,
    "AI_INVALID_RESPONSE",
    true,
  );
}

/**
 * Pull a JSON object out of Gemini's answer text.
 *
 * Handles the three shapes seen in practice: clean JSON (responseMimeType),
 * JSON wrapped in a ```json fence, and JSON truncated mid-object when the model
 * runs out of output tokens — the last case is repaired by closing whatever
 * brackets are still open.
 */
function extractJsonObject(rawText: string): Record<string, unknown> | null {
  const cleaned = rawText
    .replace(/^﻿/, "")
    .replace(/```(?:json)?/gi, "")
    .trim();

  const start = cleaned.indexOf("{");
  if (start === -1) return null;

  const candidates: string[] = [];
  const end = cleaned.lastIndexOf("}");
  if (end > start) candidates.push(cleaned.slice(start, end + 1));
  candidates.push(repairTruncatedJson(cleaned.slice(start)));

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // try the next candidate
    }
  }

  return null;
}

/** Close brackets left open by a truncated response, dropping any partial tail. */
function repairTruncatedJson(text: string): string {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  let lastSafeIndex = -1;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') inString = true;
    else if (char === "{" || char === "[") stack.push(char === "{" ? "}" : "]");
    else if (char === "}" || char === "]") {
      stack.pop();
      // A closing bracket ends a complete element — cutting here keeps only
      // whole entries, so a half-written food never reaches the user as 0 kcal.
      lastSafeIndex = i;
    }
  }

  if (stack.length === 0) return text;

  const truncated = lastSafeIndex >= 0 ? text.slice(0, lastSafeIndex + 1) : text;
  // Recount depth on the trimmed slice — the tail we dropped may have opened brackets.
  return trimTrailingComma(truncated) + closersFor(truncated);
}

function trimTrailingComma(text: string): string {
  return text.replace(/,\s*$/, "");
}

function closersFor(text: string): string {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (const char of text) {
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") stack.push("}");
    else if (char === "[") stack.push("]");
    else if (char === "}" || char === "]") stack.pop();
  }

  return stack.reverse().join("");
}

function logAttempt(fields: Record<string, unknown>): void {
  console.info(JSON.stringify({ event: "food_scan_ai", ...fields }));
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  usageMetadata?: { thoughtsTokenCount?: number; candidatesTokenCount?: number };
}

function parseGeminiResponse(json: GeminiResponse): NutritionResult {
  // Surface prompt-level blocks (e.g. SAFETY)
  if (json.promptFeedback?.blockReason) {
    throw imageRejectedError();
  }

  const candidate = json.candidates?.[0];
  const finishReason = candidate?.finishReason;

  // Truncated by the output-token cap — retry, don't blame the user's photo.
  if (finishReason === "MAX_TOKENS") {
    console.warn(
      `[Gemini] MAX_TOKENS (thoughts=${json.usageMetadata?.thoughtsTokenCount ?? 0}, ` +
      `output=${json.usageMetadata?.candidatesTokenCount ?? 0})`,
    );
  } else if (finishReason && finishReason !== "STOP") {
    // Surface candidate-level blocks (SAFETY, RECITATION, ...)
    throw imageRejectedError();
  }

  // Gemini may split output across multiple parts — join them all, skipping
  // thought summaries which are reasoning traces, not the answer.
  const rawText = (candidate?.content?.parts ?? [])
    .filter((p) => p.thought !== true)
    .map((p) => p.text ?? "")
    .join("");

  if (!rawText.trim()) {
    console.warn(`[Gemini] empty response (finishReason=${finishReason ?? "none"})`);
    throw finishReason === "MAX_TOKENS" ? invalidResponseError() : unavailableError();
  }

  const raw = extractJsonObject(rawText) as {
    foods?: Array<Record<string, unknown>>;
    totals?: Record<string, unknown>;
    commentVi?: unknown;
    comment?: unknown;
  } | null;

  if (!raw) {
    // Log a bounded prefix so a recurring format change is diagnosable from logs.
    console.warn(`[Gemini] unparseable response (len=${rawText.length}): ${rawText.slice(0, 300)}`);
    throw invalidResponseError();
  }

  if (!Array.isArray(raw.foods) || raw.foods.length === 0) {
    throw imageRejectedError();
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

async function requestGeminiModel(
  model: string,
  imageBase64: string,
  apiKey: string,
  timeoutMs: number,
): Promise<NutritionResult> {
  const url = `${GEMINI_BASE}/${model}:generateContent`;
  const body = {
    contents: [{
      parts: [
        { inline_data: { mime_type: "image/jpeg", data: imageBase64 } },
        { text: USER_PROMPT },
      ],
    }],
    generationConfig: {
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.1,
      // Forces raw JSON — no ```json fences, no prose preamble.
      responseMimeType: "application/json",
    },
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    if (err instanceof AiScanError) throw err;
    throw unavailableError();
  }

  if (!response.ok) {
    // Consume the body so the connection can be reused, but never expose or log it.
    await response.text().catch(() => undefined);
    if (RETRYABLE_PROVIDER_STATUSES.has(response.status)) {
      throw unavailableError(response.status);
    }
    if (response.status === 429) {
      throw new AiScanError(
        "Dịch vụ phân tích ảnh đang bận. Vui lòng thử lại sau ít phút.",
        503,
        "AI_PROVIDER_RATE_LIMITED",
        true,
        429,
      );
    }
    if (response.status >= 400 && response.status < 500) {
      // 404 = model retired/unknown, 400 = unsupported request field for this
      // model. Both are model-specific, so mark retryable to let the ladder move
      // on to the next model rather than failing the whole scan.
      throw new AiScanError(
        "Tính năng quét ảnh tạm thời chưa sẵn sàng. Vui lòng thử lại sau.",
        503,
        "AI_PROVIDER_CONFIGURATION_ERROR",
        true,
        response.status,
      );
    }
    throw unavailableError(response.status);
  }

  return parseGeminiResponse(await response.json() as GeminiResponse);
}

export async function analyzeImage(imageBuffer: Buffer): Promise<NutritionResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim() ?? "";
  if (!apiKey) {
    throw new AiScanError(
      "Tính năng quét ảnh chưa được cấu hình. Vui lòng liên hệ hỗ trợ.",
      503,
      "AI_NOT_CONFIGURED",
    );
  }

  const models = getModelLadder();
  if (models.length === 0) {
    throw new AiScanError(
      "Tính năng quét ảnh chưa được cấu hình. Vui lòng liên hệ hỗ trợ.",
      503,
      "AI_NOT_CONFIGURED",
    );
  }

  const imageBase64 = imageBuffer.toString("base64");
  const configuredTimeoutMs = getRequestTimeoutMs();
  const deadline = Date.now() + TOTAL_BUDGET_MS;
  let lastRetryable: AiScanError | undefined;
  let attemptNumber = 0;

  for (const model of models) {
    for (let modelAttempt = 0; modelAttempt < MAX_ATTEMPTS_PER_MODEL; modelAttempt += 1) {
      // Stop rather than start an attempt the mobile client would time out on.
      const remainingMs = deadline - Date.now();
      if (remainingMs < MIN_ATTEMPT_BUDGET_MS) {
        throw lastRetryable ?? unavailableError();
      }

      attemptNumber += 1;
      const startedAt = Date.now();
      try {
        const result = await requestGeminiModel(
          model,
          imageBase64,
          apiKey,
          Math.min(configuredTimeoutMs, remainingMs),
        );
        logAttempt({ model, attempt: attemptNumber, outcome: "success", durationMs: Date.now() - startedAt });
        return result;
      } catch (err) {
        const aiError = err instanceof AiScanError
          ? err
          : unavailableError();
        logAttempt({
          model,
          attempt: attemptNumber,
          outcome: "failure",
          durationMs: Date.now() - startedAt,
          code: aiError.code,
          providerStatus: aiError.providerStatus,
        });

        if (!aiError.retryable) throw aiError;
        lastRetryable = aiError;

        if (SKIP_MODEL_CODES.has(aiError.code)) break;

        if (modelAttempt + 1 < MAX_ATTEMPTS_PER_MODEL) {
          await sleep(getRetryDelayMs(modelAttempt));
        }
      }
    }
  }

  throw lastRetryable ?? unavailableError();
}
