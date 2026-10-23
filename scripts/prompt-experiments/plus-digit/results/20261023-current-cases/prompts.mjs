import { PROMPTS as COMPOSED } from '../20261023-composed-output/prompts.mjs';
import { PROMPTS as ORIGINAL } from '../20261023-first-shape/prompts.mjs';
export { DIAGNOSTIC_QUESTIONS, LABELS, RESPONSE_CONSTRAINT, SAMPLING } from '../20261023-first-shape/prompts.mjs';

export const PROMPTS = {
  'v1-en': ORIGINAL['v1-en'],
  'hyphen-v29-zh': COMPOSED['hyphen-v29-zh'],
  'digit-plus-v18-en': COMPOSED['digit-plus-v18-en'],
  'v2-en-joins': {
    ...ORIGINAL['v1-en'],
    build: (kase) =>
      ORIGINAL['v1-en']
        .build(kase)
        .replace(
          '- conjunction: joins two distinct items or components.',
          '- conjunction: means "and", "together with", or "followed by". Joins distinct items, separate counts, or parts of a code; these do not need to be complete clauses.',
        ),
  },
};
PROMPTS['v3-en-sign-scope'] = {
  ...PROMPTS['v2-en-joins'],
  build: (kase) =>
    PROMPTS['v2-en-joins']
      .build(kase)
      .replace(
        '- signed-number: a positive value or change, or an international phone prefix.',
        '- signed-number: marks the sign of one numeric value or change as above zero, or an international phone prefix. A count being positive is not enough: + must modify that value, not join it to another item.',
      ),
};

PROMPTS['v4-en-paraphrase'] = {
  ...PROMPTS['v3-en-sign-scope'],
  build: (kase) =>
    PROMPTS['v3-en-sign-scope']
      .build(kase)
      .replace(
        'What does + mean here?',
        'Which reading preserves the meaning of + here? Read it as "positive" for signed-number, or as "and", "together with", or "followed by" for conjunction. A separator between parts of a format or pattern also counts as conjunction.',
      ),
};

PROMPTS['v5-en-target'] = {
  ...PROMPTS['v4-en-paraphrase'],
  build: (kase) =>
    PROMPTS['v4-en-paraphrase']
      .build(kase)
      .replace(
        'Which reading preserves the meaning of + here?',
        `Which reading preserves the meaning of the ASCII + immediately before "${kase.input.slice(kase.at + 1)}"? Other symbols, including ±, are not the target.`,
      ),
};

PROMPTS['v6-en-range-sign'] = {
  ...PROMPTS['v4-en-paraphrase'],
  build: (kase) =>
    PROMPTS['v4-en-paraphrase']
      .build(kase)
      .replace(
        'not join it to another item.',
        'not join it to another item. A positive endpoint of a temperature or percentage range is still signed-number, even when the other endpoint is negative; the range connector joins the bounds, not the + sign.',
      ),
};

export const BASELINE_SHAPE_PROMPTS = { 'hyphen-digit': 'hyphen-v29-zh', 'digit-plus': 'digit-plus-v18-en', 'plus-digit': 'v1-en' };
export const SHAPE_PROMPTS = { ...BASELINE_SHAPE_PROMPTS, 'plus-digit': 'v6-en-range-sign' };
