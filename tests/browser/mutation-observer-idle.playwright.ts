import type { BrowserPangu } from '../../dist/browser/pangu';
import { test, expect } from '@playwright/test';

declare global {
  const pangu: BrowserPangu;
  interface Window {
    // @ts-expect-error - pangu is defined in the global scope
    pangu: BrowserPangu;
  }
}

test.describe('MutationObserver Idle Processing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('data:text/html,<html><head><title>Test</title></head><body><div id="content"></div></body></html>');
    await page.addScriptTag({ path: 'dist/browser/pangu.umd.js' });
    await page.waitForFunction(() => typeof window.pangu !== 'undefined');
  });

  // Skip all tests in this describe block if requestIdleCallback is not supported
  test.beforeEach(async ({ page, browserName }) => {
    const hasSupport = await page.evaluate(() => typeof window.requestIdleCallback === 'function');
    if (!hasSupport) {
      test.skip(browserName === 'webkit', 'requestIdleCallback is not supported in WebKit/Safari');
    }
  });

  test('should process dynamic content with idle processing when enabled', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Enable idle processing and auto-spacing
      pangu.taskScheduler.config.enabled = true;
      pangu.taskScheduler.config.chunkSize = 2;
      pangu.autoSpacingPage({ pageDelayMs: 0, nodeDelayMs: 50, nodeMaxWaitMs: 100 });
      
      const content = document.getElementById('content')!;
      
      // Add content dynamically
      const div = document.createElement('div');
      div.textContent = '動態dynamic內容content';
      content.appendChild(div);
      
      // Wait for MutationObserver to process
      await new Promise(resolve => setTimeout(resolve, 200));
      
      return div.textContent;
    });

    expect(result?.trim()).toBe('動態 dynamic 內容 content');
  });

  test('should process dynamic content synchronously when idle disabled', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Disable idle processing
      pangu.taskScheduler.config.enabled = false;
      pangu.autoSpacingPage({ pageDelayMs: 0, nodeDelayMs: 50, nodeMaxWaitMs: 100 });
      
      const content = document.getElementById('content')!;
      
      // Add content dynamically
      const div = document.createElement('div');
      div.textContent = '同步sync處理process';
      content.appendChild(div);
      
      // Wait for MutationObserver to process
      await new Promise(resolve => setTimeout(resolve, 200));
      
      return div.textContent;
    });

    expect(result?.trim()).toBe('同步 sync 處理 process');
  });

  test('should handle bulk dynamic content additions', async ({ page }) => {
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
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Collect results
      const texts = [];
      for (let i = 1; i <= 5; i++) {
        const elem = content.querySelector(`.item-${i}`);
        if (elem) {
          texts.push(elem.textContent);
        }
      }
      
      return texts;
    });

    expect(result).toEqual([
      '項目 1item',
      '項目 2item',
      '項目 3item',
      '項目 4item',
      '項目 5item'
    ]);
  });

  test('should handle rapid content changes with debouncing', async ({ page }) => {
    const result = await page.evaluate(async () => {
      pangu.taskScheduler.config.enabled = true;
      pangu.autoSpacingPage({ pageDelayMs: 0, nodeDelayMs: 100, nodeMaxWaitMs: 200 });
      
      const content = document.getElementById('content')!;
      const div = document.createElement('div');
      content.appendChild(div);
      
      // Make rapid changes
      div.textContent = '初始initial';
      await new Promise(resolve => setTimeout(resolve, 50));
      
      div.textContent = '更新update';
      await new Promise(resolve => setTimeout(resolve, 50));
      
      div.textContent = '最終final文本text';
      
      // Wait for debounced processing
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return div.textContent;
    });

    expect(result?.trim()).toBe('最終 final 文本 text');
  });
});