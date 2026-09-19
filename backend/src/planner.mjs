import SunCalc from 'suncalc';
import { AppError, kmBetween } from './core.mjs';
import { getSearch } from './places.mjs';
import { matrix, route } from './routing.mjs';
import { advise } from './ai.mjs';
import { optimize } from './optimizer.mjs';
import { randomUUID } from 'node:crypto';

export async function createPlan(config) {
  const search = getSearch(config.searchId);
  if (kmBetween(search.origin, config.origin) > 15) throw new AppError('Actualiza los lugares alrededor del nuevo punto de partida.');
  if (config.placeIds.some(id => !search.places.some(p => p.id === id))) throw new AppError('Una parada no pertenece a esta búsqueda.');
  let candidates = config.placeIds.length
    ? search.places.filter(p => config.placeIds.includes(p.id))
    : search.places.filter(p => config.interests.includes(p.category));
  // Round-robin categories avoids filling the compact candidate list with only nearby cafés.
  if (!config.placeIds.length) {
    const groups = config.interests.map(c => candidates.filter(p => p.category === c));
    candidates = [];
    while (groups.some(g => g.length) && candidates.length < 10) for (const group of groups) if (group.length && candidates.length < 10) candidates.push(group.shift());
  }
  candidates = candidates.slice(0, 10);
  if (!candidates.length) throw new AppError('No hay lugares compatibles. Amplía el radio o elige otros intereses.', 422);
  let minutes = config.minutes;
  const start = new Date(config.startAt);
  if (Math.abs(start.getTime() - Date.now()) > 31 * 86400_000) throw new AppError('Elige una fecha dentro de los próximos 30 días.');
  if (config.daylightOnly) {
    const { sunrise, sunset } = SunCalc.getTimes(start, config.origin.lat, config.origin.lng);
    if (!Number.isFinite(sunrise.getTime()) || !Number.isFinite(sunset.getTime())) throw new AppError('No se pudo verificar la luz diurna para esa ubicación.', 422);
    if (start < sunrise || start >= sunset) throw new AppError('Tu hora de salida está fuera de la luz diurna estimada. Cambia la hora o desactiva «Solo con luz de día».', 422);
    minutes = Math.min(minutes, Math.floor((sunset - start) / 60_000));
  }
  const advice = await advise(config, candidates);
  if (advice.used) candidates = candidates.filter(p => !advice.excludedIds.includes(p.id));
  if (!candidates.length) throw new AppError('Los lugares encontrados no cumplen tus preferencias. Cambia tu búsqueda.', 422);
  const table = await matrix([config.origin, ...candidates], config.mode);
  let stops = optimize({ places: candidates, durations: table.durations, distances: table.distances, minutes, maxMeters: config.maxDistanceKm * 1000, roundTrip: config.roundTrip, ranks: advice.used ? advice.rankedIds : [] });
  if (!stops.length) throw new AppError('No cabe ninguna visita con los límites actuales. Aumenta el tiempo o la distancia total.', 422);
  const points = [config.origin, ...stops, ...(config.roundTrip ? [config.origin] : [])];
  const path = await route(points, config.mode);
  const visitMinutes = stops.reduce((sum, place) => sum + place.visitMinutes, 0);
  const travelMinutes = Math.ceil(path.seconds / 60);
  const bufferMinutes = Math.ceil(path.seconds / 60 * 0.1);
  const totalMinutes = visitMinutes + travelMinutes + bufferMinutes;
  if (totalMinutes > minutes || path.meters > config.maxDistanceKm * 1000) throw new AppError('El trayecto final excede el límite. Amplía unos minutos o reduce las paradas.', 422);
  let elapsed = 0;
  stops = stops.map((place, index) => {
    const leg = path.legs[index];
    elapsed += leg.seconds / 60 * 1.1;
    const arrival = new Date(start.getTime() + elapsed * 60_000).toISOString();
    elapsed += place.visitMinutes;
    return { ...place, arrival, departure: new Date(start.getTime() + elapsed * 60_000).toISOString(), travelMinutes: Math.ceil(leg.seconds / 60), travelMeters: Math.round(leg.meters) };
  });
  return {
    id: randomUUID(), createdAt: new Date().toISOString(), config,
    title: advice.used ? advice.title : 'Tu próximo recorrido',
    summary: advice.used ? advice.summary : 'Paradas organizadas según tus intereses y los trayectos disponibles.',
    advice, stops, geometry: path.geometry, legs: path.legs,
    meters: Math.round(path.meters), totalMinutes, travelMinutes, visitMinutes, bufferMinutes,
    endAt: new Date(start.getTime() + totalMinutes * 60_000).toISOString(),
    omitted: candidates.filter(p => !stops.some(s => s.id === p.id)).map(p => p.name),
    warnings: [
      'Horarios, entradas y acceso deben confirmarse con cada lugar. Las visitas son estimaciones.',
      'La ruta usa caminos registrados en OpenStreetMap; no verifica seguridad del barrio, cierres ni condiciones en tiempo real.',
      ...(config.daylightOnly ? ['El plan termina antes del atardecer estimado.'] : []),
      ...(config.mode === 'car' ? ['No incluye tiempo de parqueo ni tráfico en tiempo real.'] : []),
    ],
    routingSource: 'OSRM / OpenStreetMap',
  };
}
