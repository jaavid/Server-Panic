import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', timeout: 30_000, retries: 0, fullyParallel: false,
  use: { baseURL: 'http://127.0.0.1:5173', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [{ name:'mobile-chrome',use: { ...devices['Pixel 5'] } },{ name:'desktop-chrome',use: { ...devices['Desktop Chrome'] } }],
  webServer: {command:'npm run dev -- --host 127.0.0.1',url:'http://127.0.0.1:5173',reuseExistingServer: true,timeout:60_000},
});
