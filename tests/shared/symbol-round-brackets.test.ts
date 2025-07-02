import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Symbol ( )', () => {
  it('handle ( ) symbols as round brackets', () => {
    expect(pangu.spacingText('前面(中文123漢字)後面')).toBe('前面 (中文 123 漢字) 後面');
    expect(pangu.spacingText('前面(中文123)後面')).toBe('前面 (中文 123) 後面');
    expect(pangu.spacingText('前面(123漢字)後面')).toBe('前面 (123 漢字) 後面');
    expect(pangu.spacingText('前面(中文123) tail')).toBe('前面 (中文 123) tail');
    expect(pangu.spacingText('head (中文123漢字)後面')).toBe('head (中文 123 漢字) 後面');
    expect(pangu.spacingText('head (中文123漢字) tail')).toBe('head (中文 123 漢字) tail');
    expect(pangu.spacingText('(or simply "React")')).toBe('(or simply "React")');
    expect(pangu.spacingText('function(123)')).toBe('function(123)');
    expect(pangu.spacingText('我看过的电影(1404)')).toBe('我看过的电影 (1404)');

    // prettier-ignore
    expect(pangu.spacingText('預定於繳款截止日114/07/02(遇假日順延)之次一營業日進行扣款'))
                       .toBe('預定於繳款截止日 114/07/02 (遇假日順延) 之次一營業日進行扣款');

    // prettier-ignore
    expect(pangu.spacingText("OperationalError: (2006, 'MySQL server has gone away')"))
                       .toBe("OperationalError: (2006, 'MySQL server has gone away')");

    // prettier-ignore
    expect(pangu.spacingText('Chang Stream(变更记录流)是指collection(数据库集合)的变更事件流'))
                       .toBe('Chang Stream (变更记录流) 是指 collection (数据库集合) 的变更事件流');

    // prettier-ignore
    expect(pangu.spacingText('从结果来看，当a.b销毁后，`a.getB()`返回值为null'))
                       .toBe('从结果来看，当 a.b 销毁后，`a.getB()` 返回值为 null');

    // prettier-ignore
    expect(pangu.spacingText("后续会直接用iframe window.addEventListener('message')"))
                       .toBe("后续会直接用 iframe window.addEventListener('message')");
  });
});
