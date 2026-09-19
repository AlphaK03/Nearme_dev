import { test, expect } from '@playwright/test';

const origin = { lat: 9.9332, lng: -84.0779 };
const places = [
  { id: 'node/1', name: 'Museo del Oro', category: 'culture', lat: 9.933, lng: -84.077, distanceKm: 0.1, visitMinutes: 45, osmUrl: 'https://www.openstreetmap.org/node/1', fee: 'Precio por confirmar', wheelchair: 'unknown' },
  { id: 'node/2', name: 'Café del Centro', category: 'food', lat: 9.934, lng: -84.076, distanceKm: 0.3, visitMinutes: 35, osmUrl: 'https://www.openstreetmap.org/node/2', fee: 'Precio por confirmar', wheelchair: 'unknown' },
  { id: 'node/3', name: 'Parque Central', category: 'nature', lat: 9.935, lng: -84.075, distanceKm: 0.5, visitMinutes: 30, osmUrl: 'https://www.openstreetmap.org/node/3', fee: 'Precio por confirmar', wheelchair: 'unknown' },
];
const fixture = {
  id: 'test-route', title: 'Cultura y café en San José', summary: 'Una selección para disfrutar con calma.',
  createdAt: new Date().toISOString(),
  config: { origin, startAt: '2026-09-18T15:00:00.000Z', mode: 'foot', useAi: true, roundTrip: false },
  advice: { used: true, cached: false, tips: ['Confirma los horarios antes de salir.'] },
  stops: places.map((place, i) => ({ ...place, arrival: `2026-09-18T${15+i}:00:00.000Z`, departure: `2026-09-18T${15+i}:30:00.000Z`, travelMinutes: 5, travelMeters: 300 })),
  geometry: { type: 'LineString', coordinates: [[-84.0779,9.9332],[-84.077,9.933],[-84.076,9.934],[-84.075,9.935]] },
  legs: [], totalMinutes: 128, travelMinutes: 15, visitMinutes: 110, bufferMinutes: 3, meters: 900,
  endAt: '2026-09-18T17:08:00.000Z', omitted: [], warnings: ['No se verifican condiciones en tiempo real.'], routingSource: 'OSRM / OpenStreetMap',
};
async function setup(page) {
  await page.route('**/api/health', route => route.fulfill({ json: { ok: true, ai: { configured: true, calls: 1, maxCalls: 30 } } }));
  await page.route('**/api/places', route => route.fulfill({ json: { searchId: 'test', places, origin, radiusKm: 3 } }));
  await page.route('**/api/plan', route => route.fulfill({ json: fixture }));
  await page.goto('/');
}
test('desktop: real interactions from discovery to saved route, not static screens', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await setup(page);
  await expect(page.getByRole('heading', { name: /Tu próximo plan/ })).toBeVisible();
  await expect(page.locator('.leaflet-container')).toBeVisible();
  await page.getByLabel('Buscar lugares').fill('Museo');
  await expect(page.locator('.place-card')).toHaveCount(1);
  await page.getByLabel('Añadir Museo del Oro').click();
  await expect(page.locator('.selection-dock')).toContainText('1 lugar elegido');
  await page.locator('.selection-dock').getByRole('button', { name: 'Crear ruta' }).click();
  await page.getByRole('button', { name: 'Encontrar mi recorrido' }).click();
  await expect(page.getByRole('heading', { name: fixture.title })).toBeVisible();
  await page.getByLabel('Guardar ruta', { exact: true }).click();
  await page.locator('.sidebar').getByRole('button', { name: /Guardados/ }).click();
  await expect(page.locator('.saved-card')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('.saved-card')).toHaveCount(1);
  await page.screenshot({ path: 'test-results/desktop-saved.png', fullPage: true });
  expect(errors).toEqual([]);
});
test('phone: planning, completion, route recalculation and persistence', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  await expect(page.locator('.mobile-nav')).toBeVisible();
  await expect(page.locator('.sidebar')).toBeHidden();
  await page.screenshot({ path: 'test-results/mobile-discovery.png', fullPage: true });
  await page.getByRole('button', { name: 'Crear mi recorrido', exact: true }).click();
  await page.getByRole('button', { name: 'Encontrar mi recorrido' }).click();
  await page.getByRole('button', { name: 'Iniciar recorrido', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Cómo llegar' })).toHaveAttribute('href', /google.com\/maps/);
  await page.getByRole('button', { name: 'Completar parada' }).click();
  await expect(page.locator('.timeline-stop.completed')).toHaveCount(1);
  await page.getByRole('button', { name: 'Tengo menos tiempo' }).click();
  const request = page.waitForRequest(request => request.url().endsWith('/api/plan'));
  await page.getByRole('button', { name: 'Recalcular recorrido' }).click();
  const payload = (await request).postDataJSON();
  expect(payload.placeIds).toEqual(['node/2', 'node/3']);
  expect(payload.useAi).toBe(false);
  expect(payload.origin.lat).toBe(places[0].lat);
  await expect(page.locator('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('server error is visible, selection and dialog survive; never fakes a route', async ({ page }) => {
  await setup(page);
  await page.route('**/api/plan', route => route.fulfill({ status: 422, json: { error: 'No cabe ninguna visita con los límites actuales.' } }));
  await page.getByRole('button', { name: 'Crear mi recorrido', exact: true }).click();
  await page.getByRole('button', { name: 'Encontrar mi recorrido' }).click();
  await expect(page.getByRole('alert')).toContainText('No cabe ninguna visita');
  await expect(page.locator('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Encontrar mi recorrido' })).toBeEnabled();
});

test('AI can be switched off directly and the request reflects the choice', async ({ page }) => {
  await setup(page);
  await page.getByRole('button', { name: 'Crear mi recorrido', exact: true }).click();
  await page.getByLabel('Personalizar con ChatGPT').uncheck();
  const request = page.waitForRequest(request => request.url().endsWith('/api/plan'));
  await page.getByRole('button', { name: 'Encontrar mi recorrido' }).click();
  expect((await request).postDataJSON().useAi).toBe(false);
});
test('location search is explicit and updates the map origin', async ({ page }) => {
  await setup(page);
  await page.route('**/api/geocode?*', route => route.fulfill({ json: { results: [{ label: 'Heredia, Costa Rica', lat: 10.002, lng: -84.117 }] } }));
  await page.locator('.location-button').click();
  await page.getByPlaceholder('Barrio Escalante, San José…').fill('Heredia');
  await page.locator('.location-search').getByRole('button', { name: 'Buscar' }).click();
  const nextSearch = page.waitForRequest(request => request.url().endsWith('/api/places'));
  await page.getByRole('button', { name: 'Heredia, Costa Rica' }).click();
  expect((await nextSearch).postDataJSON().origin).toEqual({ lat: 10.002, lng: -84.117 });
});
