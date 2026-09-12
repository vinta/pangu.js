import { spawnSync } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, onTestFinished, test } from 'vitest';

const artifactsModule = '../artifacts.mjs';
const { scratchDirectory } = await import(artifactsModule);

const source = JSON.parse(readFileSync(new URL('./corpus/development.json', import.meta.url), 'utf8')) as {
  enums: { hyphen: string[] };
  cases: { id: string; input: string; expected_label: string; [key: string]: unknown }[];
};
const kase = source.cases[0]!;
const wrong = kase.expected_label === 'signed-number' ? 'range-or-separator' : 'signed-number';

function setup(phase = 'screening') {
  const root = scratchDirectory(process.cwd(), 'pangu-check-paired-');
  onTestFinished(() => rmSync(root, { recursive: true, force: true }));
  const cases = join(root, 'cases.json');
  const prompts = join(root, 'prompts.mjs');
  writeFileSync(cases, JSON.stringify({ role: phase === 'holdout' ? 'holdout' : 'development', enums: source.enums, cases: [kase] }));
  writeFileSync(prompts, 'export const PROMPTS = { frozen: { system: "test", build: kase => kase.input }, candidate: { system: "test", build: kase => kase.input } };');
  const repeats = phase === 'screening' ? 1 : 3;
  const artifacts = Array.from({ length: phase === 'screening' ? 2 : 4 }, (_, index) => ({
    variant: index % 2 === 0 ? 'shipping' : 'candidate',
    status: 'complete',
    purpose: 'accuracy',
    system: 'test',
    omitResponseConstraintInput: false,
    sampling: 'temperature 0, topK 1',
    profileVerified: true,
    extensionWorkerVerified: true,
    repeats,
    expectedAttemptsPerCase: repeats * 2,
    orders: [[kase.id], [kase.id]],
    results: [
      {
        ...kase,
        question: kase.input,
        responseConstraint: { type: 'string', enum: source.enums.hyphen },
        answers: [0, 1].flatMap((order) =>
          Array.from({ length: repeats }, () => {
            const answer = index % 2 === 0 ? wrong : kase.expected_label;
            return { order, answer, raw: JSON.stringify(answer), error: null };
          }),
        ),
      },
    ],
  }));
  let invocation = 0;
  const paths = artifacts.map((_, index) => join(root, `${index}.json`));
  const run = (...extra: string[]) => {
    for (const [index, artifact] of artifacts.entries()) {
      writeFileSync(paths[index]!, JSON.stringify(artifact));
    }
    const out = join(root, `gate-${invocation++}`);
    return {
      ...spawnSync(
        process.execPath,
        ['scripts/prompt-experiments/hyphen-digit/check-paired.mjs', '--phase', phase, '--cases', cases, '--prompts', prompts, '--baseline', 'frozen', '--out', out, ...paths, ...extra],
        { encoding: 'utf8' },
      ),
      gate: () => JSON.parse(readFileSync(join(out, 'gate.json'), 'utf8')),
    };
  };
  return { artifacts, cases, prompts, paths, run };
}

test('checks all three phases with production edits and retains a failing gate with a nonzero exit', () => {
  for (const phase of ['screening', 'confirmation', 'holdout']) {
    const { artifacts, run } = setup(phase);
    const passed = run();
    expect(passed.status, passed.stderr).toBe(0);
    expect(passed.gate()).toMatchObject({ phase, passed: true, frozen: true, protocolIssues: [] });
    expect(JSON.parse(passed.stdout).runs[0]).toEqual({
      passed: true,
      matched: true,
      regressions: [],
      attemptDeclines: [],
      baseline: { complete: true, issues: [], total: 1, passing: 0, labels: 0, targetSpacing: 0, combinedSpacing: 0, misses: [kase.id] },
      candidate: { complete: true, issues: [], total: 1, passing: 1, labels: 1, targetSpacing: 1, combinedSpacing: 1, misses: [] },
    });
    for (const answer of artifacts[1]!.results[0]!.answers) {
      answer.answer = wrong;
      answer.raw = JSON.stringify(wrong);
    }
    artifacts[1]!.results[0]!.answers.pop();
    const failed = run();
    expect(failed.status, failed.stderr).toBe(1);
    expect(failed.gate().passed).toBe(false);
    expect(failed.gate().runs[0].candidate.issues).toContain(`${kase.id}: missing, skipped, or extra attempts`);
    expect(JSON.parse(failed.stdout).runs[0].candidate).toMatchObject({
      complete: false,
      issues: expect.arrayContaining([`${kase.id}: missing, skipped, or extra attempts`]),
      passing: 0,
      labels: 0,
      targetSpacing: 0,
      combinedSpacing: 0,
      misses: [kase.id],
    });
  }
});

test('checks frozen rendering, schema, options, sampling, and profile evidence beyond paired equality', () => {
  const { artifacts, run } = setup();
  for (const artifact of artifacts) {
    artifact.system = 'changed';
    artifact.omitResponseConstraintInput = true;
    artifact.sampling = 'changed';
    artifact.profileVerified = false;
    artifact.extensionWorkerVerified = false;
    artifact.results[0]!.question = 'changed';
    artifact.results[0]!.responseConstraint.enum = [...source.enums.hyphen].reverse();
  }
  const result = run();
  expect(result.status, result.stderr).toBe(1);
  expect(result.gate()).toMatchObject({ passed: false, frozen: false });
  expect(result.gate().protocolIssues).toHaveLength(14);
});

test('uses external frozen cases and excludes example pages', () => {
  const { artifacts, run } = setup();
  artifacts[1]!.results[0]!.expected_label = wrong;
  const changedGold = run();
  expect(changedGold.status).toBe(1);
  expect(changedGold.gate().runs[0].candidate.issues).toContain(`${kase.id}: result differs from frozen expected_label`);
  const example = run('--example-source', String(kase.canonical_source ?? kase.source));
  expect(example.status).toBe(1);
  expect(example.stderr).toContain('review/example page cannot be scored');
});

test('rejects malformed files, roles, prompt keys, and pair counts with actionable errors', () => {
  const { artifacts, cases, prompts, paths, run } = setup();
  const unknownPhase = run('--phase', 'invalid');
  expect(unknownPhase.status).toBe(1);
  expect(unknownPhase.stderr).toContain('invalid --phase invalid');
  const wrongCount = run('--phase', 'confirmation');
  expect(wrongCount.status).toBe(1);
  expect(wrongCount.stderr).toContain('provide 4 artifact paths in baseline/candidate pairs');
  const unknownPrompt = run('--baseline', 'missing');
  expect(unknownPrompt.status).toBe(1);
  expect(unknownPrompt.stderr).toContain(`missing frozen prompt missing in ${prompts}`);
  const corpus = JSON.parse(readFileSync(cases, 'utf8'));
  writeFileSync(cases, JSON.stringify({ ...corpus, role: 'holdout' }));
  const wrongRole = run();
  expect(wrongRole.status).toBe(1);
  expect(wrongRole.stderr).toContain('screening requires a frozen development corpus');
  writeFileSync(cases, JSON.stringify(corpus));
  Object.assign(artifacts[1]!.results[0]!, { answers: [null] });
  const malformedAnswers = run();
  expect(malformedAnswers.status).toBe(1);
  expect(malformedAnswers.stderr).toContain(`${paths[1]}: results and answers must be arrays of objects`);
  writeFileSync(cases, '{broken');
  const malformed = run();
  expect(malformed.status).toBe(1);
  expect(malformed.stderr).toContain(`${cases}:`);
  expect(malformed.stderr).toContain('provide a readable JSON object file');
});
