// Explicit live integration smoke test. At most one paid OpenAI call (the repeat is cached).
const base = 'http://127.0.0.1:8787';
async function request(path, data) {
  const res = await fetch(base + path, { method: data ? 'POST' : 'GET', headers: data ? { 'Content-Type': 'application/json' } : {}, body: data ? JSON.stringify(data) : undefined });
  const value = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${value.error}`);
  return value;
}
const places = await request('/api/places', { origin: { lat: 9.9332, lng: -84.0779 }, radiusKm: 3 });
const date = new Date(); date.setUTCDate(date.getUTCDate() + 1); date.setUTCHours(15, 0, 0, 0);
const config = { searchId: places.searchId, origin: places.origin, interests: ['food','culture','nature'], minutes: 180, maxDistanceKm: 5, mode: 'foot', roundTrip: true, daylightOnly: true, startAt: date.toISOString(), useAi: true, prompt: 'Un café y cultura; un recorrido tranquilo y variado.' };
const before = await request('/api/health');
const plan = await request('/api/plan', config);
const repeat = await request('/api/plan', config);
const after = await request('/api/health');
if (!plan.geometry?.coordinates.length || !plan.stops.length || plan.totalMinutes > 180 || plan.meters > 5000) throw new Error('Invalid real route');
if (plan.advice.used && (!repeat.advice.cached || after.ai.calls !== before.ai.calls + 1)) throw new Error('AI cache did not prevent second charge');
console.log(JSON.stringify({ livePlaces: places.places.length, stops: plan.stops.map(p => p.name), minutes: plan.totalMinutes, meters: plan.meters, geometryPoints: plan.geometry.coordinates.length, aiUsed: plan.advice.used, aiReason: plan.advice.reason, cacheHit: repeat.advice.cached, callsConsumed: after.ai.calls - before.ai.calls, inputTokens: after.ai.inputTokens - before.ai.inputTokens, outputTokens: after.ai.outputTokens - before.ai.outputTokens }, null, 2));
