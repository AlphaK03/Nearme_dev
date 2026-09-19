import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './web/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  use: { baseURL: 'http://127.0.0.1:8787', browserName: 'chromium', channel: 'msedge', trace: 'retain-on-failure' },
  reporter: 'list',
  webServer: { command: 'npm start', url: 'http://127.0.0.1:8787/api/health', reuseExistingServer: true },
});
