import { hyphenDigitPrompt } from '../../../browser-extensions/chrome/src/ai-spacing/shapes/hyphen-digit-prompt.ts';

export const PROMPTS = {
  'real-r1-semantic': {
    system:
      '你是中文數字判讀助手。判斷句子裡指定的「-」是負號還是分隔符號。只判斷指定符號，不要改寫句子，不要解釋，只回答一個選項名稱。先依完整句意判斷數字代表的事物；只有該數值確實小於零時才選 signed-number。編號、年齡或期間前的連接符號選 range-or-separator，不要只因「-」緊接數字就判為負號。',
    build: (kase) => hyphenDigitPrompt.buildQuestion(kase.input, kase.at),
  },
};
