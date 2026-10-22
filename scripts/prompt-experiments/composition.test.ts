import { spawnSync } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, onTestFinished, test } from 'vitest';
import { digitPlusPrompt } from '../../browser-extensions/chrome/src/ai-spacing/shapes/digit-plus-prompt';
import { hyphenDigitPrompt } from '../../browser-extensions/chrome/src/ai-spacing/shapes/hyphen-digit-prompt';
import { scratchDirectory } from './artifacts.mjs';

const modulePath = './composition.mjs';
const { prepareComposition, evaluateComposition } = await import(modulePath);
const loaderPath = './plus-digit/experiment.mjs';
const { loadCorpus } = await import(loaderPath);
const frozenPath = './plus-digit/results/20261023-first-shape/prompts.mjs';
const frozen = await import(frozenPath);
const registry = {
  SHAPE_PROMPTS: { 'plus-digit': 'v1-en', 'hyphen-digit': 'hyphen-frozen', 'digit-plus': 'digit-frozen' },
  PROMPTS: {
    ...frozen.PROMPTS,
    ...Object.fromEntries(
      [
        [hyphenDigitPrompt, 'hyphen-frozen'],
        [digitPlusPrompt, 'digit-frozen'],
      ].map(([prompt, key]: any) => [
        key,
        {
          system: prompt.systemPrompt,
          labels: prompt.candidateLabels,
          build: (kase: any) => prompt.buildQuestion(kase.input, kase.at),
        },
      ]),
    ),
  },
};

function setup() {
  const directory = scratchDirectory(process.cwd(), 'pangu-composition-test-');
  onTestFinished(() => rmSync(directory, { recursive: true, force: true }));
  const mixed = '氣溫在-50℃至+200℃；遊戲2+資料片';
  const seed = '字母+9位；字母+8位';
  const rows = [
    {
      id: 'mixed',
      input: '氣溫在-50℃至+200℃',
      sourceExcerpt: mixed,
      excerptId: 'mixed',
      at: 8,
      excerptAt: 8,
      expected_label: 'signed-number',
      expected_output: '氣溫在 - 50℃ 至 +200℃',
      expected_excerpt_output: '氣溫在 - 50℃ 至 +200℃；遊戲 2+ 資料片',
      expected_composed_output: '氣溫在 -50℃ 至 +200℃',
      expected_composed_excerpt_output: '氣溫在 -50℃ 至 +200℃；遊戲 2 + 資料片',
      companion_targets: [
        { kind: 'hyphen-digit', excerptAt: 3, expected_label: 'signed-number' },
        { kind: 'digit-plus', excerptAt: mixed.lastIndexOf('+'), expected_label: 'conjunction' },
      ],
    },
    ...[9, 8].map((number, index) => ({
      id: `join-${number}`,
      input: `字母+${number}位`,
      sourceExcerpt: seed,
      excerptId: 'seed',
      at: 2,
      excerptAt: index === 0 ? 2 : 8,
      expected_label: 'conjunction',
      expected_output: `字母 + ${number} 位`,
      expected_excerpt_output: '字母 + 9 位；字母 + 8 位',
      expected_composed_output: `字母 + ${number} 位`,
      expected_composed_excerpt_output: '字母 + 9 位；字母 + 8 位',
      companion_targets: [],
    })),
  ].map((kase) => ({
    ...kase,
    enum: 'plus',
    ordinal: 1,
    targets: [{ ordinal: 1, expected_label: kase.expected_label }],
    source: 'https://example.test/composition',
    publisher: 'Synthetic implementation test',
    retrievedDate: '2026-10-23',
    category: 'test',
    rationale: 'Synthetic fixture, not inference evidence.',
    evidence: 'Synthetic fixture.',
    source_html: `<p>${kase.sourceExcerpt}</p>`,
    routing_status: 'synthetic fixture',
  }));
  const path = join(directory, 'corpus.json');
  writeFileSync(path, JSON.stringify({ role: 'development', enums: { plus: frozen.LABELS }, cases: rows }));
  const corpus = loadCorpus(path);
  return { corpus, prepared: prepareComposition(corpus, registry), path, directory };
}

function artifacts(prepared: any, side: string) {
  return Object.fromEntries(
    Object.entries(prepared.corpora).map(([kind, corpus]: any) => {
      const variant = side === 'baseline' && kind === 'plus-digit' ? 'rules-only' : registry.SHAPE_PROMPTS[kind as keyof typeof registry.SHAPE_PROMPTS];
      const prompt = registry.PROMPTS[variant];
      const labels = Object.values(corpus.enums)[0];
      const offline = variant === 'rules-only';
      return [
        kind,
        {
          status: 'complete',
          purpose: 'accuracy',
          variant,
          system: prompt.system,
          sampling: 'temperature 0, topK 1',
          omitResponseConstraintInput: false,
          backend: offline ? 'rules-only' : 'prompt-api',
          context: offline ? 'offline' : 'extension-sw',
          offlineLabel: offline ? 'signed-number' : undefined,
          profileVerified: !offline,
          extensionWorkerVerified: !offline,
          repeats: 3,
          expectedAttemptsPerCase: 6,
          orders: [corpus.cases.map((kase: any) => kase.id), corpus.cases.map((kase: any) => kase.id).reverse()],
          results: corpus.cases.map((kase: any) => ({
            ...kase,
            question: prompt.build(kase, labels),
            responseConstraint: { type: 'string', enum: labels },
            answers: [0, 1].flatMap((order) =>
              Array.from({ length: 3 }, () => {
                const answer = offline ? 'signed-number' : kase.expected_label;
                return { order, answer, raw: JSON.stringify(answer), error: null };
              }),
            ),
          })),
        },
      ];
    }),
  );
}

function comparisons(prepared: any) {
  return Array.from({ length: 2 }, () => ({ baseline: artifacts(prepared, 'baseline'), candidate: artifacts(prepared, 'candidate') }));
}

test('prepares every shipping shape from one original and settled snapshot, with distinct component and composed gold', () => {
  const { prepared } = setup();
  expect(Object.fromEntries(Object.entries(prepared.corpora).map(([kind, corpus]: any) => [kind, corpus.cases.length]))).toEqual({ 'hyphen-digit': 1, 'digit-plus': 1, 'plus-digit': 3 });
  expect(prepared.groups).toHaveLength(2);
  const hyphen = prepared.corpora['hyphen-digit'].cases[0];
  const plus = prepared.corpora['plus-digit'].cases[0];
  expect(hyphen).toMatchObject({ symbol: '-', targets: [{ ordinal: hyphen.ordinal, expected_label: hyphen.expected_label }] });
  const digit = prepared.corpora['digit-plus'].cases[0];
  expect(digit).toMatchObject({ symbol: '+', targets: [{ ordinal: digit.ordinal, expected_label: digit.expected_label }] });
  expect(hyphen.settled).toBe(plus.settled);
  expect(hyphen.input).toBe(plus.input);
  expect(hyphen.expected_spacing).toBe('氣溫在 -50℃ 至 +200℃；遊戲 2+ 資料片');
  expect(plus.expected_spacing).toBe('氣溫在 - 50℃ 至 +200℃；遊戲 2+ 資料片');
  expect(prepared.groups[0].expected).toBe('氣溫在 -50℃ 至 +200℃；遊戲 2 + 資料片');
});

test('rejects missing, duplicate, misaligned and inconsistent companion annotations or composed gold', () => {
  for (const mutate of [
    (corpus: any) => corpus.cases[0].companion_targets.pop(),
    (corpus: any) => corpus.cases[0].companion_targets.push(corpus.cases[0].companion_targets[0]),
    (corpus: any) => corpus.cases[0].companion_targets[0].excerptAt++,
    (corpus: any) => (corpus.cases[0].expected_composed_output = corpus.cases[0].expected_output),
    (corpus: any) => (corpus.cases[0].expected_composed_excerpt_output = corpus.cases[0].expected_excerpt_output),
    (corpus: any) => (corpus.cases[2].companion_targets = [{ kind: 'hyphen-digit', excerptAt: 0, expected_label: 'signed-number' }]),
  ]) {
    const { corpus } = setup();
    mutate(corpus);
    expect(() => prepareComposition(corpus, registry)).toThrow();
  }
});

test('does not promote a tight plus when its full model context contains another plus', () => {
  const { corpus } = setup();
  corpus.cases[0].sourceExcerpt = '氣溫在-50℃至+200℃和+300℃';
  expect(() => prepareComposition(corpus, registry)).toThrow('missing or ineligible target annotation');
});

test('scores components and complete excerpts separately, composing descending-index edits', () => {
  const { prepared } = setup();
  const gate = evaluateComposition(prepared, comparisons(prepared), registry);
  expect(gate).toMatchObject({ passed: true, stableImprovements: ['seed'], protocolIssues: [] });
  expect(gate.runs[0].baseline.passing).toBe(1);
  expect(gate.runs[0].candidate.passing).toBe(2);
  expect(gate.runs[0].candidate.components['plus-digit'].passing).toBe(3);
  expect(gate.runs[0].candidate.excerpts[0].attempts[0].output).toBe('氣溫在 -50℃ 至 +200℃；遊戲 2 + 資料片');
});

test('attributes companion failures and rejects whole-excerpt regression or per-target attempt decline', () => {
  const { prepared } = setup();
  const pairs = comparisons(prepared);
  const answer = pairs[1].candidate['hyphen-digit'].results[0].answers[0];
  Object.assign(answer, { answer: 'range-or-separator', raw: '"range-or-separator"' });
  const gate = evaluateComposition(prepared, pairs, registry);
  expect(gate.passed).toBe(false);
  expect(gate.runs[1].regressions).toEqual(['mixed']);
  expect(gate.runs[1].attemptDeclines).toEqual(['mixed']);
  expect(gate.runs[1].targetDeclines).toEqual(['hyphen-digit/mixed:hyphen-digit:3']);
  expect(gate.runs[1].candidate.excerpts[0].attempts[0].failures).toEqual([{ kind: 'hyphen-digit', id: 'mixed:hyphen-digit:3' }]);
});

test('rejects unsafe signed-plus answers, inference errors, missing answers, changed questions and changed sampling', () => {
  for (const mutate of [
    (pairs: any) => Object.assign(pairs[0].candidate['plus-digit'].results[0].answers[0], { answer: 'conjunction', raw: '"conjunction"' }),
    (pairs: any) => (pairs[0].candidate['hyphen-digit'].results[0].answers[0].error = 'timeout'),
    (pairs: any) => pairs[0].candidate['hyphen-digit'].results[0].answers.pop(),
    (pairs: any) => (pairs[0].candidate['hyphen-digit'].results[0].question += 'changed'),
    (pairs: any) => (pairs[0].candidate['hyphen-digit'].sampling = 'temperature 1, topK 1'),
    (pairs: any) => pairs[0].candidate['hyphen-digit'].results.push(pairs[0].candidate['hyphen-digit'].results[0]),
  ]) {
    const { prepared } = setup();
    const pairs = comparisons(prepared);
    mutate(pairs);
    expect(evaluateComposition(prepared, pairs, registry).passed).toBe(false);
  }
});

test('shipping prompts and schemas must stay frozen, including a shape with zero targets', () => {
  const { corpus } = setup();
  const changed = { ...registry, PROMPTS: { ...registry.PROMPTS, 'hyphen-frozen': { ...registry.PROMPTS['hyphen-frozen'], system: 'Changed.' } } };
  expect(() => prepareComposition(corpus, changed)).toThrow('frozen companion system differs');
  const missing = { ...registry, SHAPE_PROMPTS: { 'hyphen-digit': 'hyphen-frozen', 'plus-digit': 'v1-en' } };
  expect(() => prepareComposition(corpus, missing)).toThrow('freeze one prompt key');
  expect(readFileSync(new URL('./composition.mjs', import.meta.url), 'utf8')).not.toContain('LanguageModel.create');
});

test('prepared component corpora pass the existing sweep CLI preflight without a browser', () => {
  const { corpus, path, directory } = setup();
  delete corpus.cases[0].routing_status;
  const prepared = prepareComposition(corpus, registry);
  const prompts = join(directory, 'prompts.mjs');
  const shipping = new URL('../../browser-extensions/chrome/src/ai-spacing/shapes/', import.meta.url).href;
  writeFileSync(
    prompts,
    `import { PROMPTS as plus } from ${JSON.stringify(new URL(frozenPath, import.meta.url).href)};
import { hyphenDigitPrompt as hyphen } from ${JSON.stringify(`${shipping}hyphen-digit-prompt.ts`)};
import { digitPlusPrompt as digit } from ${JSON.stringify(`${shipping}digit-plus-prompt.ts`)};
const adapt = p => ({ system: p.systemPrompt, labels: p.candidateLabels, build: k => p.buildQuestion(k.input, k.at) });
export const PROMPTS = { ...plus, 'hyphen-frozen': adapt(hyphen), 'digit-frozen': adapt(digit) };`,
  );
  for (const [kind, component] of Object.entries(prepared.corpora)) {
    writeFileSync(path, JSON.stringify(component));
    const result = spawnSync(
      process.execPath,
      ['scripts/prompt-experiments/sweep.mjs', '--experiment', kind, '--cases', path, '--prompts', prompts, '--check', registry.SHAPE_PROMPTS[kind as keyof typeof registry.SHAPE_PROMPTS]],
      { encoding: 'utf8' },
    );
    expect(result.status, result.stderr).toBe(0);
  }
});
