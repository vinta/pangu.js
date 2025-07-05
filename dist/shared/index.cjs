"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __defProp2 = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp2(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp2({}, "__esModule", { value: true }), mod);
var shared_exports = {};
__export(shared_exports, {
  ANY_CJK: () => ANY_CJK,
  Pangu: () => Pangu,
  default: () => shared_default,
  pangu: () => pangu
});
module.exports = __toCommonJS(shared_exports);
const CJK = "\u2E80-\u2EFF\u2F00-\u2FDF\u3040-\u309F\u30A0-\u30FA\u30FC-\u30FF\u3100-\u312F\u3200-\u32FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF";
const AN = "A-Za-z0-9";
const A = "A-Za-z";
const UPPER_AN = "A-Z0-9";
const OPERATORS_BASE = "\\+\\*=&";
const OPERATORS_WITH_HYPHEN = `${OPERATORS_BASE}\\-`;
const OPERATORS_NO_HYPHEN = OPERATORS_BASE;
const GRADE_OPERATORS = "\\+\\-\\*";
const QUOTES = '`"\u05F4';
const LEFT_BRACKETS_BASIC = "\\(\\[\\{";
const RIGHT_BRACKETS_BASIC = "\\)\\]\\}";
const LEFT_BRACKETS_EXTENDED = "\\(\\[\\{<>\u201C";
const RIGHT_BRACKETS_EXTENDED = "\\)\\]\\}<>\u201D";
const ANS_CJK_AFTER = `${A}\u0370-\u03FF0-9@\\$%\\^&\\*\\-\\+\\\\=\xA1-\xFF\u2150-\u218F\u2700\u2014\u27BF`;
const ANS_BEFORE_CJK = `${A}\u0370-\u03FF0-9\\$%\\^&\\*\\-\\+\\\\=\xA1-\xFF\u2150-\u218F\u2700\u2014\u27BF`;
const FILE_PATH_DIRS = "home|root|usr|etc|var|opt|tmp|dev|mnt|proc|sys|bin|boot|lib|media|run|sbin|srv|node_modules|path|project|src|dist|test|tests|docs|templates|assets|public|static|config|scripts|tools|build|out|target|your|\\.claude|\\.git|\\.vscode";
const FILE_PATH_CHARS = "[A-Za-z0-9_\\-\\.@\\+\\*]+";
const UNIX_ABSOLUTE_FILE_PATH = new RegExp(`/(?:\\.?(?:${FILE_PATH_DIRS})|\\.(?:[A-Za-z0-9_\\-]+))(?:/${FILE_PATH_CHARS})*`);
const UNIX_RELATIVE_FILE_PATH = new RegExp(`(?:\\./)?(?:${FILE_PATH_DIRS})(?:/${FILE_PATH_CHARS})+`);
const WINDOWS_FILE_PATH = /[A-Z]:\\(?:[A-Za-z0-9_\-\. ]+\\?)+/;
const ANY_CJK = new RegExp(`[${CJK}]`);
const CJK_PUNCTUATION = new RegExp(`([${CJK}])([!;,\\?:]+)(?=[${CJK}${AN}])`, "g");
const AN_PUNCTUATION_CJK = new RegExp(`([${AN}])([!;,\\?]+)([${CJK}])`, "g");
const CJK_TILDE = new RegExp(`([${CJK}])(~+)(?!=)(?=[${CJK}${AN}])`, "g");
const CJK_TILDE_EQUALS = new RegExp(`([${CJK}])(~=)`, "g");
const CJK_PERIOD = new RegExp(`([${CJK}])(\\.)(?![${AN}\\./])(?=[${CJK}${AN}])`, "g");
const AN_PERIOD_CJK = new RegExp(`([${AN}])(\\.)([${CJK}])`, "g");
const AN_COLON_CJK = new RegExp(`([${AN}])(:)([${CJK}])`, "g");
const DOTS_CJK = new RegExp(`([\\.]{2,}|\u2026)([${CJK}])`, "g");
const FIX_CJK_COLON_ANS = new RegExp(`([${CJK}])\\:([${UPPER_AN}\\(\\)])`, "g");
const CJK_QUOTE = new RegExp(`([${CJK}])([${QUOTES}])`, "g");
const QUOTE_CJK = new RegExp(`([${QUOTES}])([${CJK}])`, "g");
const FIX_QUOTE_ANY_QUOTE = new RegExp(`([${QUOTES}]+)[ ]*(.+?)[ ]*([${QUOTES}]+)`, "g");
const QUOTE_AN = new RegExp(`([\u201D])([${AN}])`, "g");
const CJK_QUOTE_AN = new RegExp(`([${CJK}])(")([${AN}])`, "g");
const CJK_SINGLE_QUOTE_BUT_POSSESSIVE = new RegExp(`([${CJK}])('[^s])`, "g");
const SINGLE_QUOTE_CJK = new RegExp(`(')([${CJK}])`, "g");
const FIX_POSSESSIVE_SINGLE_QUOTE = new RegExp(`([${AN}${CJK}])( )('s)`, "g");
const HASH_ANS_CJK_HASH = new RegExp(`([${CJK}])(#)([${CJK}]+)(#)([${CJK}])`, "g");
const CJK_HASH = new RegExp(`([${CJK}])(#([^ ]))`, "g");
const HASH_CJK = new RegExp(`(([^ ])#)([${CJK}])`, "g");
const CJK_OPERATOR_ANS = new RegExp(`([${CJK}])([${OPERATORS_WITH_HYPHEN}])([${AN}])`, "g");
const ANS_OPERATOR_CJK = new RegExp(`([${AN}])([${OPERATORS_WITH_HYPHEN}])([${CJK}])`, "g");
const ANS_OPERATOR_ANS = new RegExp(`([${AN}])([${OPERATORS_NO_HYPHEN}])([${AN}])`, "g");
const ANS_HYPHEN_ANS_NOT_COMPOUND = new RegExp(`([A-Za-z])(-(?![a-z]))([A-Za-z0-9])|([A-Za-z]+[0-9]+)(-(?![a-z]))([0-9])|([0-9])(-(?![a-z0-9]))([A-Za-z])`, "g");
const CJK_SLASH_CJK = new RegExp(`([${CJK}])([/])([${CJK}])`, "g");
const CJK_SLASH_ANS = new RegExp(`([${CJK}])([/])([${AN}])`, "g");
const ANS_SLASH_CJK = new RegExp(`([${AN}])([/])([${CJK}])`, "g");
const ANS_SLASH_ANS = new RegExp(`([${AN}])([/])([${AN}])`, "g");
const SINGLE_LETTER_GRADE_CJK = new RegExp(`\\b([${A}])([${GRADE_OPERATORS}])([${CJK}])`, "g");
const CJK_LESS_THAN = new RegExp(`([${CJK}])(<)([${AN}])`, "g");
const LESS_THAN_CJK = new RegExp(`([${AN}])(<)([${CJK}])`, "g");
const CJK_GREATER_THAN = new RegExp(`([${CJK}])(>)([${AN}])`, "g");
const GREATER_THAN_CJK = new RegExp(`([${AN}])(>)([${CJK}])`, "g");
const ANS_LESS_THAN_ANS = new RegExp(`([${AN}])(<)([${AN}])`, "g");
const ANS_GREATER_THAN_ANS = new RegExp(`([${AN}])(>)([${AN}])`, "g");
const CJK_LEFT_BRACKET = new RegExp(`([${CJK}])([${LEFT_BRACKETS_EXTENDED}])`, "g");
const RIGHT_BRACKET_CJK = new RegExp(`([${RIGHT_BRACKETS_EXTENDED}])([${CJK}])`, "g");
const ANS_CJK_LEFT_BRACKET_ANY_RIGHT_BRACKET = new RegExp(`([${AN}${CJK}])[ ]*([\u201C])([${AN}${CJK}\\-_ ]+)([\u201D])`, "g");
const LEFT_BRACKET_ANY_RIGHT_BRACKET_ANS_CJK = new RegExp(`([\u201C])([${AN}${CJK}\\-_ ]+)([\u201D])[ ]*([${AN}${CJK}])`, "g");
const AN_LEFT_BRACKET = new RegExp(`([${AN}])(?<!\\.[${AN}]*)([${LEFT_BRACKETS_BASIC}])`, "g");
const RIGHT_BRACKET_AN = new RegExp(`([${RIGHT_BRACKETS_BASIC}])([${AN}])`, "g");
const CJK_UNIX_ABSOLUTE_FILE_PATH = new RegExp(`([${CJK}])(${UNIX_ABSOLUTE_FILE_PATH.source})`, "g");
const CJK_UNIX_RELATIVE_FILE_PATH = new RegExp(`([${CJK}])(${UNIX_RELATIVE_FILE_PATH.source})`, "g");
const CJK_WINDOWS_PATH = new RegExp(`([${CJK}])(${WINDOWS_FILE_PATH.source})`, "g");
const UNIX_ABSOLUTE_FILE_PATH_SLASH_CJK = new RegExp(`(${UNIX_ABSOLUTE_FILE_PATH.source}/)([${CJK}])`, "g");
const UNIX_RELATIVE_FILE_PATH_SLASH_CJK = new RegExp(`(${UNIX_RELATIVE_FILE_PATH.source}/)([${CJK}])`, "g");
const CJK_ANS = new RegExp(`([${CJK}])([${ANS_CJK_AFTER}])`, "g");
const ANS_CJK = new RegExp(`([${ANS_BEFORE_CJK}])([${CJK}])`, "g");
const S_A = new RegExp(`(%)([${A}])`, "g");
const MIDDLE_DOT = /([ ]*)([\u00b7\u2022\u2027])([ ]*)/g;
class PlaceholderReplacer {
  constructor(placeholder, startDelimiter, endDelimiter) {
    __publicField(this, "items", []);
    __publicField(this, "index", 0);
    __publicField(this, "pattern");
    this.placeholder = placeholder;
    this.startDelimiter = startDelimiter;
    this.endDelimiter = endDelimiter;
    const escapedStart = this.startDelimiter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedEnd = this.endDelimiter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    this.pattern = new RegExp(`${escapedStart}${this.placeholder}(\\d+)${escapedEnd}`, "g");
  }
  store(item) {
    this.items[this.index] = item;
    return `${this.startDelimiter}${this.placeholder}${this.index++}${this.endDelimiter}`;
  }
  restore(text) {
    return text.replace(this.pattern, (_match, index) => {
      return this.items[parseInt(index, 10)] || "";
    });
  }
  reset() {
    this.items = [];
    this.index = 0;
  }
}
class Pangu {
  constructor() {
    __publicField(this, "version");
    this.version = "7.2.0";
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
    const backtickManager = new PlaceholderReplacer("BACKTICK_CONTENT_", "\uE004", "\uE005");
    newText = newText.replace(/`([^`]+)`/g, (_match, content) => {
      return `\`${backtickManager.store(content)}\``;
    });
    const htmlTagManager = new PlaceholderReplacer("HTML_TAG_PLACEHOLDER_", "\uE000", "\uE001");
    let hasHtmlTags = false;
    if (newText.includes("<")) {
      hasHtmlTags = true;
      const HTML_TAG_PATTERN = /<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s+[^>]*)?>/g;
      newText = newText.replace(HTML_TAG_PATTERN, (match) => {
        const processedTag = match.replace(/(\w+)="([^"]*)"/g, (_attrMatch, attrName, attrValue) => {
          const processedValue = self.spacingText(attrValue);
          return `${attrName}="${processedValue}"`;
        });
        return htmlTagManager.store(processedTag);
      });
    }
    newText = newText.replace(DOTS_CJK, "$1 $2");
    newText = newText.replace(CJK_PUNCTUATION, "$1$2 ");
    newText = newText.replace(AN_PUNCTUATION_CJK, "$1$2 $3");
    newText = newText.replace(CJK_TILDE, "$1$2 ");
    newText = newText.replace(CJK_TILDE_EQUALS, "$1 $2 ");
    newText = newText.replace(CJK_PERIOD, "$1$2 ");
    newText = newText.replace(AN_PERIOD_CJK, "$1$2 $3");
    newText = newText.replace(AN_COLON_CJK, "$1$2 $3");
    newText = newText.replace(FIX_CJK_COLON_ANS, "$1\uFF1A$2");
    newText = newText.replace(CJK_QUOTE, "$1 $2");
    newText = newText.replace(QUOTE_CJK, "$1 $2");
    newText = newText.replace(FIX_QUOTE_ANY_QUOTE, "$1$2$3");
    newText = newText.replace(QUOTE_AN, "$1 $2");
    newText = newText.replace(CJK_QUOTE_AN, "$1$2 $3");
    newText = newText.replace(FIX_POSSESSIVE_SINGLE_QUOTE, "$1's");
    const singleQuoteCJKManager = new PlaceholderReplacer("SINGLE_QUOTE_CJK_PLACEHOLDER_", "\uE030", "\uE031");
    const SINGLE_QUOTE_PURE_CJK = new RegExp(`(')([${CJK}]+)(')`, "g");
    newText = newText.replace(SINGLE_QUOTE_PURE_CJK, (match) => {
      return singleQuoteCJKManager.store(match);
    });
    newText = newText.replace(CJK_SINGLE_QUOTE_BUT_POSSESSIVE, "$1 $2");
    newText = newText.replace(SINGLE_QUOTE_CJK, "$1 $2");
    newText = singleQuoteCJKManager.restore(newText);
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
    const compoundWordManager = new PlaceholderReplacer("COMPOUND_WORD_PLACEHOLDER_", "\uE010", "\uE011");
    const COMPOUND_WORD_PATTERN = /\b(?:[A-Za-z0-9]*[a-z][A-Za-z0-9]*-[A-Za-z0-9]+|[A-Za-z0-9]+-[A-Za-z0-9]*[a-z][A-Za-z0-9]*|[A-Za-z]+-[0-9]+|[A-Za-z]+[0-9]+-[A-Za-z0-9]+)(?:-[A-Za-z0-9]+)*\b/g;
    newText = newText.replace(COMPOUND_WORD_PATTERN, (match) => {
      return compoundWordManager.store(match);
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
      const filePathManager = new PlaceholderReplacer("FILE_PATH_PLACEHOLDER_", "\uE020", "\uE021");
      const allFilePathPattern = new RegExp(`(${UNIX_ABSOLUTE_FILE_PATH.source}|${UNIX_RELATIVE_FILE_PATH.source})`, "g");
      newText = newText.replace(allFilePathPattern, (match) => {
        return filePathManager.store(match);
      });
      newText = newText.replace(CJK_SLASH_CJK, "$1 $2 $3");
      newText = newText.replace(CJK_SLASH_ANS, "$1 $2 $3");
      newText = newText.replace(ANS_SLASH_CJK, "$1 $2 $3");
      newText = newText.replace(ANS_SLASH_ANS, "$1 $2 $3");
      newText = filePathManager.restore(newText);
    }
    newText = compoundWordManager.restore(newText);
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
      const bracketPatterns = [
        { pattern: /<([^<>]*)>/g, open: "<", close: ">" },
        { pattern: /\(([^()]*)\)/g, open: "(", close: ")" },
        { pattern: /\[([^\[\]]*)\]/g, open: "[", close: "]" },
        { pattern: /\{([^{}]*)\}/g, open: "{", close: "}" }
      ];
      for (const { pattern, open, close } of bracketPatterns) {
        text2 = text2.replace(pattern, (_match, innerContent) => {
          if (!innerContent) {
            return `${open}${close}`;
          }
          const trimmedContent = innerContent.replace(/^ +| +$/g, "");
          return `${open}${trimmedContent}${close}`;
        });
      }
      return text2;
    };
    newText = fixBracketSpacing(newText);
    if (hasHtmlTags) {
      newText = htmlTagManager.restore(newText);
    }
    newText = backtickManager.restore(newText);
    return newText;
  }
  hasProperSpacing(text) {
    return this.spacingText(text) === text;
  }
}
const pangu = new Pangu();
var shared_default = pangu;
//# sourceMappingURL=index.cjs.map
