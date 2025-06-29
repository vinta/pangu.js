var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const CJK = "\u2E80-\u2EFF\u2F00-\u2FDF\u3040-\u309F\u30A0-\u30FA\u30FC-\u30FF\u3100-\u312F\u3200-\u32FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF";
const UNIX_ABSOLUTE_FILE_PATH = /\/(?:\.?(?:home|root|usr|etc|var|opt|tmp|dev|mnt|proc|sys|bin|boot|lib|media|run|sbin|srv|node_modules|path|project|src|dist|test|tests|docs|templates|assets|public|static|config|scripts|tools|build|out|target|your)|\.(?:[A-Za-z0-9_\-]+))(?:\/[A-Za-z0-9_\-\.@\+\*]+)*/;
const UNIX_RELATIVE_FILE_PATH = /(?:\.\/)?(?:src|dist|test|tests|docs|templates|assets|public|static|config|scripts|tools|build|out|target|node_modules|\.claude|\.git|\.vscode)(?:\/[A-Za-z0-9_\-\.@\+\*]+)+/;
const WINDOWS_FILE_PATH = /[A-Z]:\\(?:[A-Za-z0-9_\-\. ]+\\?)+/;
const ANY_CJK = new RegExp(`[${CJK}]`);
const CONVERT_TO_FULLWIDTH_CJK_SYMBOLS_CJK = new RegExp(`([${CJK}])[ ]*([\\:]+|\\.)[ ]*([${CJK}])`, "g");
const CONVERT_TO_FULLWIDTH_CJK_SYMBOLS = new RegExp(`([${CJK}])[ ]*([~\\!;,\\?]+)[ ]*`, "g");
const DOTS_CJK = new RegExp(`([\\.]{2,}|\u2026)([${CJK}])`, "g");
const FIX_CJK_COLON_ANS = new RegExp(`([${CJK}])\\:([A-Z0-9\\(\\)])`, "g");
const CJK_QUOTE = new RegExp(`([${CJK}])([\`"\u05F4])`, "g");
const QUOTE_CJK = new RegExp(`([\`"\u05F4])([${CJK}])`, "g");
const FIX_QUOTE_ANY_QUOTE = /([`"\u05f4]+)[ ]*(.+?)[ ]*([`"\u05f4]+)/g;
const QUOTE_AN = /([\u201d])([A-Za-z0-9])/g;
const CJK_QUOTE_AN = new RegExp(`([${CJK}])(")([A-Za-z0-9])`, "g");
const CJK_SINGLE_QUOTE_BUT_POSSESSIVE = new RegExp(`([${CJK}])('[^s])`, "g");
const SINGLE_QUOTE_CJK = new RegExp(`(')([${CJK}])`, "g");
const FIX_POSSESSIVE_SINGLE_QUOTE = new RegExp(`([A-Za-z0-9${CJK}])( )('s)`, "g");
const HASH_ANS_CJK_HASH = new RegExp(`([${CJK}])(#)([${CJK}]+)(#)([${CJK}])`, "g");
const CJK_HASH = new RegExp(`([${CJK}])(#([^ ]))`, "g");
const HASH_CJK = new RegExp(`(([^ ])#)([${CJK}])`, "g");
const CJK_OPERATOR_ANS = new RegExp(`([${CJK}])([\\+\\-\\*=&])([A-Za-z0-9])`, "g");
const ANS_OPERATOR_CJK = new RegExp(`([A-Za-z0-9])([\\+\\-\\*=&])([${CJK}])`, "g");
const ANS_OPERATOR_ANS = new RegExp(`([A-Za-z0-9])([\\+\\*=&])([A-Za-z0-9])`, "g");
const ANS_HYPHEN_ANS_NOT_COMPOUND = new RegExp(`([A-Za-z])(-(?![a-z]))([A-Za-z0-9])|([A-Za-z]+[0-9]+)(-(?![a-z]))([0-9])|([0-9])(-(?![a-z0-9]))([A-Za-z])`, "g");
const CJK_SLASH_CJK = new RegExp(`([${CJK}])([/])([${CJK}])`, "g");
const CJK_SLASH_ANS = new RegExp(`([${CJK}])([/])([A-Za-z0-9])`, "g");
const ANS_SLASH_CJK = new RegExp(`([A-Za-z0-9])([/])([${CJK}])`, "g");
const ANS_SLASH_ANS = new RegExp(`([A-Za-z0-9])([/])([A-Za-z0-9])`, "g");
const SINGLE_LETTER_GRADE_CJK = new RegExp(`\\b([A-Za-z])([\\+\\-\\*])([${CJK}])`, "g");
const CJK_LESS_THAN = new RegExp(`([${CJK}])(<)([A-Za-z0-9])`, "g");
const LESS_THAN_CJK = new RegExp(`([A-Za-z0-9])(<)([${CJK}])`, "g");
const CJK_GREATER_THAN = new RegExp(`([${CJK}])(>)([A-Za-z0-9])`, "g");
const GREATER_THAN_CJK = new RegExp(`([A-Za-z0-9])(>)([${CJK}])`, "g");
const ANS_LESS_THAN_ANS = new RegExp(`([A-Za-z0-9])(<)([A-Za-z0-9])`, "g");
const ANS_GREATER_THAN_ANS = new RegExp(`([A-Za-z0-9])(>)([A-Za-z0-9])`, "g");
const CJK_LEFT_BRACKET = new RegExp(`([${CJK}])([\\(\\[\\{<>\u201C])`, "g");
const RIGHT_BRACKET_CJK = new RegExp(`([\\)\\]\\}<>\u201D])([${CJK}])`, "g");
const ANS_CJK_LEFT_BRACKET_ANY_RIGHT_BRACKET = new RegExp(`([A-Za-z0-9${CJK}])[ ]*([\u201C])([A-Za-z0-9${CJK}\\-_ ]+)([\u201D])`, "g");
const LEFT_BRACKET_ANY_RIGHT_BRACKET_ANS_CJK = new RegExp(`([\u201C])([A-Za-z0-9${CJK}\\-_ ]+)([\u201D])[ ]*([A-Za-z0-9${CJK}])`, "g");
const AN_LEFT_BRACKET = new RegExp("([A-Za-z0-9])(?<!\\.[A-Za-z0-9]*)([\\(\\[\\{])", "g");
const RIGHT_BRACKET_AN = /([\)\]\}])([A-Za-z0-9])/g;
const CJK_UNIX_ABSOLUTE_FILE_PATH = new RegExp(`([${CJK}])(${UNIX_ABSOLUTE_FILE_PATH.source})`, "g");
const CJK_UNIX_RELATIVE_FILE_PATH = new RegExp(`([${CJK}])(${UNIX_RELATIVE_FILE_PATH.source})`, "g");
const CJK_WINDOWS_PATH = new RegExp(`([${CJK}])(${WINDOWS_FILE_PATH.source})`, "g");
const UNIX_ABSOLUTE_FILE_PATH_SLASH_CJK = new RegExp(`(${UNIX_ABSOLUTE_FILE_PATH.source}/)([${CJK}])`, "g");
const UNIX_RELATIVE_FILE_PATH_SLASH_CJK = new RegExp(`(${UNIX_RELATIVE_FILE_PATH.source}/)([${CJK}])`, "g");
const CJK_ANS = new RegExp(`([${CJK}])([A-Za-z\u0370-\u03FF0-9@\\$%\\^&\\*\\-\\+\\\\=\xA1-\xFF\u2150-\u218F\u2700\u2014\u27BF])`, "g");
const ANS_CJK = new RegExp(`([A-Za-z\u0370-\u03FF0-9~\\$%\\^&\\*\\-\\+\\\\=!;:,\\.\\?\xA1-\xFF\u2150-\u218F\u2700\u2014\u27BF])([${CJK}])`, "g");
const S_A = /(%)([A-Za-z])/g;
const MIDDLE_DOT = /([ ]*)([\u00b7\u2022\u2027])([ ]*)/g;
class Pangu {
  constructor() {
    __publicField(this, "version");
    this.version = "6.1.0";
  }
  spacingText(text) {
    if (typeof text !== "string") {
      console.warn(`spacingText(text) only accepts string but got ${typeof text}`);
      return text;
    }
    if (text.length <= 1 || !ANY_CJK.test(text)) {
      return text;
    }
    const self = this;
    let newText = text;
    const htmlTags = [];
    const HTML_TAG_PLACEHOLDER = "\0HTML_TAG_PLACEHOLDER_";
    let hasHtmlTags = false;
    if (newText.includes("<")) {
      hasHtmlTags = true;
      const HTML_TAG_PATTERN = /<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s+[^>]*)?>/g;
      newText = newText.replace(HTML_TAG_PATTERN, (match) => {
        const processedTag = match.replace(/(\w+)="([^"]*)"/g, (_attrMatch, attrName, attrValue) => {
          const processedValue = self.spacingText(attrValue);
          return `${attrName}="${processedValue}"`;
        });
        const index = htmlTags.length;
        htmlTags.push(processedTag);
        return `${HTML_TAG_PLACEHOLDER}${index}\0`;
      });
    }
    newText = newText.replace(CONVERT_TO_FULLWIDTH_CJK_SYMBOLS_CJK, (_match, leftCjk, symbols, rightCjk) => {
      const fullwidthSymbols = self.convertToFullwidth(symbols);
      return `${leftCjk}${fullwidthSymbols}${rightCjk}`;
    });
    newText = newText.replace(CONVERT_TO_FULLWIDTH_CJK_SYMBOLS, (_match, cjk, symbols) => {
      const fullwidthSymbols = self.convertToFullwidth(symbols);
      return `${cjk}${fullwidthSymbols}`;
    });
    newText = newText.replace(DOTS_CJK, "$1 $2");
    newText = newText.replace(FIX_CJK_COLON_ANS, "$1\uFF1A$2");
    newText = newText.replace(CJK_QUOTE, "$1 $2");
    newText = newText.replace(QUOTE_CJK, "$1 $2");
    newText = newText.replace(FIX_QUOTE_ANY_QUOTE, "$1$2$3");
    newText = newText.replace(QUOTE_AN, "$1 $2");
    newText = newText.replace(CJK_QUOTE_AN, "$1$2 $3");
    newText = newText.replace(CJK_SINGLE_QUOTE_BUT_POSSESSIVE, "$1 $2");
    newText = newText.replace(SINGLE_QUOTE_CJK, "$1 $2");
    newText = newText.replace(FIX_POSSESSIVE_SINGLE_QUOTE, "$1's");
    const textLength = newText.length;
    const slashCount = (newText.match(/\//g) || []).length;
    if (slashCount === 0) {
      if (textLength >= 5) {
        newText = newText.replace(HASH_ANS_CJK_HASH, "$1 $2$3$4 $5");
      }
      newText = newText.replace(CJK_HASH, "$1 $2");
      newText = newText.replace(HASH_CJK, "$1 $3");
    } else if (slashCount <= 1) {
      if (textLength >= 5) {
        newText = newText.replace(HASH_ANS_CJK_HASH, "$1 $2$3$4 $5");
      }
      newText = newText.replace(CJK_HASH, "$1 $2");
      newText = newText.replace(HASH_CJK, "$1 $3");
    } else {
      if (textLength >= 5) {
        newText = newText.replace(HASH_ANS_CJK_HASH, "$1 $2$3$4 $5");
      }
      newText = newText.replace(new RegExp(`([^/])([${CJK}])(#[A-Za-z0-9]+)$`), "$1$2 $3");
    }
    const COMPOUND_WORD_PLACEHOLDER = "\uE002";
    const compoundWords = [];
    let compoundIndex = 0;
    const COMPOUND_WORD_PATTERN = /\b(?:[A-Za-z0-9]*[a-z][A-Za-z0-9]*-[A-Za-z0-9]+|[A-Za-z0-9]+-[A-Za-z0-9]*[a-z][A-Za-z0-9]*|[A-Za-z]+-[0-9]+|[A-Za-z]+[0-9]+-[A-Za-z0-9]+)(?:-[A-Za-z0-9]+)*\b/g;
    newText = newText.replace(COMPOUND_WORD_PATTERN, (match) => {
      compoundWords[compoundIndex] = match;
      return `${COMPOUND_WORD_PLACEHOLDER}${compoundIndex++}\uE003`;
    });
    newText = newText.replace(SINGLE_LETTER_GRADE_CJK, "$1$2 $3");
    newText = newText.replace(CJK_OPERATOR_ANS, "$1 $2 $3");
    newText = newText.replace(ANS_OPERATOR_CJK, "$1 $2 $3");
    newText = newText.replace(ANS_OPERATOR_ANS, "$1 $2 $3");
    newText = newText.replace(ANS_HYPHEN_ANS_NOT_COMPOUND, (match, ...groups) => {
      if (groups[0] && groups[1] && groups[2]) {
        return `${groups[0]} ${groups[1]} ${groups[2]}`;
      } else if (groups[3] && groups[4] && groups[5]) {
        return `${groups[3]} ${groups[4]} ${groups[5]}`;
      } else if (groups[6] && groups[7] && groups[8]) {
        return `${groups[6]} ${groups[7]} ${groups[8]}`;
      }
      return match;
    });
    newText = newText.replace(CJK_LESS_THAN, "$1 $2 $3");
    newText = newText.replace(LESS_THAN_CJK, "$1 $2 $3");
    newText = newText.replace(ANS_LESS_THAN_ANS, "$1 $2 $3");
    newText = newText.replace(CJK_GREATER_THAN, "$1 $2 $3");
    newText = newText.replace(GREATER_THAN_CJK, "$1 $2 $3");
    newText = newText.replace(ANS_GREATER_THAN_ANS, "$1 $2 $3");
    newText = newText.replace(CJK_UNIX_ABSOLUTE_FILE_PATH, "$1 $2");
    newText = newText.replace(CJK_UNIX_RELATIVE_FILE_PATH, "$1 $2");
    newText = newText.replace(CJK_WINDOWS_PATH, "$1 $2");
    newText = newText.replace(UNIX_ABSOLUTE_FILE_PATH_SLASH_CJK, "$1 $2");
    newText = newText.replace(UNIX_RELATIVE_FILE_PATH_SLASH_CJK, "$1 $2");
    if (slashCount === 1) {
      const FILE_PATH_PLACEHOLDER = "\uE000";
      const filePaths = [];
      let pathIndex = 0;
      const allFilePathPattern = new RegExp(`(${UNIX_ABSOLUTE_FILE_PATH.source}|${UNIX_RELATIVE_FILE_PATH.source})`, "g");
      newText = newText.replace(allFilePathPattern, (match) => {
        filePaths[pathIndex] = match;
        return `${FILE_PATH_PLACEHOLDER}${pathIndex++}\uE001`;
      });
      newText = newText.replace(CJK_SLASH_CJK, "$1 $2 $3");
      newText = newText.replace(CJK_SLASH_ANS, "$1 $2 $3");
      newText = newText.replace(ANS_SLASH_CJK, "$1 $2 $3");
      newText = newText.replace(ANS_SLASH_ANS, "$1 $2 $3");
      const FILE_PATH_RESTORE = new RegExp(`${FILE_PATH_PLACEHOLDER}(\\d+)\uE001`, "g");
      newText = newText.replace(FILE_PATH_RESTORE, (_match, index) => {
        return filePaths[parseInt(index, 10)] || "";
      });
    }
    const COMPOUND_WORD_RESTORE = new RegExp(`${COMPOUND_WORD_PLACEHOLDER}(\\d+)\uE003`, "g");
    newText = newText.replace(COMPOUND_WORD_RESTORE, (_match, index) => {
      return compoundWords[parseInt(index, 10)] || "";
    });
    newText = newText.replace(CJK_LEFT_BRACKET, "$1 $2");
    newText = newText.replace(RIGHT_BRACKET_CJK, "$1 $2");
    newText = newText.replace(ANS_CJK_LEFT_BRACKET_ANY_RIGHT_BRACKET, "$1 $2$3$4");
    newText = newText.replace(LEFT_BRACKET_ANY_RIGHT_BRACKET_ANS_CJK, "$1$2$3 $4");
    newText = newText.replace(AN_LEFT_BRACKET, "$1 $2");
    newText = newText.replace(RIGHT_BRACKET_AN, "$1 $2");
    newText = newText.replace(CJK_ANS, "$1 $2");
    newText = newText.replace(ANS_CJK, "$1 $2");
    newText = newText.replace(S_A, "$1 $2");
    newText = newText.replace(MIDDLE_DOT, "\u30FB");
    const fixBracketSpacing = (text2) => {
      const processBracket = (pattern, openBracket, closeBracket) => {
        text2 = text2.replace(pattern, (_match, innerContent) => {
          if (!innerContent) {
            return `${openBracket}${closeBracket}`;
          }
          const trimmedContent = innerContent.replace(/^ +| +$/g, "");
          return `${openBracket}${trimmedContent}${closeBracket}`;
        });
      };
      processBracket(/<([^<>]*)>/g, "<", ">");
      processBracket(/\(([^()]*)\)/g, "(", ")");
      processBracket(/\[([^\[\]]*)\]/g, "[", "]");
      processBracket(/\{([^{}]*)\}/g, "{", "}");
      return text2;
    };
    newText = fixBracketSpacing(newText);
    if (hasHtmlTags) {
      const HTML_TAG_RESTORE = new RegExp(`${HTML_TAG_PLACEHOLDER}(\\d+)\0`, "g");
      newText = newText.replace(HTML_TAG_RESTORE, (_match, index) => {
        return htmlTags[parseInt(index, 10)] || "";
      });
    }
    return newText;
  }
  // alias for spacingText()
  spacing(text) {
    return this.spacingText(text);
  }
  hasProperSpacing(text) {
    return this.spacingText(text) === text;
  }
  convertToFullwidth(symbols) {
    return symbols.replace(/~/g, "\uFF5E").replace(/!/g, "\uFF01").replace(/;/g, "\uFF1B").replace(/:/g, "\uFF1A").replace(/,/g, "\uFF0C").replace(/\./g, "\u3002").replace(/\?/g, "\uFF1F");
  }
}
const pangu = new Pangu();
export {
  ANY_CJK,
  Pangu,
  pangu as default,
  pangu
};
//# sourceMappingURL=index.js.map
