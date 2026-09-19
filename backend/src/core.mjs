import { z } from 'zod';

export class AppError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export class Cache {
  constructor(ttl = 600_000, limit = 150) { this.ttl = ttl; this.limit = limit; this.items = new Map(); }
  get(key) {
    const item = this.items.get(key);
    if (!item || item.expires < Date.now()) { this.items.delete(key); return undefined; }
    return item.value;
  }
  set(key, value) {
    if (this.items.size >= this.limit) this.items.delete(this.items.keys().next().value);
    this.items.set(key, { value, expires: Date.now() + this.ttl });
    return value;
  }
}
export const coordinate = z.object({ lat: z.number().finite().min(-85).max(85), lng: z.number().finite().min(-180).max(180) });
export const categories = ['culture', 'food', 'nature', 'history', 'shopping', 'art'];
export const searchSchema = z.object({
  origin: coordinate,
  radiusKm: z.number().min(0.5).max(10).default(3),
});
export const planSchema = z.object({
  searchId: z.string().max(80),
  origin: coordinate,
  placeIds: z.array(z.string().max(80)).max(10).default([]),
  interests: z.array(z.enum(categories)).min(1).max(6),
  minutes: z.number().int().min(15).max(480),
  maxDistanceKm: z.number().min(0.5).max(30),
  mode: z.enum(['foot', 'bike', 'car']).default('foot'),
  roundTrip: z.boolean().default(false),
  daylightOnly: z.boolean().default(true),
  startAt: z.string().datetime({ offset: true }),
  useAi: z.boolean().default(false),
  prompt: z.string().max(400).default(''),
});
export function kmBetween(a, b) {
  const rad = value => value * Math.PI / 180;
  const x = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
export async function fetchJson(url, options = {}, timeout = 20_000) {
  const response = await fetch(url, {
    ...options,
    headers: { 'User-Agent': 'NearMeAcademic/1.0 (local university route planner)', ...options.headers },
    signal: AbortSignal.timeout(timeout),
  });
  if (!response.ok) throw new AppError('El proveedor no respondió. Intenta de nuevo en un momento.', 502);
  return response.json();
}
