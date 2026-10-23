import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

import type { CandidateLabel, ClassifyCandidatesMessage, ClassifyCandidatesResponse } from '../../src/ai-spacing/messages';
import { indexOfNthSymbol, sliceSentence } from '../../src/ai-spacing/shapes/base';
import type { Settings } from '../../src/settings/storage';

type StubLabels = CandidateLabel[] | Record<string, CandidateLabel>;

declare global {
  interface Window {
    __aiClassifications: ClassifyCandidatesMessage[];
    __aiLabels: StubLabels;
    __releaseClassification: () => void;
  }
}

// The candidates the content script sent to the worker. The warm-up request carries none, so it is skipped
async function sentCandidates(page: Page) {
  await page.waitForFunction(() => window.__aiClassifications.some(({ candidates }) => candidates.length > 0));
  return page.evaluate(() => window.__aiClassifications.flatMap(({ candidates }) => candidates));
}

// A fresh document per case, then the built content script injected the way Chrome does on spacing_when_load, with the worker stubbed to answer the given labels
async function loadContentScript(page: Page, html: string, candidateLabels: StubLabels, aiEnabled = true) {
  await page.goto(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  const originalText = await page.locator('body').textContent();
  await page.evaluate(
    ({ candidateLabels, aiEnabled }) => {
      window.__aiClassifications = [];
      window.__aiLabels = candidateLabels;
      Object.defineProperty(window, 'chrome', {
        value: {
          storage: { sync: { get: async (defaults: Settings) => ({ ...defaults, spacing_mode: 'spacing_when_load', is_ai_spacing_enabled: aiEnabled }) } },
          runtime: {
            onMessage: { addListener: () => {} },
            sendMessage: async (message: ClassifyCandidatesMessage) => {
              window.__aiClassifications.push(message);
              const labelsByKind: Record<string, string[]> = {
                'digit-plus': ['conjunction', 'lower-bound', 'unsure'],
                'hyphen-digit': ['signed-number', 'range-or-separator', 'unsure'],
                'plus-digit': ['signed-number', 'conjunction', 'unsure'],
              };
              const labels = labelsByKind[message.kind];
              if (!labels) {
                throw new Error(`Unknown shape ${message.kind}`);
              }
              return {
                ok: true,
                candidateLabels: message.candidates.map((candidate, index) => {
                  const label =
                    (Array.isArray(window.__aiLabels)
                      ? window.__aiLabels[index]
                      : (window.__aiLabels[`${message.kind}:${candidate.at}:${candidate.sentence}`] ?? window.__aiLabels[candidate.sentence])) ?? 'unsure';
                  if (!labels.includes(label)) {
                    throw new Error(`Invalid stub label ${label} for ${message.kind}`);
                  }
                  return label;
                }),
              };
            },
          },
        },
      });
      if (!('navigation' in window)) {
        Object.defineProperty(window, 'navigation', { value: { addEventListener: () => {} } });
      }
      // The fake clock's idle deadline reports no time remaining, so the task queue would never run a task
      const fakeRequestIdleCallback = window.requestIdleCallback.bind(window);
      window.requestIdleCallback = (callback, options) => fakeRequestIdleCallback(({ didTimeout }) => callback({ didTimeout, timeRemaining: () => 50 }), options);
    },
    { candidateLabels, aiEnabled },
  );
  await page.addScriptTag({ path: 'browser-extensions/chrome/dist/content-script.js' });
  return originalText;
}

// What the page pass classifies
async function classify(page: Page, html: string, candidateLabels: StubLabels = []) {
  await loadContentScript(page, html, candidateLabels);
  await page.clock.runFor(1000);
  return sentCandidates(page);
}

// What a mutation of the candidate link alone classifies. It lands before the page pass, so the script spaces that one node and reads its neighbors as the page shipped them
async function classifyCandidate(page: Page, html: string) {
  await loadContentScript(page, html, []);
  await page.evaluate(() => {
    const node = document.querySelector('#candidate')!.firstChild as Text;
    node.data = node.data;
  });
  await page.clock.runFor(500);
  return sentCandidates(page);
}

test.describe('AI spacing DOM context', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install();
  });

  test('inserts the digit-plus separator using original neighboring inline context', async ({ page }) => {
    expect(await classify(page, '<p><span>Switch </span><a>2+瑪利歐賽車世界同捆組</a><b>現貨</b></p>', ['conjunction'])).toEqual([{ sentence: 'Switch 2+瑪利歐賽車世界同捆組現貨', at: 8 }]);
    await expect(page.locator('p')).toHaveText('Switch 2 + 瑪利歐賽車世界同捆組現貨');
    expect(await page.evaluate(() => window.__aiClassifications.filter(({ candidates }) => candidates.length > 0).map(({ kind }) => kind))).toEqual(['digit-plus']);
  });

  test('does not classify a digit-plus when an inline sibling adds a second plus', async ({ page }) => {
    await loadContentScript(page, '<p><a>Switch 2+瑪利歐賽車世界同捆組</a><span>，另送A+B</span></p>', ['conjunction']);
    await page.clock.runFor(1000);

    await expect(page.locator('p')).toHaveText('Switch 2+ 瑪利歐賽車世界同捆組，另送 A+B');
    expect(await page.evaluate(() => window.__aiClassifications.flatMap(({ candidates }) => candidates))).toEqual([]);
  });

  test('classifies pluses in separate sentences independently across inline siblings', async ({ page }) => {
    const candidates = await classify(page, '<p><a>Switch 2+瑪利歐賽車世界同捆組</a><span>。有100+的選擇</span></p>', {
      'Switch 2+瑪利歐賽車世界同捆組': 'conjunction',
      '有100+的選擇': 'lower-bound',
    });
    expect(candidates).toHaveLength(2);
    expect(candidates).toEqual(
      expect.arrayContaining([
        { sentence: 'Switch 2+瑪利歐賽車世界同捆組', at: 8 },
        { sentence: '有100+的選擇', at: 4 },
      ]),
    );
    await expect(page.locator('p')).toHaveText('Switch 2 + 瑪利歐賽車世界同捆組。有 100+ 的選擇');
  });

  test('retains core digit-plus spacing without classification when AI spacing is disabled', async ({ page }) => {
    await loadContentScript(page, '<p>Switch 2+瑪利歐賽車世界同捆組</p>', ['conjunction'], false);
    await page.clock.runFor(1000);

    await expect(page.locator('p')).toHaveText('Switch 2+ 瑪利歐賽車世界同捆組');
    expect(await page.evaluate(() => window.__aiClassifications)).toEqual([]);
  });

  test('classifies plus-digit using original neighboring inline context', async ({ page }) => {
    const sentence = '●可12歲以下兒童+1位家長使用';
    expect(await classify(page, '<p><span>●可12歲以下</span><a>兒童+1位家長</a><b>使用</b></p>', ['conjunction'])).toEqual([{ sentence, at: sentence.indexOf('+') }]);
    await expect(page.locator('p')).toHaveText('●可 12 歲以下兒童 + 1 位家長使用');
    expect(await page.evaluate(() => window.__aiClassifications.filter(({ candidates }) => candidates.length > 0).map(({ kind }) => kind))).toEqual(['plus-digit']);
  });

  // Real sentences joined by a full stop as separate contexts in one node, in both orders: hyphen-digit, plus-digit
  for (const text of ['保存冷凍於-18°C以下。交通票券+5大夯景點', '交通票券+5大夯景點。保存冷凍於-18°C以下']) {
    test(`composes plus-digit insertion and hyphen deletion from the same snapshot: ${text}`, async ({ page }) => {
      await classify(page, `<p>${text}</p>`, { '保存冷凍於-18°C以下': 'signed-number', '交通票券+5大夯景點': 'conjunction' });
      await expect
        .poll(() => page.evaluate(() => window.__aiClassifications.filter(({ candidates }) => candidates.length > 0)))
        .toEqual([
          { type: 'CLASSIFY_CANDIDATES', kind: 'hyphen-digit', candidates: [{ sentence: '保存冷凍於-18°C以下', at: 5 }] },
          { type: 'CLASSIFY_CANDIDATES', kind: 'plus-digit', candidates: [{ sentence: '交通票券+5大夯景點', at: 4 }] },
        ]);
      await expect.poll(() => page.locator('p').textContent()).toBe(text.startsWith('保存') ? '保存冷凍於 -18°C 以下。交通票券 + 5 大夯景點' : '交通票券 + 5 大夯景點。保存冷凍於 -18°C 以下');
    });
  }

  test('routes digit-plus and plus-digit to separate workers across a semicolon', async ({ page }) => {
    // Real sentences joined as separate contexts: plus-digit; digit-plus
    await classify(page, '<p>交通票券+5大夯景點；Switch 2+瑪利歐賽車世界同捆組</p>', ['conjunction']);
    await expect
      .poll(() => page.evaluate(() => window.__aiClassifications.filter(({ candidates }) => candidates.length > 0)))
      .toEqual([
        { type: 'CLASSIFY_CANDIDATES', kind: 'digit-plus', candidates: [{ sentence: 'Switch 2+瑪利歐賽車世界同捆組', at: 8 }] },
        { type: 'CLASSIFY_CANDIDATES', kind: 'plus-digit', candidates: [{ sentence: '交通票券+5大夯景點', at: 4 }] },
      ]);
    await expect.poll(() => page.locator('p').textContent()).toBe('交通票券 + 5 大夯景點；Switch 2 + 瑪利歐賽車世界同捆組');
  });

  test('excludes plus-digit when neighboring inline context contains another plus', async ({ page }) => {
    await loadContentScript(page, '<p><a>一個標示Z5U的電容，其工作溫度為+10°C</a><span>至+85°C，容值變動範圍在+22%至−56%之間。</span></p>', ['conjunction']);
    await page.clock.runFor(1000);

    await expect.poll(() => page.locator('p').textContent()).toBe('一個標示 Z5U 的電容，其工作溫度為 +10°C 至 +85°C，容值變動範圍在 +22% 至−56% 之間。');
    expect(await page.evaluate(() => window.__aiClassifications.flatMap(({ candidates }) => candidates))).toEqual([]);
  });

  test('excludes authored spaces from plus-digit routing', async ({ page }) => {
    // Synthetic regex-boundary variants of a real phrase, each with an authored space beside the plus
    await loadContentScript(page, '<p>交通票券 +5大夯景點；交通票券+ 5大夯景點；交通票券 + 5大夯景點</p>', ['conjunction']);
    await page.clock.runFor(1000);

    await expect.poll(() => page.locator('p').textContent()).toBe('交通票券 +5 大夯景點；交通票券 + 5 大夯景點；交通票券 + 5 大夯景點');
    expect(await page.evaluate(() => window.__aiClassifications.flatMap(({ candidates }) => candidates))).toEqual([]);
  });

  test('retains core plus-digit spacing when AI spacing is disabled', async ({ page }) => {
    await loadContentScript(page, '<p>交通票券+5大夯景點</p>', ['conjunction'], false);
    await page.clock.runFor(1000);

    await expect.poll(() => page.locator('p').textContent()).toBe('交通票券 +5 大夯景點');
    expect(await page.evaluate(() => window.__aiClassifications)).toEqual([]);
  });

  for (const failure of ['unavailable', 'worker error']) {
    test(`retains core plus-digit spacing after ${failure}`, async ({ page }) => {
      await loadContentScript(page, '<p>交通票券+5大夯景點</p>', ['conjunction']);
      await page.evaluate((failure) => {
        Object.assign(chrome.runtime, {
          sendMessage: async (message: ClassifyCandidatesMessage) => {
            window.__aiClassifications.push(message);
            if (failure === 'worker error') {
              throw new Error('worker disconnected');
            }
            return { ok: false, error: 'model unavailable' };
          },
        });
      }, failure);
      await page.clock.runFor(1000);

      await expect.poll(() => page.locator('p').textContent()).toBe('交通票券 +5 大夯景點');
      expect(await sentCandidates(page)).toEqual([{ sentence: '交通票券+5大夯景點', at: 4 }]);
    });
  }

  test('drops a plus-digit answer after the page rewrites the settled text', async ({ page }) => {
    await loadContentScript(page, '<p>交通票券+5大夯景點</p>', ['conjunction']);
    await page.evaluate(() => {
      const sendMessage = chrome.runtime.sendMessage;
      Object.assign(chrome.runtime, {
        sendMessage: async (message: ClassifyCandidatesMessage) => {
          const response = sendMessage<ClassifyCandidatesMessage, ClassifyCandidatesResponse>(message);
          if (message.candidates.length) {
            await new Promise<void>((resolve) => {
              window.__releaseClassification = resolve;
            });
          }
          return response;
        },
      });
    });
    await page.clock.runFor(1000);
    expect(await sentCandidates(page)).toEqual([{ sentence: '交通票券+5大夯景點', at: 4 }]);
    await expect.poll(() => page.locator('p').textContent()).toBe('交通票券 +5 大夯景點');

    await page.evaluate(() => {
      document.querySelector('p')!.firstChild!.textContent = '頁面已改寫';
      window.__releaseClassification();
    });
    await page.clock.runFor(1000);

    await expect.poll(() => page.locator('p').textContent()).toBe('頁面已改寫');
  });

  test('plain text and nested inline elements provide the same sentence and symbol position', async ({ page }) => {
    const expected = [{ sentence: '目前已經發展成為一個擁有運-12輕型多用途飛機', at: 13 }];
    expect(await classify(page, '<p>目前已經發展成為一個擁有運-12輕型多用途飛機</p>')).toEqual(expected);
    expect(await classify(page, '<p>目前已經<span>發展成為一個擁有<a id="candidate">運-12</a></span><b>輕型多用途飛機</b></p>')).toEqual(expected);
    expect(await classifyCandidate(page, '<p>目前已經<span>發展成為一個擁有<a id="candidate">運-12</a></span><b>輕型多用途飛機</b></p>')).toEqual(expected);
    expect(
      await classifyCandidate(
        page,
        '<p>目前已經<span style="display: inline-block">發展成為一個擁有<a id="candidate" style="display: inline-block">運-12</a></span><b style="display: inline-flex">輕型多用途飛機</b></p>',
      ),
    ).toEqual(expected);
  });

  test('read neighboring original snapshots before the rules inserted spaces', async ({ page }) => {
    expect(await classify(page, '<p><span>型號A與</span><a>運-12</a><b>以及B型輕航機</b></p>')).toEqual([{ sentence: '型號A與運-12以及B型輕航機', at: 5 }]);
    await expect(page.locator('span')).toHaveText('型號 A 與');
    await expect(page.locator('b')).toHaveText('以及 B 型輕航機');
  });

  test('keep repeated symbols distinct and apply the selected edit inside its original node', async ({ page }) => {
    expect(await classify(page, '<p>A-B型號<a id="candidate">低-5高-6</a>度</p>', ['range-or-separator', 'signed-number'])).toEqual([
      { sentence: 'A-B型號低-5高-6度', at: 6 },
      { sentence: 'A-B型號低-5高-6度', at: 9 },
    ]);
    await expect(page.locator('#candidate')).toHaveText('低 - 5 高 -6');
    await expect(page.locator('p')).toHaveText('A-B 型號低 - 5 高 -6 度');
  });

  test('retain sentence punctuation, whitespace and the 120-character limit on each side', async ({ page }) => {
    expect(await classifyCandidate(page, '<p>前一句。<span>目前\t已經 </span><a id="candidate">運-12</a><b>輕型、多用途飛機</b>！後一句</p>')).toEqual([
      { sentence: '目前\t已經 運-12輕型、多用途飛機', at: 7 },
    ]);
    expect(await classifyCandidate(page, `<p>${'甲'.repeat(130)}<a id="candidate">運-12</a>${'乙'.repeat(130)}</p>`)).toEqual([{ sentence: `${'甲'.repeat(119)}運-12${'乙'.repeat(118)}`, at: 120 }]);
  });

  test('render a soft line break as one space the way Chrome does and keep hard breaks under a white-space value that preserves them', async ({ page }) => {
    const expected = [{ sentence: '目前已經發展成為一個擁有 運-12 輕型多用途飛機', at: 14 }];
    expect(await classify(page, '<p>目前已經發展成為一個擁有\n<a id="candidate">運-12</a>\n輕型多用途飛機</p>')).toEqual(expected);
    expect(await classifyCandidate(page, '<p>\n  目前已經發展成為一個擁有\n  <a id="candidate">運-12</a>\n  輕型多用途飛機\n</p>')).toEqual(expected);
    expect(await classifyCandidate(page, '<p>目前已經發展成為一個擁有，\n<a id="candidate">運-12</a>輕型多用途飛機</p>')).toEqual([
      { sentence: '目前已經發展成為一個擁有， 運-12輕型多用途飛機', at: 15 },
    ]);
    expect(await classifyCandidate(page, '<p>代號Y12\n<a id="candidate">運-12</a>\n輕型多用途飛機</p>')).toEqual([{ sentence: '代號Y12 運-12 輕型多用途飛機', at: 7 }]);
    expect(await classify(page, '<div style="white-space: pre-wrap">前一行\n氣溫是-5度\n後一行</div>')).toEqual([{ sentence: '氣溫是-5度', at: 3 }]);
    expect(await classifyCandidate(page, '<div style="white-space: pre-wrap">前一行\n<a id="candidate">運-12</a>\n後一行</div>')).toEqual([{ sentence: '運-12', at: 1 }]);
  });

  test('stop at a block edge, ignored or not, or a line break in both directions', async ({ page }) => {
    for (const edge of ['<p><b>區塊文字</b></p>', '<br>', '<pre>程式碼</pre>', '<div class="no-pangu-spacing">略過</div>']) {
      expect(await classifyCandidate(page, `<section>外側${edge}<span>前<a id="candidate">運-12</a>後</span>${edge}外側</section>`), edge).toEqual([{ sentence: '前運-12後', at: 2 }]);
    }
    expect(await classifyCandidate(page, '<section>外側<p><b>前<a id="candidate">運-12</a>後</b></p>外側</section>')).toEqual([{ sentence: '前運-12後', at: 2 }]);
  });

  test('step past ignored, hidden, superscript and subscript siblings in both directions', async ({ page }) => {
    for (const skipped of [
      '<code>程式碼</code>',
      '<span class="no-pangu-spacing">略過</span>',
      '<span contenteditable="true">編輯中</span>',
      '<span hidden>隱藏</span>',
      '<span style="display: none">隱藏</span>',
      '<span style="visibility: hidden">隱藏</span>',
      '<span style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0)">僅供螢幕閱讀器</span>',
      '<sup class="reference"><a href="#cite_note-1">[1]</a></sup>',
      '<sub>2</sub>',
    ]) {
      expect(await classifyCandidate(page, `<section>外側${skipped}<span>前<a id="candidate">運-12</a>後</span>${skipped}外側</section>`), skipped).toEqual([{ sentence: '外側前運-12後外側', at: 4 }]);
    }
    expect(await classify(page, '<p>目前已經發展成為一個擁有<a>運-12</a><sup class="reference"><a href="#cite_note-1">[1]</a></sup>輕型多用途飛機</p>')).toEqual([
      { sentence: '目前已經發展成為一個擁有運-12輕型多用途飛機', at: 13 },
    ]);
  });
});

interface PlusDigitCase {
  id: string;
  excerptId: string;
  input: string;
  at: number;
  excerptAt: number;
  expected_label: CandidateLabel;
  sourceExcerpt: string;
  source_html: string;
  source_css: string;
  expected_output: string;
  expected_excerpt_output: string;
  expected_composed_output: string;
  expected_composed_excerpt_output: string;
  companion_targets: { kind: string; excerptAt: number; expected_label: CandidateLabel }[];
}

const plusDigitCorpus = JSON.parse(readFileSync(new URL('../../../../scripts/prompt-experiments/plus-digit/corpus/development.json', import.meta.url), 'utf8')) as { cases: PlusDigitCase[] };

test.describe('plus-digit reviewed corpus through the production content script', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install();
  });

  test('replay every reviewed case', () => {
    expect(plusDigitCorpus.cases).toHaveLength(22);
  });

  // One replay per excerpt: its page carries every member's target
  const excerpts = [...new Set(plusDigitCorpus.cases.map((kase) => kase.excerptId))].map((excerptId) => plusDigitCorpus.cases.filter((kase) => kase.excerptId === excerptId));
  for (const group of excerpts) {
    const excerpt = group[0]!;
    test(group.map((kase) => kase.id).join(', '), async ({ page }) => {
      const targets = [
        ...excerpt.companion_targets.map((target) => ({ kind: target.kind, ...sliceSentence(excerpt.sourceExcerpt, target.excerptAt), label: target.expected_label })),
        ...group.map((target) => ({ kind: 'plus-digit', sentence: target.input, at: target.at, label: target.expected_label })),
      ];
      const labels = Object.fromEntries(targets.map((target) => [`${target.kind}:${target.at}:${target.sentence}`, target.kind === 'plus-digit' ? target.label : 'unsure'])) as Record<
        string,
        CandidateLabel
      >;
      const html = `<html><head><style>${excerpt.source_css}</style></head><body><section id="fixture">${excerpt.source_html}</section></body></html>`;
      const expectedCandidates = targets.map(({ kind, sentence, at }) => ({ kind, sentence, at }));

      async function replay(expectedExcerpt: string, expectedInput: (kase: PlusDigitCase) => string) {
        const originalText = await loadContentScript(page, html, labels);
        expect(originalText?.trim()).toBe(excerpt.sourceExcerpt);
        await page.clock.runFor(1000);

        // Exact message equality also rejects newly routed, missing, or duplicate targets; no inference is used in this replay.
        await expect.poll(() => page.evaluate(() => window.__aiClassifications.flatMap(({ kind, candidates }) => candidates.map((candidate) => ({ kind, ...candidate }))))).toEqual(expectedCandidates);
        await expect.poll(async () => (await page.locator('#fixture').textContent())?.trim()).toBe(expectedExcerpt);
        const output = (await page.locator('#fixture').textContent())!.trim();
        for (const kase of group) {
          const originalOrdinal = kase.sourceExcerpt.slice(0, kase.excerptAt).split('+').length - 1;
          expect(sliceSentence(output, indexOfNthSymbol(output, '+', originalOrdinal)).sentence, kase.id).toBe(expectedInput(kase));
        }
      }

      await replay(excerpt.expected_excerpt_output, (kase) => kase.expected_output);
      if (excerpt.companion_targets.length) {
        for (const target of targets) {
          labels[`${target.kind}:${target.at}:${target.sentence}`] = target.label;
        }
        await replay(excerpt.expected_composed_excerpt_output, (kase) => kase.expected_composed_output);
      } else {
        for (const kase of group) {
          expect(kase.expected_composed_excerpt_output, kase.id).toBe(kase.expected_excerpt_output);
          expect(kase.expected_composed_output, kase.id).toBe(kase.expected_output);
        }
      }
    });
  }
});
