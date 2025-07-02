import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('API', () => {
  describe('spacingText()', () => {
    it('should spacing text', () => {
      expect(pangu.spacingText('中文abc')).toBe('中文 abc');
      expect(pangu.spacingText('中文123')).toBe('中文 123');
    });
  });

  describe('hasProperSpacing()', () => {
    it('should detect proper spacing', () => {
      expect(pangu.hasProperSpacing('♫ 每條大街小巷，每個工程師的嘴裡，見面第一句話，就是不要在過年前 Deploy ♫')).toBe(true);
      expect(pangu.hasProperSpacing('♫每條大街小巷，每個工程師的嘴裡，見面第一句話，就是不要在過年前Deploy♫')).toBe(false);
    });
  });
});
