import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import type { HyphenSignCandidate } from '../../src/browser/hyphen-sign';

declare global {
  interface Window {
    // Where these tests park the candidates the finder hands them, so a later evaluate() can pass the same objects back to the applier
    __hyphenCandidates: HyphenSignCandidate[];
  }
}

// Stands in for the Chrome extension's classifier: the finder's output is parked on the page instead of being sent to a model, so nothing here needs Gemini Nano to exist
function collectCandidates(page: Page) {
  return page.evaluate(() => {
    pangu.onHyphenSpans = (candidates) => {
      window.__hyphenCandidates.push(...candidates);
    };
    pangu.spacingNode(document.body);
    // The Text nodes cannot cross the evaluate boundary, so only the serializable half of each candidate comes back
    return window.__hyphenCandidates.map(({ sentence, at, postIndex, postSnapshot }) => ({ sentence, at, postIndex, postSnapshot }));
  });
}

// Every candidate classified signed-number, which is what the content script does with the model's answers
function collectAndApplyAll(page: Page) {
  return page.evaluate(() => {
    pangu.onHyphenSpans = (candidates) => {
      window.__hyphenCandidates.push(...candidates);
    };
    pangu.spacingNode(document.body);
    pangu.applyHyphenSignFixes(window.__hyphenCandidates);
    return document.body.textContent;
  });
}

test.describe('hyphen-sign finder and applier', () => {
  test.beforeEach(async ({ page }) => {
    await page.addScriptTag({ path: 'dist/browser/pangu.umd.js' });
    await page.waitForFunction(() => typeof window.pangu !== 'undefined');

    await page.evaluate(() => {
      pangu.taskScheduler.config.enabled = false;
      window.__hyphenCandidates = [];
    });
  });

  test('leave the finder unassigned so the npm build never runs it', async ({ page }) => {
    await page.setContent('<div>氣溫是-5度左右</div>');

    const result = await page.evaluate(() => {
      const unassigned = pangu.onHyphenSpans === null;
      pangu.spacingNode(document.body);
      return { unassigned, text: document.body.textContent };
    });

    expect(result.unassigned).toBe(true);
    expect(result.text).toBe('氣溫是 - 5 度左右');
  });

  test('flag a tight CJK-digit hyphen with its pre-spacing sentence and its settled index', async ({ page }) => {
    await page.setContent('<div>氣溫是-5度左右</div>');

    expect(await collectCandidates(page)).toEqual([{ sentence: '氣溫是-5度左右', at: 3, postIndex: 4, postSnapshot: '氣溫是 - 5 度左右' }]);
  });

  test('count hyphens the finder never flagged into the settled index', async ({ page }) => {
    await page.setContent('<div>Nasdaq-100本週下跌-13.44%</div>');

    expect(await collectCandidates(page)).toEqual([{ sentence: 'Nasdaq-100本週下跌-13.44%', at: 14, postIndex: 16, postSnapshot: 'Nasdaq-100 本週下跌 - 13.44%' }]);
  });

  test('resolve the settled index after a junction space moved it', async ({ page }) => {
    // The boundary between the two runs prepends a space to the very node the hyphen sits in, after that node's own text-run spacing already ran
    await page.setContent('<div><b>abc</b><span>氣溫是-5度</span></div>');

    expect(await collectCandidates(page)).toEqual([{ sentence: '氣溫是-5度', at: 3, postIndex: 5, postSnapshot: ' 氣溫是 - 5 度' }]);
    expect(await page.evaluate(() => document.body.textContent)).toBe('abc 氣溫是 - 5 度');
  });

  test('never flag a hyphen the author already spaced', async ({ page }) => {
    await page.setContent('<div>氣溫是 -5度左右</div>');

    expect(await collectCandidates(page)).toEqual([]);
    expect(await page.evaluate(() => document.body.textContent)).toBe('氣溫是 -5 度左右');
  });

  test('delete only the space the rules inserted after the hyphen', async ({ page }) => {
    await page.setContent('<div>氣溫是-5度左右</div>');

    expect(await collectAndApplyAll(page)).toBe('氣溫是 -5 度左右');
  });

  test('fix every flagged hyphen in one text node', async ({ page }) => {
    await page.setContent('<div>從-5到-3度</div>');

    expect(await collectAndApplyAll(page)).toBe('從 -5 到 -3 度');
  });

  test('fix a hyphen whose settled index a junction space moved', async ({ page }) => {
    await page.setContent('<div><b>abc</b><span>氣溫是-5度</span></div>');

    expect(await collectAndApplyAll(page)).toBe('abc 氣溫是 -5 度');
  });

  test('drop the fix when the node changed after it was flagged', async ({ page }) => {
    await page.setContent('<div id="target">氣溫是-5度左右</div>');

    const result = await page.evaluate(() => {
      pangu.onHyphenSpans = (candidates) => {
        window.__hyphenCandidates.push(...candidates);
      };
      pangu.spacingNode(document.body);

      // Something else rewrote the node while the classifier was still thinking
      const textNode = document.getElementById('target')!.firstChild as Text;
      textNode.data = '外部改寫 - 5 度';
      pangu.applyHyphenSignFixes(window.__hyphenCandidates);
      return textNode.data;
    });

    expect(result).toBe('外部改寫 - 5 度');
  });

  test('drop the fix when the node left the document', async ({ page }) => {
    await page.setContent('<div id="target">氣溫是-5度左右</div>');

    const result = await page.evaluate(() => {
      pangu.onHyphenSpans = (candidates) => {
        window.__hyphenCandidates.push(...candidates);
      };
      pangu.spacingNode(document.body);

      const target = document.getElementById('target')!;
      const textNode = target.firstChild as Text;
      target.remove();
      pangu.applyHyphenSignFixes(window.__hyphenCandidates);
      return textNode.data;
    });

    expect(result).toBe('氣溫是 - 5 度左右');
  });

  test('not re-space a late fix back through the MutationObserver', async ({ page }) => {
    await page.setContent('<div id="target">氣溫是-5度左右</div>');

    await page.evaluate(() => {
      pangu.onHyphenSpans = (candidates) => {
        pangu.applyHyphenSignFixes(candidates);
      };
      pangu.autoSpacingPage({ pageDelayMs: 0 });
    });

    // Past the observer's own debounce, so a revert would have landed by now
    await page.waitForTimeout(900);

    expect(await page.evaluate(() => document.getElementById('target')!.textContent)).toBe('氣溫是 -5 度左右');
  });
});
