import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Symbol " "', () => {
  it('handle " " symbols as quotes', () => {
    expect(pangu.spacingText('前面"中文123漢字"後面')).toBe('前面 "中文 123 漢字" 後面');
    expect(pangu.spacingText('前面"中文123"後面')).toBe('前面 "中文 123" 後面');
    expect(pangu.spacingText('前面"中文abc"後面')).toBe('前面 "中文 abc" 後面');
    expect(pangu.spacingText('前面"123漢字"後面')).toBe('前面 "123 漢字" 後面');
    expect(pangu.spacingText('前面"中文123" tail')).toBe('前面 "中文 123" tail');
    expect(pangu.spacingText('head "中文123漢字"後面')).toBe('head "中文 123 漢字" 後面');
    expect(pangu.spacingText('head "中文123漢字" tail')).toBe('head "中文 123 漢字" tail');
  });

  it('handle " " adjacent to CJK', () => {
    expect(pangu.spacingText('我們也不可以說"We invited the reverend to dinner."')).toBe('我們也不可以說 "We invited the reverend to dinner."');
    expect(pangu.spacingText('"We invited the Rev. Darling."我們也不可以說')).toBe('"We invited the Rev. Darling." 我們也不可以說');
    expect(pangu.spacingText('它應該這樣使用："We invited"')).toBe('它應該這樣使用："We invited"');

    // Full paragraph with multiple quoted segments and solitary &nbsp; (\u00a0)
    // prettier-ignore
    expect(pangu.spacingText('Rev. (Reverend；牧師的尊稱)這個縮寫嚴格來說並不是一項頭銜，而是形容詞。所以，它應該這樣使用："We invited the Rev. Alan Darling." 或\u00a0 "We\u00a0invited the Rev. Mr. Darling."，而非"We invited the Rev. Darling."我們也不可以說"We invited the reverend to dinner." -- Only a cad would invite the rev. (只有下流的人才會招致批評：句中的 rev. 是 review 的縮寫，算是雙關語)'))
                       .toBe('Rev. (Reverend；牧師的尊稱) 這個縮寫嚴格來說並不是一項頭銜，而是形容詞。所以，它應該這樣使用："We invited the Rev. Alan Darling." 或 "We invited the Rev. Mr. Darling."，而非 "We invited the Rev. Darling." 我們也不可以說 "We invited the reverend to dinner." -- Only a cad would invite the rev. (只有下流的人才會招致批評：句中的 rev. 是 review 的縮寫，算是雙關語)');
  });

  // Some input habits type both quotes of a pair as closing curly quotes,
  // so a ”…” pair reads as opening/closing quotes when no unclosed “ precedes it
  it('handle misused ” ” quote pairs', () => {
    expect(pangu.spacingText('他说”你好”啊')).toBe('他说 ”你好” 啊');

    // prettier-ignore
    expect(pangu.spacingText('《战斧骨》里还有个镜头挺有意思，就是男主”见路不走”，不从峡谷入口走，而选择了从侧面翻越，还顺便借着口哨吸引出来一个食人族给杀了。'))
                       .toBe('《战斧骨》里还有个镜头挺有意思，就是男主 ”见路不走”，不从峡谷入口走，而选择了从侧面翻越，还顺便借着口哨吸引出来一个食人族给杀了。');
  });

  // Straight quotes cannot distinguish opening from closing, so quotes are paired
  // left-to-right within a line. An unpaired leading closing quote or a quoted segment
  // that spans a newline shifts the pairing, and the CJK prose between two segments is
  // treated as quoted content whose edge spaces get stripped. This mis-pairing kept the
  // browser suite's quote-spacing case skipped for years. See #287
  it('handle " " mis-pairing (known limitation)', () => {
    expect(pangu.spacingText('Darling." 或 "We')).toBe('Darling."或" We');
    expect(pangu.spacingText('使用："We\ninvited Darling." 或 "We invited."')).toBe('使用："We\ninvited Darling."或" We invited."');
  });
});
