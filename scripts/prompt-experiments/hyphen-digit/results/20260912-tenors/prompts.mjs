// Freeze v27-zh here so future production changes cannot alter these historical candidates.
const hyphenDigitPrompt = {
  systemPrompt:
    '你是中文數字判讀助手。判斷句子裡指定的「-」是負號還是分隔符號。只判斷指定符號，不要改寫句子，不要解釋，只回答一個選項名稱。先依完整句意判斷數字代表的事物；只有該數值確實小於零時才選 signed-number。編號、年齡或期間前的連接符號選 range-or-separator，不要只因「-」緊接數字就判為負號。',
  buildQuestion: (sentence, at) => {
    const number = sentence.slice(at + 1).match(/^\d+(?:\.\d+)?/)?.[0] ?? '';
    return `句子：${sentence}\n\n「${sentence[at - 1]}${sentence[at]}${number}」裡的「${sentence[at]}」是哪一種符號？\n- signed-number：負號，屬於後面的數字，表示數值小於零\n- range-or-separator：連接或分隔兩個項目，不屬於後面的數字\n- unsure：句子提供的資訊不足以判斷\n\n用選項的名稱回答。`;
  },
};

export const RESPONSE_CONSTRAINT = { type: 'string', enum: ['signed-number', 'range-or-separator', 'unsure'] };

export const PROMPTS = {
  'v27-zh': { system: hyphenDigitPrompt.systemPrompt, build: (kase) => hyphenDigitPrompt.buildQuestion(kase.input, kase.at) },
  'tenor-meaning': {
    system: `${hyphenDigitPrompt.systemPrompt}判斷的是緊接「-」的數字，不是句尾的指標值；年期表示合約或債券的存續期間，不是殖利率或報酬率，期間前的「-」選 range-or-separator。`,
    build: (kase) => hyphenDigitPrompt.buildQuestion(kase.input, kase.at),
  },
};

PROMPTS['target-ordinal'] = {
  system: hyphenDigitPrompt.systemPrompt,
  build: (kase) =>
    hyphenDigitPrompt
      .buildQuestion(kase.input, kase.at)
      .replace(/「[^\n]*」裡的「-」是哪一種符號？/, `句子中從左到右第 ${kase.input.slice(0, kase.at + 1).split('-').length - 1} 個「-」是哪一種符號？`),
};

PROMPTS['english-instructions'] = {
  system:
    'You interpret numbers in Chinese text. Decide whether the specified "-" is a negative sign or a separator. Classify only that symbol. Do not rewrite the sentence or explain; answer with one option name. First use the full sentence to determine what the number represents. Choose signed-number only when that value is actually below zero. A hyphen before an identifier, age, or duration is range-or-separator. Do not classify it as negative just because "-" directly precedes a digit.',
  build: (kase) => {
    const number = kase.input.slice(kase.at + 1).match(/^\d+(?:\.\d+)?/)?.[0] ?? '';
    return `Sentence: ${kase.input}\n\nWhat kind of symbol is "-" in "${kase.input[kase.at - 1]}-${number}"?\n- signed-number: a negative sign belonging to the following number, indicating a value below zero\n- range-or-separator: connects or separates two items; it is not part of the following number\n- unsure: the sentence does not provide enough information to decide\n\nAnswer with the option name.`;
  },
};

PROMPTS['sourced-examples'] = {
  system:
    '你是中文數字判讀助手。判斷句子裡指定的「-」是負號還是分隔符號。只判斷指定符號，不要改寫句子，不要解釋，只回答一個選項名稱。先依完整句意判斷數字代表的事物；只有該數值確實小於零時才選 signed-number。編號、年齡或期間前的連接符號選 range-or-separator，不要只因「-」緊接數字就判為負號。\n\n範例：\n句子：一定要注意冰庫溫度設定在-18°C或以下的同時，要維持固定溫度讓食物保持冷凍方可安心食用\n\n「在-18」裡的「-」是哪一種符號？\n- signed-number：負號，屬於後面的數字，表示數值小於零\n- range-or-separator：連接或分隔兩個項目，不屬於後面的數字\n- unsure：句子提供的資訊不足以判斷\n\n用選項的名稱回答。\n答案：signed-number\n\n範例：\n句子：水轉印系列-1\n\n「列-1」裡的「-」是哪一種符號？\n- signed-number：負號，屬於後面的數字，表示數值小於零\n- range-or-separator：連接或分隔兩個項目，不屬於後面的數字\n- unsure：句子提供的資訊不足以判斷\n\n用選項的名稱回答。\n答案：range-or-separator',
  build: (kase) => hyphenDigitPrompt.buildQuestion(kase.input, kase.at),
};

PROMPTS['target-unit'] = {
  system: PROMPTS['sourced-examples'].system,
  build: (kase) => {
    const number = kase.input.slice(kase.at + 1).match(/^\d+(?:\.\d+)?/)?.[0] ?? '';
    return hyphenDigitPrompt.buildQuestion(kase.input, kase.at).replace(`「${kase.input[kase.at - 1]}-${number}」`, `「${kase.input.slice(kase.at - 1, kase.at + number.length + 2)}」`);
  },
};

PROMPTS['english-sourced-examples'] = {
  system:
    'You interpret numbers in Chinese text. Decide whether the specified "-" is a negative sign or a separator. Classify only that symbol. Do not rewrite the sentence or explain; answer with one option name. First use the full sentence to determine what the number represents. Choose signed-number only when that value is actually below zero. A hyphen before an identifier, age, or duration is range-or-separator. Do not classify it as negative just because "-" directly precedes a digit.\n\nExample:\nSentence: 一定要注意冰庫溫度設定在-18°C或以下的同時，要維持固定溫度讓食物保持冷凍方可安心食用\n\nWhat kind of symbol is "-" in "在-18"?\n- signed-number: a negative sign belonging to the following number, indicating a value below zero\n- range-or-separator: connects or separates two items; it is not part of the following number\n- unsure: the sentence does not provide enough information to decide\n\nAnswer with the option name.\nAnswer: signed-number\n\nExample:\nSentence: 水轉印系列-1\n\nWhat kind of symbol is "-" in "列-1"?\n- signed-number: a negative sign belonging to the following number, indicating a value below zero\n- range-or-separator: connects or separates two items; it is not part of the following number\n- unsure: the sentence does not provide enough information to decide\n\nAnswer with the option name.\nAnswer: range-or-separator',
  build: PROMPTS['english-instructions'].build,
};

PROMPTS['cds-maturity'] = {
  system: `${PROMPTS['sourced-examples'].system}\n信用違約交換的年數是合約期限，國家名稱與年數之間的「-」選 range-or-separator。`,
  build: PROMPTS['sourced-examples'].build,
};

PROMPTS['cds-before-examples'] = {
  system: PROMPTS['sourced-examples'].system.replace(
    hyphenDigitPrompt.systemPrompt,
    `${hyphenDigitPrompt.systemPrompt}\n信用違約交換的年數是合約期限，國家名稱與年數之間的「-」選 range-or-separator。`,
  ),
  build: PROMPTS['sourced-examples'].build,
};

PROMPTS['maturity-and-cashflow'] = {
  system: `${PROMPTS['cds-maturity'].system}\n銀行金額若與其他帳戶的正向入帳並列，「-」表示轉出或扣款，選 signed-number。`,
  build: PROMPTS['sourced-examples'].build,
};
