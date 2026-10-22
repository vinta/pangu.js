import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { PLUS_DIGIT_LABELS, plusDigitPrompt } from '../../../src/ai-spacing/shapes/plus-digit-prompt';

const frozenModule = new URL('../../../../../scripts/prompt-experiments/plus-digit/results/20261023-first-shape/prompts.mjs', import.meta.url).href;
const { PROMPTS, RESPONSE_CONSTRAINT } = (await import(frozenModule)) as {
  PROMPTS: { 'v1-en': { system: string; build: (kase: { input: string }) => string } };
  RESPONSE_CONSTRAINT: { enum: string[] };
};
const { cases } = JSON.parse(readFileSync(new URL('../../../../../scripts/prompt-experiments/plus-digit/corpus/development.json', import.meta.url), 'utf8')) as {
  cases: { id: string; input: string; at: number }[];
};

it('preserve the frozen v1-en system prompt and enum order', () => {
  expect(plusDigitPrompt.kind).toBe('plus-digit');
  expect(plusDigitPrompt.version).toBe('v1-en');
  expect(plusDigitPrompt.systemPrompt).toBe(PROMPTS['v1-en'].system);
  expect(PLUS_DIGIT_LABELS).toEqual({ signedNumber: 'signed-number', conjunction: 'conjunction', unsure: 'unsure' });
  expect(plusDigitPrompt.candidateLabels).toEqual(RESPONSE_CONSTRAINT.enum);
  expect(plusDigitPrompt.candidateLabels).toEqual(['signed-number', 'conjunction', 'unsure']);
});

it.each(cases)('preserve the frozen question bytes for $id', ({ input, at }) => {
  expect(plusDigitPrompt.buildQuestion(input, at)).toBe(PROMPTS['v1-en'].build({ input }));
});
