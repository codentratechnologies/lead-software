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

  test('Leads page view toggle and Kanban works', async ({ page }) => {
    await page.goto('/dashboard/leads');
    
    // Check view toggles exist
    const listBtn = page.locator('button', { hasText: 'List' });
    const boardBtn = page.locator('button', { hasText: 'Board' });
    
    await expect(listBtn).toBeVisible();
    await expect(boardBtn).toBeVisible();
    
    // Switch to board view
    await boardBtn.click();
    
    // In board view, we should see Kanban columns
    await expect(page.locator('h3', { hasText: 'New' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Contacted' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Meeting Booked' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Closed' })).toBeVisible();
  });
});
