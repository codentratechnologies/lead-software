import { test, expect } from '@playwright/test';

test.describe('CRM Automation', () => {
  test.beforeEach(async ({ context }) => {
    // Add auth cookie to bypass login middleware
    await context.addCookies([
      {
        name: 'codentra_auth',
        value: 'authenticated',
        domain: 'localhost',
        path: '/',
      }
    ]);
  });

  test('Dashboard loads correctly', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('h1').filter({ hasText: 'Dashboard Overview' })).toBeVisible();
  });

  test('Leads page loads', async ({ page }) => {
    await page.goto('/dashboard/leads');
    await expect(page.locator('h1').filter({ hasText: 'Pipeline' })).toBeVisible();
  });
});
