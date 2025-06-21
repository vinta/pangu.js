"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, key + "", value);
const CJK = "⺀-⻿⼀-⿟぀-ゟ゠-ヺー-ヿ㄀-ㄯ㈀-㋿㐀-䶿一-鿿豈-﫿";
const ANY_CJK = new RegExp(`[${CJK}]`);
const CONVERT_TO_FULLWIDTH_CJK_SYMBOLS_CJK = new RegExp(`([${CJK}])[ ]*([\\:]+|\\.)[ ]*([${CJK}])`, "g");
const CONVERT_TO_FULLWIDTH_CJK_SYMBOLS = new RegExp(`([${CJK}])[ ]*([~\\!;,\\?]+)[ ]*`, "g");
const DOTS_CJK = new RegExp(`([\\.]{2,}|…)([${CJK}])`, "g");
const FIX_CJK_COLON_ANS = new RegExp(`([${CJK}])\\:([A-Z0-9\\(\\)])`, "g");
const CJK_QUOTE = new RegExp(`([${CJK}])([\`"״])`, "g");
const QUOTE_CJK = new RegExp(`([\`"״])([${CJK}])`, "g");
const FIX_QUOTE_ANY_QUOTE = /([`"\u05f4]+)[ ]*(.+?)[ ]*([`"\u05f4]+)/g;
const QUOTE_AN = /([\u201d])([A-Za-z0-9])/g;
const CJK_QUOTE_AN = new RegExp(`([${CJK}])(")([A-Za-z0-9])`, "g");
const CJK_SINGLE_QUOTE_BUT_POSSESSIVE = new RegExp(`([${CJK}])('[^s])`, "g");
const SINGLE_QUOTE_CJK = new RegExp(`(')([${CJK}])`, "g");
const FIX_POSSESSIVE_SINGLE_QUOTE = new RegExp(`([A-Za-z0-9${CJK}])( )('s)`, "g");
const HASH_ANS_CJK_HASH = new RegExp(`([${CJK}])(#)([${CJK}]+)(#)([${CJK}])`, "g");
const CJK_HASH = new RegExp(`([${CJK}])(#([^ ]))`, "g");
const HASH_CJK = new RegExp(`(([^ ])#)([${CJK}])`, "g");
const CJK_OPERATOR_ANS = new RegExp(`([${CJK}])([\\+\\-\\*\\/=&\\|<>])([A-Za-z0-9])`, "g");
const ANS_OPERATOR_CJK = new RegExp(`([A-Za-z0-9])([\\+\\-\\*\\/=&\\|<>])([${CJK}])`, "g");
const FIX_SLASH_AS = /([/]) ([a-z\-_\./]+)/g;
const FIX_SLASH_AS_SLASH = /([/\.])([A-Za-z\-_\./]+) ([/])/g;
const CJK_LEFT_BRACKET = new RegExp(`([${CJK}])([\\(\\[\\{<>“])`, "g");
const RIGHT_BRACKET_CJK = new RegExp(`([\\)\\]\\}<>”])([${CJK}])`, "g");
const FIX_LEFT_BRACKET_ANY_RIGHT_BRACKET = /([\(\[\{<\u201c]+)[ ]*(.+?)[ ]*([\)\]\}>\u201d]+)/;
const ANS_CJK_LEFT_BRACKET_ANY_RIGHT_BRACKET = new RegExp(`([A-Za-z0-9${CJK}])[ ]*([“])([A-Za-z0-9${CJK}\\-_ ]+)([”])`, "g");
const LEFT_BRACKET_ANY_RIGHT_BRACKET_ANS_CJK = new RegExp(`([“])([A-Za-z0-9${CJK}\\-_ ]+)([”])[ ]*([A-Za-z0-9${CJK}])`, "g");
const AN_LEFT_BRACKET = /([A-Za-z0-9])([\(\[\{])/g;
const RIGHT_BRACKET_AN = /([\)\]\}])([A-Za-z0-9])/g;
const CJK_ANS = new RegExp(`([${CJK}])([A-Za-zͰ-Ͽ0-9@\\$%\\^&\\*\\-\\+\\\\=\\|/¡-ÿ⅐-↏✀—➿])`, "g");
const ANS_CJK = new RegExp(`([A-Za-zͰ-Ͽ0-9~\\$%\\^&\\*\\-\\+\\\\=\\|/!;:,\\.\\?¡-ÿ⅐-↏✀—➿])([${CJK}])`, "g");
const S_A = /(%)([A-Za-z])/g;
const MIDDLE_DOT = /([ ]*)([\u00b7\u2022\u2027])([ ]*)/g;
class Pangu {
  constructor() {
    __publicField(this, "version");
    this.version = "5.0.0";
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
    newText = newText.replace(CONVERT_TO_FULLWIDTH_CJK_SYMBOLS_CJK, (_match, leftCjk, symbols, rightCjk) => {
      const fullwidthSymbols = self.convertToFullwidth(symbols);
      return `${leftCjk}${fullwidthSymbols}${rightCjk}`;
    });
    newText = newText.replace(CONVERT_TO_FULLWIDTH_CJK_SYMBOLS, (_match, cjk, symbols) => {
      const fullwidthSymbols = self.convertToFullwidth(symbols);
      return `${cjk}${fullwidthSymbols}`;
    });
    newText = newText.replace(DOTS_CJK, "$1 $2");
    newText = newText.replace(FIX_CJK_COLON_ANS, "$1：$2");
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
    newText = newText.replace(FIX_SLASH_AS, "$1$2");
    newText = newText.replace(FIX_SLASH_AS_SLASH, "$1$2$3");
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
    newText = newText.replace(MIDDLE_DOT, "・");
    return newText;
  }
  // alias for spacingText()
  spacing(text) {
    return this.spacingText(text);
  }
  convertToFullwidth(symbols) {
    return symbols.replace(/~/g, "～").replace(/!/g, "！").replace(/;/g, "；").replace(/:/g, "：").replace(/,/g, "，").replace(/\./g, "。").replace(/\?/g, "？");
  }
}
new Pangu();
exports.Pangu = Pangu;
//# sourceMappingURL=index.cjs.map
