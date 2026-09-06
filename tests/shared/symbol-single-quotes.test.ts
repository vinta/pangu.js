import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe("Symbol ' '", () => {
  it("handle ' ' symbols as quotes", () => {
    // prettier-ignore
    expect(pangu.spacingText("Why are Python's 'private' methods not actually private?"))
                       .toBe("Why are Python's 'private' methods not actually private?");

    // prettier-ignore
    expect(pangu.spacingText("举个栗子，如果一道题只包含'A' ~ 'Z'意味着字符集大小是"))
                       .toBe("举个栗子，如果一道题只包含 'A' ~ 'Z' 意味着字符集大小是");

    // prettier-ignore
    expect(pangu.spacingText("后续会直接用iframe window.addEventListener('message')"))
                       .toBe("后续会直接用 iframe window.addEventListener('message')");

    // prettier-ignore
    expect(pangu.spacingText(`'! git commit -a -m "蛤"'`))
                       .toBe(`'! git commit -a -m "蛤"'`);

    // Single quotes around Chinese text should not have spaces added
    expect(pangu.spacingText("Remove '铁蕾' from 1 Folder?")).toBe("Remove '铁蕾' from 1 Folder?");
  });

  it("handle ' symbols as apostrophe", () => {
    expect(pangu.spacingText("陳上進 likes 林依諾's status.")).toBe("陳上進 likes 林依諾's status.");
  });
});
