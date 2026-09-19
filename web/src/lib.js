export const categories = [
  { id: 'food', label: 'Gastronomía', icon: 'Coffee', tone: 'peach', detail: 'Cafés y sabores locales' },
  { id: 'nature', label: 'Naturaleza', icon: 'Trees', tone: 'mint', detail: 'Parques y aire libre' },
  { id: 'culture', label: 'Cultura', icon: 'Landmark', tone: 'sand', detail: 'Museos y patrimonio' },
  { id: 'history', label: 'Historia', icon: 'Hourglass', tone: 'rose', detail: 'Lugares con historias' },
  { id: 'art', label: 'Arte', icon: 'Palette', tone: 'lavender', detail: 'Galerías y teatros' },
  { id: 'shopping', label: 'Compras', icon: 'ShoppingBag', tone: 'blue', detail: 'Mercados y diseño' },
];
export const defaultOrigin = { lat: 9.9332, lng: -84.0779, label: 'Centro de San José' };
export function nextDeparture() {
  const date = new Date(); date.setSeconds(0, 0);
  if (date.getHours() >= 16) { date.setDate(date.getDate() + 1); date.setHours(9, 0); }
  else if (date.getHours() < 7) date.setHours(9, 0);
  else date.setMinutes(date.getMinutes() + 10);
  return localDate(date);
}
export function localDate(date) { return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); }
export const defaults = { interests: ['food', 'nature', 'culture'], minutes: 180, maxDistanceKm: 5, radiusKm: 3, mode: 'foot', roundTrip: false, daylightOnly: true, useAi: true, prompt: '' };
export function load(key, fallback) { try { const value = JSON.parse(localStorage.getItem(`nearme:${key}`)); return value ?? fallback; } catch { return fallback; } }
export function persist(key, value) { try { localStorage.setItem(`nearme:${key}`, JSON.stringify(value)); return true; } catch { return false; } }
export async function api(path, body, signal) {
  const response = await fetch(`/api/${path}`, { method: body ? 'POST' : 'GET', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, signal });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'No pudimos conectar con el servidor. Vuelve a intentar.');
  return data;
}
export function duration(minutes) { const m = Math.round(minutes); return m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`; }
export function distance(meters) { return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`; }
export function time(iso) { return new Date(iso).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }); }
export function directionsUrl(origin, stop, mode = 'foot') {
  const query = new URLSearchParams({ api: '1', origin: `${origin.lat},${origin.lng}`, destination: `${stop.lat},${stop.lng}`, travelmode: { foot: 'walking', bike: 'bicycling', car: 'driving' }[mode] });
  return `https://www.google.com/maps/dir/?${query}`;
}
export function exportGpx(plan) {
  const escape = value => String(value).replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));
  const points = plan.geometry.coordinates.map(([lon, lat]) => `<trkpt lat="${lat}" lon="${lon}"/>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="NearMe" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>${escape(plan.title)}</name><trkseg>${points}</trkseg></trk></gpx>`;
  const url = URL.createObjectURL(new Blob([xml], { type: 'application/gpx+xml' }));
  const a = document.createElement('a'); a.href = url; a.download = 'nearme-ruta.gpx'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
