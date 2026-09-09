import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('API', () => {
  describe('spaceText()', () => {
    it('space text', () => {
      // prettier-ignore
      expect(pangu.spaceText('聽說Hadoop工程師睡不著的時候都會MapReduce羊'))
                         .toBe('聽說 Hadoop 工程師睡不著的時候都會 MapReduce 羊');

      // prettier-ignore
      expect(pangu.spaceText('遇到了一個問題，決定用 thread 來解決，嗯，在現有我兩個問了題'))
                         .toBe('遇到了一個問題，決定用 thread 來解決，嗯，在現有我兩個問了題');
    });

    it('space text is idempotent', () => {
      // Formatter contract: a second pass never changes the output, so format-then-check always passes
      for (const text of ['"字+"', '"字|"', '你好"字+"世界', '多行"字+"\n下行"字|"', '聽說Hadoop工程師睡不著的時候都會MapReduce羊']) {
        const once = pangu.spaceText(text);
        expect(pangu.spaceText(once)).toBe(once);
        expect(pangu.hasProperSpacing(once)).toBe(true);
      }
    });
  });

  describe('hasProperSpacing()', () => {
    it('detect proper spacing', () => {
      expect(pangu.hasProperSpacing('♫ 每條大街小巷，每個工程師的嘴裡，見面第一句話，就是不要在過年前 Deploy ♫')).toBe(true);
      expect(pangu.hasProperSpacing('♫每條大街小巷，每個工程師的嘴裡，見面第一句話，就是不要在過年前Deploy♫')).toBe(false);
    });
  });
});
