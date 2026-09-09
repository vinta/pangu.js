import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol Superscripts', () => {
  it('handle superscript as suffix', () => {
    expect(pangu.spaceText('前面E=mc²後面')).toBe('前面 E=mc² 後面');

    // prettier-ignore
    expect(pangu.spaceText('115年賽事加碼：7/21-10/8 新申請MOD+自選餐(全選)/影劇館⁺加碼'))
                       .toBe('115 年賽事加碼：7/21-10/8 新申請 MOD + 自選餐 (全選)/影劇館⁺ 加碼');

    expect(pangu.spaceText('甲⁰乙、甲¹乙、甲²乙、甲³乙、甲⁴乙、甲⁵乙、甲⁶乙、甲⁷乙、甲⁸乙、甲⁹乙')).toBe('甲⁰ 乙、甲¹ 乙、甲² 乙、甲³ 乙、甲⁴ 乙、甲⁵ 乙、甲⁶ 乙、甲⁷ 乙、甲⁸ 乙、甲⁹ 乙');
    expect(pangu.spaceText('甲ⁱ乙、甲ⁿ乙、甲⁺乙、甲⁻乙、甲⁼乙')).toBe('甲ⁱ 乙、甲ⁿ 乙、甲⁺ 乙、甲⁻ 乙、甲⁼ 乙');
    expect(pangu.spaceText('甲⁽註⁾乙')).toBe('甲⁽註⁾ 乙');
  });

  // \u2122
  it('handle ™ symbol', () => {
    expect(pangu.spaceText('Trademark™後面')).toBe('Trademark™ 後面');
    expect(pangu.spaceText('商標™後面')).toBe('商標™ 後面');
  });

  // \u2120
  it('handle ℠ symbol', () => {
    expect(pangu.spaceText('Service Mark℠後面')).toBe('Service Mark℠ 後面');
    expect(pangu.spaceText('服務商標℠後面')).toBe('服務商標℠ 後面');
  });
});

// \u00ae
describe('Symbol ®', () => {
  it('handle ® symbol', () => {
    expect(pangu.spaceText('Registered Trademark®後面')).toBe('Registered Trademark® 後面');
    expect(pangu.spaceText('註冊商標®公司')).toBe('註冊商標® 公司');
    expect(pangu.spaceText('註冊商標®與Trademark™')).toBe('註冊商標® 與 Trademark™');
  });
});

// \u00a9
describe('Symbol ©', () => {
  it('handle © symbol', () => {
    expect(pangu.spaceText('版權所有©2026東亞重工')).toBe('版權所有 © 2026 東亞重工');
    expect(pangu.spaceText('版權所有©2012-2026東亞重工')).toBe('版權所有 © 2012-2026 東亞重工');
    expect(pangu.spaceText('Copyright © 2026東亞重工')).toBe('Copyright © 2026 東亞重工');
    expect(pangu.spaceText('Copyright © 2012-2026東亞重工')).toBe('Copyright © 2012-2026 東亞重工');
  });
});
