import { test, expect } from '@playwright/test';

test('zoom overlay appears after spin', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start').click();
  await page.getByTestId('wheel').waitFor({ state: 'visible' });

  // Spin and wait for zoom overlay
  const spin = page.getByTestId('spin');
  if (await spin.isEnabled()) await spin.click();
  await page.getByTestId('zoom').waitFor({ state: 'visible', timeout: 8000 });
  await expect(page.getByTestId('zoom')).toBeVisible();
});
