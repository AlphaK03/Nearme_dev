import { test, expect } from '@playwright/test';

const origin = { lat: 9.9332, lng: -84.079 };
const stops = [
  { id: 'a', name: 'Museo del Oro', lat: 9.934, lng: -84.077, category: 'culture', travelMinutes: 5, travelMeters: 300, visitMinutes: 45 },
  { id: 'b', name: 'Café del Centro', lat: 9.935, lng: -84.076, category: 'food', travelMinutes: 4, travelMeters: 200, visitMinutes: 30 },
];
const plan = {
  id: 'journey-test', title: 'Un paseo por el centro', summary: 'Cultura y un café, a tu ritmo.',
  config: { origin, mode: 'foot', startAt: '2026-09-18T15:00:00.000Z', useAi: false },
  stops: stops.map(stop => ({ ...stop, arrival: '2026-09-18T15:05:00.000Z', departure: '2026-09-18T15:45:00.000Z' })),
  geometry: { type: 'LineString', coordinates: [[-84.079, 9.9332], [-84.079, 9.9335], [-84.0785, 9.9335], [-84.0785, 9.934], [-84.077, 9.934], [-84.077, 9.935], [-84.076, 9.935]] },
  legs: [], advice: { used: false }, warnings: [], omitted: [], totalMinutes: 90, travelMinutes: 9, visitMinutes: 75, bufferMinutes: 6, meters: 500, endAt: '2026-09-18T16:30:00.000Z', routingSource: 'Fixture',
};
const tile = '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#e6ecdf"/><path d="M0 90H256M85 0V256M0 195H256M200 0V256" stroke="#fff" stroke-width="10"/><path d="M0 90H256M85 0V256M0 195H256M200 0V256" stroke="#d4dccd" stroke-width="1"/></svg>';

async function setup(page) {
  await page.addInitScript(route => {
    localStorage.setItem('nearme:current-plan', JSON.stringify(route));
    const watches = new Map(); let sequence = 0;
    window.testGps = {
      watches, started: 0, cleared: 0, hidden: false,
      emit(coords) { for (const watch of watches.values()) watch.success({ coords: { latitude: 9.9332, longitude: -84.079, accuracy: 5, heading: null, ...coords }, timestamp: Date.now() }); },
      fail(code) { for (const watch of [...watches.values()]) watch.failure({ code }); },
    };
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => window.testGps.hidden });
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: {
      watchPosition(success, failure) { const id = ++sequence; watches.set(id, { success, failure }); window.testGps.started++; return id; },
      clearWatch(id) { watches.delete(id); window.testGps.cleared++; },
    } });
  }, plan);
  await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({ contentType: 'image/svg+xml', body: tile }));
  await page.route('**/api/health', route => route.fulfill({ json: { ok: true, ai: { configured: false } } }));
  await page.route('**/api/places', route => route.fulfill({ json: { searchId: 'fixture', places: stops, origin, radiusKm: 3 } }));
  await page.goto('/#route');
  await expect(page.getByRole('region', { name: 'Seguimiento del recorrido' })).toBeVisible();
}

test('preview animates locally, pauses, and never starts GPS or completes a stop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const apiCalls = []; page.on('request', request => { if (request.url().includes('/api/')) apiCalls.push(request.url()); });
  await setup(page);
  await page.clock.install();
  await page.getByRole('button', { name: 'Vista previa', exact: true }).click();
  await page.clock.runFor(1800);
  await expect(page.locator('.journey-marker')).toBeVisible();
  await expect(page.locator('.journey-status')).toContainText('Simulación');
  expect(Number(await page.getByRole('progressbar').getAttribute('aria-valuenow'))).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  const marker = await page.locator('.journey-marker-container').getAttribute('style');
  await page.clock.runFor(1000);
  expect(await page.locator('.journey-marker-container').getAttribute('style')).toBe(marker);
  expect(await page.evaluate(() => window.testGps.started)).toBe(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nearme:progress')).completed)).toEqual([]);
  expect(apiCalls.filter(url => url.includes('/api/plan'))).toHaveLength(0);
  await page.getByRole('button', { name: 'Ver ruta completa' }).click();
  await expect(page.getByRole('button', { name: 'Seguir marcador' })).toBeVisible();
  await page.getByRole('button', { name: 'Seguir marcador' }).click();
  await expect(page.getByRole('button', { name: 'Seguir marcador' })).toHaveCount(0);
  await page.screenshot({ path: 'test-results/journey-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Tramo 2: Café del Centro' }).click();
  await expect(page.locator('.journey-destination h3')).toHaveText('Café del Centro');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
});

test('finishing the last stop stops GPS and a reload does not reactivate it', async ({ page }) => {
  await setup(page);
  await page.getByRole('button', { name: 'Seguir con GPS', exact: true }).click();
  await page.evaluate(() => window.testGps.emit({}));
  await page.getByRole('button', { name: 'Marcar parada visitada' }).click();
  await expect(page.locator('.journey-destination h3')).toHaveText('Café del Centro');
  await page.getByRole('button', { name: 'Marcar parada visitada' }).click();
  await expect(page.getByRole('button', { name: 'Seguir con GPS', exact: true })).toBeDisabled();
  expect(await page.evaluate(() => window.testGps.watches.size)).toBe(0);
  await page.reload();
  expect(await page.evaluate(() => window.testGps.started)).toBe(0);
});

test('mobile GPS follows real fixes, reports a deviation, advances stops and releases the watcher', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  await page.clock.install();
  await page.getByRole('button', { name: 'Seguir con GPS', exact: true }).click();
  await page.evaluate(() => window.testGps.emit({}));
  await expect(page.locator('.journey-marker')).toBeVisible();
  await expect(page.locator('.journey-status')).toContainText('Siguiendo tu ubicación');
  await page.evaluate(() => { window.originalMap = document.querySelector('.journey-map .leaflet-map'); });
  await page.clock.runFor(1100);
  await page.evaluate(() => window.testGps.emit({ latitude: 9.9335, longitude: -84.0788 }));
  await page.clock.runFor(800);
  expect(await page.evaluate(() => window.originalMap === document.querySelector('.journey-map .leaflet-map'))).toBe(true);
  await page.locator('.journey-card').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/journey-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.clock.runFor(1100);
  await page.evaluate(() => window.testGps.emit({ latitude: 9.938, longitude: -84.08 }));
  await expect(page.locator('.journey-status')).toContainText('fuera de este tramo');
  await page.getByRole('button', { name: 'Marcar parada visitada' }).click();
  await expect(page.locator('.journey-destination h3')).toHaveText('Café del Centro');
  expect(await page.evaluate(() => window.testGps.watches.size)).toBe(1);
  await page.locator('.mobile-nav').getByRole('button', { name: 'Guardados' }).click();
  expect(await page.evaluate(() => window.testGps.watches.size)).toBe(0);
});

test('poor signal and denied permission never invent movement; hidden apps stop GPS', async ({ page }) => {
  await setup(page);
  await page.clock.install();
  await page.getByRole('button', { name: 'Seguir con GPS', exact: true }).click();
  await page.evaluate(() => window.testGps.emit({ accuracy: 150 }));
  await expect(page.locator('.journey-status')).toContainText('Señal poco precisa');
  await expect(page.locator('.journey-marker')).toHaveCount(0);
  await page.clock.runFor(1100);
  await page.evaluate(() => window.testGps.emit({}));
  await expect(page.locator('.journey-marker')).toBeVisible();
  await page.clock.runFor(21000);
  await expect(page.locator('.journey-status')).toContainText('desactualizada');
  await page.evaluate(() => { window.testGps.hidden = true; document.dispatchEvent(new Event('visibilitychange')); });
  await expect.poll(() => page.evaluate(() => window.testGps.watches.size)).toBe(0);
  await page.evaluate(() => { window.testGps.hidden = false; document.dispatchEvent(new Event('visibilitychange')); });
  await expect.poll(() => page.evaluate(() => window.testGps.watches.size)).toBe(1);
  await page.evaluate(() => window.testGps.fail(1));
  await expect(page.locator('.journey-status')).toContainText('Permite la ubicación');
  expect(await page.evaluate(() => window.testGps.watches.size)).toBe(0);
});

test('reduced motion still allows a preview and pauses when the page is hidden', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await setup(page);
  await page.clock.install();
  await page.getByRole('button', { name: 'Vista previa', exact: true }).click();
  await page.clock.runFor(1500);
  await expect(page.locator('.journey-marker')).toBeVisible();
  await page.evaluate(() => { window.testGps.hidden = true; document.dispatchEvent(new Event('visibilitychange')); });
  await expect(page.getByRole('button', { name: 'Reanudar', exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.testGps.started)).toBe(0);
});
