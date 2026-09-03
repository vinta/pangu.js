import { expect, test } from '@playwright/test';

test.describe('applyLateFixes', () => {
  test.beforeEach(async ({ page }) => {
    await page.addScriptTag({ path: 'dist/browser/pangu.umd.js' });
    await page.waitForFunction(() => typeof window.pangu !== 'undefined');

    await page.evaluate(() => {
      pangu.taskScheduler.config.enabled = false;
    });
  });

  test('write the fix while the node still holds the bytes it was computed from', async ({ page }) => {
    await page.setContent('<div id="target">氣溫是-5度左右</div>');

    const result = await page.evaluate(() => {
      pangu.spacingNode(document.body);

      const textNode = document.getElementById('target')!.firstChild as Text;
      pangu.applyLateFixes([{ node: textNode, settled: '氣溫是 - 5 度左右', data: '氣溫是 -5 度左右' }]);
      return document.getElementById('target')!.textContent;
    });

    expect(result).toBe('氣溫是 -5 度左右');
  });

  test('drop the fix when the node changed after it was computed', async ({ page }) => {
    await page.setContent('<div id="target">氣溫是-5度左右</div>');

    const result = await page.evaluate(() => {
      pangu.spacingNode(document.body);

      // Something else rewrote the node while the classifier was still thinking
      const textNode = document.getElementById('target')!.firstChild as Text;
      textNode.data = '外部改寫 - 5 度';
      pangu.applyLateFixes([{ node: textNode, settled: '氣溫是 - 5 度左右', data: '氣溫是 -5 度左右' }]);
      return textNode.data;
    });

    expect(result).toBe('外部改寫 - 5 度');
  });

  test('drop the fix when the node left the document', async ({ page }) => {
    await page.setContent('<div id="target">氣溫是-5度左右</div>');

    const result = await page.evaluate(() => {
      pangu.spacingNode(document.body);

      const target = document.getElementById('target')!;
      const textNode = target.firstChild as Text;
      target.remove();
      pangu.applyLateFixes([{ node: textNode, settled: '氣溫是 - 5 度左右', data: '氣溫是 -5 度左右' }]);
      return textNode.data;
    });

    expect(result).toBe('氣溫是 - 5 度左右');
  });

  test('not re-space a late fix back through the MutationObserver', async ({ page }) => {
    await page.setContent('<div id="target">氣溫是-5度左右</div>');

    await page.evaluate(() => {
      // Stands in for the extension's policy half: whatever the seam settled, delete every space between a hyphen-minus and the digit after it. Descending, so each deletion leaves the
      // indexes still to come untouched
      pangu.onTextNodesSettled = (settledTextNodes) => {
        const fixes = [];
        for (const settled of settledTextNodes) {
          let data = settled.after;
          for (let index = data.length - 1; index >= 0; index--) {
            if (data[index] === '-' && data[index + 1] === ' ' && /[0-9]/.test(data[index + 2] ?? '')) {
              data = data.slice(0, index + 1) + data.slice(index + 2);
            }
          }
          if (data !== settled.after) {
            fixes.push({ node: settled.node, settled: settled.after, data });
          }
        }
        pangu.applyLateFixes(fixes);
      };
      pangu.autoSpacingPage({ pageDelayMs: 0 });
    });

    // Past the observer's own debounce, so a revert would have landed by now
    await page.waitForTimeout(900);

    expect(await page.evaluate(() => document.getElementById('target')!.textContent)).toBe('氣溫是 -5 度左右');
  });
});
