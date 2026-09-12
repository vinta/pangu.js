import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, onTestFinished, test } from 'vitest';
import { publicCase, publicError, publicFixture } from './public-artifacts.mjs';

const supportsTypeScript = 'typescript' in process.features && process.features.typescript;
const hyphenCases = 'scripts/prompt-experiments/hyphen-digit/corpus/development.json';
const sourceCorpus = JSON.parse(readFileSync(hyphenCases, 'utf8')) as {
  role: string;
  cases: { id: string; input: string; at: number; expected_label: string; source: string; [key: string]: unknown }[];
};

test.skipIf(!supportsTypeScript)('hyphen corpora require provenance and retain diagnostic and target validation', () => {
  const root = mkdtempSync(join(tmpdir(), 'pangu-cases-'));
  onTestFinished(() => rmSync(root, { recursive: true, force: true }));
  const file = join(root, 'cases.json');
  const sourceCase = sourceCorpus.cases[0]!;
  const corpus = { ...sourceCorpus, cases: [sourceCase] };
  const check = (...args: string[]) => spawnSync(process.execPath, ['scripts/prompt-experiments/sweep.mjs', '--check', '--cases', file, 'shipping', ...args], { encoding: 'utf8' });
  writeFileSync(file, JSON.stringify(corpus));
  const accuracy = check();
  expect(accuracy.status, accuracy.stderr).toBe(0);
  expect(accuracy.stdout).toContain('Checked 1 cases (offline structure only); rendered variants: shipping');
  const promptModule = join(root, 'prompts.mjs');
  writeFileSync(promptModule, "export const PROMPTS = { candidate: { system: 'Candidate instructions', build: kase => kase.input } };");
  const independent = check('--prompts', promptModule, 'candidate');
  expect(independent.status, independent.stderr).toBe(0);
  expect(independent.stdout).toContain('rendered variants: shipping, candidate');
  writeFileSync(promptModule, 'export const PROMPTS = { shipping: {} };');
  expect(check('--prompts', promptModule).stderr).toContain('cannot override shipping');
  const diagnostics = check('--diagnostics', sourceCase.id, '--orders', '1');
  expect(diagnostics.status, diagnostics.stderr).toBe(0);
  expect(check('--diagnostics', sourceCase.id).stderr).toContain('--diagnostics requires --repeats 1, --orders 1');
  expect(check('--experiment', 'digit-plus').stderr).toContain('--cases is only supported for --experiment hyphen-digit');
  const missingCorpus = spawnSync(process.execPath, ['scripts/prompt-experiments/sweep.mjs', '--check'], { encoding: 'utf8' });
  expect(missingCorpus.status).toBe(1);
  expect(missingCorpus.stderr).toContain('provide --cases');

  writeFileSync(file, JSON.stringify({ ...corpus, role: 'holdout' }));
  expect(check('--diagnostics', sourceCase.id, '--orders', '1').stderr).toContain('holdout diagnostics are forbidden');
  writeFileSync(file, JSON.stringify({ ...corpus, role: 'pending' }));
  expect(check().stderr).toContain('invalid corpus role');
  writeFileSync(file, JSON.stringify({ ...corpus, cases: [] }));
  expect(check().stderr).toContain('empty corpus');
  writeFileSync(file, JSON.stringify({ ...corpus, cases: [{ ...sourceCase, source: '' }] }));
  expect(check().stderr).toContain(`missing source: ${sourceCase.id}`);

  writeFileSync(file, JSON.stringify({ ...corpus, diagnosticQuestions: [' '] }));
  expect(check().stderr).toContain('invalid diagnosticQuestions');
  writeFileSync(file, JSON.stringify({ ...corpus, cases: [{ ...corpus.cases[0], at: 0 }] }));
  expect(check().stderr).toContain(`invalid symbol offset: ${sourceCase.id}`);
});

test.skipIf(!supportsTypeScript)('requires an absolute Chrome profile path without local profile metadata', () => {
  const root = mkdtempSync(join(tmpdir(), 'pangu-profile-'));
  onTestFinished(() => rmSync(root, { recursive: true, force: true }));
  const profile = join(root, 'Test Profile');
  const output = join(root, 'results');
  const args = ['scripts/prompt-experiments/sweep.mjs', '--cases', hyphenCases, '--extension-id', 'a'.repeat(32), '--out', output];

  for (const [options, message] of [
    [[], 'invalid --profile-path (missing)'],
    [['--profile-path', 'relative'], 'invalid --profile-path relative'],
  ] as const) {
    const run = spawnSync(process.execPath, [...args, ...options], { encoding: 'utf8' });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(message);
    expect(existsSync(output)).toBe(false);
  }

  // A valid profile reaches output creation; an existing directory stops the run before Chrome is contacted.
  mkdirSync(output);
  const run = spawnSync(process.execPath, [...args, '--profile-path', profile], { encoding: 'utf8' });
  expect(run.status).toBe(1);
  expect(run.stderr).toContain('EEXIST');
  const envFile = join(root, 'settings.env');
  writeFileSync(envFile, `PANGU_EXTENSION_ID=${'a'.repeat(32)}\nPANGU_CHROME_PROFILE_PATH=${profile}\n`);
  const configured = spawnSync(process.execPath, [`--env-file=${envFile}`, 'scripts/prompt-experiments/sweep.mjs', '--cases', hyphenCases, '--out', output], { encoding: 'utf8' });
  expect(configured.status).toBe(1);
  expect(configured.stderr).toContain('EEXIST');
});

for (const [experiment, variant] of [
  ['hyphen-digit', 'shipping'],
  ['digit-plus', 'v1-zh'],
] as const) {
  test.skipIf(!supportsTypeScript)(`${experiment}/${variant}: scored failures fail require-perfect and preserve raw answers`, () => {
    const root = mkdtempSync(join(tmpdir(), 'pangu-abstention-'));
    onTestFinished(() => rmSync(root, { recursive: true, force: true }));
    const profile = join(root, 'Test Profile');
    const output = join(root, 'results');
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
        if (input === args.inputs[0]) return JSON.stringify(input.enum === 'digit-plus' ? 'lower-bound' : 'range-or-separator');
        if (input.enum === 'hyphen' && input === args.inputs[1]) return 'invalid JSON';
        return JSON.stringify(input.expected_label);
      } }) })
    };
    return fn(args);
  }
};
const info = { waitForURL: async () => {}, locator: () => ({ innerText: async () => process.env.TEST_PROFILE }) };
const context = { serviceWorkers: () => [worker], waitForEvent: async () => info, browser: () => ({ version: () => 'test' }) };
new Function('return (' + process.argv.at(-1) + ')')()({ context: () => context }).then(run => console.log(JSON.stringify({ ...run, testCalls: calls, sessionId: 'private-session', profilePath: process.env.TEST_PROFILE, results: run.results.map(row => ({ ...row, requestToken: 'private-token', answers: row.answers.map(answer => ({ ...answer, requestToken: 'private-token' })) })) })));
`,
      { mode: 0o755 },
    );
    const run = spawnSync(
      process.execPath,
      [
        'scripts/prompt-experiments/sweep.mjs',
        '--experiment',
        experiment,
        ...(experiment === 'hyphen-digit' ? ['--cases', hyphenCases] : []),
        '--extension-id',
        'a'.repeat(32),
        '--profile-path',
        profile,
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
        complete: boolean;
        stable: boolean;
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
      expect(result.results[0]!.answers[0]).toMatchObject({ raw: '"lower-bound"', answer: 'lower-bound', error: null });
      expect(result.results[0]!.responseConstraint).toEqual({ type: 'string', enum: ['conjunction', 'lower-bound', 'unsure'] });
      expect(result.results.every((kase) => kase.input[kase.at] === '+' && kase.input.split('+').length === 2)).toBe(true);
      expect(result.results.flatMap((kase) => kase.answers)).toHaveLength(7 * 6);
      expect(result.testCalls).toBeUndefined();
      return;
    }
    expect(result.results.map((kase) => kase.id)).toEqual(sourceCorpus.cases.map((kase) => kase.id));
    expect(result.results[0]).toMatchObject({ correct: false, stable: true, complete: true });
    expect(result.results[0]!.answers[0]).toMatchObject({ raw: '"range-or-separator"', answer: 'range-or-separator', error: null });
    expect(result.results[1]).toMatchObject({ correct: false, stable: false, complete: true });
    expect(result.results[1]!.answers[0]).toMatchObject({ raw: 'invalid JSON', answer: null, error: expect.any(String) as unknown });
    expect(result.results.slice(2).every((kase) => kase.correct)).toBe(true);
    expect(result.results.flatMap((kase) => kase.answers)).toHaveLength(sourceCorpus.cases.length * 3 * 2);
    expect(result.testCalls).toBeUndefined();
    expect(JSON.stringify(result)).not.toMatch(/private-session|private-token|profilePath|requestToken|sessionId/);
    expect(result.orders).toHaveLength(2);
    expect([...result.orders[1]!].sort()).toEqual([...result.orders[0]!].sort());
    expect(result.orders[1]).not.toEqual(result.orders[0]);
    for (const kase of result.results) {
      expect(kase.answers.map((answer) => answer.order)).toEqual([0, 0, 0, 1, 1, 1]);
    }
  });
}

test.skipIf(!supportsTypeScript)('browser and profile failures leave incomplete artifacts without invented answers', () => {
  const root = mkdtempSync(join(tmpdir(), 'pangu-incomplete-'));
  onTestFinished(() => rmSync(root, { recursive: true, force: true }));
  const profile = join(root, 'Test Profile');
  const output = join(root, 'results', 'new-run');
  writeFileSync(join(root, 'playwright-cli'), '#!/usr/bin/env node\nprocess.stderr.write("worker unavailable; token=private-token; profile=/Users/example/Profile"); process.exit(9);\n', {
    mode: 0o755,
  });
  const run = spawnSync(
    process.execPath,
    ['scripts/prompt-experiments/sweep.mjs', '--cases', hyphenCases, '--extension-id', 'a'.repeat(32), '--profile-path', profile, '--out', output],
    { encoding: 'utf8', env: { ...process.env, PATH: `${root}:${process.env.PATH}` } },
  );
  expect(run.status).toBe(1);
  const artifact = JSON.parse(readFileSync(join(output, '1-shipping.json'), 'utf8')) as { status: string; error: string; stderr: string; inputs: unknown[]; results?: unknown[] };
  expect(artifact.status).toBe('incomplete');
  expect(artifact.error).toContain('Browser command failed (exit 9)');
  expect(artifact.stderr).toBeUndefined();
  expect(JSON.stringify(artifact)).not.toMatch(/private-token|\/Users\/example|stdout|stderr/);
  expect(artifact.inputs).toHaveLength(sourceCorpus.cases.length);
  expect(artifact.results).toBeUndefined();

  writeFileSync(
    join(root, 'playwright-cli'),
    `#!/usr/bin/env node
const profile = ${JSON.stringify(profile)};
const worker = {
  url: () => 'chrome-extension://' + 'a'.repeat(32) + '/dist/service-worker.js',
  evaluate: async (fn, args) => {
    if (typeof args === 'string') return 1;
    if (typeof args === 'number') return;
    globalThis.LanguageModel = {};
    try { return await fn(args); }
    catch (error) { error.message += ' (' + profile + ')\\nprivate-token'; throw error; }
  }
};
const info = { waitForURL: async () => {}, locator: () => ({ innerText: async () => process.env.TEST_PROFILE ?? profile }) };
const context = { serviceWorkers: () => [worker], waitForEvent: async () => info };
new Function('return (' + process.argv.at(-1) + ')')()({ context: () => context }).then(run => console.log(JSON.stringify({ ...run, sessionId: 'private-session' })));
`,
    { mode: 0o755 },
  );
  const unavailableOutput = join(root, 'results', 'api-unavailable');
  const unavailable = spawnSync(
    process.execPath,
    ['scripts/prompt-experiments/sweep.mjs', '--cases', hyphenCases, '--extension-id', 'a'.repeat(32), '--profile-path', profile, '--out', unavailableOutput],
    { encoding: 'utf8', env: { ...process.env, PATH: `${root}:${process.env.PATH}` } },
  );
  expect(unavailable.status).toBe(1);
  const unavailableArtifact = JSON.parse(readFileSync(join(unavailableOutput, '1-shipping.json'), 'utf8')) as { status: string; error: string; inputs: unknown[]; results?: unknown[] };
  expect(unavailableArtifact.status).toBe('incomplete');
  expect(unavailableArtifact.error).toContain('extension Prompt API sampling controls unavailable');
  expect(unavailableArtifact.error).toContain('[local]');
  expect(JSON.stringify(unavailableArtifact)).not.toContain(profile);
  expect(JSON.stringify(unavailableArtifact)).not.toMatch(/private-token|private-session|sessionId|stdout|stderr/);
  expect(unavailableArtifact.inputs).toHaveLength(sourceCorpus.cases.length);
  expect(unavailableArtifact.results).toBeUndefined();

  const wrongProfileOutput = join(root, 'results', 'wrong-profile');
  const wrongProfile = spawnSync(
    process.execPath,
    ['scripts/prompt-experiments/sweep.mjs', '--cases', hyphenCases, '--extension-id', 'a'.repeat(32), '--profile-path', profile, '--out', wrongProfileOutput],
    { encoding: 'utf8', env: { ...process.env, PATH: `${root}:${process.env.PATH}`, TEST_PROFILE: join(root, 'Other Profile') } },
  );
  expect(wrongProfile.status).toBe(1);
  const wrongProfileArtifact = JSON.parse(readFileSync(join(wrongProfileOutput, '1-shipping.json'), 'utf8')) as { status: string; error: string; results?: unknown[] };
  expect(wrongProfileArtifact.status).toBe('incomplete');
  expect(wrongProfileArtifact.error).toContain('wrong Chrome profile');
  expect(wrongProfileArtifact.results).toBeUndefined();
});

test('public artifact fields preserve evidence and omit unknown metadata', () => {
  const source = sourceCorpus.cases[0]!;
  const kase = publicCase({
    ...source,
    sessionId: 'private-session',
    source_style_check: [{ tag: 'P', display: 'block', whiteSpace: 'normal', id: 'private-id', className: 'private-class' }],
    prior_exposure: { model_inference: true, requestToken: 'private-token' },
  });
  expect(kase).toMatchObject({
    id: source.id,
    input: source.input,
    at: source.at,
    expected_label: source.expected_label,
    source_style_check: [{ tag: 'P', display: 'block', whiteSpace: 'normal' }],
    prior_exposure: { model_inference: true },
  });
  expect(JSON.stringify(kase)).not.toMatch(/private-session|private-id|private-class|private-token/);
  expect(publicFixture(kase)).toMatchObject({ html: source.source_html, css: source.source_css, sha256: expect.stringMatching(/^[a-f0-9]{64}$/) });
  expect(publicError(new Error('wrong profile: /Users/example/Profile\nstack with token'), ['/Users/example/Profile'])).toBe('wrong profile: [local]');
});
