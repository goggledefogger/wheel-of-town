import { test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACTS_DIR = path.resolve('tests/artifacts');

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

test('capture: wheel page and canvas', async ({ page }) => {
  await ensureDir(ARTIFACTS_DIR);
  await page.goto('/');
  await page.getByTestId('start').click();
  await page.getByTestId('wheel').waitFor({ state: 'visible' });

  // Full page screenshot
  const fullPath = path.join(ARTIFACTS_DIR, 'wheel-page.png');
  await page.screenshot({ path: fullPath, fullPage: false });

  // Extract wheel canvas as PNG via data URL
  const dataUrl = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="wheel"]');
    if (!el) return null;
    // Try to capture zoom overlay first if visible
    const zoom = document.querySelector('[data-testid="zoom"]');
    const preferZoom = zoom && getComputedStyle(zoom).display !== 'none';
    if (preferZoom) {
      const z = zoom;
      const canvas = z.tagName.toLowerCase() === 'canvas' ? z : z.querySelector('canvas');
      if (canvas && canvas.toDataURL) return canvas.toDataURL('image/png');
    }
    const canvas = el.tagName.toLowerCase() === 'canvas' ? el : el.querySelector('canvas');
    if (!canvas || !canvas.toDataURL) return null;
    return canvas.toDataURL('image/png');
  });

  if (dataUrl) {
    const b64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    const canvasPath = path.join(ARTIFACTS_DIR, 'wheel-canvas.png');
    await fs.promises.writeFile(canvasPath, Buffer.from(b64, 'base64'));
    // eslint-disable-next-line no-console
    console.log(`Saved canvas: ${canvasPath}`);
  }

  // Trigger zoom overlay and capture again
  const spin = page.getByTestId('spin');
  if (await spin.isEnabled()) await spin.click();
  await page.getByTestId('zoom').waitFor({ state: 'visible', timeout: 8000 });

  const zoomCanvasDataUrl = await page.evaluate(() => {
    const zoom = document.querySelector('[data-testid="zoom"]');
    const canvas = zoom && (zoom.tagName.toLowerCase() === 'canvas' ? zoom : zoom.querySelector('canvas'));
    if (!canvas || !canvas.toDataURL) return null;
    return canvas.toDataURL('image/png');
  });

  if (zoomCanvasDataUrl) {
    const b64 = zoomCanvasDataUrl.replace(/^data:image\/png;base64,/, '');
    const canvasPath = path.join(ARTIFACTS_DIR, 'wheel-zoom-canvas.png');
    await fs.promises.writeFile(canvasPath, Buffer.from(b64, 'base64'));
    // eslint-disable-next-line no-console
    console.log(`Saved zoom canvas: ${canvasPath}`);
  }
});


