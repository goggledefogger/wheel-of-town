import { test, expect } from '@playwright/test';

test('start and layout', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start').click();
  await page.locator('[data-testid="phase"]').waitFor({ state: 'attached' });
  await expect(page.getByTestId('phase')).not.toBeEmpty();
  await expect(page.getByTestId('wheel')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Spin' })).toBeVisible();
});


