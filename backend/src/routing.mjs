import { AppError, Cache, fetchJson } from './core.mjs';

const cache = new Cache(30 * 60_000);
let queue = Promise.resolve();
let nextRequest = 0;
const roots = { foot: 'routed-foot', bike: 'routed-bike', car: 'routed-car' };

async function request(service, points, mode, query) {
  const coordinates = points.map(p => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(';');
  const key = `${mode}/${service}/${coordinates}?${query}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const job = queue.then(async () => {
    await new Promise(resolve => setTimeout(resolve, Math.max(0, nextRequest - Date.now())));
    nextRequest = Date.now() + 1100;
    const data = await fetchJson(`https://routing.openstreetmap.de/${roots[mode]}/${service}/v1/driving/${coordinates}?${query}`, {}, 25_000);
    if (data.code !== 'Ok') throw new AppError('No hay una conexión transitable entre estas paradas para el transporte seleccionado.', 422);
    return cache.set(key, data);
  });
  queue = job.catch(() => {});
  return job;
}
export async function matrix(points, mode) {
  const result = await request('table', points, mode, 'annotations=duration,distance');
  if (!result.durations || !result.distances) throw new AppError('No se pudieron verificar distancias y tiempos.', 503);
  return result;
}
export async function route(points, mode) {
  const result = await request('route', points, mode, 'overview=full&geometries=geojson&steps=true');
  if (result.waypoints?.some(point => point.distance > 150)) throw new AppError('Una parada está demasiado lejos de un camino registrado. Prueba con otra.', 422);
  const item = result.routes?.[0];
  if (!item) throw new AppError('El servicio no pudo trazar la ruta.', 503);
  return { geometry: item.geometry, meters: item.distance, seconds: item.duration, legs: item.legs.map(leg => ({
    meters: leg.distance, seconds: leg.duration,
    steps: leg.steps.map(step => ({ name: step.name || '', meters: step.distance, type: step.maneuver.type, modifier: step.maneuver.modifier || '', location: step.maneuver.location })),
  })) };
}
