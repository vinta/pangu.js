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

  test('should have spacingNodesWithIdleCallback method', async ({ page }) => {
    const hasMethod = await page.evaluate(() => {
      return typeof pangu.spacingNodesWithIdleCallback === 'function';
    });

    expect(hasMethod).toBe(true);
  });

  test('should process nodes synchronously when idle disabled', async ({ page }) => {
    const result = await page.evaluate(() => {
      // Ensure idle processing is disabled
      pangu.disableIdleSpacing();
      
      const content = document.getElementById('content')!;
      const div = document.createElement('div');
      div.textContent = '測試text';
      content.appendChild(div);
      
      // Process synchronously
      pangu.spacingNodesWithIdleCallback([div]);
      
      return div.textContent;
    });

    expect(result).toBe('測試 text');
  });

  test('should process nodes with idle processing when enabled', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Enable idle processing
      pangu.enableIdleSpacing({ chunkSize: 1, timeoutMs: 100 });
      
      const content = document.getElementById('content')!;
      const div = document.createElement('div');
      div.textContent = '異步async';
      content.appendChild(div);
      
      let completed = false;
      
      // Process with idle callback
      pangu.spacingNodesWithIdleCallback([div], {
        onComplete: () => { completed = true; }
      });
      
      // Wait for completion
      await new Promise(resolve => {
        const checkComplete = () => {
          if (completed) {
            resolve(undefined);
          } else {
            setTimeout(checkComplete, 10);
          }
        };
        checkComplete();
      });
      
      return {
        text: div.textContent,
        completed
      };
    });

    expect(result.text).toBe('異步 async');
    expect(result.completed).toBe(true);
  });

  test('should handle multiple nodes at once', async ({ page }) => {
    const result = await page.evaluate(async () => {
      pangu.enableIdleSpacing({ chunkSize: 2, timeoutMs: 100 });
      
      const content = document.getElementById('content')!;
      
      const nodes = [];
      for (let i = 1; i <= 3; i++) {
        const div = document.createElement('div');
        div.textContent = `項目${i}item`;
        content.appendChild(div);
        nodes.push(div);
      }
      
      let completed = false;
      
      pangu.spacingNodesWithIdleCallback(nodes, {
        onComplete: () => { completed = true; }
      });
      
      // Wait for completion
      await new Promise(resolve => {
        const checkComplete = () => {
          if (completed) {
            resolve(undefined);
          } else {
            setTimeout(checkComplete, 10);
          }
        };
        checkComplete();
      });
      
      return {
        texts: nodes.map(node => node.textContent),
        completed
      };
    });

    expect(result.texts).toEqual(['項目 1item', '項目 2item', '項目 3item']);
    expect(result.completed).toBe(true);
  });

  test('should verify mutation observer integration by manual trigger', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Enable idle processing 
      pangu.enableIdleSpacing({ chunkSize: 1, timeoutMs: 100 });
      
      // Set up auto spacing
      pangu.autoSpacingPage();
      
      const content = document.getElementById('content')!;
      
      // Create initial content to verify it gets spaced
      const div = document.createElement('div');
      div.textContent = '測試mutation';
      content.appendChild(div);
      
      // Manually trigger spacing to verify the path works
      const nodes = [div];
      
      let completed = false;
      pangu.spacingNodesWithIdleCallback(nodes, {
        onComplete: () => { completed = true; }
      });
      
      // Wait for completion
      await new Promise(resolve => {
        const checkComplete = () => {
          if (completed) {
            resolve(undefined);
          } else {
            setTimeout(checkComplete, 10);
          }
        };
        checkComplete();
      });
      
      return {
        text: div.textContent,
        completed,
        hasObserver: pangu.getIdleSpacingConfig().enabled
      };
    });

    expect(result.text).toBe('測試 mutation');
    expect(result.completed).toBe(true);
    expect(result.hasObserver).toBe(true);
  });
});