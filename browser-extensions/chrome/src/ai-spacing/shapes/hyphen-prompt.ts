import type { PromptSpec } from './base';

// NOTE: Changing the language of these label "values" affects model output and can reduce accuracy. Re-run model evaluations after changing them.
export const HYPHEN_LABELS = {
  signedNumber: 'signed-number',
  rangeOrSeparator: 'range-or-separator',
  unsure: 'unsure',
} as const;

export type HyphenLabel = (typeof HYPHEN_LABELS)[keyof typeof HYPHEN_LABELS];

const PROMPT_VERSION = 'v26-zh';

const SYSTEM_PROMPT = '你是中文數字判讀助手。判斷句子裡指定的「-」是負號還是分隔符號。只判斷指定符號，不要改寫句子，不要解釋，只回答一個選項名稱。';

const MENU = `- ${HYPHEN_LABELS.signedNumber}：負號，屬於後面的數字，表示數值小於零
- ${HYPHEN_LABELS.rangeOrSeparator}：連接或分隔兩個項目，不屬於後面的數字
- ${HYPHEN_LABELS.unsure}：句子提供的資訊不足以判斷`;

function buildQuestion(sentence: string, at: number) {
  const number = sentence.slice(at + 1).match(/^\d+(?:\.\d+)?/)?.[0] ?? '';
  return `句子：${sentence}\n\n「${sentence[at - 1]}${sentence[at]}${number}」裡的「${sentence[at]}」是哪一種符號？\n${MENU}\n\n用選項的名稱回答。`;
}

export const hyphenPrompt: PromptSpec<HyphenLabel> = {
  kind: 'hyphen-sign',
  systemPrompt: SYSTEM_PROMPT,
  version: PROMPT_VERSION,
  candidateLabels: Object.values(HYPHEN_LABELS),
  buildQuestion,
};
