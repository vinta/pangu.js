const baselineSystem = '你是中文數字判讀助手。判斷句子裡指定的「-」是負號還是分隔符號。只判斷指定符號，不要改寫句子，不要解釋，只回答一個選項名稱。';

const build = ({ input: sentence, at }) => {
  const number = sentence.slice(at + 1).match(/^\d+(?:\.\d+)?/)?.[0] ?? '';
  return `句子：${sentence}\n\n「${sentence[at - 1]}${sentence[at]}${number}」裡的「${sentence[at]}」是哪一種符號？\n- signed-number：負號，屬於後面的數字，表示數值小於零\n- range-or-separator：連接或分隔兩個項目，不屬於後面的數字\n- unsure：句子提供的資訊不足以判斷\n\n用選項的名稱回答。`;
};

export const RESPONSE_CONSTRAINT = { type: 'string', enum: ['signed-number', 'range-or-separator', 'unsure'] };

export const DIAGNOSTIC_QUESTIONS = [
  '請解釋原句的意思，必要時翻譯成英文。保持原句不變，不要創作新例句。',
  '請逐字引用指定的「-」前後的原文，指出它連接或修飾的內容。不要改寫原句。',
  '你剛才為何選擇那個標籤？根據原句解釋後面的數字代表什麼，並指出原判斷是否符合其意思。不要創作新例句。',
];

export const PROMPTS = {
  'v26-zh': { system: baselineSystem, build },
  'real-r1-semantic': {
    system: baselineSystem + '先依完整句意判斷數字代表的事物；只有該數值確實小於零時才選 signed-number。編號、年齡或期間前的連接符號選 range-or-separator，不要只因「-」緊接數字就判為負號。',
    build,
  },
};
