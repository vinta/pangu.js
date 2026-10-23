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
const frozenPath = './plus-digit/results/20261023-current-cases/prompts.mjs';
const frozen = await import(frozenPath);
const supportsTypeScript = 'typescript' in process.features && process.features.typescript;
const registry = {
  BASELINE_SHAPE_PROMPTS: { 'plus-digit': 'v6-en-range-sign', 'hyphen-digit': 'hyphen-frozen', 'digit-plus': 'digit-frozen' },
  SHAPE_PROMPTS: { 'plus-digit': 'candidate', 'hyphen-digit': 'hyphen-frozen', 'digit-plus': 'digit-frozen' },
  PROMPTS: {
    ...frozen.PROMPTS,
    candidate: { ...frozen.PROMPTS['v6-en-range-sign'], system: 'Candidate.' },
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

// The shipping baseline misses both seed conjunctions unless a test passes another plus-digit answer.
function artifacts(prepared: any, side: string, plusDigitAnswer = side === 'baseline' ? () => 'signed-number' : (kase: any) => kase.expected_label) {
  return Object.fromEntries(
    Object.entries(prepared.corpora).map(([kind, corpus]: any) => {
      const variant = (side === 'baseline' ? registry.BASELINE_SHAPE_PROMPTS : registry.SHAPE_PROMPTS)[kind as keyof typeof registry.SHAPE_PROMPTS];
      const prompt = registry.PROMPTS[variant];
      const labels = Object.values(corpus.enums)[0];
      return [
        kind,
        {
          status: 'complete',
          purpose: 'accuracy',
          variant,
          system: prompt.system,
          sampling: 'temperature 0, topK 1',
          omitResponseConstraintInput: false,
          backend: 'prompt-api',
          context: 'extension-sw',
          profileVerified: true,
          extensionWorkerVerified: true,
          repeats: 3,
          expectedAttemptsPerCase: 6,
          orders: [corpus.cases.map((kase: any) => kase.id), corpus.cases.map((kase: any) => kase.id).reverse()],
          results: corpus.cases.map((kase: any) => ({
            ...kase,
            question: prompt.build(kase, labels),
            responseConstraint: { type: 'string', enum: labels },
            answers: [0, 1].flatMap((order) =>
              Array.from({ length: 3 }, () => {
                const answer = kind === 'plus-digit' ? plusDigitAnswer(kase) : kase.expected_label;
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
  expect(prepared.groups[0].targets.map(({ kind }: { kind: string }) => kind)).toEqual(['plus-digit', 'hyphen-digit', 'digit-plus']);
  expect(plus.routing_status).toBe('Shipping detector matched the saved excerpt; DOM routing remains unverified.');
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

test('rejects a candidate that loses a plus-digit fix the shipping baseline makes', () => {
  const { prepared } = setup();
  const pairs = Array.from({ length: 2 }, () => ({ baseline: artifacts(prepared, 'baseline', (kase: any) => kase.expected_label), candidate: artifacts(prepared, 'candidate') }));
  const answer = pairs[0].candidate['plus-digit'].results.find((row: any) => row.id === 'join-9').answers[0];
  Object.assign(answer, { answer: 'signed-number', raw: '"signed-number"' });
  const gate = evaluateComposition(prepared, pairs, registry);
  expect(gate.passed).toBe(false);
  expect(gate.runs[0].regressions).toEqual(['seed']);
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

test('every baseline prompt and both companion sides stay shipping while the plus-digit candidate can differ', () => {
  const { corpus } = setup();
  const changedCompanion = { ...registry, PROMPTS: { ...registry.PROMPTS, 'hyphen-frozen': { ...registry.PROMPTS['hyphen-frozen'], system: 'Changed.' } } };
  expect(() => prepareComposition(corpus, changedCompanion)).toThrow('hyphen-digit: frozen baseline system differs from shipping');
  const splitCompanion = {
    ...registry,
    SHAPE_PROMPTS: { ...registry.SHAPE_PROMPTS, 'hyphen-digit': 'hyphen-changed' },
    PROMPTS: { ...registry.PROMPTS, 'hyphen-changed': { ...registry.PROMPTS['hyphen-frozen'], build: () => 'Changed.' } },
  };
  expect(() => prepareComposition(corpus, splitCompanion)).toThrow('companion prompts must match on both sides');
  const changedCandidate = { ...registry, PROMPTS: { ...registry.PROMPTS, candidate: { ...registry.PROMPTS.candidate, system: 'Changed.', build: () => 'Changed.' } } };
  expect(() => prepareComposition(corpus, changedCandidate)).not.toThrow();
  const changedBaseline = { ...registry, PROMPTS: { ...registry.PROMPTS, 'v6-en-range-sign': { ...registry.PROMPTS['v6-en-range-sign'], system: 'Changed.' } } };
  expect(() => prepareComposition(corpus, changedBaseline)).toThrow('plus-digit: frozen baseline system differs from shipping');
  const changedBaselineQuestion = { ...registry, PROMPTS: { ...registry.PROMPTS, 'v6-en-range-sign': { ...registry.PROMPTS['v6-en-range-sign'], build: () => 'Changed.' } } };
  expect(() => prepareComposition(corpus, changedBaselineQuestion)).toThrow('plus-digit: frozen baseline question differs from shipping');
  const missing = { ...registry, SHAPE_PROMPTS: { 'hyphen-digit': 'hyphen-frozen', 'plus-digit': 'candidate' } };
  expect(() => prepareComposition(corpus, missing)).toThrow('SHAPE_PROMPTS: freeze one prompt key');
  const { BASELINE_SHAPE_PROMPTS: _, ...noBaseline } = registry;
  expect(() => prepareComposition(corpus, noBaseline)).toThrow('BASELINE_SHAPE_PROMPTS: freeze one prompt key');
  expect(readFileSync(new URL('./composition.mjs', import.meta.url), 'utf8')).not.toContain('LanguageModel.create');
});

test.skipIf(!supportsTypeScript)('prepared component corpora pass the existing sweep CLI preflight without a browser', () => {
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
export const PROMPTS = { ...plus, candidate: { ...plus['v6-en-range-sign'], system: 'Candidate.' }, 'hyphen-frozen': adapt(hyphen), 'digit-frozen': adapt(digit) };
export const BASELINE_SHAPE_PROMPTS = ${JSON.stringify(registry.BASELINE_SHAPE_PROMPTS)};
export const SHAPE_PROMPTS = ${JSON.stringify(registry.SHAPE_PROMPTS)};`,
  );
  const output = join(directory, 'prepared');
  const preparation = spawnSync(process.execPath, ['scripts/prompt-experiments/composition.mjs', 'prepare', '--cases', path, '--prompts', prompts, '--out', output], { encoding: 'utf8' });
  expect(preparation.status, preparation.stderr).toBe(0);
  const snapshot = JSON.parse(readFileSync(join(output, 'prepared.json'), 'utf8')).frozen.sources;
  expect(snapshot['browser-extensions/chrome/src/ai-spacing/shapes/plus-digit.ts']).toMatch(/^[a-f0-9]{64}$/);
  expect(snapshot['browser-extensions/chrome/src/ai-spacing/shapes/plus-digit-prompt.ts']).toMatch(/^[a-f0-9]{64}$/);
  for (const [kind, component] of Object.entries(prepared.corpora)) {
    writeFileSync(path, JSON.stringify(component));
    const variants = new Set([registry.BASELINE_SHAPE_PROMPTS, registry.SHAPE_PROMPTS].map((map) => map[kind as keyof typeof map]));
    const result = spawnSync(process.execPath, ['scripts/prompt-experiments/sweep.mjs', '--experiment', kind, '--cases', path, '--prompts', prompts, '--check', ...variants], { encoding: 'utf8' });
    expect(result.status, result.stderr).toBe(0);
  }
});
