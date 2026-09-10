# Full-width glyphs for ANS characters in CJK fonts

Date: 2026-09-11. Status: research only, no rule change.

## Question

On <https://www.cht.com.tw/zh-tw/home/cht/messages/2026/0114-1740> the title reads `評等 “AA” 全球` and the body reads `評等 “AA”，`. Both hold the same bytes: U+0020, U+201C, `A`, `A`, U+201D, U+0020. The title quotes render about three times wider. The title uses Noto Sans TC 700 at 36px, the body uses Arial at 18px. Noto Sans TC ships U+201C and U+201D as one-em glyphs; Arial ships them at about 0.33 em. So `CJK “A” CJK` with pangu's boundary spaces looks double-spaced under Noto Sans TC and right under Arial.

Which other characters that pangu spaces as ANS do common Chinese fonts ship full-width, and can a page detect it?

## Method

Canvas `measureText` at 100px per character, per font family. A glyph counts as served by the font itself when its width is the same under `"Font", monospace` and `"Font", serif`; otherwise a fallback font drew it and the row skips it. Full means advance width at or above 0.9 em. Mid means 0.75 to 0.89 em. Measured on macOS 26 with Chrome, plus Noto Sans SC/JP/KR/HK, Noto Serif TC, and LXGW WenKai TC loaded from Google Fonts. Windows fonts (Microsoft JhengHei, Microsoft YaHei, SimSun, SimHei, DengXian, MingLiU) were not installed and are unmeasured.

```js
const c = document.createElement('canvas').getContext('2d');
const w = (family, s) => {
  c.font = `100px ${family}`;
  return c.measureText(s).width;
};
const a = w(`"${font}", monospace`, ch),
  b = w(`"${font}", serif`, ch);
const servedByFont = Math.abs(a - b) < 0.5;
const ratio = a / 100;
```

## Findings

Characters pangu spaces as ANS, and the fonts that ship them full-width:

| Char                                  | pangu class                                                      | Full-width in                                                                                                                                                                                       |
| ------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `…` U+2026                            | `DOTS_CJK`                                                       | every CJK font tested                                                                                                                                                                               |
| `℃` U+2103                            | `LETTERLIKE_SYMBOLS`                                             | every font except Kaiti TC 0.85, Nanum Gothic 0.79                                                                                                                                                  |
| `№` U+2116                            | `LETTERLIKE_SYMBOLS`                                             | Noto Sans TC, PingFang, Hiragino, Heiti TC, Songti, STHeiti, Kaiti TC, Yuanti TC, LiHei Pro, Nanum Gothic. Not Noto Sans SC/JP/KR                                                                   |
| `“ ” ‘ ’` U+2018 to U+201D            | quote rules, `LEFT_BRACKETS_EXTENDED`, `RIGHT_BRACKETS_EXTENDED` | Noto Sans TC/SC/HK, Noto Serif TC, Hiragino Sans GB, Heiti TC, STHeiti, LiHei Pro, Apple LiGothic, Kaiti TC (opening only for `“`). Not PingFang 0.54, Noto Sans JP/KR, Songti, Yuanti, LXGW WenKai |
| `× ÷ ± §` U+00D7 U+00F7 U+00B1 U+00A7 | `LATIN_1_SUPPLEMENT_AFTER_NBSP`                                  | all Noto CJK, Hiragino Sans GB, Songti, STSong, STHeiti, LiHei Pro, Apple LiGothic. Not PingFang 0.60                                                                                               |
| `Ⅰ ⅰ` U+2160 U+2170                   | `NUMBER_FORMS`                                                   | PingFang, Hiragino, Heiti TC, Songti, STHeiti, Kaiti TC, Yuanti TC, LiHei Pro, Nanum Gothic. Not Noto 0.33                                                                                          |
| `°` U+00B0                            | `LATIN_1_SUPPLEMENT_AFTER_NBSP`                                  | Hiragino Sans GB, Heiti TC, Songti, STHeiti, LiHei Pro, Apple LiGothic. Not Noto 0.37, PingFang 0.33                                                                                                |
| `α Α` U+03B1 U+0391                   | `GREEK_AND_COPTIC`                                               | Hiragino Sans GB, Hiragino Sans, Hiragino Mincho, Heiti TC, STHeiti, LiHei Pro, Apple LiGothic. Not Noto, PingFang                                                                                  |
| `™` U+2122                            | `LETTERLIKE_SYMBOLS`                                             | Hiragino, Heiti TC, Songti, STHeiti, Kaiti TC, Yuanti TC, Nanum Gothic. PingFang 0.89                                                                                                               |
| `❶` U+2776                            | `DINGBATS`                                                       | Noto Sans TC, PingFang, Hiragino Sans, Osaka, Nanum Gothic. 0.79 elsewhere                                                                                                                          |
| `© ®` U+00A9 U+00AE                   | `LATIN_1_SUPPLEMENT_AFTER_NBSP`                                  | none full. 0.76 to 0.88 in PingFang, Noto, Heiti TC, Songti                                                                                                                                         |

`—` U+2014, `–` U+2013, and `·` U+00B7 are also full-width in most of these fonts, but pangu does not space them. The middle dot normalizes to U+30FB instead.

Per font, full-width set among the tested characters:

| Font                                | Full-width                            |
| ----------------------------------- | ------------------------------------- |
| Noto Sans TC, Noto Sans CJK TC      | `“”‘’…·×÷±§℃№❶`                       |
| Noto Sans SC, Noto Sans HK          | `“”‘’…·×÷±§℃`                         |
| Noto Sans JP, Noto Sans KR          | `…×÷±§℃`                              |
| Noto Serif TC                       | `“”‘’…×÷±§℃`                          |
| LXGW WenKai TC                      | `…—℃`                                 |
| PingFang TC, PingFang SC            | `…—Ⅰⅰ℃№❶`                             |
| Hiragino Sans GB                    | `“”‘’…—–·°×÷±§αΑⅠⅰ℃№™`                |
| Hiragino Sans, Hiragino Mincho ProN | `…—αΑⅠⅰ℃№™❶`                          |
| Heiti TC                            | `“”‘’…—·°ΑⅠⅰ℃№™`                      |
| Songti TC, STSong                   | `…—–·°×÷±§Ⅰⅰ℃№™`                      |
| STHeiti                             | `“”‘’…—–·°×÷±§ΑⅠⅰ℃№™`                 |
| STKaiti                             | `…—–§Ⅰⅰ№™`                            |
| Kaiti TC                            | `“‘’…—–§Ⅰⅰ№™`                         |
| Yuanti TC                           | `…—–Ⅰⅰ℃№™`                            |
| Apple LiGothic                      | `“”‘’—–·°×÷±§¥αΑⅠ℃`                   |
| LiHei Pro                           | `“”‘’—–·°×÷±§¥αΑⅠⅰ℃№`                 |
| Apple SD Gothic Neo                 | none at 0.9; `…—Ⅰⅰ№❶` at 0.81 to 0.86 |
| Osaka                               | `…—℃№❶`                               |
| Nanum Gothic                        | `…¥®Ⅰⅰ№™❶`                            |
| Arial Unicode MS                    | `…—℃№™`                               |

## Takeaways

- No stable per-character answer. The same code point flips per font family, even within one vendor: PingFang quotes are narrow and Heiti TC quotes are full; Noto `Ⅰ` is narrow and PingFang `Ⅰ` is full.
- Only `…` and `℃` are full-width nearly everywhere.
- PingFang, the macOS and iOS default for Chinese, is the most Latin-like of the set. Noto Sans TC, the most common web CJK font, has the widest full-width set, including the curly quotes.
- Measured ratios cluster cleanly: at or above 0.9 em for true full-width, at or below 0.66 em for proportional glyphs, with `© ® ™ ❶` in a 0.75 to 0.89 band between. A 0.9 threshold separates full-width from that band.
- Windows fonts are unmeasured. From their GB2312 and Big5 origins, SimSun, SimHei, and Microsoft YaHei are expected to ship curly quotes, Greek, and `× ÷ ° ± §` full-width. Confirm on a Windows machine before relying on it.

## Detection

A page can detect it per text node. Detection is cheap; wiring the result into spacing is the cost.

```js
const style = getComputedStyle(textNode.parentElement);
ctx.font = style.font; // Chrome exposes the computed shorthand
const isFullWidth = ctx.measureText('“').width / parseFloat(style.fontSize) >= 0.9;
```

- Canvas honors the element's full fallback chain, so `Arial, "Noto Sans TC"` correctly reads narrow. No forced layout. Cache per computed `font` string; a page has a handful.
- The rules are string in, string out. Quote spacing lives in `spaceText` plus `isQuoteNextToCjk` and `isStandaloneQuote` in boundary spacing. A per-node font fact needs either a `spaceText` option that turns the affected rules off, with the junction cache keyed by it, or a late fix that removes only the spaces pangu added beside a full-width glyph.
- Webfont timing. The first spacing pass often runs before `font-display: swap` finishes, so the measurement sees the fallback font. Affected nodes need a rerun on `document.fonts` `loadingdone`.
- Only the Chrome extension can do this. The npm package has no font information.
- A rule change that depends on the rendered font is a new spacing contract and needs an ADR.
