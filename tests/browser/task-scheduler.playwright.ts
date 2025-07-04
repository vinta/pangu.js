import './global';
import { test, expect } from '@playwright/test';

test.describe('TaskScheduler Enabled', () => {
  test.beforeEach(async ({ page }) => {
    const hasSupport = await page.evaluate(() => typeof window.requestIdleCallback === 'function');
    test.skip(!hasSupport, 'requestIdleCallback is not supported');
  });

  test.beforeEach(async ({ page }) => {
    await page.addScriptTag({ path: 'dist/browser/pangu.umd.js' });
    await page.waitForFunction(() => typeof window.pangu !== 'undefined');
  });

  test('should be able to enable taskScheduler', async ({ page }) => {
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

  test('should process page content asynchronously', async ({ page }) => {
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
      pangu.taskScheduler.config.enabled = true;
      pangu.taskScheduler.config.chunkSize = 2;

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

  test('should process dynamic content asynchronously', async ({ page }) => {
    await page.evaluate(async () => {
      pangu.taskScheduler.config.enabled = true;
      pangu.taskScheduler.config.chunkSize = 2;
      pangu.autoSpacingPage({ pageDelayMs: 0, nodeDelayMs: 50, nodeMaxWaitMs: 100 });
    });

    await page.waitForTimeout(50);

    // Dynamically add content after autoSpacingPage is active
    await page.evaluate(() => {
      const div = document.createElement('div');
      div.textContent = '小明在開發軟體時總是嚴格地遵循各項協定與標準，直到他看了ISO 3166-1';
      div.id = 'test-div';
      document.body.appendChild(div);
    });

    await page.waitForTimeout(600);

    const result = await page.evaluate(() => document.getElementById('test-div')!.textContent);
    expect(result).toBe('小明在開發軟體時總是嚴格地遵循各項協定與標準，直到他看了 ISO 3166-1');
  });

  test('should handle bulk content changes', async ({ page }) => {
    const result = await page.evaluate(async () => {
      pangu.taskScheduler.config.enabled = true;
      pangu.taskScheduler.config.chunkSize = 3;
      pangu.autoSpacingPage({ pageDelayMs: 0, nodeDelayMs: 50, nodeMaxWaitMs: 100 });

      const content = document.getElementById('content')!;

      // Add multiple elements at once
      const fragment = document.createDocumentFragment();
      for (let i = 1; i <= 5; i++) {
        const div = document.createElement('div');
        div.className = `item-${i}`;
        div.textContent = `項目${i}item`;
        fragment.appendChild(div);
      }
      content.appendChild(fragment);

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 300));

      const texts = [];
      for (let i = 1; i <= 5; i++) {
        const elem = content.querySelector(`.item-${i}`);
        if (elem) {
          texts.push(elem.textContent);
        }
      }
      return texts;
    });

    expect(result).toEqual(['項目 1item', '項目 2item', '項目 3item', '項目 4item', '項目 5item']);
  });

  test('should handle rapid content changes with debounce', async ({ page }) => {
    const result = await page.evaluate(async () => {
      pangu.taskScheduler.config.enabled = true;

      // Track how many times the observer processes mutations
      let processingCount = 0;
      const originalSpacingNode = pangu.spacingNode.bind(pangu);
      pangu.spacingNode = function (node: Node) {
        processingCount++;
        return originalSpacingNode(node);
      };

      pangu.autoSpacingPage({ pageDelayMs: 0, nodeDelayMs: 100, nodeMaxWaitMs: 200 });

      const content = document.getElementById('content')!;
      const div = document.createElement('div');
      content.appendChild(div);

      // Make rapid changes
      div.textContent = '初始initial';
      await new Promise((resolve) => setTimeout(resolve, 50));

      div.textContent = '更新update';
      await new Promise((resolve) => setTimeout(resolve, 50));

      div.textContent = '最終final文本text';

      // Wait for debounced processing
      await new Promise((resolve) => setTimeout(resolve, 300));

      return {
        text: div.textContent,
        processingCount,
      };
    });

    expect(result.text?.trim()).toBe('最終 final 文本 text');
    expect(result.processingCount).toBe(1);
  });
});
