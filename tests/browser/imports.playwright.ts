import { test, expect } from '@playwright/test';

// Browser ESM imports are tested in the Node.js environment
// since they use the same ES modules. UMD is the primary browser target.
test.describe('Browser UMD imports', () => {
  test.beforeEach(async ({ page }) => {
    await page.addScriptTag({ path: 'dist/browser/pangu.umd.js' });
    await page.waitForFunction(() => typeof window.pangu !== 'undefined');
  });

  test('handle global pangu object exposure', async ({ page }) => {
    const result = await page.evaluate(() => {
      return {
        hasGlobalPangu: typeof window.pangu !== 'undefined',
        hasAutoSpacingPage: typeof window.pangu?.autoSpacingPage === 'function',
        // @ts-expect-error - UMD bundle attaches BrowserPangu to the pangu instance
        hasBrowserPanguClass: typeof window.pangu?.BrowserPangu === 'function',
        // @ts-expect-error - UMD bundle attaches BrowserPangu to the pangu instance
        canCreateInstance: window.pangu?.BrowserPangu ? new window.pangu.BrowserPangu() instanceof window.pangu.BrowserPangu : false,
      };
    });

    expect(result.hasGlobalPangu).toBe(true);
    expect(result.hasAutoSpacingPage).toBe(true);
    expect(result.hasBrowserPanguClass).toBe(true);
    expect(result.canCreateInstance).toBe(true);
  });

  test('handle text with spacing functionality', async ({ page }) => {
    const result = await page.evaluate(() => {
      const text = 'Hello世界';
      const spaced = pangu.spacing(text);
      return { original: text, spaced };
    });

    expect(result.spaced).toBe('Hello 世界');
  });
});
