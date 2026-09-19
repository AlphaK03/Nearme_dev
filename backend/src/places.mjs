import { randomUUID } from 'node:crypto';
import { AppError, Cache, fetchJson, kmBetween } from './core.mjs';

const searches = new Cache(2 * 60 * 60_000);
const nearbyCache = new Cache(15 * 60_000);
const geocodes = new Cache(24 * 60 * 60_000);
let nextGeocode = 0;
let geocodeQueue = Promise.resolve();

export function getSearch(id) {
  const result = searches.get(id);
  if (!result) throw new AppError('La búsqueda expiró. Actualiza los lugares antes de crear la ruta.', 410);
  return result;
}
export function normalizePlace(item, origin) {
  const tags = item.tags || {};
  const lat = item.lat ?? item.center?.lat;
  const lng = item.lon ?? item.center?.lon;
  if (!tags.name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (['private', 'no', 'customers'].includes(tags.access) || tags.disused === 'yes' || tags.abandoned === 'yes') return null;
  let category = 'culture';
  if (['restaurant', 'cafe', 'fast_food', 'food_court'].includes(tags.amenity)) category = 'food';
  else if (['park', 'garden', 'nature_reserve'].includes(tags.leisure)) category = 'nature';
  else if (tags.historic) category = 'history';
  else if (tags.shop || tags.amenity === 'marketplace') category = 'shopping';
  else if (tags.tourism === 'gallery' || tags.amenity === 'theatre' || tags.tourism === 'artwork') category = 'art';
  const duration = { food: 35, culture: 45, nature: 30, history: 20, shopping: 30, art: 35 }[category];
  return {
    id: `${item.type}/${item.id}`, name: tags.name.slice(0, 100), lat, lng, category,
    distanceKm: Math.round(kmBetween(origin, { lat, lng }) * 100) / 100,
    visitMinutes: duration,
    openingHours: tags.opening_hours?.slice(0, 150) || null,
    wheelchair: tags.wheelchair || 'unknown',
    address: [tags['addr:street'], tags['addr:housenumber'], tags['addr:city']].filter(Boolean).join(', '),
    website: /^https?:\/\//.test(tags.website || '') ? tags.website : null,
    osmUrl: `https://www.openstreetmap.org/${item.type}/${item.id}`,
    fee: tags.fee === 'no' ? 'Sin entrada según OSM' : 'Precio por confirmar',
  };
}
export async function nearby({ origin, radiusKm }) {
  const key = `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}:${radiusKm}`;
  const cached = nearbyCache.get(key);
  if (cached && searches.get(cached.searchId)) return { ...cached, cached: true };
  const around = `(around:${Math.round(radiusKm * 1000)},${origin.lat},${origin.lng})`;
  const query = `[out:json][timeout:22];(nwr${around}["tourism"~"^(museum|gallery|attraction|artwork)$"]["name"];nwr${around}["leisure"~"^(park|garden)$"]["name"];nwr${around}["amenity"~"^(cafe|restaurant|theatre|marketplace)$"]["name"];nwr${around}["historic"~"^(monument|memorial|building)$"]["name"];);out center tags 160;`;
  let data;
  for (const endpoint of ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']) {
    try {
      data = await fetchJson(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ data: query }) }, 28_000);
      if (data.remark || !Array.isArray(data.elements)) throw new Error('Incomplete OSM response');
      break;
    } catch { data = null; }
  }
  if (!data) throw new AppError('No pudimos consultar los lugares de OpenStreetMap. Conservamos tu plan; vuelve a intentar.', 503);
  const unique = new Map();
  for (const item of data.elements) {
    const place = normalizePlace(item, origin);
    if (!place || place.distanceKm > radiusKm) continue;
    const duplicate = [...unique.values()].some(other => other.name.toLowerCase() === place.name.toLowerCase() && kmBetween(other, place) < 0.1);
    if (!duplicate) unique.set(place.id, place);
  }
  const places = [...unique.values()].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 80);
  const result = { searchId: randomUUID(), places, origin, radiusKm, fetchedAt: new Date().toISOString(), source: 'OpenStreetMap', cached: false };
  searches.set(result.searchId, result);
  return nearbyCache.set(key, result);
}
export async function geocode(query) {
  if (typeof query !== 'string' || query.trim().length < 3 || query.length > 150) throw new AppError('Escribe una dirección de 3 a 150 caracteres.');
  const cached = geocodes.get(query);
  if (cached) return cached;
  // Nominatim permits one request per second, and no client-side autocomplete.
  const operation = geocodeQueue.then(async () => {
    await new Promise(resolve => setTimeout(resolve, Math.max(0, nextGeocode - Date.now())));
    nextGeocode = Date.now() + 1100;
    const data = await fetchJson(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}&accept-language=es`);
    return geocodes.set(query, data.map(item => ({ label: item.display_name, lat: Number(item.lat), lng: Number(item.lon) })));
  });
  geocodeQueue = operation.catch(() => {});
  return operation;
}
