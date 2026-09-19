import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';

const base = 'http://127.0.0.1:18787';
const preview = 'https://nearme-test-8787.use.devtunnels.ms';
let child;
before(async () => {
  child = spawn(process.execPath, ['backend/src/server.mjs'], { env: { ...process.env, HOST: '127.0.0.1', PORT: '18787', OPENAI_API_KEY: '', ALLOWED_ORIGINS: base, PUBLIC_APP_URL: preview }, stdio: 'ignore' });
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(`${base}/api/health`)).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Test API failed to start');
});
after(() => child?.kill());
test('health never exposes the private credential', async () => {
  const res = await fetch(`${base}/api/health`);
  const text = await res.text();
  assert.equal(res.status, 200);
  assert.equal(text.includes('sk-proj-'), false);
  assert.equal(JSON.parse(text).ai.configured, false);
});
test('cross-site requests cannot spend the API budget', async () => {
  const res = await fetch(`${base}/api/plan`, { method: 'POST', headers: { Origin: 'https://untrusted.example', 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(res.status, 403);
});

test('the exact HTTPS preview works with forwarded or preserved Host headers', async () => {
  for (const host of ['127.0.0.1:18787', new URL(preview).host]) {
    const res = await fetch(`${base}/api/health`, { headers: { Origin: preview, Host: host, 'Sec-Fetch-Site': 'same-origin' } });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), preview);
  }
  const post = await fetch(`${base}/api/plan`, { method: 'POST', headers: { Origin: preview, 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(post.status, 400); // Reaches validation instead of failing origin checks.
});

test('other tunnels and forged forwarding headers cannot bypass origin checks', async () => {
  for (const origin of ['https://other-8787.use.devtunnels.ms', `${preview}.untrusted.example`]) {
    const res = await fetch(`${base}/api/health`, { headers: { Origin: origin, 'X-Forwarded-Host': new URL(preview).host, 'X-Forwarded-Proto': 'https' } });
    assert.equal(res.status, 403);
  }
});
test('invalid parameters fail before external providers are called', async () => {
  const res = await fetch(`${base}/api/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ minutes: -50, origin: {lat:1000,lng:0} }) });
  assert.equal(res.status, 400);
});
test('body size and content type are constrained', async () => {
  const text = await fetch(`${base}/api/plan`, { method: 'POST', body: '{}' });
  assert.equal(text.status, 415);
  const huge = await fetch(`${base}/api/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: 'x'.repeat(17000) }) });
  assert.equal(huge.status, 413);
});
test('server files and environment files cannot be fetched', async () => {
  for (const path of ['/backend/.env','/.env','/backend/src/ai.mjs','/%2e%2e%2fbackend%2f.env']) {
    const result = await fetch(base + path);
    assert.ok([403,404].includes(result.status));
    assert.equal((await result.text()).includes('sk-proj-'), false);
  }
});
test('no API credentials are bundled in the public source', () => {
  const code = readFileSync('web/src/App.jsx', 'utf8') + readFileSync('web/src/lib.js', 'utf8');
  assert.equal(/sk-(?:proj-)?[a-zA-Z0-9_-]{20}/.test(code), false);
});
