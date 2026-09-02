// The hyphen-sign classifier's shipping prompt, variant `v20-zh`: the variant that held every control at temperature 0 in the extension-context retest (docs/hyphen-sign-probe-handoff.md).
// Gemini Nano tracks presentation rather than meaning and is hypersensitive to surface form, so these bytes are load-bearing -- rewording, reordering or reformatting any of them invalidates the
// measured numbers. Copied from the variant of the same name in experiments/hyphen-sign/prompts.js, which the extension is deliberately independent of from here on.

export const PROMPT_VARIANT = 'v20-zh';

export type HyphenLabel = 'signed-number' | 'range-or-separator' | 'unsure';

// The menu order the retest measured. Answers move with the order, so production never shuffles it
export const CANONICAL_LABELS: readonly HyphenLabel[] = ['signed-number', 'range-or-separator', 'unsure'];

export const SYSTEM_PROMPT = '你是中文朗讀老師。想像把整句話唸出來給聽眾聽，判斷朗讀時句子裡指定的「-」該怎麼唸。只判斷那一個符號，不要改寫句子，不要解釋，只從選項中挑一個回答。';

// The model answers in reading words rather than in canonical labels, which is the change that stabilized this chassis. Answers are mapped back before anything outside this module sees them
const DISPLAY_TOKENS: Record<HyphenLabel, string> = {
  'signed-number': '負',
  'range-or-separator': '到或分隔',
  'unsure': '聽不出來',
};

const GLOSSES: Record<HyphenLabel, string> = {
  'signed-number': '朗讀時唸作「負」或「零下」：後面的數字是負數',
  'range-or-separator': '朗讀時唸作「到」或「至」，或是完全不唸出來、只停頓一下（當作分隔）',
  'unsure': '真的聽不出來該怎麼唸',
};

// What the response constraint allows the model to emit
export const DISPLAY_TOKEN_ENUM = CANONICAL_LABELS.map((label) => DISPLAY_TOKENS[label]);

export function labelForDisplayToken(token: string) {
  return CANONICAL_LABELS.find((label) => DISPLAY_TOKENS[label] === token) ?? null;
}

const MENU = CANONICAL_LABELS.map((label) => `- ${DISPLAY_TOKENS[label]}：${GLOSSES[label]}`).join('\n');

// No mark around the flagged symbol: the guillemets earlier variants wrapped it in read as a tokenizer to Nano rather than as a pointer. The question shows the sentence untouched and points at the
// symbol by quoting the character before it, which is what a sentence carrying a second hyphen makes necessary
export function buildQuestion(sentence: string, at: number) {
  return `句子：${sentence}\n\n把這句話唸出來時，「${sentence[at - 1]}」後面的那個「${sentence[at]}」該怎麼唸？\n${MENU}\n\n用選項的名稱回答。`;
}
