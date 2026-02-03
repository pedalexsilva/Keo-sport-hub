import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    viewport: { width: 375, height: 812 }, // Mobile view since it looks like a mobile-first app
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }, // Actually let's use Desktop for better screenshots unless user said mobile. The app has "mobile bottom bar" but also "md:max-w-2xl". Let's use a mobile viewport to match likely usage, OR a desktop one.
      // User workspace path has "Apps/KEO", might be mobile. Navigation.tsx has "fixed bottom-0 ... md:max-w-2xl".
      // It's a mobile-optimized web app. I will stick to a mobile viewport, likely iPhone 12/13.
      // But wait, the user instructions didn't specify. Desktop is safer for "seeing everything".
      // Let's use a standard responsive desktop size, but narrow enough to show the "mobile app" layout if it's constrained.
      // Actually, line 157 in AppLayout: `md:max-w-2xl lg:max-w-4xl`. It centers content.
      // So Desktop size is fine, it will just show the app centered.
    },
  ],
});
