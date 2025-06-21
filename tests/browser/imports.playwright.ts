import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
// Import the UMD types for window.pangu global
import '../../dist/browser/pangu.umd';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Note: Browser ESM imports are tested in the Node.js environment
// since they use the same ES modules. UMD is the primary browser target.

test.describe('Browser UMD imports', () => {
  test('should expose global pangu object', async ({ page }) => {
    await page.addScriptTag({ path: path.join(__dirname, '../../dist/browser/pangu.umd.js') });

    const result = await page.evaluate(() => {
      return {
        hasGlobalPangu: typeof window.pangu !== 'undefined',
        hasSpacing: typeof window.pangu?.spacing === 'function',
        hasBrowserPanguClass: typeof window.pangu?.BrowserPangu === 'function',
        canCreateInstance: window.pangu?.BrowserPangu ? new window.pangu.BrowserPangu() instanceof window.pangu.BrowserPangu : false,
      };
    });

    expect(result.hasGlobalPangu).toBe(true);
    expect(result.hasSpacing).toBe(true);
    expect(result.hasBrowserPanguClass).toBe(true);
    expect(result.canCreateInstance).toBe(true);
  });

  test('should have working spacing functionality', async ({ page }) => {
    await page.addScriptTag({ path: path.join(__dirname, '../../dist/browser/pangu.umd.js') });

    const result = await page.evaluate(() => {
      const text = 'Hello世界';
      const spaced = window.pangu.spacing(text);
      return { original: text, spaced };
    });

    expect(result.spaced).toBe('Hello 世界');
  });
});
