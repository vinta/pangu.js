import './global';
import { test, expect } from '@playwright/test';

test.describe('Visibility Detector Enabled', () => {
  test.beforeEach(async ({ page }) => {
    await page.addScriptTag({ path: 'dist/browser/pangu.umd.js' });
    await page.waitForFunction(() => typeof window.pangu !== 'undefined');

    // Disable taskScheduler for synchronous tests
    await page.evaluate(() => {
      pangu.taskScheduler.config.enabled = false;
    });
  });

  test('should detects all CSS hiding patterns when enabled', async ({ page }) => {
    const result = await page.evaluate(() => {
      const content = document.getElementById('content')!;
      content.innerHTML = `
        <style>
          .sr-only { clip: rect(1px, 1px, 1px, 1px); height: 1px; overflow: hidden; position: absolute; width: 1px; }
          .visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); }
          .hidden { display: none; }
          .invisible { visibility: hidden; }
          .opacity-zero { opacity: 0; }
        </style>
        <div>
          <span class="sr-only">SR Only:</span>
          <span class="visually-hidden">Visually Hidden:</span>
          <span class="hidden">Display None:</span>
          <span class="invisible">Visibility Hidden:</span>
          <span class="opacity-zero">Opacity Zero:</span>
          <span>Visible text</span>
        </div>
      `;

      // Enable visibility checking
      pangu.visibilityDetector.config.enabled = true;

      // Test the helper method for visibility detection
      const spans = content.querySelectorAll('span');
      const visibilityResults = Array.from(spans).map((span) => ({
        className: span.className,
        text: span.textContent,
        isHidden: pangu.isElementVisuallyHidden(span),
      }));

      return visibilityResults;
    });

    expect(result).toEqual([
      { className: 'sr-only', text: 'SR Only:', isHidden: true },
      { className: 'visually-hidden', text: 'Visually Hidden:', isHidden: true },
      { className: 'hidden', text: 'Display None:', isHidden: true },
      { className: 'invisible', text: 'Visibility Hidden:', isHidden: true },
      { className: 'opacity-zero', text: 'Opacity Zero:', isHidden: true },
      { className: '', text: 'Visible text', isHidden: false },
    ]);
  });

  test('should return false for all elements when visibility detection is disabled', async ({ page }) => {
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
        <span class="sr-only">Description:</span><span>一律轉整數</span>
      `;

      const hiddenSpan = content.querySelector('.sr-only')!;
      const visibleSpan = content.querySelector('span:not(.sr-only)')!;

      // Test with visibility check disabled
      pangu.visibilityDetector.config.enabled = false;
      const hiddenCheckDisabled = pangu.isElementVisuallyHidden(hiddenSpan);
      const visibleCheckDisabled = pangu.isElementVisuallyHidden(visibleSpan);

      // Test with visibility check enabled
      pangu.visibilityDetector.config.enabled = true;
      const hiddenCheckEnabled = pangu.isElementVisuallyHidden(hiddenSpan);
      const visibleCheckEnabled = pangu.isElementVisuallyHidden(visibleSpan);

      return {
        disabled: {
          hiddenIsHidden: hiddenCheckDisabled,
          visibleIsHidden: visibleCheckDisabled,
        },
        enabled: {
          hiddenIsHidden: hiddenCheckEnabled,
          visibleIsHidden: visibleCheckEnabled,
        },
      };
    });

    // When disabled, always returns false
    expect(result.disabled.hiddenIsHidden).toBe(false);
    expect(result.disabled.visibleIsHidden).toBe(false);

    // When enabled, correctly detects visibility
    expect(result.enabled.hiddenIsHidden).toBe(true);
    expect(result.enabled.visibleIsHidden).toBe(false);
  });

  test('should skip spacing between hidden element and CJK', async ({ page }) => {
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
        <div>
          <span class="sr-only">Description:</span><span>測試visibility check功能</span>
        </div>
      `;

      // Enable visibility checking
      pangu.visibilityDetector.config.enabled = true;

      // Process with visibility-aware spacing (synchronous)
      pangu.spacingPage();

      const hiddenSpan = content.querySelector('.sr-only')!;
      const visibleSpan = content.querySelector('span:not(.sr-only)')!;

      return {
        hiddenText: hiddenSpan.textContent,
        visibleText: visibleSpan.textContent,
        // Should not start with space since previous element is hidden
        startsWithSpace: visibleSpan.textContent?.startsWith(' ') || false,
      };
    });

    expect(result.hiddenText).toBe('Description:');
    expect(result.visibleText).toBe('測試 visibility check 功能');
    expect(result.startsWithSpace).toBe(false); // No unwanted space
  });

  test('should perform spacing between visible element and CJK', async ({ page }) => {
    const result = await page.evaluate(() => {
      const content = document.getElementById('content')!;
      content.innerHTML = `
        <div>
          <span>第一個visible</span><span>第二個visible</span>
        </div>
      `;

      pangu.visibilityDetector.config.enabled = true;

      // Process with visibility checking enabled (synchronous)
      pangu.spacingPage();

      const spans = content.querySelectorAll('span');

      return {
        firstText: spans[0].textContent,
        secondText: spans[1].textContent,
        // Second span should start with space since first is visible
        secondStartsWithSpace: spans[1].textContent?.startsWith(' ') || false,
      };
    });

    expect(result.firstText).toBe('第一個 visible');
    expect(result.secondText).toBe(' 第二個 visible');
    expect(result.secondStartsWithSpace).toBe(true); // Space added between visible elements
  });

  test('should perform spacing with complex nested hidden structures', async ({ page }) => {
    const result = await page.evaluate(() => {
      const content = document.getElementById('content')!;
      content.innerHTML = `
        <style>
          .sr-only { clip: rect(1px, 1px, 1px, 1px); height: 1px; overflow: hidden; position: absolute; width: 1px; }
        </style>
        <div>
          <div class="sr-only">
            <span>Hidden parent</span>
            <span>Hidden child</span>
          </div>
          <span>Visible after hidden parent</span>
          <div>
            <span class="sr-only">Hidden nested</span>
            <span>Visible nested</span>
          </div>
        </div>
      `;

      pangu.visibilityDetector.config.enabled = true;

      // Process with visibility checking (synchronous)
      pangu.spacingPage();

      // Get the spans we actually want by text content to avoid selector issues
      const allDivs = content.querySelectorAll('div');
      const visibleAfterHidden = content.querySelector('div.sr-only + span')!;
      let visibleNested = null;

      // Find the last div (which is not sr-only) and get its last span
      for (let i = allDivs.length - 1; i >= 0; i--) {
        if (!allDivs[i].classList.contains('sr-only')) {
          const spans = allDivs[i].querySelectorAll('span');
          visibleNested = spans[spans.length - 1]; // Get the last span in this div
          break;
        }
      }

      return {
        visibleAfterHiddenText: visibleAfterHidden.textContent,
        visibleNestedText: visibleNested?.textContent || '',
        // Neither should start with space due to hidden adjacent elements
        afterHiddenStartsWithSpace: visibleAfterHidden.textContent?.startsWith(' ') || false,
        nestedStartsWithSpace: visibleNested?.textContent?.startsWith(' ') || false,
      };
    });

    expect(result.visibleAfterHiddenText).toBe('Visible after hidden parent');
    expect(result.visibleNestedText).toBe('Visible nested');
    expect(result.afterHiddenStartsWithSpace).toBe(false);
    expect(result.nestedStartsWithSpace).toBe(false);
  });
});
