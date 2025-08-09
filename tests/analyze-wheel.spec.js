import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACTS_DIR = path.resolve('tests/artifacts');

test('analyze: wheel label metrics + submit artifacts path', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start').click();
  await page.getByTestId('wheel').waitFor({ state: 'visible' });

  // Read metrics exposed by app for quick heuristics
  const data = await page.evaluate(() => window.__wheelTest?.getLabelMetrics?.());
  expect(data).toBeTruthy();

  const { metrics } = data;
  // Basic sanity: target width/arc ratio close to 1; height relative to radius adequate
  const avgWidthRatio = metrics.reduce((a, m) => a + m.widthRatio, 0) / metrics.length;
  const avgHeightRadius = metrics.reduce((a, m) => a + m.heightToRadius, 0) / metrics.length;

  // Log for developer; keep assertions loose to avoid flakes while tuning
  // eslint-disable-next-line no-console
  console.log('Label metrics:', { avgWidthRatio, avgHeightRadius });

  // Save paths of artifacts to a manifest so we can "submit" them elsewhere
  await fs.promises.mkdir(ARTIFACTS_DIR, { recursive: true });
  const manifestPath = path.join(ARTIFACTS_DIR, 'manifest.json');
  const manifest = {
    createdAt: new Date().toISOString(),
    artifacts: [
      path.join(ARTIFACTS_DIR, 'wheel-page.png'),
      path.join(ARTIFACTS_DIR, 'wheel-canvas.png'),
      path.join(ARTIFACTS_DIR, 'wheel-zoom-canvas.png')
    ],
    metrics: { avgWidthRatio, avgHeightRadius }
  };
  await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  // Loose expectations: ensure labels occupy at least 70% of wedge arc on average and height ≥ 0.18 of radius
  expect(avgWidthRatio).toBeGreaterThan(0.7);
  expect(avgHeightRadius).toBeGreaterThan(0.18);
});


