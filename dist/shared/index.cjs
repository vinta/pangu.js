"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var shared_exports = {};
__export(shared_exports, {
  ANY_CJK: () => import_patterns.ANY_CJK,
  Pangu: () => Pangu,
  default: () => shared_default,
  pangu: () => pangu
});
module.exports = __toCommonJS(shared_exports);
var import_placeholder_replacer = require("./placeholder-replacer");
var import_patterns = require("./patterns");
class Pangu {
  version;
  constructor() {
    this.version = "7.2.1";
  }
  spacingText(text) {
    if (typeof text !== "string") {
      console.warn(`spacingText(text) only accepts string but got ${typeof text}`);
      return text;
    }
    if (text.length <= 1 || !import_patterns.ANY_CJK.test(text)) {
      return text;
    }
    let newText = text;
    const backtickManager = new import_placeholder_replacer.PlaceholderReplacer("BACKTICK_CONTENT_", "\uE004", "\uE005");
    newText = newText.replace(import_patterns.BACKTICK_PATTERN, (_match, content) => {
      return `\`${backtickManager.store(content)}\``;
    });
    const htmlTagManager = new import_placeholder_replacer.PlaceholderReplacer("HTML_TAG_PLACEHOLDER_", "\uE000", "\uE001");
    let hasHtmlTags = false;
    if (newText.includes("<")) {
      hasHtmlTags = true;
      newText = newText.replace(import_patterns.HTML_TAG_PATTERN, (match) => {
        const processedTag = match.replace(import_patterns.HTML_ATTR_PATTERN, (_attrMatch, attrName, attrValue) => {
          const processedValue = this.spacingText(attrValue);
          return `${attrName}="${processedValue}"`;
        });
        return htmlTagManager.store(processedTag);
      });
    }
    newText = this.applyPunctuationSpacing(newText);
    const singleQuoteCJKManager = new import_placeholder_replacer.PlaceholderReplacer("SINGLE_QUOTE_CJK_PLACEHOLDER_", "\uE030", "\uE031");
    newText = this.applyQuoteSpacing(newText, singleQuoteCJKManager);
    const slashCount = (newText.match(/\//g) || []).length;
    newText = this.applyHashSpacing(newText, slashCount);
    const compoundWordManager = new import_placeholder_replacer.PlaceholderReplacer("COMPOUND_WORD_PLACEHOLDER_", "\uE010", "\uE011");
    newText = newText.replace(import_patterns.COMPOUND_WORD_PATTERN, (match) => {
      return compoundWordManager.store(match);
    });
    newText = this.applyOperatorSpacing(newText);
    newText = this.applyComparisonOperatorSpacing(newText);
    newText = this.applyFilePathSpacing(newText);
    newText = this.applySlashSpacing(newText, slashCount);
    newText = compoundWordManager.restore(newText);
    newText = this.applyBracketSpacing(newText);
    newText = newText.replace(import_patterns.CJK_ANS, "$1 $2");
    newText = newText.replace(import_patterns.ANS_CJK, "$1 $2");
    newText = newText.replace(import_patterns.S_A, "$1 $2");
    newText = newText.replace(import_patterns.MIDDLE_DOT, "\u30FB");
    newText = this.fixBracketInnerSpacing(newText);
    if (hasHtmlTags) {
      newText = htmlTagManager.restore(newText);
    }
    newText = backtickManager.restore(newText);
    return newText;
  }
  hasProperSpacing(text) {
    return this.spacingText(text) === text;
  }
  // ─── Private spacing step methods ─────────────────────────────────────────────
  applyPunctuationSpacing(text) {
    let result = text;
    result = result.replace(import_patterns.DOTS_CJK, "$1 $2");
    result = result.replace(import_patterns.CJK_PUNCTUATION, "$1$2 ");
    result = result.replace(import_patterns.AN_PUNCTUATION_CJK, "$1$2 $3");
    result = result.replace(import_patterns.CJK_TILDE, "$1$2 ");
    result = result.replace(import_patterns.CJK_TILDE_EQUALS, "$1 $2 ");
    result = result.replace(import_patterns.CJK_PERIOD, "$1$2 ");
    result = result.replace(import_patterns.AN_PERIOD_CJK, "$1$2 $3");
    result = result.replace(import_patterns.AN_COLON_CJK, "$1$2 $3");
    result = result.replace(import_patterns.FIX_CJK_COLON_ANS, "$1\uFF1A$2");
    return result;
  }
  applyQuoteSpacing(text, singleQuoteCJKManager) {
    let result = text;
    result = result.replace(import_patterns.CJK_QUOTE, "$1 $2");
    result = result.replace(import_patterns.QUOTE_CJK, "$1 $2");
    result = result.replace(import_patterns.FIX_QUOTE_ANY_QUOTE, "$1$2$3");
    result = result.replace(import_patterns.QUOTE_AN, "$1 $2");
    result = result.replace(import_patterns.CJK_QUOTE_AN, "$1$2 $3");
    result = result.replace(import_patterns.FIX_POSSESSIVE_SINGLE_QUOTE, "$1's");
    result = result.replace(import_patterns.SINGLE_QUOTE_PURE_CJK, (match) => {
      return singleQuoteCJKManager.store(match);
    });
    result = result.replace(import_patterns.CJK_SINGLE_QUOTE_BUT_POSSESSIVE, "$1 $2");
    result = result.replace(import_patterns.SINGLE_QUOTE_CJK, "$1 $2");
    result = singleQuoteCJKManager.restore(result);
    return result;
  }
  applyHashSpacing(text, slashCount) {
    let result = text;
    const textLength = result.length;
    if (slashCount <= 1) {
      if (textLength >= 5) {
        result = result.replace(import_patterns.HASH_ANS_CJK_HASH, "$1 $2$3$4 $5");
      }
      result = result.replace(import_patterns.CJK_HASH, "$1 $2");
      result = result.replace(import_patterns.HASH_CJK, "$1 $3");
    } else {
      if (textLength >= 5) {
        result = result.replace(import_patterns.HASH_ANS_CJK_HASH, "$1 $2$3$4 $5");
      }
      result = result.replace(new RegExp(`([^/])([${import_patterns.CJK}])(#[A-Za-z0-9]+)$`), "$1$2 $3");
    }
    return result;
  }
  applyOperatorSpacing(text) {
    let result = text;
    result = result.replace(import_patterns.SINGLE_LETTER_GRADE_CJK, "$1$2 $3");
    result = result.replace(import_patterns.CJK_OPERATOR_ANS, "$1 $2 $3");
    result = result.replace(import_patterns.ANS_OPERATOR_CJK, "$1 $2 $3");
    result = result.replace(import_patterns.ANS_OPERATOR_ANS, "$1 $2 $3");
    result = result.replace(import_patterns.ANS_HYPHEN_ANS_NOT_COMPOUND, (match, ...groups) => {
      if (groups[0] && groups[1] && groups[2]) {
        return `${groups[0]} ${groups[1]} ${groups[2]}`;
      } else if (groups[3] && groups[4] && groups[5]) {
        return `${groups[3]} ${groups[4]} ${groups[5]}`;
      } else if (groups[6] && groups[7] && groups[8]) {
        return `${groups[6]} ${groups[7]} ${groups[8]}`;
      }
      return match;
    });
    return result;
  }
  applyComparisonOperatorSpacing(text) {
    let result = text;
    result = result.replace(import_patterns.CJK_LESS_THAN, "$1 $2 $3");
    result = result.replace(import_patterns.LESS_THAN_CJK, "$1 $2 $3");
    result = result.replace(import_patterns.ANS_LESS_THAN_ANS, "$1 $2 $3");
    result = result.replace(import_patterns.CJK_GREATER_THAN, "$1 $2 $3");
    result = result.replace(import_patterns.GREATER_THAN_CJK, "$1 $2 $3");
    result = result.replace(import_patterns.ANS_GREATER_THAN_ANS, "$1 $2 $3");
    return result;
  }
  applyFilePathSpacing(text) {
    let result = text;
    result = result.replace(import_patterns.CJK_UNIX_ABSOLUTE_FILE_PATH, "$1 $2");
    result = result.replace(import_patterns.CJK_UNIX_RELATIVE_FILE_PATH, "$1 $2");
    result = result.replace(import_patterns.CJK_WINDOWS_PATH, "$1 $2");
    result = result.replace(import_patterns.UNIX_ABSOLUTE_FILE_PATH_SLASH_CJK, "$1 $2");
    result = result.replace(import_patterns.UNIX_RELATIVE_FILE_PATH_SLASH_CJK, "$1 $2");
    return result;
  }
  applySlashSpacing(text, slashCount) {
    let result = text;
    if (slashCount === 1) {
      const filePathManager = new import_placeholder_replacer.PlaceholderReplacer("FILE_PATH_PLACEHOLDER_", "\uE020", "\uE021");
      const allFilePathPattern = new RegExp(`(${import_patterns.UNIX_ABSOLUTE_FILE_PATH.source}|${import_patterns.UNIX_RELATIVE_FILE_PATH.source})`, "g");
      result = result.replace(allFilePathPattern, (match) => {
        return filePathManager.store(match);
      });
      result = result.replace(import_patterns.CJK_SLASH_CJK, "$1 $2 $3");
      result = result.replace(import_patterns.CJK_SLASH_ANS, "$1 $2 $3");
      result = result.replace(import_patterns.ANS_SLASH_CJK, "$1 $2 $3");
      result = result.replace(import_patterns.ANS_SLASH_ANS, "$1 $2 $3");
      result = filePathManager.restore(result);
    }
    return result;
  }
  applyBracketSpacing(text) {
    let result = text;
    result = result.replace(import_patterns.CJK_LEFT_BRACKET, "$1 $2");
    result = result.replace(import_patterns.RIGHT_BRACKET_CJK, "$1 $2");
    result = result.replace(import_patterns.ANS_CJK_LEFT_BRACKET_ANY_RIGHT_BRACKET, "$1 $2$3$4");
    result = result.replace(import_patterns.LEFT_BRACKET_ANY_RIGHT_BRACKET_ANS_CJK, "$1$2$3 $4");
    result = result.replace(import_patterns.AN_LEFT_BRACKET, "$1 $2");
    result = result.replace(import_patterns.RIGHT_BRACKET_AN, "$1 $2");
    return result;
  }
  fixBracketInnerSpacing(text) {
    let result = text;
    const bracketPatterns = [
      { pattern: /<([^<>]*)>/g, open: "<", close: ">" },
      { pattern: /\(([^()]*)\)/g, open: "(", close: ")" },
      { pattern: /\[([^\[\]]*)\]/g, open: "[", close: "]" },
      { pattern: /\{([^{}]*)\}/g, open: "{", close: "}" }
    ];
    for (const { pattern, open, close } of bracketPatterns) {
      result = result.replace(pattern, (_match, innerContent) => {
        if (!innerContent) {
          return `${open}${close}`;
        }
        const trimmedContent = innerContent.replace(/^ +| +$/g, "");
        return `${open}${trimmedContent}${close}`;
      });
    }
    return result;
  }
}
const pangu = new Pangu();
var shared_default = pangu;
//# sourceMappingURL=index.cjs.map
