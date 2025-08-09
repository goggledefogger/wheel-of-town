import { test, expect } from '@playwright/test';

test('visual: wheel layout and zoom overlay', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start').click();
  await page.getByTestId('wheel').waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot('wheel-initial.png', { maxDiffPixels: 2000 });

  // Spin and capture zoom overlay
  const spin = page.getByTestId('spin');
  if (await spin.isEnabled()) await spin.click();
  await page.getByTestId('zoom').waitFor({ state: 'visible', timeout: 8000 });
  await expect(page).toHaveScreenshot('wheel-zoom.png', { maxDiffPixels: 3000 });
});


