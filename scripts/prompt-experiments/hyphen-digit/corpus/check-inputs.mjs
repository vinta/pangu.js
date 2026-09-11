import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rolldown } from 'rolldown';

const usage =
  'Usage: node scripts/prompt-experiments/hyphen-digit/corpus/check-inputs.mjs\nReplays frozen development/holdout HTML in the attached pangu-eval session. Run outside the browser sandbox. No model inference.';
if (process.argv.includes('--help')) {
  console.log(usage);
  process.exit(0);
}
assert.equal(process.argv.length, 2, usage);

const read = (name) => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
const development = read('development.json');
const holdout = read('holdout.json');
assert.equal(development.role, 'development');
assert.equal(holdout.role, 'holdout');
const developmentSources = new Set(development.cases.map((kase) => kase.source));
for (const kase of holdout.cases) {
  assert(!developmentSources.has(kase.source), `Source appears in both roles: ${kase.source}`);
}
const cases = [...development.cases, ...holdout.cases];
assert.equal(new Set(cases.map((kase) => kase.id)).size, cases.length, 'Case IDs must be unique');
for (const kase of cases) {
  assert.equal(kase.original_excerpt[kase.original_at], '-', `${kase.id}: original target moved`);
  assert.equal(typeof kase.source_css, 'string', `${kase.id}: source CSS must be recorded, including an empty string for default styles`);
}

async function replay(page, bundle, cases) {
  const tab = await page.context().newPage();
  try {
    await tab.goto('about:blank');
    await tab.evaluate(bundle);
    const results = [];
    for (const kase of cases) {
      const title = kase.source_surface === 'document-title';
      await tab.setContent(`<html><head><style>${kase.source_css}</style>${title ? kase.source_html : ''}</head><body>${title ? '' : kase.source_html}</body></html>`);
      results.push(
        await tab.evaluate((kase) => {
          const { BrowserPangu, Pangu, applyTextEdits, hyphenDigit, readSentence } = globalThis.hyphenEval;
          const walker = document.createTreeWalker(document, NodeFilter.SHOW_TEXT);
          let node;
          while (walker.nextNode()) {
            if (walker.currentNode.data === kase.original_excerpt) {
              node = walker.currentNode;
              break;
            }
          }
          if (!node) {
            throw new Error(`${kase.id}: original text node missing; check source_html`);
          }
          const pangu = new Pangu();
          const settled = pangu.spaceText(node.data);
          const sentenceAt = (at) => readSentence(node, node.data, at, new Map());
          const context = sentenceAt(kase.original_at);
          const match = hyphenDigit.find(node.data, settled, sentenceAt).find((candidate) => candidate.sentence === context.sentence && candidate.at === context.at);
          if (!match) {
            throw new Error(`${kase.id}: production detector excluded the target; check source spacing and CSS`);
          }
          const result = { id: kase.id, input: context.sentence, at: context.at, settled, index: match.index };
          if (kase.expected_target_spacing !== undefined || kase.expected_spacing !== undefined) {
            const matches = hyphenDigit.find(node.data, settled, sentenceAt);
            if (matches.length !== 1) {
              throw new Error(`${kase.id}: spacing gold requires exactly one eligible target in this excerpt`);
            }
            const expected = applyTextEdits(settled, hyphenDigit.edits({ ...match, node, settled }, kase.expected_label));
            if (expected !== kase.expected_target_spacing || expected !== kase.expected_spacing) {
              throw new Error(`${kase.id}: production target edits differ from recorded spacing gold`);
            }
            const browserPangu = new BrowserPangu();
            browserPangu.taskScheduler.config.enabled = false;
            let routed;
            browserPangu.onTextNodesSettled = (entries) => {
              const entry = entries.find((entry) => entry.node === node);
              if (entry) {
                const unspacedByNode = new Map(entries.map((entry) => [entry.node, entry.unspaced]));
                routed = hyphenDigit.find(entry.unspaced, entry.settled, (at) => readSentence(node, entry.unspaced, at, unspacedByNode));
              }
            };
            browserPangu.spaceNode(kase.source_surface === 'document-title' ? document.querySelector('head > title') : document.body);
            if (node.data !== settled || routed?.length !== 1 || routed[0].sentence !== context.sentence || routed[0].at !== context.at || routed[0].index !== match.index) {
              throw new Error(`${kase.id}: BrowserPangu did not emit the recorded production target`);
            }
            browserPangu.applyLateFixes([{ node, settled, data: expected }]);
            if (node.data !== kase.expected_spacing) {
              throw new Error(`${kase.id}: production late fix differs from recorded full-excerpt spacing`);
            }
          }
          if (kase.source.includes('electrolux.com.tw')) {
            const authored = node.data.split('。', 1)[0];
            if (!authored.includes('攝氏 -18 度以下')) {
              throw new Error(`${kase.id}: authored-space source excerpt changed`);
            }
            result.authoredSpaceExcluded = !hyphenDigit.hasPotentialCandidates(authored) && hyphenDigit.find(authored, pangu.spaceText(authored)).length === 0;
          }
          return result;
        }, kase),
      );
    }
    return results;
  } finally {
    await tab.close();
  }
}

const temporary = mkdtempSync(join(tmpdir(), 'pangu-hyphen-inputs-'));
try {
  const root = fileURLToPath(new URL('../../../../', import.meta.url));
  const entry = join(temporary, 'entry.ts');
  writeFileSync(
    entry,
    [
      `export { Pangu } from ${JSON.stringify(join(root, 'src/shared/index.ts'))};`,
      `export { BrowserPangu } from ${JSON.stringify(join(root, 'src/browser/pangu.ts'))};`,
      `export { applyTextEdits } from ${JSON.stringify(join(root, 'browser-extensions/chrome/src/ai-spacing/shapes/base.ts'))};`,
      `export { hyphenDigit } from ${JSON.stringify(join(root, 'browser-extensions/chrome/src/ai-spacing/shapes/hyphen-digit.ts'))};`,
      `export { readSentence } from ${JSON.stringify(join(root, 'browser-extensions/chrome/src/ai-spacing/sentence-context.ts'))};`,
    ].join('\n'),
  );
  const build = await rolldown({ input: entry });
  let bundle;
  try {
    bundle = (await build.generate({ format: 'iife', name: 'hyphenEval' })).output[0].code;
  } finally {
    await build.close();
  }
  const command = join(temporary, 'replay.js');
  writeFileSync(command, `async page => (${replay.toString()})(page, ${JSON.stringify(bundle)}, ${JSON.stringify(cases)})`);
  const results = JSON.parse(
    execFileSync('playwright-cli', ['-s=pangu-eval', '--raw', 'run-code', `--filename=${command}`], {
      encoding: 'utf8',
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'inherit'],
    }),
  );
  assert.equal(results.length, cases.length, 'Browser did not return every case');
  for (const [index, result] of results.entries()) {
    const kase = cases[index];
    assert.deepEqual(
      { ...result, authoredSpaceExcluded: undefined },
      {
        id: kase.id,
        input: kase.input,
        at: kase.at,
        settled: kase.settled,
        index: kase.settled_index,
        authoredSpaceExcluded: undefined,
      },
      `${kase.id}: production routing differs from the frozen input`,
    );
  }
  assert(
    results.some((result) => result.authoredSpaceExcluded === true),
    'Author-written Electrolux spaces must remain excluded',
  );
  console.log(`Verified ${development.cases.length} development and ${holdout.cases.length} holdout inputs, disjoint source pages, and authored-space exclusion.`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
