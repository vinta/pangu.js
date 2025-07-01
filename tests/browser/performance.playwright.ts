import type { BrowserPangu } from '../../dist/browser/pangu';
import { test, expect } from '@playwright/test';

declare global {
  const pangu: BrowserPangu;
  interface Window {
    // @ts-expect-error - pangu is defined in the global scope
    pangu: BrowserPangu;
  }
}

test.describe('Performance Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    await page.addScriptTag({ path: 'dist/browser/pangu.umd.js' });
    await page.waitForFunction(() => typeof window.pangu !== 'undefined');
  });

  test('should measure performance when enabled', async ({ page }) => {
    await page.setContent(`
      <div>
        <p>測試中文abc混合內容123</p>
        <span>更多測試text456</span>
        <div>最後一段測試content789</div>
      </div>
    `);

    const result = await page.evaluate(() => {
      // Enable performance monitoring
      pangu.enablePerformanceMonitoring();
      pangu.resetPerformanceMetrics();

      // Run spacing multiple times to generate metrics
      pangu.spacingPageBody();
      pangu.spacingPageBody();
      pangu.spacingPageBody();

      // Get performance report
      const report = pangu.getPerformanceReport();
      
      return {
        hasData: Object.keys(report).length > 0,
        metrics: report,
        spacingPageBodyStats: pangu.getPerformanceStats('spacingPageBody'),
        collectTextNodesStats: pangu.getPerformanceStats('collectTextNodes'),
        processTextNodesStats: pangu.getPerformanceStats('processTextNodes')
      };
    });

    // Should have performance data
    expect(result.hasData).toBe(true);
    
    // Should have measured key operations
    expect(result.spacingPageBodyStats).toBeTruthy();
    expect(result.spacingPageBodyStats?.count).toBe(3);
    expect(result.spacingPageBodyStats?.avg).toBeGreaterThan(0);
    
    expect(result.collectTextNodesStats).toBeTruthy();
    expect(result.collectTextNodesStats?.count).toBe(3);
    
    expect(result.processTextNodesStats).toBeTruthy();
    expect(result.processTextNodesStats?.count).toBe(3);

    // All timings should be non-negative (can be 0 for very fast operations)
    expect(result.spacingPageBodyStats?.min).toBeGreaterThanOrEqual(0);
    expect(result.spacingPageBodyStats?.max).toBeGreaterThanOrEqual(result.spacingPageBodyStats?.min);
    expect(result.spacingPageBodyStats?.total).toBeGreaterThanOrEqual(0);
  });

  test('should not measure performance when disabled', async ({ page }) => {
    await page.setContent(`
      <div>
        <p>測試中文abc混合內容123</p>
      </div>
    `);

    const result = await page.evaluate(() => {
      // Disable performance monitoring
      pangu.disablePerformanceMonitoring();
      pangu.resetPerformanceMetrics();

      // Run spacing
      pangu.spacingPageBody();

      // Get performance report
      const report = pangu.getPerformanceReport();
      
      return {
        hasData: Object.keys(report).length > 0,
        metrics: report
      };
    });

    // Should have no performance data when disabled
    expect(result.hasData).toBe(false);
    expect(result.metrics).toEqual({});
  });

  test('should handle performance API integration', async ({ page }) => {
    await page.setContent(`
      <div>
        <p>測試performance API整合abc123</p>
      </div>
    `);

    const result = await page.evaluate(() => {
      // Enable performance monitoring
      pangu.enablePerformanceMonitoring();
      pangu.resetPerformanceMetrics();

      // Clear any existing performance marks
      performance.clearMarks();
      performance.clearMeasures();

      // Add performance marks
      performance.mark('pangu-test-start');
      pangu.spacingPageBody();
      performance.mark('pangu-test-end');
      performance.measure('pangu-test-total', 'pangu-test-start', 'pangu-test-end');

      // Get both our metrics and Performance API data
      const report = pangu.getPerformanceReport();
      const performanceEntries = performance.getEntriesByType('measure')
        .filter(entry => entry.name.startsWith('pangu-test'));

      return {
        report,
        performanceEntries: performanceEntries.map(entry => ({
          name: entry.name,
          duration: entry.duration
        }))
      };
    });

    // Should have our performance data
    expect(Object.keys(result.report).length).toBeGreaterThan(0);
    
    // Should have Performance API data
    expect(result.performanceEntries.length).toBe(1);
    expect(result.performanceEntries[0].name).toBe('pangu-test-total');
    expect(result.performanceEntries[0].duration).toBeGreaterThan(0);
  });

  test('should reset metrics correctly', async ({ page }) => {
    await page.setContent(`
      <div>
        <p>測試reset功能abc123</p>
      </div>
    `);

    const result = await page.evaluate(() => {
      // Enable performance monitoring
      pangu.enablePerformanceMonitoring();
      
      // Run spacing to generate metrics
      pangu.spacingPageBody();
      const reportBefore = pangu.getPerformanceReport();
      
      // Reset metrics
      pangu.resetPerformanceMetrics();
      const reportAfter = pangu.getPerformanceReport();
      
      return {
        beforeReset: Object.keys(reportBefore).length,
        afterReset: Object.keys(reportAfter).length
      };
    });

    expect(result.beforeReset).toBeGreaterThan(0);
    expect(result.afterReset).toBe(0);
  });
});