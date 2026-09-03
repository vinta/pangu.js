import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

declare global {
  interface Window {
    // Where these tests park what the batch tail hands them. The Text nodes cannot cross the evaluate boundary, so only the serializable half of each settled text node is kept
    __settledTextNodes: { unspaced: string; settled: string }[];
    // How many times the batch tail fired, which is what proves the seam is per batch rather than per text node
    __batchCount: number;
  }
}

// Stands in for the Chrome extension's classifier: the settled text nodes are parked on the page instead of being read for candidates, so nothing here knows any ambiguous shape exists
function collectSettledRuns(page: Page) {
  return page.evaluate(() => {
    pangu.onTextNodesSettled = (settledTextNodes) => {
      window.__batchCount++;
      window.__settledTextNodes.push(...settledTextNodes.map(({ unspaced, settled }) => ({ unspaced, settled })));
    };
    pangu.spacingNode(document.body);
    return window.__settledTextNodes;
  });
}

test.describe('onTextNodesSettled', () => {
  test.beforeEach(async ({ page }) => {
    await page.addScriptTag({ path: 'dist/browser/pangu.umd.js' });
    await page.waitForFunction(() => typeof window.pangu !== 'undefined');

    await page.evaluate(() => {
      pangu.taskScheduler.config.enabled = false;
      window.__settledTextNodes = [];
      window.__batchCount = 0;
    });
  });

  test('leave the seam unassigned so the npm build never captures anything', async ({ page }) => {
    await page.setContent('<div>氣溫是-5度左右</div>');

    const result = await page.evaluate(() => {
      const unassigned = pangu.onTextNodesSettled === null;
      pangu.spacingNode(document.body);
      return { unassigned, text: document.body.textContent, captured: window.__settledTextNodes.length };
    });

    expect(result.unassigned).toBe(true);
    expect(result.text).toBe('氣溫是 - 5 度左右');
    expect(result.captured).toBe(0);
  });

  test('carry the bytes text spacing read and the bytes it wrote', async ({ page }) => {
    await page.setContent('<div>氣溫是-5度左右</div>');

    expect(await collectSettledRuns(page)).toEqual([{ unspaced: '氣溫是-5度左右', settled: '氣溫是 - 5 度左右' }]);
  });

  test('settle a text node a junction space wrote to after its own text spacing ran', async ({ page }) => {
    // The boundary between the two text nodes prepends a space to the very node text spacing already visited. The list is in reverse document order, so the second node settles first, and the
    // unchanged node is in the list too: whether that matters is the host's policy, so nothing is filtered here
    await page.setContent('<div><b>abc</b><span>氣溫是-5度</span></div>');

    expect(await collectSettledRuns(page)).toEqual([
      { unspaced: '氣溫是-5度', settled: ' 氣溫是 - 5 度' },
      { unspaced: 'abc', settled: 'abc' },
    ]);
    expect(await page.evaluate(() => document.body.textContent)).toBe('abc 氣溫是 - 5 度');
  });

  test('skip a text node text spacing never ran on', async ({ page }) => {
    // The standalone quote node gets prepend-space and nothing else, so it is never captured; the CJK node beside it is
    await page.setContent('<div><b>中文</b>"</div>');

    expect(await collectSettledRuns(page)).toEqual([{ unspaced: '中文', settled: '中文' }]);
    expect(await page.evaluate(() => document.body.textContent)).toBe('中文 "');
  });

  test('fire once per batch rather than once per text node', async ({ page }) => {
    await page.setContent('<div><b>abc</b><span>氣溫是-5度</span></div>');

    await collectSettledRuns(page);

    expect(await page.evaluate(() => window.__batchCount)).toBe(1);
  });
});
