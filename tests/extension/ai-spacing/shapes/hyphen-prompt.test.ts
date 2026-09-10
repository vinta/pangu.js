import { expect, it } from 'vitest';
import { hyphenPrompt } from '../../../../browser-extensions/chrome/src/ai-spacing/shapes/hyphen-prompt';

it('use the v26-zh system prompt with English output labels', () => {
  expect(hyphenPrompt.version).toBe('v26-zh');
  expect(hyphenPrompt.systemPrompt).toBe('你是中文數字判讀助手。判斷句子裡指定的「-」是負號還是分隔符號。只判斷指定符號，不要改寫句子，不要解釋，只回答一個選項名稱。');
});

it.each([
  ['跌到-20%', 2, '到-20'],
  ['從-20%回升', 1, '從-20'],
  ['降幅度-5.5%', 3, '度-5.5'],
  ['從-5到5', 1, '從-5'],
  ['從-5到-3度', 4, '到-3'],
])('quote the target hyphen with its local phrase in %s', (sentence, at, phrase) => {
  expect(hyphenPrompt.buildQuestion(sentence, at)).toBe(
    `句子：${sentence}\n\n「${phrase}」裡的「-」是哪一種符號？\n` +
      '- signed-number：負號，屬於後面的數字，表示數值小於零\n' +
      '- range-or-separator：連接或分隔兩個項目，不屬於後面的數字\n' +
      '- unsure：句子提供的資訊不足以判斷\n\n用選項的名稱回答。',
  );
});
