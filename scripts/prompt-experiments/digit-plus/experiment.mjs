import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export function loadCorpus(path = new URL('./corpus/development.json', import.meta.url)) {
  const corpus = JSON.parse(readFileSync(path, 'utf8'));
  for (const kase of corpus.cases ?? []) {
    const offsets = [...kase.input.matchAll(/\+/g)].map((match) => match.index);
    if (corpus.historical !== true) {
      assert.equal(offsets.length, 1, `invalid digit-plus input: ${kase.id}; provide a sentence with exactly one +`);
    }
    assert(Number.isSafeInteger(kase.ordinal) && kase.ordinal > 0 && offsets[kase.ordinal - 1] === kase.at, `invalid digit-plus target: ${kase.id}; record the + ordinal and offset`);
    assert(/[0-9]/.test(kase.input[kase.at - 1]) && kase.input[kase.at + 1] !== '+', `invalid digit-plus target: ${kase.id}`);
    assert.equal(kase.input.replaceAll(' ', ''), kase.expected_output.replaceAll(' ', ''), `non-space edit: ${kase.id}`);
  }
  return corpus;
}

export function score(run) {
  const count = (cases) => ({ passed: cases.filter((kase) => kase.correct).length, total: cases.length });
  return {
    labels: count(run.results),
    required: count(run.results.filter((kase) => kase.group === 'required')),
    classes: Object.fromEntries([...new Set(run.results.map((kase) => kase.expected_label))].map((label) => [label, count(run.results.filter((kase) => kase.expected_label === label))])),
    misses: run.results.filter((kase) => !kase.correct).map((kase) => kase.id),
    unstable: run.results.filter((kase) => !kase.stable).map((kase) => kase.id),
  };
}
