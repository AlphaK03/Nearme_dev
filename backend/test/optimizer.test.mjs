import test from 'node:test';
import assert from 'node:assert/strict';
import { optimize } from '../src/optimizer.mjs';
import { planSchema, kmBetween } from '../src/core.mjs';
import { normalizePlace } from '../src/places.mjs';
import { validateAdvice } from '../src/ai.mjs';

const places = [{ id: 'a', visitMinutes: 30 }, { id: 'b', visitMinutes: 30 }, { id: 'c', visitMinutes: 30 }];
const durations = [[0,300,900,1500],[300,0,300,900],[900,300,0,300],[1500,900,300,0]];
const distances = durations.map(row => row.map(t => t * 1.2));
test('orders stops over the actual network and includes transfer buffers', () => {
  const result = optimize({ places, durations, distances, minutes: 110, maxMeters: 5000, roundTrip: false });
  assert.deepEqual(result.map(p => p.id), ['a', 'b', 'c']);
});
test('return leg counts toward time and distance', () => {
  const outbound = optimize({ places, durations, distances, minutes: 110, maxMeters: 2500, roundTrip: false });
  const circular = optimize({ places, durations, distances, minutes: 110, maxMeters: 2500, roundTrip: true });
  assert.equal(outbound.length, 3);
  assert.equal(circular.length, 2);
});
test('cannot create infeasible or unreachable tours', () => {
  assert.deepEqual(optimize({ places, durations, distances, minutes: 10, maxMeters: 300, roundTrip: false }), []);
  assert.deepEqual(optimize({ places: [places[0]], durations: [[0,null],[null,0]], distances: [[0,null],[null,0]], minutes: 120, maxMeters: 5000, roundTrip: false }), []);
});
test('all randomly generated plans satisfy travel and visit budgets', () => {
  for (let minutes = 20; minutes <= 180; minutes += 7) {
    for (const roundTrip of [true, false]) {
      const result = optimize({ places, durations, distances, minutes, maxMeters: 2500, roundTrip });
      let seconds = 0, meters = 0, last = 0;
      for (const p of result) { const next = places.indexOf(p) + 1; seconds += durations[last][next] * 1.1 + p.visitMinutes * 60; meters += distances[last][next]; last = next; }
      if (roundTrip) { seconds += durations[last][0] * 1.1; meters += distances[last][0]; }
      assert.ok(seconds <= minutes * 60); assert.ok(meters <= 2500); assert.equal(new Set(result).size, result.length);
    }
  }
});
test('rejects malformed coordinates, oversized prompts and unsupported profiles', () => {
  assert.equal(planSchema.safeParse({ origin: { lat: 95, lng: 1 }, prompt: 'x'.repeat(401), mode: 'flying' }).success, false);
  assert.ok(kmBetween({lat:9.933,lng:-84.078},{lat:9.933,lng:-84.072}) < 1);
});
test('private and abandoned places are never candidates', () => {
  const item = { id: 1, type: 'node', lat: 9.933, lon: -84.078, tags: { name: 'Private garden', leisure: 'garden', access: 'private' } };
  assert.equal(normalizePlace(item, {lat:9.93,lng:-84.08}), null);
  item.tags.access = 'yes';
  assert.equal(normalizePlace(item, {lat:9.93,lng:-84.08}).category, 'nature');
});
test('AI cannot invent IDs, repeat IDs or return unvalidated extra fields', () => {
  const valid = { title: 'Un paseo', summary: 'Cultura y café', rankedIds: ['a'], excludedIds: [], tips: [] };
  assert.equal(validateAdvice(valid, ['a']).title, 'Un paseo');
  assert.throws(() => validateAdvice({ ...valid, rankedIds: ['invented'] }, ['a']));
  assert.throws(() => validateAdvice({ ...valid, rankedIds: ['a','a'] }, ['a']));
  assert.throws(() => validateAdvice({ ...valid, secret: 'ignored?' }, ['a']));
});
