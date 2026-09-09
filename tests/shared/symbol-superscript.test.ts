import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol Superscripts', () => {
  it('handle superscript', () => {
    expect(pangu.spacingText('前面E=mc²後面')).toBe('前面 E=mc² 後面');

    // prettier-ignore
    expect(pangu.spacingText('115年賽事加碼：7/21-10/8 新申請MOD+自選餐(全選)/影劇館⁺加碼'))
                       .toBe('115 年賽事加碼：7/21-10/8 新申請 MOD + 自選餐 (全選)/影劇館⁺ 加碼');

    expect(pangu.spacingText('甲⁰乙、甲¹乙、甲²乙、甲³乙、甲⁴乙、甲⁵乙、甲⁶乙、甲⁷乙、甲⁸乙、甲⁹乙')).toBe('甲⁰ 乙、甲¹ 乙、甲² 乙、甲³ 乙、甲⁴ 乙、甲⁵ 乙、甲⁶ 乙、甲⁷ 乙、甲⁸ 乙、甲⁹ 乙');
    expect(pangu.spacingText('甲ⁱ乙、甲ⁿ乙、甲⁺乙、甲⁻乙、甲⁼乙')).toBe('甲ⁱ 乙、甲ⁿ 乙、甲⁺ 乙、甲⁻ 乙、甲⁼ 乙');
    expect(pangu.spacingText('甲⁽註⁾乙')).toBe('甲⁽註⁾ 乙');
  });

  // \u2122
  it('handle ™ symbol', () => {
    expect(pangu.spacingText('Trademark™後面')).toBe('Trademark™ 後面');
    expect(pangu.spacingText('商標™後面')).toBe('商標™ 後面');
  });

  // \u2120
  it('handle ℠ symbol', () => {
    expect(pangu.spacingText('Service Mark℠後面')).toBe('Service Mark℠ 後面');
    expect(pangu.spacingText('服務商標℠後面')).toBe('服務商標℠ 後面');
  });
});
