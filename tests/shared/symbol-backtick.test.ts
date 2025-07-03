import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Symbol ` `', () => {
  it('handle ` ` symbols as quotes', () => {
    expect(pangu.spacingText('前面`中間`後面')).toBe('前面 `中間` 後面');

    // prettier-ignore
    expect(pangu.spacingText('! git commit -a -m "蛤"'))
                       .toBe('! git commit -a -m "蛤"');

    // FIXME
    // prettier-ignore
    expect(pangu.spacingText('`! git commit -a -m "蛤"`'))
                       .toBe('`! git commit -a -m "蛤"`');

    // prettier-ignore
    expect(pangu.spacingText(`'! git commit -a -m "蛤"'`))
                       .toBe(`'! git commit -a -m "蛤"'`);

    // prettier-ignore
    expect(pangu.spacingText('"! git commit -a -m \'蛤\'"'))
                       .toBe('"! git commit -a -m \'蛤\'"');

    // FIXME
    // prettier-ignore
    expect(pangu.spacingText('雖然知道可以在Claude Code直接執行shell指令，例如`! git commit -a -m "蛤"`，但是看了文件才知道原來在 http://command.md 裡面也可以用`!`啊#TIL'))
                       .toBe('雖然知道可以在 Claude Code 直接執行 shell 指令，例如 `! git commit -a -m "蛤"`，但是看了文件才知道原來在 http://command.md 裡面也可以用 `!` 啊 #TIL');

    // prettier-ignore
    expect(pangu.spacingText('雖然知道可以在 Claude Code 直接執行 shell 指令，例如 `! git commit -a -m "蛤"`，但是看了文件才知道原來在 http://command.md 裡面也可以用 `!` 啊 #TIL'))
                       .toBe('雖然知道可以在 Claude Code 直接執行 shell 指令，例如 `! git commit -a -m "蛤"`，但是看了文件才知道原來在 http://command.md 裡面也可以用 `!` 啊 #TIL');
  });
});
