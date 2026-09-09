import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol ` `', () => {
  it('handle ` ` symbols as quotes', () => {
    expect(pangu.spaceText('前面`中間`後面')).toBe('前面 `中間` 後面');

    // prettier-ignore
    expect(pangu.spaceText('`! git commit -a -m "蛤"`'))
                       .toBe('`! git commit -a -m "蛤"`');

    // prettier-ignore
    expect(pangu.spaceText('从结果来看，当a.b销毁后，`a.getB()`返回值为null'))
                       .toBe('从结果来看，当 a.b 销毁后，`a.getB()` 返回值为 null');

    // prettier-ignore
    expect(pangu.spaceText('雖然知道可以在Claude Code直接執行shell指令，例如`! git commit -a -m "蛤"`，但是看了文件才知道原來在 http://command.md 裡面也可以用`!`啊#TIL'))
                       .toBe('雖然知道可以在 Claude Code 直接執行 shell 指令，例如 `! git commit -a -m "蛤"`，但是看了文件才知道原來在 http://command.md 裡面也可以用 `!` 啊 #TIL');

    // prettier-ignore
    expect(pangu.spaceText('雖然知道可以在 Claude Code 直接執行 shell 指令，例如 `! git commit -a -m "蛤"`，但是看了文件才知道原來在 http://command.md 裡面也可以用 `!` 啊 #TIL'))
                       .toBe('雖然知道可以在 Claude Code 直接執行 shell 指令，例如 `! git commit -a -m "蛤"`，但是看了文件才知道原來在 http://command.md 裡面也可以用 `!` 啊 #TIL');
  });
});
