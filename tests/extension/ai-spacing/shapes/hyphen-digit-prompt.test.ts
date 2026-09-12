import { expect, it } from 'vitest';
import { HYPHEN_DIGIT_LABELS, hyphenDigitPrompt } from '../../../../browser-extensions/chrome/src/ai-spacing/shapes/hyphen-digit-prompt';

it('preserve the measured v29-zh system prompt and enum order', () => {
  expect(hyphenDigitPrompt.kind).toBe('hyphen-digit');
  expect(hyphenDigitPrompt.version).toBe('v29-zh');
  expect(hyphenDigitPrompt.systemPrompt).toBe(
    '你是中文數字判讀助手。判斷句子裡指定的「-」是負號還是分隔符號。只判斷指定符號，不要改寫句子，不要解釋，只回答一個選項名稱。先依完整句意判斷數字代表的事物；只有該數值確實小於零時才選 signed-number。編號、年齡區間、年齡門檻或期間前的連接符號選 range-or-separator，不要只因「-」緊接數字就判為負號。',
  );
  expect(HYPHEN_DIGIT_LABELS).toEqual({ signedNumber: 'signed-number', rangeOrSeparator: 'range-or-separator', unsure: 'unsure' });
  expect(hyphenDigitPrompt.candidateLabels).toEqual(['signed-number', 'range-or-separator', 'unsure']);
});

it.each([
  ['跌到-20%', 2, '到-20%'],
  ['從-20%回升', 1, '從-20%'],
  ['降幅度-5.5%', 3, '度-5.5%'],
  ['從-5到5', 1, '從-5到'],
  ['從-5到-3度', 4, '到-3度'],
  ['勞動參與率-15歲以上', 5, '率-15歲以'],
  ['勞動參與率-15歲至64歲', 5, '率-15歲至'],
  ['美國-10年期公債殖利率', 2, '國-10年期'],
  ['最多應該就-100吧 剛好押金', 5, '就-100吧'],
  ['選修-2,-3', 2, '修-2,'],
  ['期間-1\u{20000}年', 2, '間-1\u{20000}年'], // U+20000 uses 2 UTF-16 code units, so the 2-letter suffix needs 3 code units.
])('preserve the target quote and question bytes for %s', (sentence, at, phrase) => {
  expect(hyphenDigitPrompt.buildQuestion(sentence, at)).toBe(
    `「${phrase}」裡的「-」是哪一種符號？\n` +
      '- signed-number：數字表示小於零的值，或扣款、支出、轉出；溫度的負號表示零下；負數即使是範圍的上限或下限，仍選此項\n' +
      '- range-or-separator：數字表示名稱中的編號、年齡或年期，或分隔的項目；這個數字本身不是負值\n' +
      `- unsure：句子提供的資訊不足以判斷\n\n句子：${sentence}\n\n用選項的名稱回答。`,
  );
});
