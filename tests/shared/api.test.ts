import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('API', () => {
  describe('spacingText()', () => {
    it('should spacing text', () => {
      // prettier-ignore
      expect(pangu.spacingText('聽說Hadoop工程師睡不著的時候都會Map/Reduce羊",'))
                         .toBe('聽說 Hadoop 工程師睡不著的時候都會 Map/Reduce 羊",');

      // prettier-ignore
      expect(pangu.spacingText('遇到了一個問題，決定用 thread 來解決，嗯，在現有我兩個問了題'))
                         .toBe('遇到了一個問題，決定用 thread 來解決，嗯，在現有我兩個問了題');
    });
  });

  describe('hasProperSpacing()', () => {
    it('should detect proper spacing', () => {
      expect(pangu.hasProperSpacing('♫ 每條大街小巷，每個工程師的嘴裡，見面第一句話，就是不要在過年前 Deploy ♫')).toBe(true);
      expect(pangu.hasProperSpacing('♫每條大街小巷，每個工程師的嘴裡，見面第一句話，就是不要在過年前Deploy♫')).toBe(false);
    });
  });
});
