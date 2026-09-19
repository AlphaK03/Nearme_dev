import { test, expect } from '@playwright/test';

test('map tiles identify the app even when the HTTPS tunnel overrides the document referrer policy', async ({ page, baseURL }) => {
  const tileReferers = [];
  await page.route('https://tile.openstreetmap.org/**', async route => {
    tileReferers.push((await route.request().allHeaders()).referer);
    await route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#e1eddc"/></svg>' });
  });
  await page.route('**/api/health', route => route.fulfill({ json: { ok: true, ai: { configured: false } } }));
  await page.route('**/api/places', route => route.fulfill({ json: { searchId: 'map-test', places: [], origin: { lat: 9.9332, lng: -84.0779 }, radiusKm: 3 } }));
  await page.route('**/*', async route => {
    if (!route.request().isNavigationRequest()) return route.fallback();
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), 'referrer-policy': 'same-origin' } });
  });

  await page.goto('/?private-query=must-not-leak');
  await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible();
  expect(tileReferers.length).toBeGreaterThan(0);
  expect(tileReferers.every(referer => referer === `${new URL(baseURL).origin}/`)).toBe(true);
  await expect(page.locator('.leaflet-control-attribution').getByRole('link', { name: 'OpenStreetMap' })).toBeVisible();
});
