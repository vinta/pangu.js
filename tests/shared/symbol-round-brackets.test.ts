import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol ( )', () => {
  it('handle ( ) symbols as round brackets', () => {
    expect(pangu.spaceText('前面(中文123漢字)後面')).toBe('前面 (中文 123 漢字) 後面');
    expect(pangu.spaceText('前面(中文123)後面')).toBe('前面 (中文 123) 後面');
    expect(pangu.spaceText('前面(123漢字)後面')).toBe('前面 (123 漢字) 後面');
    expect(pangu.spaceText('前面(中文123) tail')).toBe('前面 (中文 123) tail');
    expect(pangu.spaceText('head (中文123漢字)後面')).toBe('head (中文 123 漢字) 後面');
    expect(pangu.spaceText('head (中文123漢字) tail')).toBe('head (中文 123 漢字) tail');
    expect(pangu.spaceText('(or simply "React")')).toBe('(or simply "React")');
    expect(pangu.spaceText('function(123)')).toBe('function(123)');
    expect(pangu.spaceText('我看过的电影(1404)')).toBe('我看过的电影 (1404)');

    // prettier-ignore
    expect(pangu.spaceText('預定於繳款截止日114/07/02(遇假日順延)之次一營業日進行扣款'))
                     .toBe('預定於繳款截止日 114/07/02 (遇假日順延) 之次一營業日進行扣款');

    // prettier-ignore
    expect(pangu.spaceText("OperationalError: (2006, 'MySQL server has gone away')"))
                     .toBe("OperationalError: (2006, 'MySQL server has gone away')");

    // prettier-ignore
    expect(pangu.spaceText('Chang Stream(变更记录流)是指collection(数据库集合)的变更事件流'))
                     .toBe('Chang Stream (变更记录流) 是指 collection (数据库集合) 的变更事件流');
  });

  it('handle multiline content in round brackets', () => {
    // A space before a newline is mid-content, not a bracket-edge space: only the literal string edges get stripped
    expect(pangu.spaceText('(x \n)中')).toBe('(x \n) 中');
    expect(pangu.spaceText('(參數 \n)後面')).toBe('(參數 \n) 後面');
  });
});
