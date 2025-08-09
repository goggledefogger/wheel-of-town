import { test, expect } from '@playwright/test';

test('smoke: app loads and start button works', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('start')).toBeVisible();
  await page.getByTestId('start').click();
  await page.getByTestId('wheel').waitFor({ state: 'visible', timeout: 20000 });
});


