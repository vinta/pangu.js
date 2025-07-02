import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe("Symbol ' '", () => {
  it("handle ' ' symbols as quotes", () => {
    // prettier-ignore
    expect(pangu.spacingText("Why are Python's 'private' methods not actually private?"))
                       .toBe("Why are Python's 'private' methods not actually private?");

    // prettier-ignore
    expect(pangu.spacingText("举个栗子，如果一道题只包含'A' ~ 'Z'意味着字符集大小是"))
                       .toBe("举个栗子，如果一道题只包含 'A' ~ 'Z' 意味着字符集大小是");

    // Single quotes around Chinese text should not have spaces added
    expect(pangu.spacingText("Remove '铁蕾' from 1 Folder?")).toBe("Remove '铁蕾' from 1 Folder?");
  });

  it("handle ' symbols as apostrophe", () => {
    expect(pangu.spacingText("陳上進 likes 林依諾's status.")).toBe("陳上進 likes 林依諾's status.");
  });
});
