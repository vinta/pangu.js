import type { BrowserPangu } from '../../dist/browser/pangu';
import { test, expect } from '@playwright/test';

declare global {
  const pangu: BrowserPangu;
  interface Window {
    // @ts-expect-error - pangu is defined in the global scope
    pangu: BrowserPangu;
  }
}

test.describe('CSS Visibility Check Debug', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('data:text/html,<html><head><title>Test</title></head><body><div id="content"></div></body></html>');
    await page.addScriptTag({ path: 'dist/browser/pangu.umd.js' });
    await page.waitForFunction(() => typeof window.pangu !== 'undefined');
  });

  test('debug simple visible elements spacing with visibility check enabled', async ({ page }) => {
    const result = await page.evaluate(() => {
      const content = document.getElementById('content')!;
      content.innerHTML = `<span>第一個visible</span><span>第二個visible</span>`;
      
      // Enable visibility checking
      pangu.enableVisibilityCheck();
      
      const spans = content.querySelectorAll('span');
      const span1 = spans[0];
      const span2 = spans[1];
      
      // Check visibility status of both spans
      const span1Hidden = pangu.isElementVisuallyHidden(span1);
      const span2Hidden = pangu.isElementVisuallyHidden(span2);
      
      // Process the content
      pangu.spacingPage();
      
      return {
        span1Text: span1.textContent,
        span2Text: span2.textContent,
        span1Hidden,
        span2Hidden,
        visibilityCheckEnabled: pangu.getVisibilityCheckConfig().enabled
      };
    });

    expect(result.visibilityCheckEnabled).toBe(true);
    expect(result.span1Hidden).toBe(false);
    expect(result.span2Hidden).toBe(false);
    expect(result.span1Text).toBe('第一個 visible');
    // The second span should start with space since both are visible
    expect(result.span2Text).toBe(' 第二個 visible');
  });

  test('debug simple hidden-visible element spacing', async ({ page }) => {
    const result = await page.evaluate(() => {
      const content = document.getElementById('content')!;
      content.innerHTML = `
        <style>
          .sr-only { 
            clip: rect(1px, 1px, 1px, 1px); 
            height: 1px; 
            overflow: hidden; 
            position: absolute; 
            width: 1px; 
          }
        </style>
        <span class="sr-only">Hidden</span><span>Visible</span>
      `;
      
      // Enable visibility checking
      pangu.enableVisibilityCheck();
      
      const spans = content.querySelectorAll('span');
      const hiddenSpan = spans[0];
      const visibleSpan = spans[1];
      
      // Check visibility status
      const hiddenIsHidden = pangu.isElementVisuallyHidden(hiddenSpan);
      const visibleIsHidden = pangu.isElementVisuallyHidden(visibleSpan);
      
      // Process the content
      pangu.spacingPage();
      
      return {
        hiddenText: hiddenSpan.textContent,
        visibleText: visibleSpan.textContent,
        hiddenIsHidden,
        visibleIsHidden,
        visibleStartsWithSpace: visibleSpan.textContent?.startsWith(' ') || false
      };
    });

    expect(result.hiddenIsHidden).toBe(true);
    expect(result.visibleIsHidden).toBe(false);
    expect(result.hiddenText).toBe('Hidden');
    expect(result.visibleText).toBe('Visible');
    // Should NOT start with space since previous element is hidden
    expect(result.visibleStartsWithSpace).toBe(false);
  });

  test('debug without visibility check enabled', async ({ page }) => {
    const result = await page.evaluate(() => {
      const content = document.getElementById('content')!;
      content.innerHTML = `<span>第一個visible</span><span>第二個visible</span>`;
      
      // Ensure visibility checking is disabled
      pangu.disableVisibilityCheck();
      
      // Process the content
      pangu.spacingPage();
      
      const spans = content.querySelectorAll('span');
      
      return {
        span1Text: spans[0].textContent,
        span2Text: spans[1].textContent,
        visibilityCheckEnabled: pangu.getVisibilityCheckConfig().enabled
      };
    });

    expect(result.visibilityCheckEnabled).toBe(false);
    expect(result.span1Text).toBe('第一個 visible');
    expect(result.span2Text).toBe(' 第二個 visible');
  });
});