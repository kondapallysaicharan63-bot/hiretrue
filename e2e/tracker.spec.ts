import { test, expect } from '@playwright/test';

test.describe('Application Tracker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tracker');
  });

  test('shows tracker page with columns', async ({ page }) => {
    await expect(page).toHaveURL(/\/tracker/);
    await expect(page.locator('h1')).toContainText('Application Tracker');
  });

  test('shows all 5 kanban columns', async ({ page }) => {
    await expect(page.getByText('Saved')).toBeVisible();
    await expect(page.getByText('Applied')).toBeVisible();
    await expect(page.getByText('Interview')).toBeVisible();
    await expect(page.getByText('Offer')).toBeVisible();
    await expect(page.getByText('Rejected')).toBeVisible();
  });
});
