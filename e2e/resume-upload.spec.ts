import { test, expect } from '@playwright/test';

test.describe('Resume Upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/resume');
  });

  test('shows upload button', async ({ page }) => {
    await expect(page.getByTestId('resume-upload')).toBeVisible();
  });

  test('page loads without error', async ({ page }) => {
    await expect(page).toHaveURL(/\/resume/);
    await expect(page.locator('h1')).toBeVisible();
  });
});
