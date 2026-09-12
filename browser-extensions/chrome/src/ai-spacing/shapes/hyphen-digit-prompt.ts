import type { PromptSpec } from './base';

// NOTE: Changing the language of these label "values" affects model output and can reduce accuracy. Re-run model evaluations after changing them.
export const HYPHEN_DIGIT_LABELS = {
  signedNumber: 'signed-number',
  rangeOrSeparator: 'range-or-separator',
  unsure: 'unsure',
} as const;

export type HyphenDigitLabel = (typeof HYPHEN_DIGIT_LABELS)[keyof typeof HYPHEN_DIGIT_LABELS];

const PROMPT_VERSION = 'v28-zh';

const SYSTEM_PROMPT =
  '你是中文數字判讀助手。判斷句子裡指定的「-」是負號還是分隔符號。只判斷指定符號，不要改寫句子，不要解釋，只回答一個選項名稱。先依完整句意判斷數字代表的事物；只有該數值確實小於零時才選 signed-number。編號、年齡或期間前的連接符號選 range-or-separator，不要只因「-」緊接數字就判為負號。';

const MENU = `- ${HYPHEN_DIGIT_LABELS.signedNumber}：負號，屬於後面的數字，表示數值小於零或金額減少（扣款、支出、轉出）
- ${HYPHEN_DIGIT_LABELS.rangeOrSeparator}：連接或分隔兩個項目，不屬於後面的數字
- ${HYPHEN_DIGIT_LABELS.unsure}：句子提供的資訊不足以判斷`;

function buildQuestion(sentence: string, at: number) {
  const number = sentence.slice(at + 1).match(/^\d+(?:\.\d+)?/)?.[0] ?? '';
  const target = sentence.slice(at - 1, at + number.length + 2);
  return `「${target}」裡的「${sentence[at]}」是哪一種符號？\n${MENU}\n\n句子：${sentence}\n\n用選項的名稱回答。`;
}

export const hyphenDigitPrompt: PromptSpec<HyphenDigitLabel> = {
  kind: 'hyphen-digit',
  systemPrompt: SYSTEM_PROMPT,
  version: PROMPT_VERSION,
  candidateLabels: Object.values(HYPHEN_DIGIT_LABELS),
  buildQuestion,
};
