// CJK is short for Chinese, Japanese, and Korean.
//
// CJK includes following Unicode blocks:
// \u2e80-\u2eff CJK Radicals Supplement
// \u2f00-\u2fdf Kangxi Radicals
// \u3040-\u309f Hiragana
// \u30a0-\u30ff Katakana
// \u3100-\u312f Bopomofo
// \u3200-\u32ff Enclosed CJK Letters and Months
// \u3400-\u4dbf CJK Unified Ideographs Extension A
// \u4e00-\u9fff CJK Unified Ideographs
// \uf900-\ufaff CJK Compatibility Ideographs
//
// For more information about Unicode blocks, see
// http://unicode-table.com/en/
// https://github.com/vinta/pangu
//
// all J below does not include \u30fb
const cjk = '\u2e80-\u2eff\u2f00-\u2fdf\u3040-\u309f\u30a0-\u30fa\u30fc-\u30ff\u3100-\u312f\u3200-\u32ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff';

// ANS is short for Alphabets, Numbers, and Symbols.
//
// A includes A-Za-z
// N includes 0-9
// S includes `~!@#$%^&*()-_=+[]{}\|;:'",<.>/?
//
// some S below does not include all symbols
const a = 'A-Za-z';
const n = '0-9';

const anyCjk = new RegExp(`[${cjk}]`);

// the symbol part only includes ~ ! ; : , . ? but . only matches one character
const convertToFullwidthCjkSpaceSymbolsSpaceCjk = new RegExp(`([${cjk}])[ ]*([~\\!;\\:,\\?]+|\\.)[ ]*([${cjk}])`, 'g');
const convertToFullwidthCjkSymbolsAn = new RegExp(`([${cjk}])([~\\!;\\?]+)([A-Za-z0-9])`, 'g');
const dotsCjk = new RegExp(`([\\.]{2,}|\u2026)([${cjk}])`, 'g');
const fixCjkColonAns = new RegExp(`([${cjk}])\\:([A-Z0-9\\(\\)])`, 'g');

// the symbol part does not include '
const cjkQuote = new RegExp(`([${cjk}])([\`"\u05f4])`, 'g');
const quoteCJK = new RegExp(`([\`"\u05f4])([${cjk}])`, 'g');
const fixQuote = /([`"\u05f4]+)(\s*)(.+?)(\s*)([`"\u05f4]+)/g;

const cjkSingleQuoteButPossessive = new RegExp(`([${cjk}])('[^s])`, 'g');
const singleQuoteCjk = new RegExp(`(')([${cjk}])`, 'g');
const possessiveSingleQuote = new RegExp(`([${cjk}A-Za-z0-9])( )('s)`, 'g');

const hashAnsCjkHash = new RegExp(`([${cjk}])(#)([${cjk}]+)(#)([${cjk}])`, 'g');
const cjkHash = new RegExp(`([${cjk}])(#([^ ]))`, 'g');
const hashCjk = new RegExp(`(([^ ])#)([${cjk}])`, 'g');

// the symbol part only includes + - * / = & | < >
const cjkOperatorAns = new RegExp(`([${cjk}])([\\+\\-\\*\\/=&\\|<>])([A-Za-z0-9])`, 'g');
const ansOperatorCjk = new RegExp(`([A-Za-z0-9])([\\+\\-\\*\\/=&\\|<>])([${cjk}])`, 'g');

const fixSlashSpaceAns = new RegExp('([\\/])( )([a-z\\-_\\.\\/]+)', 'g');
const fixAnsSlashSpace = new RegExp('([\\/\\.])([A-Za-z\\-_\\.\\/]+)( )([\\/])', 'g');

// the bracket part only includes ( ) [ ] { } < > “ ”
const cjkLeftBracket = new RegExp(`([${cjk}])([\\(\\[\\{<>\u201c])`, 'g');
const rightBracketCjk = new RegExp(`([\\)\\]\\}<>\u201d])([${cjk}])`, 'g');
const leftBracketAnyRightBracket = /([\(\[\{<\u201c]+)(\s*)(.+?)(\s*)([\)\]\}>\u201d]+)/;

const aLeftBracket = /([A-Za-z0-9])([\(\[\{])/g;
const rightBracketA = /([\)\]\}])([A-Za-z0-9])/g;

const cjkAns = new RegExp(`([${cjk}])([A-Za-z0-9\\$%\\^&\\*\\-=\\+\\\\\|/@\u00a1-\u00ff\u2150-\u218f\u2700—\u27bf])`, 'g');
const ansCjk = new RegExp(`([A-Za-z0-9~\\$%\\^&\\*\\-=\\+\\\\\|/!;:,\\.\\?\u00a1-\u00ff\u2150-\u218f\u2700—\u27bf])([${cjk}])`, 'g');

const middleDot = /([ ]*)([\u00b7\u2022\u2027])([ ]*)/g;

class Pangu {
  convertToFullwidth(symbols) {
    return symbols
      .replace(/~/g, '～')
      .replace(/!/g, '！')
      .replace(/;/g, '；')
      .replace(/:/g, '：')
      .replace(/,/g, '，')
      .replace(/\./g, '。')
      .replace(/\?/g, '？');
  }

  spacing(text) {
    if (typeof text !== 'string') {
      console.warn(`spacing(text) only accepts string but got ${typeof text}`);
      return text;
    }

    if (text.length <= 1 || !anyCjk.test(text)) {
      return text;
    }

    const self = this;

    // DEBUG
    // String.prototype.rawReplace = String.prototype.replace;
    // String.prototype.replace = function(regexp, newSubstr) {
    //   const oldText = this;
    //   const newText = this.rawReplace(regexp, newSubstr);
    //   if (oldText !== newText) {
    //     console.log(`regexp: ${regexp}`);
    //     console.log(`oldText: ${oldText}`);
    //     console.log(`newText: ${newText}`);
    //   }
    //   return newText;
    // };

    let newText = text;

    // https://stackoverflow.com/questions/4285472/multiple-regex-replace
    newText = newText.replace(convertToFullwidthCjkSpaceSymbolsSpaceCjk, (match, leftCjk, symbols, rightCjk) => {
      const fullwidthSymbols = self.convertToFullwidth(symbols);
      return `${leftCjk}${fullwidthSymbols}${rightCjk}`;
    });
    newText = newText.replace(convertToFullwidthCjkSymbolsAn, (match, cjk, symbols, an) => {
      const fullwidthSymbols = self.convertToFullwidth(symbols);
      return `${cjk}${fullwidthSymbols}${an}`;
    });

    newText = newText.replace(dotsCjk, '$1 $2');
    newText = newText.replace(fixCjkColonAns, '$1：$2');

    newText = newText.replace(cjkQuote, '$1 $2');
    newText = newText.replace(quoteCJK, '$1 $2');
    newText = newText.replace(fixQuote, '$1$3$5');

    newText = newText.replace(cjkSingleQuoteButPossessive, '$1 $2');
    newText = newText.replace(singleQuoteCjk, '$1 $2');
    newText = newText.replace(possessiveSingleQuote, "$1's");

    newText = newText.replace(hashAnsCjkHash, '$1 $2$3$4 $5');
    newText = newText.replace(cjkHash, '$1 $2');
    newText = newText.replace(hashCjk, '$1 $3');

    newText = newText.replace(cjkOperatorAns, '$1 $2 $3');
    newText = newText.replace(ansOperatorCjk, '$1 $2 $3');

    newText = newText.replace(fixSlashSpaceAns, '$1$3');
    newText = newText.replace(fixAnsSlashSpace, '$1$2$4');

    newText = newText.replace(cjkLeftBracket, '$1 $2');
    newText = newText.replace(rightBracketCjk, '$1 $2');
    newText = newText.replace(leftBracketAnyRightBracket, '$1$3$5');

    newText = newText.replace(aLeftBracket, '$1 $2');
    newText = newText.replace(rightBracketA, '$1 $2');

    newText = newText.replace(cjkAns, '$1 $2');
    newText = newText.replace(ansCjk, '$1 $2');

    newText = newText.replace(middleDot, '・');

    // DEBUG
    // String.prototype.replace = String.prototype.rawReplace;

    return newText;
  }

  spacingText(text, callback = () => {}) {
    let newText;
    try {
      newText = this.spacing(text);
    } catch (err) {
      callback(err);
      return;
    }
    callback(null, newText);
  }

  spacingTextSync(text) {
    return this.spacing(text);
  }
}

const pangu = new Pangu();

module.exports = pangu;
module.exports.default = pangu;
module.exports.Pangu = Pangu;
