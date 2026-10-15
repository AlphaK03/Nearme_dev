import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTrack, pointAt, metersBetween, segmentPoints, matchPosition } from '../src/route-motion.js';

const plan = {
  config: { origin: { lat: 0, lng: 0 }, roundTrip: true },
  geometry: { coordinates: [[0, 0], [0.001, 0], [0.001, 0.001], [0, 0.001], [0, 0]] },
  stops: [{ id: 'a', name: 'A', lat: 0, lng: 0.001 }, { id: 'b', name: 'B', lat: 0.001, lng: 0.001 }],
  legs: [{ meters: 111 }, { meters: 111 }, { meters: 222 }],
};

test('keeps ordered stops and the return leg on an itinerary that closes a loop', () => {
  const track = buildTrack(plan);
  assert.equal(track.segments.length, 3);
  assert.ok(Math.abs(track.segments[0].meters - 111.2) < 1);
  assert.ok(Math.abs(track.segments[1].meters - 111.2) < 1);
  assert.ok(Math.abs(track.segments[2].meters - 222.4) < 1);
  assert.equal(track.segments[2].stop.returning, true);
  assert.ok(metersBetween(pointAt(track, track.total), plan.config.origin) < 0.01);
});

test('interpolation follows bends, clamps endpoints and returns a heading', () => {
  const track = buildTrack(plan);
  const point = pointAt(track, track.segments[1].start + track.segments[1].meters / 2);
  assert.ok(Math.abs(point.lat - 0.0005) < 0.000001);
  assert.equal(point.lng, 0.001);
  assert.equal(point.heading, 0);
  assert.equal(pointAt(track, -100).along, 0);
  assert.equal(pointAt(track, track.total + 100).along, track.total);
  assert.equal(segmentPoints(track, track.segments[2]).length, 3);
});

test('matches good GPS on the current leg without jumping to another part of the loop', () => {
  const track = buildTrack(plan);
  const fix = matchPosition(track, track.segments[0], { latitude: 0.00002, longitude: 0.0005, accuracy: 5, heading: null });
  assert.equal(fix.status, 'on-route');
  assert.equal(fix.point.lat, 0);
  assert.ok(Math.abs(fix.remaining - 55.6) < 1);
  const onFutureLeg = matchPosition(track, track.segments[0], { latitude: 0.001, longitude: 0.0005, accuracy: 5 });
  assert.equal(onFutureLeg.status, 'off-route');
  assert.equal(onFutureLeg.point.lat, 0.001);
  assert.equal(onFutureLeg.remaining, null);
});

test('does not invent a route position for inaccurate or malformed GPS', () => {
  const track = buildTrack(plan), segment = track.segments[0];
  assert.equal(matchPosition(track, segment, { latitude: 0, longitude: 0, accuracy: 100 }).status, 'inaccurate');
  assert.equal(matchPosition(track, segment, { latitude: NaN, longitude: 0, accuracy: 5 }).status, 'invalid');
  assert.equal(matchPosition(track, segment, { latitude: 0, longitude: 0, accuracy: -1 }).status, 'invalid');
});

test('supports saved routes without leg details and handles unusable geometry', () => {
  assert.equal(buildTrack({ ...plan, legs: [] }).segments.length, 3);
  assert.equal(buildTrack({ ...plan, geometry: { coordinates: [] } }), null);
  assert.equal(buildTrack({ ...plan, geometry: { coordinates: [[0, 0], [0, 0]] } }), null);
  assert.equal(buildTrack({ ...plan, geometry: { coordinates: [[0, 0], [0, 100]] } }), null);
  const duplicate = buildTrack({ ...plan, geometry: { coordinates: [[0, 0], [0, 0], ...plan.geometry.coordinates.slice(1)] } });
  assert.equal(duplicate.points.length, 5);
});
