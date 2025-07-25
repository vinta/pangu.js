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

  test('should skip spacing between hidden element and CJK with taskScheduler enabled', async ({ page }) => {
    const hasSupport = await page.evaluate(() => typeof window.requestIdleCallback === 'function');
    test.skip(!hasSupport, 'requestIdleCallback is not supported');

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

      // Enable both visibility detector and task scheduler
      pangu.visibilityDetector.config.enabled = true;
      pangu.taskScheduler.config.enabled = true;
      // pangu.taskScheduler.config.chunkSize = 2; // Small chunk size to test async processing

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

  test.skip('should reproduce Google Calendar with autoSpacingPage - with MutationObserver', async ({ page }) => {
    const hasSupport = await page.evaluate(() => typeof window.requestIdleCallback === 'function');
    test.skip(!hasSupport, 'requestIdleCallback is not supported');

    // This test simulates what happens when content is dynamically added after autoSpacingPage is started
    await page.setContent('<div id="content"></div>');

    const results = await page.evaluate(async () => {
      const content = document.getElementById('content')!;

      // Start autoSpacingPage FIRST, then add content
      pangu.visibilityDetector.config.enabled = true;
      pangu.taskScheduler.config.enabled = true;
      pangu.autoSpacingPage({ pageDelayMs: 10, nodeDelayMs: 10, nodeMaxWaitMs: 50 });

      // Wait for autoSpacing to initialize
      await new Promise(resolve => setTimeout(resolve, 50));

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
      await new Promise(resolve => setTimeout(resolve, 200));

      const result = content.querySelector('span:not(.XuJrye)')!.textContent;

      return {
        text: result,
        startsWithSpace: result?.startsWith(' ') || false,
        firstChar: result?.charAt(0),
        first10Chars: result?.substring(0, 10)
      };
    });

    console.log('Result starts with space:', results.startsWithSpace);
    console.log('First char:', JSON.stringify(results.firstChar));
    console.log('First 10 chars:', JSON.stringify(results.first10Chars));

    // Should NOT start with space
    expect(results.startsWithSpace).toBe(false);
  });

  test('should reproduce Google Calendar with autoSpacingPage', async ({ page }) => {
    const hasSupport = await page.evaluate(() => typeof window.requestIdleCallback === 'function');
    test.skip(!hasSupport, 'requestIdleCallback is not supported');

    await page.setContent('<div id="content"></div>');

    const results = await page.evaluate(async () => {
      const content = document.getElementById('content')!;

      // Test both cases with autoSpacingPage
      pangu.visibilityDetector.config.enabled = true;
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
      await new Promise(resolve => setTimeout(resolve, 200)); // Wait longer for autoSpacingPage

      const result = content.querySelector('span:not(.XuJrye)')!.textContent;

      return {
        text: result,
        startsWithSpace: result?.startsWith(' ') || false,
        firstChar: result?.charAt(0),
        first10Chars: result?.substring(0, 10)
      };
    });

    console.log('Result starts with space:', results.startsWithSpace);
    console.log('First char:', JSON.stringify(results.firstChar));
    console.log('First 10 chars:', JSON.stringify(results.first10Chars));

    // Should NOT start with space
    expect(results.startsWithSpace).toBe(false);
  });

  test('should reproduce Google Calendar case differences', async ({ page }) => {
    const hasSupport = await page.evaluate(() => typeof window.requestIdleCallback === 'function');
    test.skip(!hasSupport, 'requestIdleCallback is not supported');

    await page.setContent('<div id="content"></div>');

    const results = await page.evaluate(async () => {
      const content = document.getElementById('content')!;

      // Test both cases
      pangu.visibilityDetector.config.enabled = true;
      pangu.taskScheduler.config.enabled = true;

      // Helper to collect text nodes
      const collectTextNodes = (element: Element) => {
        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              if (!node.nodeValue || !/\S/.test(node.nodeValue)) {
                return NodeFilter.FILTER_REJECT;
              }
              return NodeFilter.FILTER_ACCEPT;
            }
          }
        );

        const nodes: { text: string; parentTag: string; parentClass: string }[] = [];
        while (walker.nextNode()) {
          const node = walker.currentNode;
          const parent = node.parentElement;
          nodes.push({
            text: node.textContent || '',
            parentTag: parent?.tagName || '',
            parentClass: parent?.className || ''
          });
        }
        return nodes;
      };

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

      const case1NodesBefore = collectTextNodes(content);

      pangu.spacingPage();
      await new Promise(resolve => setTimeout(resolve, 100));

      const case1Result = content.querySelector('span:not(.XuJrye)')!.textContent;
      const case1NodesAfter = collectTextNodes(content);

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

      const case2NodesBefore = collectTextNodes(content);

      pangu.spacingPage();
      await new Promise(resolve => setTimeout(resolve, 100));

      const case2Result = content.querySelector('span:not(.XuJrye)')!.textContent;
      const case2NodesAfter = collectTextNodes(content);

      return {
        case1: {
          text: case1Result,
          startsWithSpace: case1Result?.startsWith(' ') || false,
          firstChar: case1Result?.charAt(0),
          nodesBefore: case1NodesBefore,
          nodesAfter: case1NodesAfter
        },
        case2: {
          text: case2Result,
          startsWithSpace: case2Result?.startsWith(' ') || false,
          firstChar: case2Result?.charAt(0),
          nodesBefore: case2NodesBefore,
          nodesAfter: case2NodesAfter
        }
      };
    });

    console.log('Case 1 starts with space:', results.case1.startsWithSpace, 'First char:', JSON.stringify(results.case1.firstChar));
    console.log('Case 1 nodes before:', results.case1.nodesBefore);
    console.log('Case 1 nodes after:', results.case1.nodesAfter);

    console.log('Case 2 starts with space:', results.case2.startsWithSpace, 'First char:', JSON.stringify(results.case2.firstChar));
    console.log('Case 2 nodes before:', results.case2.nodesBefore);
    console.log('Case 2 nodes after:', results.case2.nodesAfter);

    // Both should NOT start with space
    expect(results.case1.startsWithSpace).toBe(false);
    expect(results.case2.startsWithSpace).toBe(false);
  });

  test('should handle Google Calendar-like hidden description pattern correctly', async ({ page }) => {
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
      pangu.visibilityDetector.config.enabled = true;
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
      pangu.taskScheduler.config.chunkSize = 2;

      pangu.spacingPage();

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

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

      pangu.visibilityDetector.config.enabled = true;

      const hidden1 = content.querySelector('.hidden1')!;
      const hidden2 = content.querySelector('.hidden2')!;
      const hidden3 = content.querySelector('.hidden3')!;

      return {
        hidden1: {
          clip: getComputedStyle(hidden1).clip,
          isHidden: pangu.visibilityDetector.isElementVisuallyHidden(hidden1)
        },
        hidden2: {
          clip: getComputedStyle(hidden2).clip,
          isHidden: pangu.visibilityDetector.isElementVisuallyHidden(hidden2)
        },
        hidden3: {
          clip: getComputedStyle(hidden3).clip,
          isHidden: pangu.visibilityDetector.isElementVisuallyHidden(hidden3)
        }
      };
    });

    console.log('Clip rect formats:', JSON.stringify(result, null, 2));

    // All should be detected as hidden
    expect(result.hidden1.isHidden).toBe(true);
    expect(result.hidden2.isHidden).toBe(true);
    expect(result.hidden3.isHidden).toBe(true);
  });

  test('should debug text node processing order with visibility detection', async ({ page }) => {
    const hasSupport = await page.evaluate(() => typeof window.requestIdleCallback === 'function');
    test.skip(!hasSupport, 'requestIdleCallback is not supported');

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

      // Enable visibility detection FIRST
      pangu.visibilityDetector.config.enabled = true;
      pangu.taskScheduler.config.enabled = true;
      pangu.taskScheduler.config.chunkSize = 1; // Process one at a time to see the order

      // Collect text nodes manually to debug
      const walker = document.createTreeWalker(
        content,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            if (!node.nodeValue || !/\S/.test(node.nodeValue)) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const textNodes: { text: string; parentClass: string | null; isHidden: boolean; computedStyle?: any }[] = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const parent = node.parentElement;
        let computedStyle = null;
        if (parent && parent.className === 'XuJrye') {
          const style = getComputedStyle(parent);
          computedStyle = {
            clip: style.clip,
            position: style.position,
            width: style.width,
            height: style.height,
            overflow: style.overflow
          };
        }
        textNodes.push({
          text: node.textContent || '',
          parentClass: parent?.className || null,
          isHidden: parent ? pangu.visibilityDetector.isElementVisuallyHidden(parent) : false,
          computedStyle
        });
      }

      // Process the page
      pangu.spacingPage();

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 200));

      // Get the final result
      const visibleSpan = content.querySelector('span:not(.XuJrye)')!;
      const finalText = visibleSpan.textContent;

      return {
        textNodes,
        finalText,
        startsWithSpace: finalText?.startsWith(' ') || false
      };
    });

    console.log('Debug info:', JSON.stringify(debugInfo, null, 2));

    // The visible text should not start with space
    expect(debugInfo.startsWithSpace).toBe(false);
    expect(debugInfo.finalText).toBe('一律轉整數');
  });
});
