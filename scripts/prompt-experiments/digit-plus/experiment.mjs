import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export function loadCorpus(split = 'development') {
  assert(['development', 'holdout'].includes(split), `invalid digit-plus split: ${split}; use development or holdout`);
  const corpus = JSON.parse(readFileSync(new URL('./cases.json', import.meta.url), 'utf8'));
  const cases = corpus.cases
    .filter((sentence) => sentence.split === split)
    .flatMap((sentence) => {
      const offsets = [...sentence.input.matchAll(/\+/g)].map((match) => match.index);
      assert.equal(offsets.length, 1, `invalid digit-plus input: ${sentence.id}; provide a sentence with exactly one +`);
      assert.deepEqual(
        sentence.targets.map((target) => target.ordinal),
        [1],
        `invalid target: ${sentence.id}; annotate the only +`,
      );
      assert.equal(sentence.input.replaceAll(' ', ''), sentence.expected_output.replaceAll(' ', ''), `non-space edit: ${sentence.id}`);
      return sentence.targets.map((target) => {
        const at = offsets[target.ordinal - 1];
        assert(Number.isInteger(at) && /[0-9]/.test(sentence.input[at - 1]) && sentence.input[at + 1] !== '+', `invalid digit-plus target: ${sentence.id}/${target.ordinal}`);
        return { ...sentence, ...target, at, id: `${sentence.id}-${target.ordinal}`, enum: 'digit-plus' };
      });
    });
  return { ...corpus, set: `digit-plus:${split}`, cases };
}

export function score(run) {
  const count = (cases) => ({ passed: cases.filter((kase) => kase.correct).length, total: cases.length });
  return {
    labels: count(run.results),
    required: count(run.results.filter((kase) => kase.group === 'required')),
    classes: Object.fromEntries(['conjunction', 'lower-bound', 'unsure'].map((label) => [label, count(run.results.filter((kase) => kase.expected_label === label))])),
    misses: run.results.filter((kase) => !kase.correct).map((kase) => kase.id),
    unstable: run.results.filter((kase) => !kase.stable).map((kase) => kase.id),
  };
}
