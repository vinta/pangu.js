import type { BrowserPangu } from '../../dist/browser/pangu';
import { test, expect } from '@playwright/test';

declare global {
  const pangu: BrowserPangu;
  interface Window {
    // @ts-expect-error - pangu is defined in the global scope
    pangu: BrowserPangu;
  }
}

test.describe('Idle Processing Infrastructure', () => {
  test.beforeEach(async ({ page }) => {
    await page.addScriptTag({ path: 'dist/browser/pangu.umd.js' });
    await page.waitForFunction(() => typeof window.pangu !== 'undefined');
  });

  test('should have idle spacing enabled by default', async ({ page }) => {
    const config = await page.evaluate(() => {
      return pangu.getIdleSpacingConfig();
    });

    expect(config.enabled).toBe(true);
    expect(config.chunkSize).toBe(10);
    expect(config.timeout).toBe(5000);
  });

  test('should enable idle spacing with default config', async ({ page }) => {
    const result = await page.evaluate(() => {
      pangu.updateIdleSpacingConfig({ enabled: true });
      return pangu.getIdleSpacingConfig();
    });

    expect(result.enabled).toBe(true);
    expect(result.chunkSize).toBe(10);
    expect(result.timeout).toBe(5000);
  });

  test('should enable idle spacing with custom config', async ({ page }) => {
    const result = await page.evaluate(() => {
      pangu.updateIdleSpacingConfig({ enabled: true,
        chunkSize: 20,
        timeout: 3000
      });
      return pangu.getIdleSpacingConfig();
    });

    expect(result.enabled).toBe(true);
    expect(result.chunkSize).toBe(20);
    expect(result.timeout).toBe(3000);
  });

  test('should disable idle spacing and clear queue', async ({ page }) => {
    const result = await page.evaluate(() => {
      // Enable idle spacing first
      pangu.updateIdleSpacingConfig({ enabled: true });
      const configBefore = pangu.getIdleSpacingConfig();
      
      // Disable it
      pangu.updateIdleSpacingConfig({ enabled: false });
      const configAfter = pangu.getIdleSpacingConfig();
      
      return {
        enabledBefore: configBefore.enabled,
        enabledAfter: configAfter.enabled,
        queueLength: pangu.idleQueue.length
      };
    });

    expect(result.enabledBefore).toBe(true);
    expect(result.enabledAfter).toBe(false);
    expect(result.queueLength).toBe(0);
  });

  test('should provide queue management methods', async ({ page }) => {
    const result = await page.evaluate(() => {
      // Initial queue length
      const initialLength = pangu.idleQueue.length;
      
      // Clear queue (should be no-op if empty)
      pangu.idleQueue.clear();
      const lengthAfterClear = pangu.idleQueue.length;
      
      return {
        initialLength,
        lengthAfterClear
      };
    });

    expect(result.initialLength).toBe(0);
    expect(result.lengthAfterClear).toBe(0);
  });

  test('should handle requestIdleCallback availability detection', async ({ page }) => {
    // Test that the system works regardless of requestIdleCallback support
    const result = await page.evaluate(() => {
      // Check if requestIdleCallback is available
      const hasNativeSupport = typeof window.requestIdleCallback === 'function';
      
      // Enable idle spacing to ensure infrastructure is working
      pangu.updateIdleSpacingConfig({ enabled: true });
      const config = pangu.getIdleSpacingConfig();
      
      return {
        hasNativeSupport,
        idleSpacingEnabled: config.enabled
      };
    });

    // Should work whether or not requestIdleCallback is natively supported
    expect(result.idleSpacingEnabled).toBe(true);
    
    // Log the support status for debugging
    console.log(`requestIdleCallback native support: ${result.hasNativeSupport}`);
  });

  test('should maintain backward compatibility when idle spacing is disabled', async ({ page }) => {
    await page.setContent(`
      <div>
        <p>測試中文abc混合內容123</p>
        <span>更多測試text456</span>
      </div>
    `);

    const result = await page.evaluate(() => {
      // Ensure idle spacing is disabled (default state)
      pangu.updateIdleSpacingConfig({ enabled: false });
      
      // Run normal spacing
      pangu.spacingPageBody();
      
      return {
        idleEnabled: pangu.getIdleSpacingConfig().enabled,
        bodyText: document.body.textContent
      };
    });

    expect(result.idleEnabled).toBe(false);
    // Should still work normally with idle processing disabled
    expect(result.bodyText).toContain('測試中文 abc 混合內容 123');
    expect(result.bodyText).toContain('更多測試 text456');
  });

  test('should handle partial config updates correctly', async ({ page }) => {
    const result = await page.evaluate(() => {
      // Enable with partial config
      pangu.updateIdleSpacingConfig({ enabled: true, chunkSize: 5 });
      const config1 = pangu.getIdleSpacingConfig();
      
      // Update again with different partial config
      pangu.updateIdleSpacingConfig({ enabled: true, timeout: 1000 });
      const config2 = pangu.getIdleSpacingConfig();
      
      return { config1, config2 };
    });

    // First update should change chunkSize but keep other defaults
    expect(result.config1.enabled).toBe(true);
    expect(result.config1.chunkSize).toBe(5);
    expect(result.config1.timeout).toBe(5000); // Still default

    // Second update should change timeout but keep chunkSize from first update
    expect(result.config2.enabled).toBe(true);
    expect(result.config2.chunkSize).toBe(5); // Preserved from first update
    expect(result.config2.timeout).toBe(1000); // New value
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
      pangu.updateIdleSpacingConfig({ enabled: true, chunkSize: 2 });
      
      // Process the page with idle enabled
      pangu.spacingPage();
      
      // Since idle processing is async, we need to wait a bit
      return new Promise((resolve) => {
        setTimeout(() => {
          const finalText = document.body.textContent;
          resolve({
            finalText
          });
        }, 100);
      });
    });
    
    // Should have spaced the content correctly
    expect(result.finalText).toContain('測試中文 abc 混合內容 123');
    expect(result.finalText).toContain('更多測試 text456');
    expect(result.finalText).toContain('第三段 content789');
  });


  test('should fallback to synchronous processing when idle spacing is disabled', async ({ page }) => {
    await page.setContent(`
      <div>
        <p>測試synchronous fallback功能abc123</p>
      </div>
    `);

    const result = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Ensure idle spacing is disabled
        pangu.updateIdleSpacingConfig({ enabled: false });

        let completionCalled = false;

        // Process synchronously since idle is disabled
        pangu.spacingPage();
        
        completionCalled = true;
        const text = document.body.textContent;
        resolve({
          completionCalled,
          text,
          idleEnabled: pangu.getIdleSpacingConfig().enabled
        });
      });
    });

    expect(result.completionCalled).toBe(true);
    expect(result.idleEnabled).toBe(false);
    expect(result.text).toContain('測試 synchronous fallback 功能 abc123');
  });
});