import type { PromptSpec } from './ambiguous-shape';

const PROMPT_VERSION = 'v21-zh';

const SYSTEM_PROMPT = '你是中文朗讀老師。想像把整句話唸出來給聽眾聽，判斷朗讀時句子裡指定的「-」該怎麼唸。只判斷那一個符號，不要改寫句子，不要解釋，只從選項中挑一個回答。';

const OPTIONS = [
  { label: 'signed-number', token: '負', gloss: '朗讀時唸作「負」或「零下」：後面的數字是負數' },
  { label: 'range-or-separator', token: '到或分隔', gloss: '朗讀時唸作「到」或「至」，或是完全不唸出來、只停頓一下（當作分隔）' },
  { label: 'unsure', token: '聽不出來', gloss: '真的聽不出來該怎麼唸' },
] as const;

export type HyphenLabel = (typeof OPTIONS)[number]['label'];

const DISPLAY_TOKEN_ENUM = OPTIONS.map((option) => option.token);

function labelForDisplayToken(token: unknown) {
  return OPTIONS.find((option) => option.token === token)?.label ?? null;
}

const MENU = OPTIONS.map((option) => `- ${option.token}：${option.gloss}`).join('\n');

function buildQuestion(sentence: string, at: number) {
  const number = sentence.slice(at + 1).match(/^\d+(?:\.\d+)?/)?.[0] ?? '';
  return `句子：${sentence}\n\n把這句話唸出來時，「${sentence[at - 1]}${sentence[at]}${number}」裡的「${sentence[at]}」該怎麼唸？\n${MENU}\n\n用選項的名稱回答。`;
}

export const hyphenPrompt: PromptSpec<HyphenLabel> = {
  kind: 'hyphen-sign',
  systemPrompt: SYSTEM_PROMPT,
  version: PROMPT_VERSION,
  buildQuestion,
  displayTokenEnum: DISPLAY_TOKEN_ENUM,
  labelForDisplayToken,
};
