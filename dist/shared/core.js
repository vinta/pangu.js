"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var CJK = "\u2E80-\u2EFF\u2F00-\u2FDF\u3040-\u309F\u30A0-\u30FA\u30FC-\u30FF\u3100-\u312F\u3200-\u32FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF";
var ANY_CJK = new RegExp("[".concat(CJK, "]"));
var CONVERT_TO_FULLWIDTH_CJK_SYMBOLS_CJK = new RegExp("([".concat(CJK, "])[ ]*([\\:]+|\\.)[ ]*([").concat(CJK, "])"), 'g');
var CONVERT_TO_FULLWIDTH_CJK_SYMBOLS = new RegExp("([".concat(CJK, "])[ ]*([~\\!;,\\?]+)[ ]*"), 'g');
var DOTS_CJK = new RegExp("([\\.]{2,}|\u2026)([".concat(CJK, "])"), 'g');
var FIX_CJK_COLON_ANS = new RegExp("([".concat(CJK, "])\\:([A-Z0-9\\(\\)])"), 'g');
var CJK_QUOTE = new RegExp("([".concat(CJK, "])([`\"\u05F4])"), 'g');
var QUOTE_CJK = new RegExp("([`\"\u05F4])([".concat(CJK, "])"), 'g');
var FIX_QUOTE_ANY_QUOTE = /([`"\u05f4]+)[ ]*(.+?)[ ]*([`"\u05f4]+)/g;
var CJK_SINGLE_QUOTE_BUT_POSSESSIVE = new RegExp("([".concat(CJK, "])('[^s])"), 'g');
var SINGLE_QUOTE_CJK = new RegExp("(')([".concat(CJK, "])"), 'g');
var FIX_POSSESSIVE_SINGLE_QUOTE = new RegExp("([A-Za-z0-9".concat(CJK, "])( )('s)"), 'g');
var HASH_ANS_CJK_HASH = new RegExp("([".concat(CJK, "])(#)([").concat(CJK, "]+)(#)([").concat(CJK, "])"), 'g');
var CJK_HASH = new RegExp("([".concat(CJK, "])(#([^ ]))"), 'g');
var HASH_CJK = new RegExp("(([^ ])#)([".concat(CJK, "])"), 'g');
var CJK_OPERATOR_ANS = new RegExp("([".concat(CJK, "])([\\+\\-\\*\\/=&\\|<>])([A-Za-z0-9])"), 'g');
var ANS_OPERATOR_CJK = new RegExp("([A-Za-z0-9])([\\+\\-\\*\\/=&\\|<>])([".concat(CJK, "])"), 'g');
var FIX_SLASH_AS = /([/]) ([a-z\-_\./]+)/g;
var FIX_SLASH_AS_SLASH = /([/\.])([A-Za-z\-_\./]+) ([/])/g;
var CJK_LEFT_BRACKET = new RegExp("([".concat(CJK, "])([\\(\\[\\{<>\u201C])"), 'g');
var RIGHT_BRACKET_CJK = new RegExp("([\\)\\]\\}<>\u201D])([".concat(CJK, "])"), 'g');
var FIX_LEFT_BRACKET_ANY_RIGHT_BRACKET = /([\(\[\{<\u201c]+)[ ]*(.+?)[ ]*([\)\]\}>\u201d]+)/;
var ANS_CJK_LEFT_BRACKET_ANY_RIGHT_BRACKET = new RegExp("([A-Za-z0-9".concat(CJK, "])[ ]*([\u201C])([A-Za-z0-9").concat(CJK, "\\-_ ]+)([\u201D])"), 'g');
var LEFT_BRACKET_ANY_RIGHT_BRACKET_ANS_CJK = new RegExp("([\u201C])([A-Za-z0-9".concat(CJK, "\\-_ ]+)([\u201D])[ ]*([A-Za-z0-9").concat(CJK, "])"), 'g');
var AN_LEFT_BRACKET = /([A-Za-z0-9])([\(\[\{])/g;
var RIGHT_BRACKET_AN = /([\)\]\}])([A-Za-z0-9])/g;
var CJK_ANS = new RegExp("([".concat(CJK, "])([A-Za-z\u0370-\u03FF0-9@\\$%\\^&\\*\\-\\+\\\\=\\|/\xA1-\xFF\u2150-\u218F\u2700\u2014\u27BF])"), 'g');
var ANS_CJK = new RegExp("([A-Za-z\u0370-\u03FF0-9~\\$%\\^&\\*\\-\\+\\\\=\\|/!;:,\\.\\?\xA1-\xFF\u2150-\u218F\u2700\u2014\u27BF])([".concat(CJK, "])"), 'g');
var S_A = /(%)([A-Za-z])/g;
var MIDDLE_DOT = /([ ]*)([\u00b7\u2022\u2027])([ ]*)/g;

var Pangu = function () {
  function Pangu() {
    _classCallCheck(this, Pangu);

    this.version = '4.0.7';
  }

  _createClass(Pangu, [{
    key: "convertToFullwidth",
    value: function convertToFullwidth(symbols) {
      return symbols.replace(/~/g, '～').replace(/!/g, '！').replace(/;/g, '；').replace(/:/g, '：').replace(/,/g, '，').replace(/\./g, '。').replace(/\?/g, '？');
    }
  }, {
    key: "spacing",
    value: function spacing(text) {
      if (typeof text !== 'string') {
        console.warn("spacing(text) only accepts string but got ".concat(_typeof(text)));
        return text;
      }

      if (text.length <= 1 || !ANY_CJK.test(text)) {
        return text;
      }

      var self = this;
      var newText = text;
      newText = newText.replace(CONVERT_TO_FULLWIDTH_CJK_SYMBOLS_CJK, function (match, leftCjk, symbols, rightCjk) {
        var fullwidthSymbols = self.convertToFullwidth(symbols);
        return "".concat(leftCjk).concat(fullwidthSymbols).concat(rightCjk);
      });
      newText = newText.replace(CONVERT_TO_FULLWIDTH_CJK_SYMBOLS, function (match, cjk, symbols) {
        var fullwidthSymbols = self.convertToFullwidth(symbols);
        return "".concat(cjk).concat(fullwidthSymbols);
      });
      newText = newText.replace(DOTS_CJK, '$1 $2');
      newText = newText.replace(FIX_CJK_COLON_ANS, '$1：$2');
      newText = newText.replace(CJK_QUOTE, '$1 $2');
      newText = newText.replace(QUOTE_CJK, '$1 $2');
      newText = newText.replace(FIX_QUOTE_ANY_QUOTE, '$1$2$3');
      newText = newText.replace(CJK_SINGLE_QUOTE_BUT_POSSESSIVE, '$1 $2');
      newText = newText.replace(SINGLE_QUOTE_CJK, '$1 $2');
      newText = newText.replace(FIX_POSSESSIVE_SINGLE_QUOTE, "$1's");
      newText = newText.replace(HASH_ANS_CJK_HASH, '$1 $2$3$4 $5');
      newText = newText.replace(CJK_HASH, '$1 $2');
      newText = newText.replace(HASH_CJK, '$1 $3');
      newText = newText.replace(CJK_OPERATOR_ANS, '$1 $2 $3');
      newText = newText.replace(ANS_OPERATOR_CJK, '$1 $2 $3');
      newText = newText.replace(FIX_SLASH_AS, '$1$2');
      newText = newText.replace(FIX_SLASH_AS_SLASH, '$1$2$3');
      newText = newText.replace(CJK_LEFT_BRACKET, '$1 $2');
      newText = newText.replace(RIGHT_BRACKET_CJK, '$1 $2');
      newText = newText.replace(FIX_LEFT_BRACKET_ANY_RIGHT_BRACKET, '$1$2$3');
      newText = newText.replace(ANS_CJK_LEFT_BRACKET_ANY_RIGHT_BRACKET, '$1 $2$3$4');
      newText = newText.replace(LEFT_BRACKET_ANY_RIGHT_BRACKET_ANS_CJK, '$1$2$3 $4');
      newText = newText.replace(AN_LEFT_BRACKET, '$1 $2');
      newText = newText.replace(RIGHT_BRACKET_AN, '$1 $2');
      newText = newText.replace(CJK_ANS, '$1 $2');
      newText = newText.replace(ANS_CJK, '$1 $2');
      newText = newText.replace(S_A, '$1 $2');
      newText = newText.replace(MIDDLE_DOT, '・');
      return newText;
    }
  }, {
    key: "spacingText",
    value: function spacingText(text) {
      var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};
      var newText;

      try {
        newText = this.spacing(text);
      } catch (err) {
        callback(err);
        return;
      }

      callback(null, newText);
    }
  }, {
    key: "spacingTextSync",
    value: function spacingTextSync(text) {
      return this.spacing(text);
    }
  }]);

  return Pangu;
}();

var pangu = new Pangu();
module.exports = pangu;
module.exports.default = pangu;
module.exports.Pangu = Pangu;