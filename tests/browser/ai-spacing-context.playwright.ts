import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

import type { CandidateLabel, ClassifyCandidatesMessage } from '../../browser-extensions/chrome/src/ai-spacing/messages';

declare global {
  interface Window {
    __aiClassifications: ClassifyCandidatesMessage[];
    __aiLabels: CandidateLabel[];
  }
}

async function classify(page: Page, html: string, candidateOnly = false) {
  await page.setContent(html);
  await page.evaluate((candidateOnly) => {
    window.__aiClassifications = [];
    if (candidateOnly) {
      const node = document.querySelector('#candidate')!.firstChild as Text;
      const unspaced = node.data;
      node.data = pangu.spacingText(unspaced);
      pangu.onTextNodesSettled!([{ node, unspaced, settled: node.data }]);
    } else {
      pangu.spacingNode(document.body);
    }
  }, candidateOnly);
  await page.waitForFunction(() => window.__aiClassifications.length > 0);
  return page.evaluate(() => window.__aiClassifications.flatMap(({ candidates }) => candidates));
}

test.describe('AI spacing DOM context', () => {
  test.beforeEach(async ({ page }) => {
    await page.addScriptTag({ path: 'dist/browser/pangu.umd.js' });
    await page.evaluate(() => {
      pangu.taskScheduler.config.enabled = false;
      window.__aiClassifications = [];
      window.__aiLabels = [];
      Object.defineProperty(window, 'chrome', {
        value: {
          storage: { sync: { get: async () => ({ spacing_mode: 'spacing_when_click', is_enable_ai_spacing: true }) } },
          runtime: {
            onMessage: { addListener: () => {} },
            sendMessage: async (message: ClassifyCandidatesMessage) => {
              window.__aiClassifications.push(message);
              return { ok: true, candidateLabels: message.candidates.map((_, index) => window.__aiLabels[index] ?? 'range-or-separator') };
            },
          },
        },
      });
      if (!('navigation' in window)) {
        Object.defineProperty(window, 'navigation', { value: { addEventListener: () => {} } });
      }
    });
    await page.addScriptTag({ path: 'browser-extensions/chrome/dist/content-script.js' });
    await page.waitForFunction(() => pangu.onTextNodesSettled !== null);
  });

  test('plain text and nested inline elements provide the same sentence and symbol position', async ({ page }) => {
    const expected = [{ sentence: '目前已經發展成為一個擁有運-12輕型多用途飛機', at: 13 }];
    expect(await classify(page, '<p>目前已經發展成為一個擁有運-12輕型多用途飛機</p>')).toEqual(expected);
    expect(await classify(page, '<p>目前已經<span>發展成為一個擁有<a id="candidate">運-12</a></span><b>輕型多用途飛機</b></p>')).toEqual(expected);
    expect(await classify(page, '<p>目前已經<span>發展成為一個擁有<a id="candidate">運-12</a></span><b>輕型多用途飛機</b></p>', true)).toEqual(expected);
    expect(await classify(page, '<p>目前已經<span style="display: inline-block">發展成為一個擁有<a id="candidate" style="display: inline-block">運-12</a></span><b style="display: inline-flex">輕型多用途飛機</b></p>', true)).toEqual(expected);
  });

  test('read neighboring original snapshots before the rules inserted spaces', async ({ page }) => {
    expect(await classify(page, '<p><span>型號A與</span><a>運-12</a><b>以及B型輕航機</b></p>')).toEqual([{ sentence: '型號A與運-12以及B型輕航機', at: 5 }]);
    await expect(page.locator('span')).toHaveText('型號 A 與');
    await expect(page.locator('b')).toHaveText('以及 B 型輕航機');
  });

  test('keep repeated symbols distinct and apply the selected edit inside its original node', async ({ page }) => {
    await page.evaluate(() => {
      window.__aiLabels = ['range-or-separator', 'signed-number'];
    });
    expect(await classify(page, '<p>A-B型號<a id="candidate">低-5高-6</a>度</p>')).toEqual([
      { sentence: 'A-B型號低-5高-6度', at: 6 },
      { sentence: 'A-B型號低-5高-6度', at: 9 },
    ]);
    await expect(page.locator('#candidate')).toHaveText('低 - 5 高 -6');
    await expect(page.locator('p')).toHaveText('A-B 型號低 - 5 高 -6 度');
  });

  test('retain sentence punctuation, whitespace and the 120-character limit on each side', async ({ page }) => {
    expect(await classify(page, '<p>前一句。<span>目前\t已經 </span><a id="candidate">運-12</a><b>輕型、多用途飛機</b>！後一句</p>', true)).toEqual([
      { sentence: '目前\t已經 運-12輕型、多用途飛機', at: 7 },
    ]);
    expect(await classify(page, `<p>${'甲'.repeat(130)}<a id="candidate">運-12</a>${'乙'.repeat(130)}</p>`, true)).toEqual([{ sentence: `${'甲'.repeat(119)}運-12${'乙'.repeat(118)}`, at: 120 }]);
  });

  test('collapse soft line breaks the way the browser renders them and keep hard breaks under a white-space value that preserves them', async ({ page }) => {
    const expected = [{ sentence: '目前已經發展成為一個擁有運-12 輕型多用途飛機', at: 13 }];
    expect(await classify(page, '<p>目前已經發展成為一個擁有\n<a id="candidate">運-12</a>\n輕型多用途飛機</p>')).toEqual(expected);
    expect(await classify(page, '<p>\n  目前已經發展成為一個擁有\n  <a id="candidate">運-12</a>\n  輕型多用途飛機\n</p>', true)).toEqual(expected);
    expect(await classify(page, '<p>目前已經發展成為一個擁有，\n<a id="candidate">運-12</a>輕型多用途飛機</p>', true)).toEqual([{ sentence: '目前已經發展成為一個擁有，運-12輕型多用途飛機', at: 14 }]);
    expect(await classify(page, '<p>代號Y12\n<a id="candidate">運-12</a>\n輕型多用途飛機</p>', true)).toEqual([{ sentence: '代號Y12 運-12 輕型多用途飛機', at: 7 }]);
    expect(await classify(page, '<div style="white-space: pre-wrap">前一行\n氣溫是-5度\n後一行</div>')).toEqual([{ sentence: '氣溫是-5度', at: 3 }]);
    expect(await classify(page, '<div style="white-space: pre-wrap">前一行\n<a id="candidate">運-12</a>\n後一行</div>', true)).toEqual([{ sentence: '運-12', at: 1 }]);
  });

  test('stop at a block edge or line break in both directions', async ({ page }) => {
    for (const edge of ['<p><b>區塊文字</b></p>', '<br>']) {
      expect(await classify(page, `<section>外側${edge}<span>前<a id="candidate">運-12</a>後</span>${edge}外側</section>`, true), edge).toEqual([{ sentence: '前運-12後', at: 2 }]);
    }
    expect(await classify(page, '<section>外側<p><b>前<a id="candidate">運-12</a>後</b></p>外側</section>', true)).toEqual([{ sentence: '前運-12後', at: 2 }]);
  });

  test('step past ignored and hidden siblings in both directions', async ({ page }) => {
    for (const skipped of [
      '<code>程式碼</code>',
      '<span class="no-pangu-spacing">略過</span>',
      '<span contenteditable="true">編輯中</span>',
      '<span hidden>隱藏</span>',
      '<span style="display: none">隱藏</span>',
      '<span style="visibility: hidden">隱藏</span>',
      '<span style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0)">僅供螢幕閱讀器</span>',
    ]) {
      expect(await classify(page, `<section>外側${skipped}<span>前<a id="candidate">運-12</a>後</span>${skipped}外側</section>`, true), skipped).toEqual([{ sentence: '外側前運-12後外側', at: 4 }]);
    }
  });
});
