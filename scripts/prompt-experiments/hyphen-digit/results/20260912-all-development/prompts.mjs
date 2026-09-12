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

export const DIAGNOSTIC_QUESTIONS = [
  'Translate the original sentence into English, preserving the meaning of each number.',
  'Which occurrence of the hyphen did the question identify? Quote the exact surrounding original text.',
  'Explain whether that number is negative, or a positive number connected to a preceding item. Which label fits?',
];

export const PROMPTS = {
  'v27-zh': { system: hyphenDigitPrompt.systemPrompt, build: (kase) => hyphenDigitPrompt.buildQuestion(kase.input, kase.at) },
  'number-role': {
    system:
      '判斷指定數字在原文中的用途，只回答一個選項名稱。數字若表示負的測量值、負的餘額或減少的金額，選 signed-number；若表示年齡、年期、編號、日期或標題內容，選 range-or-separator；原文無法判斷用途才選 unsure。依數字的實際用途判斷，不要把金融商品名稱當成負的金額。',
    build: (kase) => hyphenDigitPrompt.buildQuestion(kase.input, kase.at),
  },
};

PROMPTS['meaning-question'] = {
  system: hyphenDigitPrompt.systemPrompt,
  build: (kase) => {
    const number = kase.input.slice(kase.at + 1).match(/^\d+(?:\.\d+)?/)?.[0] ?? '';
    const ordinal = kase.input.slice(0, kase.at + 1).split('-').length - 1;
    return `原文：${kase.input}\n\n目標：原文由左至右第 ${ordinal} 個「-」後的數字「${number}」。\n這個數字在原文中表示什麼？\n- signed-number：負的數值、負餘額、損失或扣款\n- range-or-separator：正的數量、年齡、年期、編號、日期或名稱的一部分\n- unsure：原文不足以判斷\n\n只回答選項名稱。`;
  },
};

PROMPTS['repeat-question'] = {
  system: hyphenDigitPrompt.systemPrompt,
  build: (kase) => {
    const question = hyphenDigitPrompt.buildQuestion(kase.input, kase.at);
    return `${question}\n\n${question}`;
  },
};

PROMPTS['repeat-meaning'] = {
  system: PROMPTS['meaning-question'].system,
  build: (kase) => {
    const question = PROMPTS['meaning-question'].build(kase);
    return `${question}\n\n${question}`;
  },
};

PROMPTS['question-first'] = {
  system: hyphenDigitPrompt.systemPrompt,
  build: (kase) => {
    const sentence = `句子：${kase.input}\n\n`;
    const ending = '\n\n用選項的名稱回答。';
    const question = hyphenDigitPrompt.buildQuestion(kase.input, kase.at).slice(sentence.length, -ending.length);
    return `${question}\n\n句子：${kase.input}${ending}`;
  },
};

PROMPTS['separator-menu-first'] = {
  system: hyphenDigitPrompt.systemPrompt,
  build: (kase) => hyphenDigitPrompt.buildQuestion(kase.input, kase.at).replace(/(- signed-number：[^\n]+)\n(- range-or-separator：[^\n]+)/, '$2\n$1'),
};

PROMPTS['question-first-unit'] = {
  system: PROMPTS['question-first'].system,
  build: (kase) => {
    const number = kase.input.slice(kase.at + 1).match(/^\d+(?:\.\d+)?/)?.[0] ?? '';
    return PROMPTS['question-first'].build(kase).replace(`「${kase.input[kase.at - 1]}-${number}」`, `「${kase.input.slice(kase.at - 1, kase.at + number.length + 2)}」`);
  },
};

PROMPTS['question-first-cashflow'] = {
  system: PROMPTS['question-first-unit'].system,
  build: (kase) => PROMPTS['question-first-unit'].build(kase).replace('表示數值小於零', '表示數值小於零或金額減少（扣款、支出、轉出）'),
};
