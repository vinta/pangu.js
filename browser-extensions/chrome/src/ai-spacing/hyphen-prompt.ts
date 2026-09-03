import type { PromptSpec } from './ambiguous-shape';

// The hyphen-sign classifier's shipping prompt, variant `v20-zh`: the variant that held every control at temperature 0 in the extension-context retest (docs/hyphen-sign-probe-handoff.md).
// Gemini Nano tracks presentation rather than meaning and is hypersensitive to surface form, so these bytes are load-bearing -- rewording, reordering or reformatting any of them invalidates the
// measured numbers. Copied from the variant of the same name in experiments/hyphen-sign/prompts.js, which the extension is deliberately independent of from here on.

const PROMPT_VERSION = 'v20-zh';

const SYSTEM_PROMPT = '你是中文朗讀老師。想像把整句話唸出來給聽眾聽，判斷朗讀時句子裡指定的「-」該怎麼唸。只判斷那一個符號，不要改寫句子，不要解釋，只從選項中挑一個回答。';

// The menu, in the order the retest measured: answers move with the order, so production never shuffles it. The model answers in reading words (`token`) rather than in canonical labels, which is
// the change that stabilized this chassis; tokens are mapped back to labels before anything outside this module sees them
const OPTIONS = [
  { label: 'signed-number', token: '負', gloss: '朗讀時唸作「負」或「零下」：後面的數字是負數' },
  { label: 'range-or-separator', token: '到或分隔', gloss: '朗讀時唸作「到」或「至」，或是完全不唸出來、只停頓一下（當作分隔）' },
  { label: 'unsure', token: '聽不出來', gloss: '真的聽不出來該怎麼唸' },
] as const;

export type HyphenLabel = (typeof OPTIONS)[number]['label'];

// What the response constraint allows the model to emit
const DISPLAY_TOKEN_ENUM = OPTIONS.map((option) => option.token);

function labelForDisplayToken(token: unknown) {
  return OPTIONS.find((option) => option.token === token)?.label ?? null;
}

const MENU = OPTIONS.map((option) => `- ${option.token}：${option.gloss}`).join('\n');

// No mark around the flagged symbol: the guillemets earlier variants wrapped it in read as a tokenizer to Nano rather than as a pointer. The question shows the sentence untouched and points at the
// symbol by quoting the character before it, which is what a sentence carrying a second hyphen makes necessary
function buildQuestion(sentence: string, at: number) {
  return `句子：${sentence}\n\n把這句話唸出來時，「${sentence[at - 1]}」後面的那個「${sentence[at]}」該怎麼唸？\n${MENU}\n\n用選項的名稱回答。`;
}

// The worker-side half of the hyphen-sign ambiguous shape, joined to the page-side half in hyphen-sign.ts by `kind` alone
export const hyphenPrompt: PromptSpec<HyphenLabel> = {
  kind: 'hyphen-sign',
  systemPrompt: SYSTEM_PROMPT,
  version: PROMPT_VERSION,
  buildQuestion,
  displayTokenEnum: DISPLAY_TOKEN_ENUM,
  labelForDisplayToken,
};
