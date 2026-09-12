const system =
  '你是中文數字判讀助手。判斷句子裡指定的「-」是負號還是分隔符號。只判斷指定符號，不要改寫句子，不要解釋，只回答一個選項名稱。先依完整句意判斷數字代表的事物；只有該數值確實小於零時才選 signed-number。編號、年齡或期間前的連接符號選 range-or-separator，不要只因「-」緊接數字就判為負號。';

const menu = `- signed-number：負號，屬於後面的數字，表示數值小於零或金額減少（扣款、支出、轉出）
- range-or-separator：連接或分隔兩個項目，不屬於後面的數字
- unsure：句子提供的資訊不足以判斷`;

export const RESPONSE_CONSTRAINT = { type: 'string', enum: ['signed-number', 'range-or-separator', 'unsure'] };

export const DIAGNOSTIC_QUESTIONS = [
  'Translate the original sentence into English, preserving the meaning of each number.',
  'Which occurrence of the hyphen did the question identify? Quote the exact surrounding original text.',
  'Explain whether that number is negative, or a positive number connected to a preceding item. Which label fits?',
];

export const PROMPTS = {
  'v28-zh': {
    system,
    build: (kase) => {
      const number = kase.input.slice(kase.at + 1).match(/^\d+(?:\.\d+)?/)?.[0] ?? '';
      const target = kase.input.slice(kase.at - 1, kase.at + number.length + 2);
      return `「${target}」裡的「${kase.input[kase.at]}」是哪一種符號？\n${menu}\n\n句子：${kase.input}\n\n用選項的名稱回答。`;
    },
  },
};

PROMPTS['age-conditions'] = {
  system: system.replace('編號、年齡或期間', '編號、年齡區間、年齡門檻或期間'),
  build: PROMPTS['v28-zh'].build,
};

PROMPTS['semantic-menu'] = {
  system: PROMPTS['age-conditions'].system,
  build: (kase) =>
    PROMPTS['age-conditions'].build(kase).replace(
      menu,
      `- signed-number：數字表示小於零的值，或扣款、支出、轉出；溫度的負號表示零下
- range-or-separator：數字表示名稱中的編號、年齡或年期，或分隔的項目；這個數字本身不是負值
- unsure：句子提供的資訊不足以判斷`,
    ),
};

PROMPTS['negative-bounds'] = {
  system: PROMPTS['semantic-menu'].system,
  build: (kase) => PROMPTS['semantic-menu'].build(kase).replace('溫度的負號表示零下', '溫度的負號表示零下；負數即使是範圍的上限或下限，仍選此項'),
};

PROMPTS['complete-unit'] = {
  system: PROMPTS['negative-bounds'].system,
  build: (kase) => {
    const number = kase.input.slice(kase.at + 1).match(/^\d+(?:\.\d+)?/)?.[0] ?? '';
    const oldTarget = kase.input.slice(kase.at - 1, kase.at + number.length + 2);
    const target = kase.input.slice(kase.at - 1, kase.at + number.length + 3);
    return PROMPTS['negative-bounds'].build(kase).replace(`「${oldTarget}」`, `「${target}」`);
  },
};

PROMPTS['letter-unit'] = {
  system: PROMPTS['negative-bounds'].system,
  build: (kase) => {
    const number = kase.input.slice(kase.at + 1).match(/^\d+(?:\.\d+)?/)?.[0] ?? '';
    const end = kase.at + number.length + 1;
    const unitLength = kase.input.slice(end).match(/^\p{L}{2}/u)?.[0].length ?? 1;
    const target = kase.input.slice(kase.at - 1, end + unitLength);
    return PROMPTS['negative-bounds'].build(kase).replace(`「${kase.input.slice(kase.at - 1, end + 1)}」`, `「${target}」`);
  },
};
