// Unit tests for the Gemini food-scan parsing/fallback logic.
// fetch is stubbed — these tests NEVER call the real Gemini API.
process.env.GEMINI_API_KEY = 'test-key';
process.env.GEMINI_PRIMARY_MODEL = 'model-primary';
process.env.GEMINI_FALLBACK_MODEL = 'model-fallback';
process.env.GEMINI_REQUEST_TIMEOUT_MS = '1000';
process.env.GEMINI_RETRY_DELAY_MS = '0';

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeImage, AiScanError } from './ai-food.service';

const realFetch = globalThis.fetch;
const IMAGE = Buffer.from('fake-jpeg');

interface StubResponse {
  status?: number;
  body?: unknown;
}

/** Queue one stub response per HTTP call, in order. Extra calls reuse the last. */
function stubFetch(responses: StubResponse[]): { calls: Array<Record<string, unknown>> } {
  const calls: Array<Record<string, unknown>> = [];
  let index = 0;

  globalThis.fetch = (async (url: string, init: { body: string }) => {
    const stub = responses[Math.min(index, responses.length - 1)];
    index += 1;
    calls.push({ url, body: JSON.parse(init.body) as unknown });
    const status = stub.status ?? 200;
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => stub.body,
      text: async () => JSON.stringify(stub.body),
    };
  }) as unknown as typeof fetch;

  return { calls };
}

function geminiText(text: string, finishReason = 'STOP', usageMetadata?: unknown) {
  return {
    candidates: [{ content: { parts: [{ text }] }, finishReason }],
    usageMetadata,
  };
}

const VALID_JSON = JSON.stringify({
  foods: [{
    name: 'Phở bò',
    weightG: 400,
    calories: 450,
    protein: 25,
    carbs: 60,
    fat: 10,
    fiber: 2,
    sugar: 3,
    vitamins: { vitaminC: 5 },
    minerals: { sodium: 900 },
    tags: ['món nước'],
  }],
  totals: { calories: 450, protein: 25, carbs: 60, fat: 10 },
  commentVi: 'Món này khá cân bằng.',
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

// ---------------------------------------------------------------------------
// Request shape — the root cause of the "Không đọc được kết quả" regression was
// a 1200-token cap that thinking models spent entirely on reasoning.
// ---------------------------------------------------------------------------
test('request reserves enough output tokens for thinking models and asks for JSON', async () => {
  const { calls } = stubFetch([{ body: geminiText(VALID_JSON) }]);
  await analyzeImage(IMAGE);

  const config = (calls[0].body as { generationConfig: Record<string, unknown> }).generationConfig;
  assert.ok(
    (config.maxOutputTokens as number) >= 4096,
    'maxOutputTokens must cover reasoning tokens plus the JSON answer',
  );
  assert.equal(config.responseMimeType, 'application/json');
});

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------
test('parses a clean JSON response', async () => {
  stubFetch([{ body: geminiText(VALID_JSON) }]);
  const result = await analyzeImage(IMAGE);

  assert.equal(result.foods.length, 1);
  assert.equal(result.foods[0].name, 'Phở bò');
  assert.equal(result.totals.calories, 450);
  assert.equal(result.aiProvider, 'gemini');
  assert.equal(result.commentVi, 'Món này khá cân bằng.');
});

test('parses JSON wrapped in a markdown fence', async () => {
  stubFetch([{ body: geminiText('```json\n' + VALID_JSON + '\n```') }]);
  const result = await analyzeImage(IMAGE);

  assert.equal(result.foods[0].name, 'Phở bò');
});

test('repairs JSON truncated by MAX_TOKENS instead of failing the scan', async () => {
  // Cut mid-way through the second food — what a too-small token budget produces.
  const truncated = `{"foods":[{"name":"Cơm trắng","calories":200,"protein":4,"carbs":44,"fat":0},{"name":"Thịt kho","calor`;
  stubFetch([{
    body: geminiText(truncated, 'MAX_TOKENS', { thoughtsTokenCount: 1150, candidatesTokenCount: 46 }),
  }]);

  const result = await analyzeImage(IMAGE);

  assert.equal(result.foods.length, 1);
  assert.equal(result.foods[0].name, 'Cơm trắng');
  assert.equal(result.totals.calories, 200, 'totals fall back to the sum of parsed foods');
  assert.ok(result.commentVi.length > 0, 'a Vietnamese comment is always present');
});

test('unparseable text falls through to the next model rather than erroring out', async () => {
  stubFetch([
    { body: geminiText('Xin lỗi, tôi không thể phân tích ảnh này.') },
    { body: geminiText(VALID_JSON) },
  ]);

  const result = await analyzeImage(IMAGE);
  assert.equal(result.foods[0].name, 'Phở bò');
});

test('unparseable text from every model surfaces AI_INVALID_RESPONSE', async () => {
  stubFetch([{ body: geminiText('không phải JSON') }]);

  await assert.rejects(
    analyzeImage(IMAGE),
    (err: AiScanError) => err.code === 'AI_INVALID_RESPONSE' && err.statusCode === 422,
  );
});

// ---------------------------------------------------------------------------
// Model ladder
// ---------------------------------------------------------------------------
test('a retired model (404) is skipped without retrying it', async () => {
  const { calls } = stubFetch([
    { status: 404, body: { error: { message: 'no longer available' } } },
    { body: geminiText(VALID_JSON) },
  ]);

  const result = await analyzeImage(IMAGE);

  assert.equal(result.foods[0].name, 'Phở bò');
  assert.equal(calls.length, 2, '404 must not be retried against the same model');
  assert.ok((calls[0].url as string).includes('model-primary'));
  assert.ok((calls[1].url as string).includes('model-fallback'));
});

test('a quota-exhausted model (429) is skipped without retrying it', async () => {
  const { calls } = stubFetch([
    { status: 429, body: { error: { message: 'quota exceeded' } } },
    { body: geminiText(VALID_JSON) },
  ]);

  await analyzeImage(IMAGE);
  assert.equal(calls.length, 2);
});

test('falls back to built-in models when every configured model is dead', async () => {
  const { calls } = stubFetch([
    { status: 404, body: {} },
    { status: 404, body: {} },
    { body: geminiText(VALID_JSON) },
  ]);

  const result = await analyzeImage(IMAGE);

  assert.equal(result.foods[0].name, 'Phở bò');
  const thirdUrl = calls[2].url as string;
  assert.ok(
    !thirdUrl.includes('model-primary') && !thirdUrl.includes('model-fallback'),
    'third attempt must use a built-in default model',
  );
});

test('a transient 503 is retried against the same model', async () => {
  const { calls } = stubFetch([
    { status: 503, body: {} },
    { body: geminiText(VALID_JSON) },
  ]);

  await analyzeImage(IMAGE);
  assert.ok((calls[0].url as string).includes('model-primary'));
  assert.ok((calls[1].url as string).includes('model-primary'));
});

// ---------------------------------------------------------------------------
// Blocked / empty responses
// ---------------------------------------------------------------------------
test('a safety-blocked prompt is reported as a rejected image, not retried', async () => {
  const { calls } = stubFetch([{ body: { promptFeedback: { blockReason: 'SAFETY' } } }]);

  await assert.rejects(
    analyzeImage(IMAGE),
    (err: AiScanError) => err.code === 'AI_IMAGE_REJECTED' && err.statusCode === 422,
  );
  assert.equal(calls.length, 1);
});

test('an empty foods array is reported as a rejected image', async () => {
  stubFetch([{ body: geminiText('{"foods":[],"totals":{"calories":0}}') }]);

  await assert.rejects(
    analyzeImage(IMAGE),
    (err: AiScanError) => err.code === 'AI_IMAGE_REJECTED',
  );
});

test('a missing API key is reported as unconfigured', async () => {
  const saved = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    await assert.rejects(
      analyzeImage(IMAGE),
      (err: AiScanError) => err.code === 'AI_NOT_CONFIGURED',
    );
  } finally {
    process.env.GEMINI_API_KEY = saved;
  }
});
