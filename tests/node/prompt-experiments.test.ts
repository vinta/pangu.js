import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, onTestFinished, test } from 'vitest';

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

test.skipIf(!process.features.typescript)('abstentions bypass inference and fail require-perfect even when every model answer is correct', () => {
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
      create: async () => ({ destroy() {}, clone: async () => ({ destroy() {}, prompt: async question => {
        assert.equal(typeof question, 'string');
        calls++;
        return JSON.stringify(args.inputs.find(input => input.question === question).expected_label);
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
      'v27-zh-unique-quote',
    ],
    {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${root}:${process.env.PATH}`, TEST_PROFILE: profile },
    },
  );
  expect(run.status, run.stderr).toBe(1);
  const result = JSON.parse(readFileSync(join(output, '1-v27-zh-unique-quote.json'), 'utf8'));
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
