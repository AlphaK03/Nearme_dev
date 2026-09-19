import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';

const originalCwd = process.cwd();
const envKeys = ['OPENAI_API_KEY', 'OPENAI_MODEL', 'AI_MAX_CALLS', 'AI_BUDGET_USD'];
let directory, originalEnv, ai;
let sequence = 0;
const config = { useAi: true, interests: ['culture'], minutes: 180, mode: 'foot', prompt: 'Un paseo tranquilo.' };
const places = [{ id: 'node/1', name: 'Museo', category: 'culture', visitMinutes: 45 }];
const advice = { title: 'Cultura', summary: 'Una visita tranquila.', rankedIds: ['node/1'], excludedIds: [], tips: [] };

beforeEach(async () => {
  originalEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
  Object.assign(process.env, { OPENAI_API_KEY: 'test-only', AI_MAX_CALLS: '30', AI_BUDGET_USD: '0.50' });
  delete process.env.OPENAI_MODEL;
  directory = mkdtempSync(join(tmpdir(), 'nearme-ai-test-'));
  process.chdir(directory);
  ai = await import(`../src/ai.mjs?test=${++sequence}`);
});

afterEach(() => {
  process.chdir(originalCwd);
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
  const target = resolve(directory);
  assert.ok(target.startsWith(resolve(tmpdir()) + sep + 'nearme-ai-test-'));
  rmSync(target, { recursive: true, force: true });
});

function mockProvider(t, status = 200) {
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    requests.push(JSON.parse(options.body));
    return new Response(JSON.stringify({ status: 'completed', usage: { input_tokens: 648, output_tokens: 168 }, output: [{ content: [{ type: 'output_text', text: JSON.stringify(advice) }] }] }), { status });
  });
  return requests;
}

test('upgrading mini to 4.1 changes only the model in the request and separates the cache', async t => {
  const requests = mockProvider(t);
  assert.equal(ai.aiStatus().model, 'gpt-4.1');
  process.env.OPENAI_MODEL = 'gpt-4.1-mini';
  assert.equal((await ai.advise(config, places)).model, 'gpt-4.1-mini');
  delete process.env.OPENAI_MODEL;
  assert.equal((await ai.advise(config, places)).model, 'gpt-4.1');
  assert.equal((await ai.advise(config, places)).cached, true);
  assert.equal(requests.length, 2);
  assert.deepEqual(requests[1], { ...requests[0], model: 'gpt-4.1' });
  assert.equal(requests[1].max_output_tokens, 650);
  assert.equal(requests[1].store, false);
  assert.equal(ai.aiStatus().calls, 2);
  assert.equal(ai.aiStatus().reservedUsd, 0.02);
  assert.equal(ai.aiStatus().maxCalls, 30);
  assert.equal(ai.aiStatus().budgetUsd, 0.5);
});

test('unsupported models do not reserve budget or call the provider', async t => {
  const requests = mockProvider(t);
  process.env.OPENAI_MODEL = 'unapproved-model';
  assert.equal((await ai.advise(config, places)).used, false);
  assert.equal(requests.length, 0);
  assert.equal(ai.aiStatus().calls, 0);
});

test('the existing trial limits still stop paid requests', async t => {
  const requests = mockProvider(t);
  process.env.AI_MAX_CALLS = '0';
  assert.equal((await ai.advise(config, places)).used, false);
  process.env.AI_MAX_CALLS = '30';
  process.env.AI_BUDGET_USD = '0';
  assert.equal((await ai.advise(config, places)).used, false);
  assert.equal(requests.length, 0);
  assert.equal(ai.aiStatus().calls, 0);
});

test('provider failure preserves the local fallback and counts the attempt', async t => {
  const requests = mockProvider(t, 429);
  const result = await ai.advise(config, places);
  assert.equal(result.used, false);
  assert.match(result.reason, /cuota/);
  assert.equal(requests.length, 1);
  assert.equal(ai.aiStatus().calls, 1);
});
