import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, onTestFinished, test } from 'vitest';
import { publicCase, scratchDirectory } from './artifacts.mjs';

const experimentModule = './plus-digit/experiment.mjs';
const { loadCorpus, evaluatePaired, labels, score } = await import(experimentModule);
const supportsTypeScript = 'typescript' in process.features && process.features.typescript;

function fixture() {
  const excerpt = '字母+9位；字母+8位';
  return {
    role: 'development',
    enums: { plus: ['signed-number', 'conjunction', 'unsure'] },
    cases: [
      {
        id: 'join-9',
        input: '字母+9位',
        expected_output: '字母 + 9 位',
        expected_label: 'conjunction',
        at: 2,
        excerptAt: 2,
        sourceExcerpt: excerpt,
        expected_excerpt_output: '字母 + 9 位；字母 + 8 位',
        excerptId: 'two-targets',
      },
      {
        id: 'join-8',
        input: '字母+8位',
        expected_output: '字母 + 8 位',
        expected_label: 'conjunction',
        at: 2,
        excerptAt: 8,
        sourceExcerpt: excerpt,
        expected_excerpt_output: '字母 + 9 位；字母 + 8 位',
        excerptId: 'two-targets',
      },
      {
        id: 'sign',
        input: '氣溫是+5度',
        expected_output: '氣溫是 +5 度',
        expected_label: 'signed-number',
        at: 3,
        excerptAt: 3,
        sourceExcerpt: '氣溫是+5度',
        expected_excerpt_output: '氣溫是 +5 度',
        excerptId: 'sign',
      },
    ].map((kase) => ({
      ...kase,
      enum: 'plus',
      ordinal: 1,
      targets: [{ ordinal: 1, expected_label: kase.expected_label }],
      source: 'https://example.test/fixture',
      publisher: 'Synthetic implementation fixture',
      retrievedDate: '2026-10-23',
      category: 'implementation-test',
      rationale: 'Synthetic fixture; never scored as model accuracy evidence.',
      evidence: 'Synthetic implementation test only.',
      contract_routing: 'eligible; production detector unverified',
    })),
  };
}

function setup() {
  const root = scratchDirectory(process.cwd(), 'pangu-plus-digit-test-');
  onTestFinished(() => rmSync(root, { recursive: true, force: true }));
  const cases = join(root, 'cases.json');
  const prompts = join(root, 'prompts.mjs');
  const corpus = fixture();
  writeFileSync(cases, JSON.stringify(corpus));
  writeFileSync(
    prompts,
    `export const PROMPTS = {
    'rules-only': { system: 'No edit.', build: kase => kase.input, offlineLabel: 'signed-number' },
    'frozen-shipping': { system: 'Ship.', build: kase => kase.input },
    candidate: { system: 'Classify.', build: kase => kase.input }
  };`,
  );
  return { root, cases, prompts, corpus };
}

type FixtureCase = ReturnType<typeof fixture>['cases'][number];
const missConjunctions = () => 'signed-number';

function artifact(cases: FixtureCase[], variant = 'candidate', repeats = 1, answerFor = (kase: FixtureCase) => kase.expected_label) {
  return {
    status: 'complete',
    purpose: 'accuracy',
    variant,
    system: variant === 'shipping' ? 'Ship.' : 'Classify.',
    omitResponseConstraintInput: false,
    sampling: 'temperature 0, topK 1',
    backend: 'prompt-api',
    context: 'extension-sw',
    profileVerified: true,
    extensionWorkerVerified: true,
    repeats,
    expectedAttemptsPerCase: repeats * 2,
    orders: [cases.map((kase) => kase.id), cases.map((kase) => kase.id).reverse()],
    results: cases.map((kase) => ({
      ...kase,
      stable: true,
      question: kase.input,
      responseConstraint: { type: 'string', enum: labels },
      answers: [0, 1].flatMap((order) =>
        Array.from({ length: repeats }, () => {
          const answer = answerFor(kase);
          return { order, answer, raw: JSON.stringify(answer), error: null as string | null };
        }),
      ),
    })),
  };
}

function changeAnswer(run: ReturnType<typeof artifact>, index: number, answer: string) {
  for (const row of run.results[index]!.answers) Object.assign(row, { answer, raw: JSON.stringify(answer) });
}

test('plus-digit loader validates tight targets, contract contexts, seed provenance and individual/combined gold', () => {
  const { cases, corpus } = setup();
  const loaded = loadCorpus(cases).cases;
  expect(loaded[0]).toMatchObject({ settled: '字母 +9 位；字母 +8 位', settled_index: 3, expected_target_spacing: '字母 + 9 位；字母 +8 位', expected_spacing: '字母 + 9 位；字母 + 8 位' });
  expect(loaded[1]).toMatchObject({ settled_index: 11, expected_target_spacing: '字母 +9 位；字母 + 8 位' });
  expect(publicCase(loaded[0])).toMatchObject({
    excerptId: 'two-targets',
    excerptAt: 2,
    expected_excerpt_output: '字母 + 9 位；字母 + 8 位',
    contract_routing: 'eligible; production detector unverified',
  });
  const seed = structuredClone(corpus);
  for (const kase of seed.cases) Object.assign(kase, { source: 'provided by users', evidence: 'user-provided; maintainer-confirmed real case' });
  writeFileSync(cases, JSON.stringify(seed));
  expect(loadCorpus(cases).cases).toHaveLength(3);
  for (const [patch, error] of [
    [{ input: '字母+9+8位' }, 'exactly one +'],
    [{ input: '字母 +9位', at: 3 }, 'tight CJK+digit'],
    [{ input: '字母+ 9位' }, 'tight CJK+digit'],
    [{ at: 0 }, 'target ordinal or offset'],
    [{ expected_output: '字母 + 8 位' }, 'non-space edit'],
    [{ expected_output: '字母 +9 位' }, 'input gold disagrees'],
    [{ excerptAt: 8 }, 'contract sentence slice'],
    [{ expected_excerpt_output: '字母 + 9 位；字母 +8 位' }, 'inconsistent excerpt gold'],
    [{ source: 'unknown' }, 'invalid source'],
    [{ source: 'provided by users' }, 'missing seed verification'],
  ] as const) {
    const changed = structuredClone(corpus);
    Object.assign(changed.cases[0]!, patch);
    writeFileSync(cases, JSON.stringify(changed));
    expect(() => loadCorpus(cases), JSON.stringify(patch)).toThrow(error);
  }
  writeFileSync(cases, JSON.stringify({ ...corpus, cases: [corpus.cases[0]] }));
  expect(() => loadCorpus(cases)).toThrow('include every target in the excerpt');
});

test('plus-digit gates separate safe unsure labels, false conjunction controls and combined-excerpt failures', () => {
  const { cases: path } = setup();
  const cases = loadCorpus(path).cases;
  const baseline = artifact(cases, 'shipping', 1, missConjunctions);
  const candidate = artifact(cases);
  const compare = () => evaluatePaired({ phase: 'screening', cases, comparisons: [{ baseline, candidate }] });
  expect(compare()).toMatchObject({ passed: true, stableImprovements: ['join-9', 'join-8'] });
  changeAnswer(candidate, 2, 'unsure');
  const safe = compare();
  expect(safe.passed).toBe(true);
  expect(safe.runs[0].candidate.cases[2]).toMatchObject({ labelCorrect: 0, targetSpacingCorrect: 2, fullSpacingCorrect: 2, passed: true });
  expect(score(candidate)).toMatchObject({ labels: { passed: 2, total: 3 }, targetSpacing: { passed: 3, total: 3 }, combinedSpacing: { passed: 3, total: 3 }, labelMisses: ['sign'] });
  changeAnswer(candidate, 2, 'conjunction');
  expect(compare()).toMatchObject({ passed: false, runs: [expect.objectContaining({ unsafeControls: ['sign'] })] });
  changeAnswer(candidate, 2, 'signed-number');
  changeAnswer(candidate, 1, 'signed-number');
  expect(compare().runs[0].candidate.cases[0]).toMatchObject({ labelCorrect: 2, targetSpacingCorrect: 2, fullSpacingCorrect: 0, passed: false });
  expect(compare().passed).toBe(false);
  changeAnswer(candidate, 1, 'conjunction');
  candidate.results[2]!.answers[0]!.error = 'Inference failed';
  expect(compare().passed).toBe(false);
});

test('plus-digit requires each fresh confirmation and holdout comparison to meet the gate', () => {
  const { cases: path } = setup();
  const cases = loadCorpus(path).cases;
  const first = { baseline: artifact(cases, 'shipping', 3, missConjunctions), candidate: artifact(cases, 'candidate', 3) };
  const second = structuredClone(first);
  const compare = (phase: string) => evaluatePaired({ phase, cases, comparisons: [first, second] });
  expect(compare('confirmation').passed).toBe(true);
  expect(compare('holdout').passed).toBe(true);
  changeAnswer(second.candidate, 2, 'conjunction');
  expect(compare('confirmation').passed).toBe(false);
  expect(compare('holdout').passed).toBe(false);
});

test.skipIf(!supportsTypeScript)('plus-digit sweep runs the rules-only baseline offline and imports shipping', () => {
  const { root, cases, prompts } = setup();
  writeFileSync(join(root, 'playwright-cli'), '#!/usr/bin/env node\nprocess.exit(99);\n', { mode: 0o755 });
  const args = ['scripts/prompt-experiments/sweep.mjs', '--experiment', 'plus-digit', '--cases', cases, '--prompts', prompts];
  const run = (...extra: string[]) => spawnSync(process.execPath, [...args, ...extra], { encoding: 'utf8', env: { ...process.env, PATH: `${root}:${process.env.PATH}` } });
  const check = run('--check', 'candidate');
  expect(check.status, check.stderr).toBe(0);
  expect(check.stdout).toContain('shipping source version: v1-en');
  const shipping = run('--check', 'shipping');
  expect(shipping.status, shipping.stderr).toBe(0);
  expect(shipping.stdout).toContain('rendered variants: shipping; shipping source version: v1-en');
  const output = join(root, 'offline');
  const baseline = run('--out', output, '--repeats', '3', 'rules-only');
  expect(baseline.status, baseline.stderr).toBe(0);
  const saved = JSON.parse(readFileSync(join(output, '1-rules-only.json'), 'utf8'));
  expect(saved).toMatchObject({
    backend: 'rules-only',
    context: 'offline',
    offlineLabel: 'signed-number',
    status: 'complete',
    evaluation: { labels: { passed: 1, total: 3 }, targetSpacing: { passed: 1, total: 3 }, combinedSpacing: { passed: 1, total: 3 } },
  });
  expect(saved.results.every((kase: { answers: { answer: string }[] }) => kase.answers.length === 6 && kase.answers.every((answer) => answer.answer === 'signed-number'))).toBe(true);
  expect(saved.profileVerified).toBeUndefined();
  expect(existsSync(join(output, 'run-code.js'))).toBe(false);
  writeFileSync(prompts, `export const PROMPTS = { candidate: { system: 'Classify.', build: kase => kase.input } };`);
  const defaulted = run('--check');
  expect(defaulted.status, defaulted.stderr).toBe(0);
  expect(defaulted.stdout).toContain('rendered variants: shipping;');
});

test.skipIf(!supportsTypeScript).each([1, 3])('offline plus-digit scores %i orders while paired gates require two', (orders) => {
  const { root, cases, prompts } = setup();
  const output = join(root, 'offline');
  const run = spawnSync(
    process.execPath,
    ['scripts/prompt-experiments/sweep.mjs', '--experiment', 'plus-digit', '--cases', cases, '--prompts', prompts, '--orders', String(orders), '--out', output, 'rules-only'],
    { encoding: 'utf8' },
  );
  expect(run.status, run.stderr).toBe(0);
  const saved = JSON.parse(readFileSync(join(output, '1-rules-only.json'), 'utf8'));
  expect(saved).toMatchObject({
    status: 'complete',
    expectedAttemptsPerCase: orders,
    evaluation: { labels: { passed: 1, total: 3 }, targetSpacing: { passed: 1, total: 3 }, combinedSpacing: { passed: 1, total: 3 } },
  });
  const selected = loadCorpus(cases).cases;
  const gate = evaluatePaired({ phase: 'screening', cases: selected, comparisons: [{ baseline: saved, candidate: artifact(selected) }] });
  expect(gate.passed).toBe(false);
  expect(gate.runs[0].baseline.issues).toContain('wrong declared attempt schedule');
});

test.skipIf(!supportsTypeScript)('shared paired CLI gates plus-digit candidates against the frozen shipping control', () => {
  const { root, cases: path, prompts } = setup();
  const cases = loadCorpus(path).cases;
  const files = [join(root, 'baseline.json'), join(root, 'candidate.json')];
  let invocation = 0;
  const run = (baseline: ReturnType<typeof artifact>, candidate: ReturnType<typeof artifact>) => {
    writeFileSync(files[0]!, JSON.stringify(baseline));
    writeFileSync(files[1]!, JSON.stringify(candidate));
    const out = join(root, `gate-${invocation++}`);
    const result = spawnSync(
      process.execPath,
      [
        'scripts/prompt-experiments/hyphen-digit/check-paired.mjs',
        '--experiment',
        'plus-digit',
        '--phase',
        'screening',
        '--cases',
        path,
        '--prompts',
        prompts,
        '--baseline',
        'frozen-shipping',
        '--out',
        out,
        ...files,
      ],
      { encoding: 'utf8' },
    );
    return { ...result, gate: JSON.parse(readFileSync(join(out, 'gate.json'), 'utf8')) };
  };
  const baseline = artifact(cases, 'shipping', 1, missConjunctions);
  const candidate = artifact(cases);
  const good = run(baseline, candidate);
  expect(good.status, good.stderr).toBe(0);
  expect(good.gate).toMatchObject({ passed: true, frozen: true, protocolIssues: [] });
  const unverified = run({ ...baseline, profileVerified: false }, candidate);
  expect(unverified.status).toBe(1);
  expect(unverified.gate.protocolIssues).toContain(`${files[0]}: profileVerified differs from the frozen protocol`);
  const regressed = artifact(cases);
  changeAnswer(regressed, 0, 'signed-number');
  const lost = run(artifact(cases, 'shipping'), regressed);
  expect(lost.status).toBe(1);
  expect(lost.gate.runs[0].regressions).toEqual(['join-9', 'join-8']);
});
