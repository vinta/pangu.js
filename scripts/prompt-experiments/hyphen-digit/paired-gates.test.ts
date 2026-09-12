import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import type { CandidateLabel } from '../../../browser-extensions/chrome/src/ai-spacing/messages';
import type { SettledCandidate } from '../../../browser-extensions/chrome/src/ai-spacing/shapes/base';
import { applyTextEdits } from '../../../browser-extensions/chrome/src/ai-spacing/shapes/base';
import { hyphenDigit } from '../../../browser-extensions/chrome/src/ai-spacing/shapes/hyphen-digit';

const gateModule = './paired-gates.mjs';
const { evaluatePaired } = await import(gateModule);
type Case = {
  id: string;
  source: string;
  canonical_source?: string;
  input: string;
  at: number;
  original_excerpt: string;
  expected_label: CandidateLabel;
  settled: string;
  settled_index: number;
  expected_target_spacing: string;
  expected_spacing: string;
};
const retained = JSON.parse(readFileSync(new URL('./corpus/development.json', import.meta.url), 'utf8')) as { cases: Case[] };
const editsForLabel = (kase: Case, label: CandidateLabel) => hyphenDigit.edits({ index: kase.settled_index } as SettledCandidate, label);
const cases = retained.cases.map((kase) => ({
  ...kase,
  expected_target_spacing: applyTextEdits(kase.settled, editsForLabel(kase, kase.expected_label)),
  expected_spacing: applyTextEdits(
    kase.settled,
    retained.cases.filter((other) => other.source === kase.source && other.original_excerpt === kase.original_excerpt).flatMap((other) => editsForLabel(other, other.expected_label)),
  ),
}));
const wrong = (kase: Case) => (kase.expected_label === 'signed-number' ? 'range-or-separator' : 'signed-number');
function artifact(selected: Case[], repeats: number, failing: string[] = []) {
  return {
    status: 'complete',
    purpose: 'accuracy',
    variant: 'mock',
    system: '',
    sampling: 'temperature 0, topK 1',
    repeats,
    expectedAttemptsPerCase: repeats * 2,
    orders: [selected.map((kase) => kase.id), selected.map((kase) => kase.id).reverse()],
    results: selected.map((kase) => ({
      ...kase,
      answers: [0, 1].flatMap((order) =>
        Array.from({ length: repeats }, () => {
          const answer = failing.includes(kase.id) ? wrong(kase) : kase.expected_label;
          return { order, answer, raw: JSON.stringify(answer), error: null as string | null };
        }),
      ),
    })),
  };
}
const selected = cases.slice(0, 3);
function compare(phase: string, comparisons: { baseline: ReturnType<typeof artifact>; candidate: ReturnType<typeof artifact> }[], scored = selected, exampleSources: string[] = []) {
  return evaluatePaired({ phase, cases: scored, comparisons, exampleSources, editsForLabel, applyTextEdits });
}

test('rejects a new per-case regression despite equal aggregate scores', () => {
  const baseline = artifact(selected, 1, [selected[0]!.id]);
  const candidate = artifact(selected, 1, [selected[1]!.id]);
  const result = compare('screening', [{ baseline, candidate }]);
  expect(result.passed).toBe(false);
  expect(result.runs[0].regressions).toEqual([selected[1]!.id]);
});

test('requires at least one same stable improvement in both fresh confirmation runs', () => {
  const first = { baseline: artifact(selected, 3, [selected[0]!.id]), candidate: artifact(selected, 3) };
  const second = { baseline: artifact(selected, 3, [selected[0]!.id]), candidate: artifact(selected, 3) };
  expect(compare('confirmation', [first, second])).toMatchObject({ passed: true, stableImprovements: [selected[0]!.id] });
  second.baseline = artifact(selected, 3, [selected[1]!.id]);
  expect(compare('confirmation', [first, second])).toMatchObject({ passed: false, stableImprovements: [] });
});

test('protects correct-attempt counts on an unstable baseline case independently in each run', () => {
  const first = { baseline: artifact(selected, 3, [selected[0]!.id]), candidate: artifact(selected, 3) };
  const second = structuredClone(first);
  const baselineAnswers = second.baseline.results[1]!.answers;
  const candidateAnswers = second.candidate.results[1]!.answers;
  baselineAnswers[0]!.answer = wrong(selected[1]!);
  baselineAnswers[0]!.raw = JSON.stringify(baselineAnswers[0]!.answer);
  for (const answer of candidateAnswers.slice(0, 2)) {
    answer.answer = wrong(selected[1]!);
    answer.raw = JSON.stringify(answer.answer);
  }
  const result = compare('confirmation', [first, second]);
  expect(result.passed).toBe(false);
  expect(result.runs[1].attemptDeclines).toEqual([selected[1]!.id]);
  expect(result.runs[1].baseline.cases[1].correct).toBe(5);
  expect(result.runs[1].candidate.cases[1].correct).toBe(4);
});

test('missing attempts, skips, errors, and incomplete infrastructure artifacts fail qualification', () => {
  for (const mode of ['missing', 'skipped', 'error', 'infrastructure', 'wrong-order', 'missing-case']) {
    const baseline = artifact(selected, 1, [selected[0]!.id]);
    const candidate = artifact(selected, 1);
    if (mode === 'missing') candidate.results[0]!.answers.pop();
    if (mode === 'skipped') Object.assign(candidate.results[0]!, { skipped: 'prompt-abstention' });
    if (mode === 'error') candidate.results[0]!.answers[0]!.error = 'model unavailable';
    if (mode === 'infrastructure') candidate.status = 'incomplete';
    if (mode === 'wrong-order') candidate.results[0]!.answers[0]!.order = 1;
    if (mode === 'missing-case') candidate.results.pop();
    expect(compare('screening', [{ baseline, candidate }]).passed, mode).toBe(false);
  }
  const baseline = artifact(selected, 1, [selected[0]!.id]);
  baseline.results[0]!.answers[0]!.error = 'model unavailable';
  expect(compare('screening', [{ baseline, candidate: artifact(selected, 1) }]).passed).toBe(false);
});

test('separates label, target-spacing, and combined excerpt-spacing correctness', () => {
  const multiple = cases.filter((kase) => ['real-development-04', 'real-development-05', 'books-4-percent-ebook'].includes(kase.id));
  const baseline = artifact(multiple, 1);
  const candidate = artifact(multiple, 1, [multiple[1]!.id]);
  for (const answer of candidate.results[2]!.answers) {
    answer.answer = 'unsure';
    answer.raw = JSON.stringify(answer.answer);
  }
  const result = compare('screening', [{ baseline, candidate }], multiple);
  expect(result.runs[0].candidate.cases[0]).toMatchObject({ labelCorrect: 2, targetSpacingCorrect: 2, fullSpacingCorrect: 0, correct: 0, passed: false });
  expect(result.runs[0].candidate.cases[1]).toMatchObject({ labelCorrect: 0, targetSpacingCorrect: 0, fullSpacingCorrect: 0 });
  expect(result.runs[0].candidate.cases[2]).toMatchObject({ labelCorrect: 0, targetSpacingCorrect: 2, fullSpacingCorrect: 2, correct: 0 });
  expect(result.passed).toBe(false);
});

test('holdout permits equal passing cases, still requires complete repetitions, and forbids scored example pages', () => {
  const first = { baseline: artifact(selected, 3, [selected[0]!.id]), candidate: artifact(selected, 3, [selected[0]!.id]) };
  const second = structuredClone(first);
  expect(compare('holdout', [first, second]).passed).toBe(true);
  expect(() => compare('holdout', [first])).toThrow('wrong number');
  expect(() => compare('holdout', [first, second], selected, [selected[0]!.canonical_source ?? selected[0]!.source])).toThrow('example page');
  second.candidate.system = 'changed';
  expect(compare('holdout', [first, second])).toMatchObject({ passed: false, frozen: false });
});
