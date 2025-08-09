import { test, expect } from '@playwright/test';

test('start game, spin, and AI proceeds', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start').click();

  // Ensure phase is a round turn
  await page.locator('[data-testid="phase"]').waitFor({ state: 'attached' });
  await expect(page.getByTestId('phase')).not.toBeEmpty();

  // Human spin
  // Spin when button becomes enabled
  const spinBtn = page.getByTestId('spin');
  await spinBtn.waitFor({ state: 'visible' });
  if (await spinBtn.isEnabled()) await spinBtn.click();

  // Wait for human consonant phase after spin
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="phase"]');
    return el && el.textContent && el.textContent.includes('AwaitConsonant');
  }, null, { timeout: 8000 });

  // Pick a rare consonant to likely miss and pass turn to AI
  await page.getByRole('button', { name: 'Letter Z' }).click();

  // If it's AI turn, ensure it changes current player index within a few seconds
  // Now it's AI turn; ensure index moves off of human (0) soon
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="currentPlayerIndex"]');
    return el && el.textContent && el.textContent.trim() !== '0';
  }, null, { timeout: 6000 });

  // AI should perform an action: guessed letters or host line count should change
  const guessedBefore = parseInt(await page.getByTestId('guessedCount').textContent() || '0', 10);
  const hostBefore = parseInt(await page.getByTestId('hostLineCount').textContent() || '0', 10);
  await page.waitForTimeout(5000);
  const guessedAfter = parseInt(await page.getByTestId('guessedCount').textContent() || '0', 10);
  const hostAfter = parseInt(await page.getByTestId('hostLineCount').textContent() || '0', 10);
  expect(guessedAfter + hostAfter).not.toBe(guessedBefore + hostBefore);
});


