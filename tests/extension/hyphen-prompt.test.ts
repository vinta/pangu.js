import { expect, it } from 'vitest';
import { hyphenPrompt } from '../../browser-extensions/chrome/src/ai-spacing/hyphen-prompt';

it.each([
  ['跌到-20%', 2, '到-20'],
  ['從-20%回升', 1, '從-20'],
  ['降幅度-5.5%', 3, '度-5.5'],
  ['從-5到5', 1, '從-5'],
  ['從-5到-3度', 4, '到-3'],
])('quote the target hyphen with its local phrase in %s', (sentence, at, phrase) => {
  expect(hyphenPrompt.buildQuestion(sentence, at)).toBe(
    `句子：${sentence}\n\n把這句話唸出來時，「${phrase}」裡的「-」該怎麼唸？\n` +
      '- 負：朗讀時唸作「負」或「零下」：後面的數字是負數\n' +
      '- 到或分隔：朗讀時唸作「到」或「至」，或是完全不唸出來、只停頓一下（當作分隔）\n' +
      '- 聽不出來：真的聽不出來該怎麼唸\n\n用選項的名稱回答。',
  );
});
