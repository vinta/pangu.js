import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyTextEdits, indexOfNthSymbol, sliceSentence } from '../../../browser-extensions/chrome/src/ai-spacing/shapes/base.ts';
import { evaluatePaired as pairedGate, scoreArtifact } from '../hyphen-digit/paired-gates.mjs';
import { productionModule } from '../production.mjs';

const { default: pangu, CJK_SIGN_DIGIT } = await productionModule('src/shared/index.ts');

export const labels = ['signed-number', 'conjunction', 'unsure'];
export const editsForLabel = (kase, label) => (label === 'conjunction' ? [{ index: kase.settled_index + 1, remove: 0, insert: ' ' }] : []);

export function loadCorpus(path = new URL('./corpus/development.json', import.meta.url)) {
  const corpus = JSON.parse(readFileSync(path, 'utf8'));
  assert(Array.isArray(corpus.cases) && corpus.cases.length > 0, 'empty corpus; provide at least one scored plus-digit case');
  assert.deepEqual(corpus.enums?.plus, labels, 'plus-digit requires the ordered signed-number, conjunction, unsure labels');
  assert.equal(new Set(corpus.cases.map((kase) => kase.id)).size, corpus.cases.length, 'duplicate plus-digit case IDs');
  corpus.cases = corpus.cases.map((kase) => {
    for (const field of ['id', 'input', 'expected_output', 'source', 'sourceExcerpt', 'expected_excerpt_output', 'publisher', 'retrievedDate', 'category', 'rationale', 'evidence']) {
      assert(typeof kase[field] === 'string' && kase[field].trim(), `${kase.id}: missing ${field}; record the source and frozen spacing`);
    }
    assert(!kase.review, `${kase.id}: unresolved review cannot be scored`);
    assert(/^https?:\/\/[^/\s]+(?:\/[^\s]*)?$/.test(kase.source) || kase.source === 'provided by users', `${kase.id}: invalid source; provide a URL or the confirmed user seed`);
    if (kase.source === 'provided by users') {
      assert.equal(kase.evidence, 'user-provided; maintainer-confirmed real case', `${kase.id}: missing seed verification`);
    }
    const offsets = [...kase.input.matchAll(/\+/g)].map((match) => match.index);
    assert.equal(offsets.length, 1, `${kase.id}: plus-digit input must contain exactly one +`);
    assert(kase.ordinal === 1 && kase.at === offsets[0], `${kase.id}: invalid plus-digit target ordinal or offset`);
    assert(
      [...kase.input.matchAll(CJK_SIGN_DIGIT)].some((match) => match.index + 1 === kase.at),
      `${kase.id}: target must be tight CJK+digit`,
    );
    assert.equal(kase.input.replaceAll(' ', ''), kase.expected_output.replaceAll(' ', ''), `${kase.id}: non-space edit`);
    assert(Number.isSafeInteger(kase.excerptAt) && kase.excerptAt >= 0 && kase.sourceExcerpt[kase.excerptAt] === '+', `${kase.id}: invalid excerptAt`);
    assert.deepEqual(sliceSentence(kase.sourceExcerpt, kase.excerptAt), { sentence: kase.input, at: kase.at }, `${kase.id}: input differs from the contract sentence slice`);
    assert(kase.enum === 'plus' && labels.includes(kase.expected_label), `${kase.id}: invalid plus-digit label`);
    assert.deepEqual(kase.targets, [{ ordinal: 1, expected_label: kase.expected_label }], `${kase.id}: target annotation disagrees with expected_label`);
    const settled = pangu.spaceText(kase.sourceExcerpt);
    const ordinal = kase.sourceExcerpt.slice(0, kase.excerptAt).split('+').length - 1;
    const settled_index = indexOfNthSymbol(settled, '+', ordinal);
    assert(
      settled[settled_index - 1] === ' ' &&
        [
          ...settled
            .slice(settled_index - 2, settled_index + 2)
            .replace(' ', '')
            .matchAll(CJK_SIGN_DIGIT),
        ].length === 1,
      `${kase.id}: core output does not route as CJK +digit; recheck the contract`,
    );
    const inputSettled = pangu.spaceText(kase.input);
    const inputCase = { settled_index: inputSettled.indexOf('+') };
    assert.equal(applyTextEdits(inputSettled, editsForLabel(inputCase, kase.expected_label)), kase.expected_output, `${kase.id}: input gold disagrees with core and contract edits`);
    const prepared = { ...kase, original_excerpt: kase.sourceExcerpt, settled, settled_index, expected_spacing: kase.expected_excerpt_output };
    prepared.expected_target_spacing = applyTextEdits(settled, editsForLabel(prepared, kase.expected_label));
    return prepared;
  });
  const groups = Map.groupBy(corpus.cases, (kase) => JSON.stringify([kase.canonical_source ?? kase.source, kase.excerptId ?? kase.sourceExcerpt]));
  for (const group of groups.values()) {
    assert.equal(new Set(group.map((kase) => kase.excerptAt)).size, group.length, `${group[0].id}: duplicate excerpt target`);
    assert(
      group.every((kase) => kase.sourceExcerpt === group[0].sourceExcerpt && kase.expected_spacing === group[0].expected_spacing),
      `${group[0].id}: inconsistent excerpt gold`,
    );
    assert.equal(
      applyTextEdits(
        group[0].settled,
        group.flatMap((kase) => editsForLabel(kase, kase.expected_label)),
      ),
      group[0].expected_spacing,
      `${group[0].id}: combined gold disagrees with core and contract edits; include every target in the excerpt`,
    );
  }
  return corpus;
}

const editContract = { editsForLabel, applyTextEdits, labels, spacingOnly: true };

export function evaluatePaired(options) {
  return pairedGate({ ...options, ...editContract, symbol: '+', protectedLabels: ['signed-number'] });
}

export function score(artifact) {
  const result = scoreArtifact({ artifact, cases: artifact.results, repeats: artifact.repeats, orderCount: artifact.orders.length, ...editContract });
  const count = (rows, field) => ({ passed: rows.filter((row) => row[field] === row.scheduled).length, total: rows.length });
  return {
    labels: count(result.cases, 'labelCorrect'),
    targetSpacing: count(result.cases, 'targetSpacingCorrect'),
    combinedSpacing: count(result.cases, 'fullSpacingCorrect'),
    classes: Object.fromEntries(
      labels.map((label) => [
        label,
        count(
          result.cases.filter((row) => artifact.results.find((kase) => kase.id === row.id).expected_label === label),
          'labelCorrect',
        ),
      ]),
    ),
    misses: result.cases.filter((row) => !row.passed).map((row) => row.id),
    labelMisses: result.cases.filter((row) => row.labelCorrect !== row.scheduled).map((row) => row.id),
    unstable: artifact.results.filter((row) => !row.stable).map((row) => row.id),
  };
}
