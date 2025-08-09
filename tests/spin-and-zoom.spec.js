import { test, expect } from '@playwright/test';

test('spin and zoom overlay behavior', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start').click();
  const spinBtn = page.getByTestId('spin');
  await spinBtn.waitFor({ state: 'visible' });
  await spinBtn.click();

  // Zoom should appear before full stop
  const zoom = page.getByTestId('zoom');
  await zoom.waitFor({ state: 'visible', timeout: 8000 });

  // After stop, zoom should still be visible until turn ends
  await page.waitForTimeout(1500);
  await expect(zoom).toBeVisible();

  // Force a miss to end turn: pick Z
  const zBtn = page.getByRole('button', { name: 'Letter Z' });
  if (await zBtn.isEnabled()) await zBtn.click();

  // Zoom should hide after turn passes to AI
  await page.waitForFunction(() => {
    const idx = document.querySelector('[data-testid="currentPlayerIndex"]');
    return idx && idx.textContent && idx.textContent.trim() !== '0';
  }, null, { timeout: 6000 });
  await expect(zoom).toBeHidden();
});


