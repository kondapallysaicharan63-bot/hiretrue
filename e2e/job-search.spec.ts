import { test, expect } from '@playwright/test';

test.describe('Job Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jobs');
  });

  test('shows search input and button', async ({ page }) => {
    await expect(page.getByTestId('search-input')).toBeVisible();
    await expect(page.getByTestId('search-button')).toBeVisible();
  });

  test('shows H1B, Remote and Internship filters', async ({ page }) => {
    await expect(page.getByTestId('h1b-filter')).toBeVisible();
    await expect(page.getByTestId('remote-filter')).toBeVisible();
    await expect(page.getByTestId('internship-filter')).toBeVisible();
  });

  test('can type in search box', async ({ page }) => {
    await page.getByTestId('search-input').fill('software engineer');
    await expect(page.getByTestId('search-input')).toHaveValue('software engineer');
  });

  test('toggles H1B filter', async ({ page }) => {
    const filter = page.getByTestId('h1b-filter');
    await filter.click();
    await expect(filter).toHaveClass(/bg-primary/);
    await filter.click();
    await expect(filter).not.toHaveClass(/bg-primary/);
  });
});
