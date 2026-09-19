// Bounded beam search on routed (not straight-line) distances. No claim of global optimality.
export function optimize({ places, durations, distances, minutes, maxMeters, roundTrip, ranks = [] }) {
  const n = places.length;
  const budget = minutes * 60;
  const weights = places.map(place => 100 + Math.max(0, ranks.length - ranks.indexOf(place.id)) * (ranks.includes(place.id) ? 3 : 0));
  let states = [{ order: [], mask: 0, time: 0, meters: 0, score: 0, last: 0 }];
  let best = null;
  for (let depth = 0; depth < Math.min(6, n); depth++) {
    const next = [];
    for (const state of states) {
      for (let i = 0; i < n; i++) {
        if (state.mask & (1 << i)) continue;
        const seconds = durations[state.last]?.[i + 1];
        const meters = distances[state.last]?.[i + 1];
        const backTime = roundTrip ? durations[i + 1]?.[0] : 0;
        const backMeters = roundTrip ? distances[i + 1]?.[0] : 0;
        if ([seconds, meters, backTime, backMeters].some(value => value == null || !Number.isFinite(value))) continue;
        const time = state.time + seconds * 1.1 + places[i].visitMinutes * 60;
        const distance = state.meters + meters;
        if (time + backTime * 1.1 > budget || distance + backMeters > maxMeters) continue;
        const candidate = { order: [...state.order, i], mask: state.mask | (1 << i), time, meters: distance, score: state.score + weights[i], last: i + 1 };
        candidate.utility = candidate.score - (candidate.time + backTime) / 7200 - (distance + backMeters) / 10000;
        if (!best || candidate.utility > best.utility) best = candidate;
        next.push(candidate);
      }
    }
    states = next.sort((a, b) => b.utility - a.utility).slice(0, 500);
    if (!states.length) break;
  }
  return best?.order.map(index => places[index]) || [];
}
