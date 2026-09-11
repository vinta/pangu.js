import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, onTestFinished, test } from 'vitest';

test.skipIf(!process.features.typescript)('custom hyphen cases replace the default suite and retain diagnostic and target validation', () => {
  const root = mkdtempSync(join(tmpdir(), 'pangu-cases-'));
  onTestFinished(() => rmSync(root, { recursive: true, force: true }));
  const file = join(root, 'cases.json');
  const corpus = {
    set: 'title-number',
    enums: { hyphen: ['signed-number', 'range-or-separator', 'unsure'] },
    diagnosticQuestions: ['這個數字在句子中表示什麼？'],
    cases: [{ id: 'title-19', enum: 'hyphen', input: '標題-19', at: 2, symbol: '-', expected_label: 'range-or-separator', type: 'control' }],
  };
  const check = (...args: string[]) => spawnSync(process.execPath, ['scripts/prompt-experiments/sweep.mjs', '--check', '--cases', file, 'v26-zh', ...args], { encoding: 'utf8' });
  writeFileSync(file, JSON.stringify(corpus));
  const accuracy = check();
  expect(accuracy.status, accuracy.stderr).toBe(0);
  expect(accuracy.stdout).toContain('Checked 1 cases; rendered variants: v26-zh');
  const diagnostics = check('--diagnostics', 'title-19', '--orders', '1');
  expect(diagnostics.status, diagnostics.stderr).toBe(0);
  expect(check('--diagnostics', 'title-19').stderr).toContain('--diagnostics requires --repeats 1, --orders 1');
  expect(check('--experiment', 'digit-plus').stderr).toContain('--cases is only supported for --experiment hyphen-sign');

  writeFileSync(file, JSON.stringify({ ...corpus, diagnosticQuestions: [' '] }));
  expect(check().stderr).toContain('invalid diagnosticQuestions');
  writeFileSync(file, JSON.stringify({ ...corpus, cases: [{ ...corpus.cases[0], at: 0 }] }));
  expect(check().stderr).toContain('invalid symbol offset: title-19');
});

test.skipIf(!process.features.typescript)('requires an explicit matching Chrome profile before creating experiment output', () => {
  const root = mkdtempSync(join(tmpdir(), 'pangu-profile-'));
  onTestFinished(() => rmSync(root, { recursive: true, force: true }));
  const profile = join(root, 'Test Profile');
  const output = join(root, 'results');
  writeFileSync(join(root, 'Local State'), JSON.stringify({ profile: { info_cache: { 'Test Profile': { name: 'Experiment' } } } }));
  const args = ['scripts/prompt-experiments/sweep.mjs', '--extension-id', 'a'.repeat(32), '--out', output];

  for (const [options, message] of [
    [[], 'invalid --profile-path (missing)'],
    [['--profile-path', 'relative'], 'invalid --profile-path relative'],
    [['--profile-path', profile], 'provide --profile-name'],
    [['--profile-path', profile, '--profile-name', 'Wrong'], 'Chrome profile name mismatch'],
  ] as const) {
    const run = spawnSync(process.execPath, [...args, ...options], { encoding: 'utf8' });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(message);
    expect(existsSync(output)).toBe(false);
  }

  // A valid profile reaches output creation; an existing directory stops the run before Chrome is contacted.
  mkdirSync(output);
  const run = spawnSync(process.execPath, [...args, '--profile-path', profile, '--profile-name', 'Experiment'], { encoding: 'utf8' });
  expect(run.status).toBe(1);
  expect(run.stderr).toContain('EEXIST');
});

for (const [experiment, variant] of [
  ['hyphen-sign', 'v27-zh-unique-quote'],
  ['digit-plus', 'v1-zh'],
] as const) {
  test.skipIf(!process.features.typescript)(`${experiment}/${variant}: scored failures fail require-perfect and preserve raw answers`, () => {
    const root = mkdtempSync(join(tmpdir(), 'pangu-abstention-'));
    onTestFinished(() => rmSync(root, { recursive: true, force: true }));
    const profile = join(root, 'Test Profile');
    const output = join(root, 'results');
    writeFileSync(join(root, 'Local State'), JSON.stringify({ profile: { info_cache: { 'Test Profile': { name: 'Experiment' } } } }));
    writeFileSync(
      join(root, 'playwright-cli'),
      `#!/usr/bin/env node
const assert = require('node:assert/strict');
let calls = 0;
const worker = {
  url: () => 'chrome-extension://' + 'a'.repeat(32) + '/dist/service-worker.js',
  evaluate: async (fn, args) => {
    if (typeof args === 'string') return 1;
    if (typeof args === 'number') return;
    globalThis.LanguageModel = {
      params: () => ({}), availability: async () => 'available',
      create: async () => ({ destroy() {}, clone: async () => ({ destroy() {}, prompt: async (question, options) => {
        assert.equal(typeof question, 'string');
        assert.equal(options.omitResponseConstraintInput, false);
        calls++;
        const input = args.inputs.find(input => input.question === question);
        if (input.enum === 'digit-plus' && input === args.inputs[0]) return JSON.stringify('lower-bound');
        return JSON.stringify(input.expected_label);
      } }) })
    };
    return fn(args);
  }
};
const info = { waitForURL: async () => {}, locator: () => ({ innerText: async () => process.env.TEST_PROFILE }) };
const context = { serviceWorkers: () => [worker], waitForEvent: async () => info, browser: () => ({ version: () => 'test' }) };
new Function('return (' + process.argv.at(-1) + ')')()({ context: () => context }).then(run => console.log(JSON.stringify({ ...run, testCalls: calls })));
`,
      { mode: 0o755 },
    );
    const run = spawnSync(
      process.execPath,
      [
        'scripts/prompt-experiments/sweep.mjs',
        '--experiment',
        experiment,
        '--extension-id',
        'a'.repeat(32),
        '--profile-path',
        profile,
        '--profile-name',
        'Experiment',
        '--out',
        output,
        '--repeats',
        '3',
        '--require-perfect',
        variant,
      ],
      {
        encoding: 'utf8',
        env: { ...process.env, PATH: `${root}:${process.env.PATH}`, TEST_PROFILE: profile },
      },
    );
    expect(run.status, run.stderr).toBe(1);
    const result = JSON.parse(readFileSync(join(output, `1-${variant}.json`), 'utf8')) as {
      omitResponseConstraintInput: boolean;
      evaluation: { labels: unknown; misses: string[] };
      results: {
        id: string;
        input: string;
        at: number;
        responseConstraint: unknown;
        skipped?: string;
        correct: boolean;
        answers: { order: number; answer: unknown }[];
      }[];
      testCalls: number;
      orders: string[][];
    };
    expect(result.omitResponseConstraintInput).toBe(false);
    if (experiment === 'digit-plus') {
      expect(result.evaluation.labels).toEqual({ passed: 6, total: 7 });
      expect(result.evaluation.misses).toEqual(['tw-conj-diablo-1']);
      expect(result.results[0].answers[0]).toMatchObject({ raw: '"lower-bound"', answer: 'lower-bound', error: null });
      expect(result.results[0].responseConstraint).toEqual({ type: 'string', enum: ['conjunction', 'lower-bound', 'unsure'] });
      expect(result.results.every((kase) => kase.input[kase.at] === '+' && kase.input.split('+').length === 2)).toBe(true);
      expect(result.testCalls).toBe(7 * 6);
      return;
    }
    const skipped = result.results.filter((kase: { skipped?: string }) => kase.skipped);
    expect(skipped).toHaveLength(2);
    expect(skipped).toEqual(expect.arrayContaining([expect.objectContaining({ answer: null, correct: false, stable: null, answers: [] })]));
    // Default 2 orders, each with its own base session, times 3 repeats
    expect(result.testCalls).toBe((result.results.length - skipped.length) * 3 * 2);
    expect(result.orders).toHaveLength(2);
    expect([...result.orders[1]].sort()).toEqual([...result.orders[0]].sort());
    expect(result.orders[1]).not.toEqual(result.orders[0]);
    for (const kase of result.results.filter((kase: { skipped?: string }) => !kase.skipped)) {
      expect(kase.answers.map((answer: { order: number }) => answer.order)).toEqual([0, 0, 0, 1, 1, 1]);
    }
    expect(result.results.filter((kase: { skipped?: string; correct: boolean }) => !kase.skipped).every((kase: { correct: boolean }) => kase.correct)).toBe(true);
  });
}
