"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, key + "", value);
const CJK = "\u2E80-\u2EFF\u2F00-\u2FDF\u3040-\u309F\u30A0-\u30FA\u30FC-\u30FF\u3100-\u312F\u3200-\u32FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF";
const FILESYSTEM_PATH = /(?:[A-Z]:)?\/(?:\.?(?:home|root|usr|etc|var|opt|tmp|dev|mnt|proc|sys|bin|boot|lib|media|run|sbin|srv|node_modules|path)|\.(?:[A-Za-z0-9_\-]+))(?:\/[A-Za-z0-9_\-\.@\+]+)*/;
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
const CJK_OPERATOR_ANS = new RegExp(`([${CJK}])([\\+\\-\\*=&<>])([A-Za-z0-9])`, "g");
const ANS_OPERATOR_CJK = new RegExp(`([A-Za-z0-9])([\\+\\-\\*=&<>])([${CJK}])`, "g");
const CJK_SLASH_CJK = new RegExp(`([${CJK}])([/])([${CJK}])`, "g");
const CJK_LEFT_BRACKET = new RegExp(`([${CJK}])([\\(\\[\\{<>\u201C])`, "g");
const RIGHT_BRACKET_CJK = new RegExp(`([\\)\\]\\}<>\u201D])([${CJK}])`, "g");
const FIX_LEFT_BRACKET_ANY_RIGHT_BRACKET = /([\(\[\{<\u201c]+)[ ]*(.+?)[ ]*([\)\]\}>\u201d]+)/;
const ANS_CJK_LEFT_BRACKET_ANY_RIGHT_BRACKET = new RegExp(`([A-Za-z0-9${CJK}])[ ]*([\u201C])([A-Za-z0-9${CJK}\\-_ ]+)([\u201D])`, "g");
const LEFT_BRACKET_ANY_RIGHT_BRACKET_ANS_CJK = new RegExp(`([\u201C])([A-Za-z0-9${CJK}\\-_ ]+)([\u201D])[ ]*([A-Za-z0-9${CJK}])`, "g");
const AN_LEFT_BRACKET = new RegExp("([A-Za-z0-9])(?<!\\.[A-Za-z0-9]*)([\\(\\[\\{])", "g");
const RIGHT_BRACKET_AN = /([\)\]\}])([A-Za-z0-9])/g;
const CJK_FILESYSTEM_PATH = new RegExp(`([${CJK}])(${FILESYSTEM_PATH.source})`, "g");
const FILESYSTEM_PATH_SLASH_CJK = new RegExp(`(${FILESYSTEM_PATH.source}/)([${CJK}])`, "g");
const CJK_ANS = new RegExp(`([${CJK}])([A-Za-z\u0370-\u03FF0-9@\\$%\\^&\\*\\-\\+\\\\=\xA1-\xFF\u2150-\u218F\u2700\u2014\u27BF])`, "g");
const ANS_CJK = new RegExp(`([A-Za-z\u0370-\u03FF0-9~\\$%\\^&\\*\\-\\+\\\\=!;:,\\.\\?\xA1-\xFF\u2150-\u218F\u2700\u2014\u27BF])([${CJK}])`, "g");
const S_A = /(%)([A-Za-z])/g;
const MIDDLE_DOT = /([ ]*)([\u00b7\u2022\u2027])([ ]*)/g;
class Pangu {
  constructor() {
    __publicField(this, "version");
    this.version = "5.2.0";
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
    newText = newText.replace(HASH_ANS_CJK_HASH, "$1 $2$3$4 $5");
    newText = newText.replace(CJK_HASH, "$1 $2");
    newText = newText.replace(HASH_CJK, "$1 $3");
    newText = newText.replace(CJK_OPERATOR_ANS, "$1 $2 $3");
    newText = newText.replace(ANS_OPERATOR_CJK, "$1 $2 $3");
    newText = newText.replace(CJK_FILESYSTEM_PATH, "$1 $2");
    newText = newText.replace(FILESYSTEM_PATH_SLASH_CJK, "$1 $2");
    newText = newText.replace(CJK_SLASH_CJK, "$1 $2 $3");
    newText = newText.replace(CJK_LEFT_BRACKET, "$1 $2");
    newText = newText.replace(RIGHT_BRACKET_CJK, "$1 $2");
    newText = newText.replace(FIX_LEFT_BRACKET_ANY_RIGHT_BRACKET, "$1$2$3");
    newText = newText.replace(ANS_CJK_LEFT_BRACKET_ANY_RIGHT_BRACKET, "$1 $2$3$4");
    newText = newText.replace(LEFT_BRACKET_ANY_RIGHT_BRACKET_ANS_CJK, "$1$2$3 $4");
    newText = newText.replace(AN_LEFT_BRACKET, "$1 $2");
    newText = newText.replace(RIGHT_BRACKET_AN, "$1 $2");
    newText = newText.replace(CJK_ANS, "$1 $2");
    newText = newText.replace(ANS_CJK, "$1 $2");
    newText = newText.replace(S_A, "$1 $2");
    newText = newText.replace(MIDDLE_DOT, "\u30FB");
    const HTML_TAG_RESTORE = new RegExp(`${HTML_TAG_PLACEHOLDER}(\\d+)\0`, "g");
    newText = newText.replace(HTML_TAG_RESTORE, (_match, index) => {
      return htmlTags[parseInt(index, 10)] || "";
    });
    return newText;
  }
  // alias for spacingText()
  spacing(text) {
    return this.spacingText(text);
  }
  hasPerfectSpacing(text) {
    return this.spacingText(text) === text;
  }
  convertToFullwidth(symbols) {
    return symbols.replace(/~/g, "\uFF5E").replace(/!/g, "\uFF01").replace(/;/g, "\uFF1B").replace(/:/g, "\uFF1A").replace(/,/g, "\uFF0C").replace(/\./g, "\u3002").replace(/\?/g, "\uFF1F");
  }
}
new Pangu();
exports.ANY_CJK = ANY_CJK;
exports.Pangu = Pangu;
//# sourceMappingURL=index.cjs.map
