const radians = Math.PI / 180;
const earthRadius = 6371000;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const validPoint = point => Number.isFinite(point?.lat) && Number.isFinite(point?.lng) && Math.abs(point.lat) <= 90 && Math.abs(point.lng) <= 180;

export function metersBetween(a, b) {
  const lat = (b.lat - a.lat) * radians;
  const lng = (b.lng - a.lng) * radians;
  const value = Math.sin(lat / 2) ** 2 + Math.cos(a.lat * radians) * Math.cos(b.lat * radians) * Math.sin(lng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(clamp(value, 0, 1)));
}

export function bearing(a, b) {
  const delta = (b.lng - a.lng) * radians;
  const y = Math.sin(delta) * Math.cos(b.lat * radians);
  const x = Math.cos(a.lat * radians) * Math.sin(b.lat * radians) - Math.sin(a.lat * radians) * Math.cos(b.lat * radians) * Math.cos(delta);
  return (Math.atan2(y, x) / radians + 360) % 360;
}

export function pointAt(track, meters) {
  const along = clamp(meters, 0, track.total);
  let low = 0, high = track.points.length - 1;
  while (low + 1 < high) {
    const middle = (low + high) >> 1;
    if (track.distances[middle] <= along) low = middle; else high = middle;
  }
  const a = track.points[low], b = track.points[high];
  const ratio = (along - track.distances[low]) / (track.distances[high] - track.distances[low] || 1);
  return { lat: a.lat + (b.lat - a.lat) * ratio, lng: a.lng + (b.lng - a.lng) * ratio, heading: bearing(a, b), along };
}

export function projectOnTrack(track, point, start = 0, end = track.total, expected = start) {
  let best = null;
  const scale = Math.cos(point.lat * radians);
  for (let i = 1; i < track.points.length; i++) {
    const from = track.distances[i - 1], to = track.distances[i];
    if (to < start || from > end) continue;
    const a = track.points[i - 1], b = track.points[i];
    const x = (b.lng - a.lng) * scale, y = b.lat - a.lat;
    const px = (point.lng - a.lng) * scale, py = point.lat - a.lat;
    const t = clamp((px * x + py * y) / (x * x + y * y || 1), 0, 1);
    const along = clamp(from + t * (to - from), start, end);
    const fraction = (along - from) / (to - from || 1);
    const projected = { lat: a.lat + (b.lat - a.lat) * fraction, lng: a.lng + (b.lng - a.lng) * fraction, heading: bearing(a, b), along };
    const gap = metersBetween(point, projected);
    // Resolve repeated intersections near the expected leg, without preferring a distant road.
    const score = gap + Math.min(10, Math.abs(along - expected) * 0.002);
    if (!best || score < best.score) best = { ...projected, gap, score };
  }
  return best;
}

export function buildTrack(plan) {
  const coordinates = plan?.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  const points = [], distances = [];
  for (const coordinate of coordinates) {
    if (!Array.isArray(coordinate)) return null;
    const point = { lng: coordinate[0], lat: coordinate[1] };
    if (!validPoint(point)) return null;
    const last = points.at(-1);
    const length = last ? metersBetween(last, point) : 0;
    if (last && length < 0.01) continue;
    points.push(point); distances.push((distances.at(-1) || 0) + length);
  }
  if (points.length < 2) return null;
  const track = { points, distances, total: distances.at(-1), segments: [] };
  const destinations = [...(plan.stops || [])];
  if (plan.config?.roundTrip) destinations.push({ ...plan.config.origin, id: 'return-to-origin', name: 'Punto de partida', returning: true });
  const legs = plan.legs || [];
  const legTotal = legs.reduce((sum, leg) => sum + (leg.meters || 0), 0);
  let start = 0, traveled = 0;
  destinations.forEach((stop, i) => {
    if (!validPoint(stop)) return;
    traveled += legs[i]?.meters || 0;
    const expected = legTotal ? traveled / legTotal * track.total : start;
    const arrival = legs[i]?.steps?.at(-1)?.location;
    const target = arrival ? { lng: arrival[0], lat: arrival[1] } : stop;
    const end = i === destinations.length - 1 ? track.total : projectOnTrack(track, validPoint(target) ? target : stop, start, track.total, expected)?.along ?? start;
    track.segments.push({ start, end, stop, index: i, meters: end - start });
    start = end;
  });
  return track.segments.length ? track : null;
}

export function segmentPoints(track, segment) {
  const points = [pointAt(track, segment.start)];
  track.points.forEach((point, i) => { if (track.distances[i] > segment.start && track.distances[i] < segment.end) points.push(point); });
  points.push(pointAt(track, segment.end));
  return points;
}

export function matchPosition(track, segment, coords, expected = segment.start) {
  const point = { lat: coords?.latitude, lng: coords?.longitude };
  if (!validPoint(point) || !Number.isFinite(coords.accuracy) || coords.accuracy < 0) return { status: 'invalid' };
  if (coords.accuracy > 65) return { status: 'inaccurate', accuracy: coords.accuracy };
  const match = projectOnTrack(track, point, segment.start, segment.end, expected);
  const onRoute = match && match.gap <= clamp(coords.accuracy, 12, 30);
  return {
    point: onRoute ? match : point,
    along: match?.along ?? segment.start,
    heading: Number.isFinite(coords.heading) ? coords.heading : onRoute ? match.heading : 0,
    accuracy: coords.accuracy,
    status: onRoute ? 'on-route' : 'off-route',
    remaining: onRoute ? Math.max(0, segment.end - match.along) : null,
  };
}
