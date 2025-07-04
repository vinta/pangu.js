import './global';
import { test, expect } from '@playwright/test';

test.describe('Task Scheduler', () => {
  test.beforeEach(async ({ page }) => {
    const hasSupport = await page.evaluate(() => typeof window.requestIdleCallback === 'function');
    test.skip(!hasSupport, 'requestIdleCallback is not supported');
  });

  test.beforeEach(async ({ page }) => {
    await page.addScriptTag({ path: 'dist/browser/pangu.umd.js' });
    await page.waitForFunction(() => typeof window.pangu !== 'undefined');
  });

  test('should enable idle spacing with custom config', async ({ page }) => {
    const result = await page.evaluate(() => {
      pangu.taskScheduler.config.enabled = true;
      pangu.taskScheduler.config.chunkSize = 20;
      pangu.taskScheduler.config.timeout = 3000;
      return pangu.taskScheduler.config;
    });

    expect(result.enabled).toBe(true);
    expect(result.chunkSize).toBe(20);
    expect(result.timeout).toBe(3000);
  });

  test('should process page content synchronously processing when idle spacing is disabled', async ({ page }) => {
    await page.setContent(`
      <div>
        <p>測試synchronous fallback功能abc123</p>
      </div>
    `);

    const result = await page.evaluate(() => {
      return new Promise<{ completionCalled: boolean; text: string | null; idleEnabled: boolean }>((resolve) => {
        // Ensure idle spacing is disabled
        pangu.taskScheduler.config.enabled = false;

        let completionCalled = false;

        // Process synchronously since idle is disabled
        pangu.spacingPage();

        completionCalled = true;
        const text = document.body.textContent;
        resolve({
          completionCalled,
          text,
          idleEnabled: pangu.taskScheduler.config.enabled,
        });
      });
    });

    expect(result.completionCalled).toBe(true);
    expect(result.idleEnabled).toBe(false);
    expect(result.text).toContain('測試 synchronous fallback 功能 abc123');
  });

  test('should process page content with idle callbacks and chunking', async ({ page }) => {
    await page.setContent(`
      <div>
        <p>測試中文abc混合內容123</p>
        <span>更多測試text456</span>
        <div>第三段content789</div>
        <article>第四段material012</article>
        <section>最後一段data345</section>
      </div>
    `);

    const result = await page.evaluate(() => {
      // Enable idle spacing with small chunk size to test chunking
      pangu.taskScheduler.config.enabled = true;
      pangu.taskScheduler.config.chunkSize = 2;

      // Process the page with idle enabled
      pangu.spacingPage();

      // Since idle processing is async, we need to wait a bit
      return new Promise<{ finalText: string | null }>((resolve) => {
        setTimeout(() => {
          const finalText = document.body.textContent;
          resolve({
            finalText,
          });
        }, 100);
      });
    });

    // Should have spaced the content correctly
    expect(result.finalText).toContain('測試中文 abc 混合內容 123');
    expect(result.finalText).toContain('更多測試 text456');
    expect(result.finalText).toContain('第三段 content789');
  });
});
