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

  test('should have idle spacing disabled by default', async ({ page }) => {
    const config = await page.evaluate(() => {
      return pangu.getIdleSpacingConfig();
    });

    expect(config.enabled).toBe(false);
    expect(config.chunkSize).toBe(10);
    expect(config.timeout).toBe(5000);
  });

  test('should enable idle spacing with default config', async ({ page }) => {
    const result = await page.evaluate(() => {
      pangu.enableIdleSpacing();
      return pangu.getIdleSpacingConfig();
    });

    expect(result.enabled).toBe(true);
    expect(result.chunkSize).toBe(10);
    expect(result.timeout).toBe(5000);
  });

  test('should enable idle spacing with custom config', async ({ page }) => {
    const result = await page.evaluate(() => {
      pangu.enableIdleSpacing({
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
      pangu.enableIdleSpacing();
      let configBefore = pangu.getIdleSpacingConfig();
      
      // Disable it
      pangu.disableIdleSpacing();
      let configAfter = pangu.getIdleSpacingConfig();
      
      return {
        enabledBefore: configBefore.enabled,
        enabledAfter: configAfter.enabled,
        queueLength: pangu.getIdleQueueLength()
      };
    });

    expect(result.enabledBefore).toBe(true);
    expect(result.enabledAfter).toBe(false);
    expect(result.queueLength).toBe(0);
  });

  test('should provide queue management methods', async ({ page }) => {
    const result = await page.evaluate(() => {
      // Initial queue length
      const initialLength = pangu.getIdleQueueLength();
      
      // Clear queue (should be no-op if empty)
      pangu.clearIdleQueue();
      const lengthAfterClear = pangu.getIdleQueueLength();
      
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
      pangu.enableIdleSpacing();
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
      pangu.disableIdleSpacing();
      
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
      pangu.enableIdleSpacing({ chunkSize: 5 });
      const config1 = pangu.getIdleSpacingConfig();
      
      // Update again with different partial config
      pangu.enableIdleSpacing({ timeout: 1000 });
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
});