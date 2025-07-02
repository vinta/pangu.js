import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Symbol . 只加右空格', () => {
  it('handle . symbol', () => {
    expect(pangu.spacingText('前面.')).toBe('前面.');
    expect(pangu.spacingText('前面..')).toBe('前面..');
    expect(pangu.spacingText('前面...')).toBe('前面...');
    expect(pangu.spacingText('前面.後面')).toBe('前面. 後面');
    expect(pangu.spacingText('前面..後面')).toBe('前面.. 後面');
    expect(pangu.spacingText('前面...後面')).toBe('前面... 後面');

    // DO NOT change if already spacing
    expect(pangu.spacingText('前面 . 後面')).toBe('前面 . 後面');
    expect(pangu.spacingText('前面. 後面')).toBe('前面. 後面');
    expect(pangu.spacingText('前面 .後面')).toBe('前面 .後面');

    // Special cases
    expect(pangu.spacingText('前面vs.後面')).toBe('前面 vs. 後面');
    expect(pangu.spacingText('前面U.S.A.後面')).toBe('前面 U.S.A. 後面');
    expect(pangu.spacingText('黑人問號.jpg後面')).toBe('黑人問號.jpg 後面');
    expect(pangu.spacingText('黑人問號.jpg 後面')).toBe('黑人問號.jpg 後面');
    expect(pangu.spacingText('pangu.js v1.2.3橫空出世')).toBe('pangu.js v1.2.3 橫空出世');
    expect(pangu.spacingText('pangu.js 1.2.3橫空出世')).toBe('pangu.js 1.2.3 橫空出世');

    // prettier-ignore
    expect(pangu.spacingText("Mr.龍島主道：「Let's Party!各位高明博雅君子！"))
                       .toBe("Mr. 龍島主道：「Let's Party! 各位高明博雅君子！");

    // prettier-ignore
    expect(pangu.spacingText("Mr.龍島主道:「Let's Party!各位高明博雅君子!"))
                       .toBe("Mr. 龍島主道:「Let's Party! 各位高明博雅君子!");
  });

  it('handle . symbol as file path', () => {
    // File extensions should keep spacing
    expect(pangu.spacingText('使用Python.py檔案')).toBe('使用 Python.py 檔案');
    expect(pangu.spacingText('設定檔.env很重要')).toBe('設定檔.env 很重要');
    expect(pangu.spacingText('編輯器.vscode目錄')).toBe('編輯器.vscode 目錄');

    // Multiple dots
    expect(pangu.spacingText('版本v1.2.3發布了')).toBe('版本 v1.2.3 發布了');
    expect(pangu.spacingText('檔案package.lock.json存在')).toBe('檔案 package.lock.json 存在');

    // CJK before dot patterns
    expect(pangu.spacingText('環境.env')).toBe('環境.env');
    expect(pangu.spacingText('測試.test.js')).toBe('測試.test.js');
    expect(pangu.spacingText('專案.gitignore')).toBe('專案.gitignore');

    // Mixed patterns
    expect(pangu.spacingText('使用環境.env配置')).toBe('使用環境.env 配置');
    expect(pangu.spacingText('專案.prettierrc和.eslintrc')).toBe('專案.prettierrc 和.eslintrc');
  });
});
