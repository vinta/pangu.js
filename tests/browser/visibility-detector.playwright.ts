import { test, expect } from '@playwright/test';

test.describe('Visibility Detector', () => {
  test.beforeEach(async ({ page }) => {
    await page.addScriptTag({ path: 'dist/browser/pangu.umd.js' });
    await page.waitForFunction(() => typeof window.pangu !== 'undefined');

    // Disable taskScheduler for synchronous tests
    await page.evaluate(() => {
      pangu.taskScheduler.config.enabled = false;
    });
  });

  test('should detects all CSS hiding patterns when enabled', async ({ page }) => {
    await page.setContent('<div id="content"></div>');

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

  test('should skip spacing between hidden element and CJK', async ({ page }) => {
    await page.setContent('<div id="content"></div>');

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

  test('should skip spacing between hidden element and CJK with taskScheduler enabled', async ({ page }) => {
    await page.setContent('<div id="content"></div>');

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

      // Enable task scheduler
      pangu.taskScheduler.config.enabled = true;

      // Process with both visibility checking and async task scheduling
      // Use minimal delays for testing
      pangu.autoSpacingPage({ pageDelayMs: 10, nodeDelayMs: 10, nodeMaxWaitMs: 50 });

      // Since autoSpacingPage has an initial delay and task scheduling is async,
      // we need to wait for both the initial processing and any queued tasks
      return new Promise<{
        hiddenText: string | null;
        visibleText: string | null;
        startsWithSpace: boolean;
      }>((resolve) => {
        setTimeout(() => {
          const hiddenSpan = content.querySelector('.sr-only')!;
          const visibleSpan = content.querySelector('span:not(.sr-only)')!;

          resolve({
            hiddenText: hiddenSpan.textContent,
            visibleText: visibleSpan.textContent,
            // Should not start with space since previous element is hidden
            startsWithSpace: visibleSpan.textContent?.startsWith(' ') || false,
          });
        }, 150); // Wait for initial pageDelayMs + idle callback processing
      });
    });

    expect(result.hiddenText).toBe('Description:');
    expect(result.visibleText).toBe('測試 visibility check 功能');
    expect(result.startsWithSpace).toBe(false); // No unwanted space
  });

  test('should perform spacing between visible element and CJK', async ({ page }) => {
    await page.setContent('<div id="content"></div>');

    const result = await page.evaluate(() => {
      const content = document.getElementById('content')!;
      content.innerHTML = `
        <div>
          <span>第一個visible</span><span>第二個visible</span>
        </div>
      `;

      // Process with visibility checking enabled (synchronous)
      pangu.spacingPage();

      const spans = content.querySelectorAll('span');

      return {
        firstText: spans[0]!.textContent,
        secondText: spans[1]!.textContent,
        // Second span should start with space since first is visible
        secondStartsWithSpace: spans[1]!.textContent?.startsWith(' ') || false,
      };
    });

    expect(result.firstText).toBe('第一個 visible');
    expect(result.secondText).toBe(' 第二個 visible');
    expect(result.secondStartsWithSpace).toBe(true); // Space added between visible elements
  });

  test('should perform spacing with complex nested hidden structures', async ({ page }) => {
    await page.setContent('<div id="content"></div>');

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

      // Process with visibility checking (synchronous)
      pangu.spacingPage();

      // Get the spans we actually want by text content to avoid selector issues
      const allDivs = content.querySelectorAll('div');
      const visibleAfterHidden = content.querySelector('div.sr-only + span')!;
      let visibleNested = null;

      // Find the last div (which is not sr-only) and get its last span
      for (let i = allDivs.length - 1; i >= 0; i--) {
        if (!allDivs[i]!.classList.contains('sr-only')) {
          const spans = allDivs[i]!.querySelectorAll('span');
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

  test.skip('should reproduce Google Calendar with autoSpacingPage - with MutationObserver', async ({ page }) => {
    // This test simulates what happens when content is dynamically added after autoSpacingPage is started
    await page.setContent('<div id="content"></div>');

    const results = await page.evaluate(async () => {
      const content = document.getElementById('content')!;

      // Start autoSpacingPage FIRST, then add content
      pangu.taskScheduler.config.enabled = true;
      pangu.autoSpacingPage({ pageDelayMs: 10, nodeDelayMs: 10, nodeMaxWaitMs: 50 });

      // Wait for autoSpacing to initialize
      await new Promise((resolve) => setTimeout(resolve, 50));

      // NOW add the content (simulating dynamic content loading)
      content.innerHTML = `
        <style>
          .XuJrye {
            clip: rect(1px, 1px, 1px, 1px);
            height: 1px;
            overflow: hidden;
            position: absolute;
            -webkit-user-select: none;
            user-select: none;
            white-space: nowrap;
            width: 1px;
          }
        </style>
        <div class="toUqff vfzv" id="xDetDlgDesc"><span class="XuJrye">Description:</span><span jsaction="rcuQ6b:g0mjXe" jscontroller="BlntMb">一律轉整數，避免浮點數計算誤差

    更新文件說明計算邏輯
    <a href="https://www.google.com/url?q=https://docs.google.com/document/d/1234567890abcdef&amp;sa=D&amp;source=calendar&amp;usd=2&amp;usg=AOvVaw3-Pr87YEfleSmMDeSfJLfl" target="_blank">https://docs.google.com/document/d/1234567890abcdef</a>

    修改單元測試確保通過

    發布新版本到測試環境</span></div>
      `;

      // Wait for MutationObserver to process the changes
      await new Promise((resolve) => setTimeout(resolve, 200));

      const result = content.querySelector('span:not(.XuJrye)')!.textContent;

      return {
        text: result,
        startsWithSpace: result?.startsWith(' ') || false,
      };
    });

    // Should NOT start with space
    expect(results.startsWithSpace).toBe(false);
  });

  test('should reproduce Google Calendar with autoSpacingPage', async ({ page }) => {
    await page.setContent('<div id="content"></div>');

    const results = await page.evaluate(async () => {
      const content = document.getElementById('content')!;

      // Test both cases with autoSpacingPage
      pangu.taskScheduler.config.enabled = true;

      // Case 2: Complex content with links (testing this first)
      content.innerHTML = `
        <style>
          .XuJrye {
            clip: rect(1px, 1px, 1px, 1px);
            height: 1px;
            overflow: hidden;
            position: absolute;
            -webkit-user-select: none;
            user-select: none;
            white-space: nowrap;
            width: 1px;
          }
        </style>
        <div class="toUqff vfzv" id="xDetDlgDesc"><span class="XuJrye">Description:</span><span jsaction="rcuQ6b:g0mjXe" jscontroller="BlntMb">一律轉整數，避免浮點數計算誤差

    更新文件說明計算邏輯
    <a href="https://www.google.com/url?q=https://docs.google.com/document/d/1234567890abcdef&amp;sa=D&amp;source=calendar&amp;usd=2&amp;usg=AOvVaw3-Pr87YEfleSmMDeSfJLfl" target="_blank">https://docs.google.com/document/d/1234567890abcdef</a>

    修改單元測試確保通過

    發布新版本到測試環境</span></div>
      `;

      // Use autoSpacingPage instead of spacingPage
      pangu.autoSpacingPage({ pageDelayMs: 10, nodeDelayMs: 10, nodeMaxWaitMs: 50 });
      await new Promise((resolve) => setTimeout(resolve, 200)); // Wait longer for autoSpacingPage

      const result = content.querySelector('span:not(.XuJrye)')!.textContent;

      return {
        text: result,
        startsWithSpace: result?.startsWith(' ') || false,
      };
    });

    // Should NOT start with space
    expect(results.startsWithSpace).toBe(false);
  });

  test('should reproduce Google Calendar case differences', async ({ page }) => {
    await page.setContent('<div id="content"></div>');

    const results = await page.evaluate(async () => {
      const content = document.getElementById('content')!;

      // Test both cases
      pangu.taskScheduler.config.enabled = true;

      // Case 1: Simple content
      content.innerHTML = `
        <style>
          .XuJrye {
            clip: rect(1px, 1px, 1px, 1px);
            height: 1px;
            overflow: hidden;
            position: absolute;
            -webkit-user-select: none;
            user-select: none;
            white-space: nowrap;
            width: 1px;
          }
        </style>
        <div class="toUqff vfzv" id="xDetDlgDesc"><span class="XuJrye">Description:</span><span jsaction="rcuQ6b:g0mjXe" jscontroller="BlntMb">一律轉整數，避免浮點數計算誤差
    記得更新測試案例的預期結果</span></div>
      `;

      pangu.spacingPage();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const case1Result = content.querySelector('span:not(.XuJrye)')!.textContent;

      // Case 2: Complex content with links
      content.innerHTML = `
        <style>
          .XuJrye {
            clip: rect(1px, 1px, 1px, 1px);
            height: 1px;
            overflow: hidden;
            position: absolute;
            -webkit-user-select: none;
            user-select: none;
            white-space: nowrap;
            width: 1px;
          }
        </style>
        <div class="toUqff vfzv" id="xDetDlgDesc"><span class="XuJrye">Description:</span><span jsaction="rcuQ6b:g0mjXe" jscontroller="BlntMb">一律轉整數，避免浮點數計算誤差

    更新文件說明計算邏輯
    <a href="https://www.google.com/url?q=https://docs.google.com/document/d/1234567890abcdef&amp;sa=D&amp;source=calendar&amp;usd=2&amp;usg=AOvVaw3-Pr87YEfleSmMDeSfJLfl" target="_blank">https://docs.google.com/document/d/1234567890abcdef</a>

    修改單元測試確保通過

    發布新版本到測試環境</span></div>
      `;

      pangu.spacingPage();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const case2Result = content.querySelector('span:not(.XuJrye)')!.textContent;

      return {
        case1: {
          text: case1Result,
          startsWithSpace: case1Result?.startsWith(' ') || false,
        },
        case2: {
          text: case2Result,
          startsWithSpace: case2Result?.startsWith(' ') || false,
        },
      };
    });

    // Both should NOT start with space
    expect(results.case1.startsWithSpace).toBe(false);
    expect(results.case2.startsWithSpace).toBe(false);
  });

  test('should handle Google Calendar-like hidden description pattern correctly', async ({ page }) => {
    // Keep this guard even though spacing falls back to sync without requestIdleCallback:
    // this test compares sync mode against async (idle-callback) mode, and on WebKit both
    // halves would run the same sync path, making the comparison vacuous.
    const hasSupport = await page.evaluate(() => typeof window.requestIdleCallback === 'function');
    test.skip(!hasSupport, 'requestIdleCallback is not supported');

    await page.setContent('<div id="content"></div>');

    const results = await page.evaluate(async () => {
      const content = document.getElementById('content')!;
      // Reproduce the exact HTML structure from the screenshot
      content.innerHTML = `
        <style>
          .XuJrye {
            clip: rect(1px, 1px, 1px, 1px);
            height: 1px;
            overflow: hidden;
            position: absolute;
            -webkit-user-select: none;
            user-select: none;
            white-space: nowrap;
            width: 1px;
          }
        </style>
        <div class="toUqff vfzv" id="xDetDlgDesc">
          <span class="XuJrye">Description:</span><span jsaction="rcuQ6b:g0mjXe" jscontroller="BlntMb">一律轉整數，避免浮點數計算誤差 記得更新測試案例的預期結果</span>
        </div>
      `;

      // Test 1: Synchronous mode (should work correctly)
      pangu.taskScheduler.config.enabled = false;

      pangu.spacingPage();

      const syncResult = content.querySelector('span:not(.XuJrye)')!.textContent;

      // Reset content for async test
      content.innerHTML = `
        <style>
          .XuJrye {
            clip: rect(1px, 1px, 1px, 1px);
            height: 1px;
            overflow: hidden;
            position: absolute;
            -webkit-user-select: none;
            user-select: none;
            white-space: nowrap;
            width: 1px;
          }
        </style>
        <div class="toUqff vfzv" id="xDetDlgDesc">
          <span class="XuJrye">Description:</span><span jsaction="rcuQ6b:g0mjXe" jscontroller="BlntMb">一律轉整數，避免浮點數計算誤差 記得更新測試案例的預期結果</span>
        </div>
      `;

      // Test 2: Async mode with taskScheduler (currently has the bug)
      pangu.taskScheduler.config.enabled = true;

      pangu.spacingPage();

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      const asyncResult = content.querySelector('span:not(.XuJrye)')!.textContent;

      return {
        syncResult,
        asyncResult,
        syncStartsWithSpace: syncResult?.startsWith(' ') || false,
        asyncStartsWithSpace: asyncResult?.startsWith(' ') || false,
      };
    });

    // Both should NOT start with space since previous element is hidden
    expect(results.syncStartsWithSpace).toBe(false);
    expect(results.asyncStartsWithSpace).toBe(false);

    // Check the actual content
    expect(results.syncResult).toBe('一律轉整數，避免浮點數計算誤差 記得更新測試案例的預期結果');
    expect(results.asyncResult).toBe('一律轉整數，避免浮點數計算誤差 記得更新測試案例的預期結果');
  });

  test('should handle different clip rect formats', async ({ page }) => {
    await page.setContent('<div id="content"></div>');

    const result = await page.evaluate(() => {
      const content = document.getElementById('content')!;
      content.innerHTML = `
        <style>
          .hidden1 { clip: rect(1px, 1px, 1px, 1px); position: absolute; }
          .hidden2 { clip: rect(1px,1px,1px,1px); position: absolute; }
          .hidden3 { clip: rect(1px 1px 1px 1px); position: absolute; }
        </style>
        <div class="hidden1">Hidden 1</div>
        <div class="hidden2">Hidden 2</div>
        <div class="hidden3">Hidden 3</div>
      `;

      const hidden1 = content.querySelector('.hidden1')!;
      const hidden2 = content.querySelector('.hidden2')!;
      const hidden3 = content.querySelector('.hidden3')!;

      return {
        hidden1: pangu.visibilityDetector.isElementVisuallyHidden(hidden1),
        hidden2: pangu.visibilityDetector.isElementVisuallyHidden(hidden2),
        hidden3: pangu.visibilityDetector.isElementVisuallyHidden(hidden3),
      };
    });

    // All should be detected as hidden
    expect(result.hidden1).toBe(true);
    expect(result.hidden2).toBe(true);
    expect(result.hidden3).toBe(true);
  });

  test('should debug text node processing order with visibility detection', async ({ page }) => {
    await page.setContent('<div id="content"></div>');

    const debugInfo = await page.evaluate(async () => {
      const content = document.getElementById('content')!;
      content.innerHTML = `
        <style>
          .XuJrye {
            clip: rect(1px, 1px, 1px, 1px);
            height: 1px;
            overflow: hidden;
            position: absolute;
            -webkit-user-select: none;
            user-select: none;
            white-space: nowrap;
            width: 1px;
          }
        </style>
        <div class="toUqff vfzv" id="xDetDlgDesc">
          <span class="XuJrye">Description:</span><span jsaction="rcuQ6b:g0mjXe" jscontroller="BlntMb">一律轉整數</span>
        </div>
      `;

      pangu.taskScheduler.config.enabled = true;

      // Process the page
      pangu.spacingPage();

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Get the final result
      const visibleSpan = content.querySelector('span:not(.XuJrye)')!;
      const finalText = visibleSpan.textContent;

      return {
        finalText,
        startsWithSpace: finalText?.startsWith(' ') || false,
      };
    });

    // The visible text should not start with space
    expect(debugInfo.startsWithSpace).toBe(false);
    expect(debugInfo.finalText).toBe('一律轉整數');
  });
});
