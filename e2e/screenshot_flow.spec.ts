import { test, expect } from '@playwright/test';

test.describe('App Navigation and Screenshots', () => {
  test('login and capture screenshots', async ({ page }) => {
    console.log('Navigating to base URL...');
    await page.goto('/');

    // Wait for potential redirect
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    if (currentUrl.includes('/app')) {
      console.log('User logged in. Attempting to logout...');
      // If locally we are at /app/home, go to profile
      await page.goto('/app/profile');
      await page.getByRole('button', { name: 'Terminar Sessão' }).click();
      await page.waitForURL('**/login');
    } else if (currentUrl.includes('/admin')) {
        // If in admin dashboard, logout is in sidebar
        // But likely we won't hit this path given the bot credentials logic
    }

    // Ensure we are at login
    if (!page.url().includes('/login')) {
        await page.goto('/login');
    }

    console.log('Logging in as bot@keo.com...');
    await page.fill('#email', 'bot@keo.com');
    await page.fill('#password', 'botadmin');
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Wait for Home/Dashboard
    console.log('Waiting for Dashboard...');
    await expect(page).toHaveURL(/\/app\/home/, { timeout: 20000 });
    await page.waitForLoadState('networkidle'); // Wait for network to settle
    // Extra wait for animations
    await page.waitForTimeout(2000);

    console.log('Taking dashboard.png');
    await page.screenshot({ path: 'dashboard.png', fullPage: true });

    // Events
    console.log('Navigating to Events...');
    await page.getByRole('link', { name: 'Eventos' }).click();
    await expect(page).toHaveURL(/\/app\/events/);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    console.log('Taking events.png');
    await page.screenshot({ path: 'events.png', fullPage: true });

    // Store
    console.log('Navigating to Store...');
    await page.getByRole('link', { name: 'Loja' }).click();
    await expect(page).toHaveURL(/\/app\/store/);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    console.log('Taking store.png');
    await page.screenshot({ path: 'store.png', fullPage: true });

    // Profile
    console.log('Navigating to Profile...');
    await page.getByRole('link', { name: 'Perfil' }).click();
    await expect(page).toHaveURL(/\/app\/profile/);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    console.log('Taking profile.png');
    await page.screenshot({ path: 'profile.png', fullPage: true });
  });
});
