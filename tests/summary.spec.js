import { test, expect } from '@playwright/test';

test('round summary appears and can be dismissed', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start').click();

  // Await the first turn
  await page.locator('[data-testid="phase"]:text-is("TurnHuman")').waitFor({ timeout: 8000 });

  // Solve the puzzle to end the round
  const phrase = await page.evaluate(() => window.useGameStore.getState().board.phrase);
  await page.evaluate((p) => {
    window.useGameStore.getState().actions.attemptSolve(p);
  }, phrase);

  // Verify that the round summary is displayed
  await page.getByTestId('round-summary').waitFor({ state: 'visible', timeout: 10000 });
  await expect(page.getByTestId('round-summary')).toBeVisible();

  // Verify that the continue button is visible and clickable
  const continueButton = page.getByRole('button', { name: 'Continue' });
  await expect(continueButton).toBeVisible();
  await continueButton.click();

  // Verify that the summary is dismissed and the next round starts
  await expect(page.getByTestId('round-summary')).not.toBeVisible();
  await expect(page.getByTestId('phase')).not.toHaveText('RoundEnd');
});

test('game summary appears and can be dismissed', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start').click();

  // Set rounds to 1 to accelerate game end
  await page.waitForFunction(() => window.useGameStore);
  await page.evaluate(() => {
    window.useGameStore.setState({ roundsTotal: 1 });
  });

  // Solve the puzzle to end the round
  const phrase = await page.evaluate(() => window.useGameStore.getState().board.phrase);
  await page.evaluate((p) => {
    window.useGameStore.getState().actions.attemptSolve(p);
  }, phrase);

  // Verify that the round summary is displayed and click continue
  await page.getByTestId('round-summary').waitFor({ state: 'visible', timeout: 10000 });
  await page.getByRole('button', { name: 'Continue' }).click();

  // Verify that the game summary is displayed
  await page.getByTestId('game-summary').waitFor({ state: 'visible', timeout: 10000 });
  await expect(page.getByTestId('game-summary')).toBeVisible();

  // Verify that the play again button is visible and clickable
  const playAgainButton = page.getByRole('button', { name: 'Play Again' });
  await expect(playAgainButton).toBeVisible();
  await playAgainButton.click();

  // Verify that the summary is dismissed and the game returns to the title screen
  await expect(page.getByTestId('game-summary')).not.toBeVisible();
  await expect(page.getByTestId('phase')).toHaveText('Title');
});
