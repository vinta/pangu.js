import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { rolldown } from 'rolldown';
import { scratchDirectory } from '../../public-artifacts.mjs';

const usage =
  'Usage: node scripts/prompt-experiments/hyphen-digit/corpus/check-inputs.mjs [--cases <corpus.json> ...]\nReplays supplied corpora, or the shared development corpus, in the attached pangu-eval session. Run outside the browser sandbox. No model inference.';
const { values } = parseArgs({ options: { cases: { type: 'string', multiple: true }, help: { type: 'boolean' } } });
if (values.help) {
  console.log(usage);
  process.exit(0);
}
const paths = values.cases ?? [new URL('./development.json', import.meta.url)];
const corpora = paths.map((path) => JSON.parse(readFileSync(path, 'utf8')));
for (const corpus of corpora) {
  assert(['development', 'holdout'].includes(corpus.role), 'Corpus role must be development or holdout');
}
const developmentSources = new Set(corpora.filter((corpus) => corpus.role === 'development').flatMap((corpus) => corpus.cases.map((kase) => kase.canonical_source ?? kase.source)));
for (const kase of corpora.filter((corpus) => corpus.role === 'holdout').flatMap((corpus) => corpus.cases)) {
  assert(!developmentSources.has(kase.canonical_source ?? kase.source), `Source appears in both roles: ${kase.source}`);
}
const cases = corpora.flatMap((corpus) => corpus.cases);
assert(cases.length, 'Empty corpus; provide at least one verified case');
assert.equal(new Set(cases.map((kase) => kase.id)).size, cases.length, 'Case IDs must be unique');
for (const kase of cases) {
  assert.equal(kase.original_excerpt[kase.original_at], '-', `${kase.id}: original target moved`);
  assert.equal(typeof kase.source_css, 'string', `${kase.id}: source CSS must be recorded, including an empty string for default styles`);
  assert.equal(typeof kase.expected_target_spacing, 'string', `${kase.id}: target spacing must be annotated before inference`);
  assert.equal(typeof kase.expected_spacing, 'string', `${kase.id}: full-excerpt spacing must be annotated before inference`);
}

async function replay(page, bundle, cases) {
  const tab = await page.context().newPage();
  try {
    await tab.goto('about:blank');
    await tab.evaluate(bundle);
    const results = [];
    for (const kase of cases) {
      const group = cases.filter((other) => other.source === kase.source && other.original_excerpt === kase.original_excerpt);
      const title = kase.source_surface === 'document-title';
      await tab.setContent(`<html><head><style>${kase.source_css}</style>${title ? kase.source_html : ''}</head><body>${title ? '' : kase.source_html}</body></html>`);
      results.push(
        await tab.evaluate(
          ({ kase, group }) => {
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
            const matches = hyphenDigit.find(node.data, settled, sentenceAt);
            const match = matches.find((candidate) => candidate.sentence === context.sentence && candidate.at === context.at);
            if (!match) {
              throw new Error(`${kase.id}: production detector excluded the target; check source spacing and CSS`);
            }
            const result = { id: kase.id, input: context.sentence, at: context.at, settled, index: match.index };
            if (matches.length !== group.length || new Set(group.map((target) => target.settled_index)).size !== group.length) {
              throw new Error(`${kase.id}: every eligible target in this excerpt needs one annotation`);
            }
            const allEdits = group.flatMap((target) => {
              const candidate = matches.find((candidate) => candidate.index === target.settled_index);
              if (!candidate || candidate.sentence !== target.input || candidate.at !== target.at || settled !== target.settled || target.expected_spacing !== kase.expected_spacing) {
                throw new Error(`${target.id}: target routing, settled text, or combined spacing annotation disagrees`);
              }
              const edits = hyphenDigit.edits({ ...candidate, node, settled }, target.expected_label);
              if (applyTextEdits(settled, edits) !== target.expected_target_spacing) {
                throw new Error(`${target.id}: production target edits differ from recorded target spacing`);
              }
              return edits;
            });
            const expected = applyTextEdits(settled, allEdits);
            if (expected !== kase.expected_spacing) {
              throw new Error(`${kase.id}: combined production edits differ from recorded full-excerpt spacing`);
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
            if (node.data !== settled || JSON.stringify(routed) !== JSON.stringify(matches)) {
              throw new Error(`${kase.id}: BrowserPangu did not emit every recorded production target`);
            }
            browserPangu.applyLateFixes([{ node, settled, data: expected }]);
            if (node.data !== kase.expected_spacing) {
              throw new Error(`${kase.id}: production late fix differs from recorded full-excerpt spacing`);
            }
            if (kase.id === 'real-development-08') {
              const authored = kase.original_excerpt.split('。', 1)[0];
              if (!authored.includes('攝氏 -18 度以下')) {
                throw new Error(`${kase.id}: authored-space source excerpt changed`);
              }
              result.authoredSpaceExcluded =
                !hyphenDigit.hasPotentialCandidates(authored) && hyphenDigit.find(authored, pangu.spaceText(authored)).length === 0 && node.data.split('。', 1)[0] === authored;
            }
            return result;
          },
          { kase, group },
        ),
      );
    }
    return results;
  } finally {
    await tab.close();
  }
}

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const temporary = scratchDirectory(root, 'pangu-hyphen-inputs-');
try {
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
  assert(!cases.some((kase) => kase.id === 'real-development-08') || results.some((result) => result.authoredSpaceExcluded === true), 'Author-written Electrolux spaces must remain excluded');
  console.log(
    `Verified ${cases.length} inputs, complete target annotations, individual and combined production spacing, disjoint source pages${results.some((result) => result.authoredSpaceExcluded === true) ? ', and authored-space exclusion' : ''}.`,
  );
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
