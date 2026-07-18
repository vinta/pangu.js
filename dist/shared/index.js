//#region src/shared/index.ts
var CJK = "⺀-⻿⼀-⿟぀-ゟ゠-ヺー-ヿ㄀-ㄯ㈀-㋿㐀-䶿一-鿿豈-﫿";
var AN = "A-Za-z0-9";
var A = "A-Za-z";
var UPPER_AN = "A-Z0-9";
var OPERATORS_BASE = "\\+\\*=&";
var OPERATORS_WITH_HYPHEN = `${OPERATORS_BASE}\\-`;
var OPERATORS_NO_HYPHEN = OPERATORS_BASE;
var GRADE_OPERATORS = "\\+\\-\\*";
var QUOTES = "`\"״";
var LEFT_BRACKETS_BASIC = "\\(\\[\\{";
var RIGHT_BRACKETS_BASIC = "\\)\\]\\}";
var LEFT_BRACKETS_EXTENDED = "\\(\\[\\{<>“";
var RIGHT_BRACKETS_EXTENDED = "\\)\\]\\}<>”";
var ANS_CJK_AFTER = `${A}\u0370-\u03ff0-9@\\$%\\^&\\*\\-\\+\\\\=\u00a1-\u00ff\u2150-\u218f\u2700—\u27bf`;
var ANS_BEFORE_CJK = `${A}\u0370-\u03ff0-9\\$%\\^&\\*\\-\\+\\\\=\u00a1-\u00ff\u2150-\u218f\u2700—\u27bf`;
var FILE_PATH_DIRS = "home|root|usr|etc|var|opt|tmp|dev|mnt|proc|sys|bin|boot|lib|media|run|sbin|srv|node_modules|path|project|src|dist|test|tests|docs|templates|assets|public|static|config|scripts|tools|build|out|target|your|\\.claude|\\.git|\\.vscode";
var FILE_PATH_CHARS = "[A-Za-z0-9_\\-\\.@\\+\\*]+";
var UNIX_ABSOLUTE_FILE_PATH = new RegExp(`/(?:\\.?(?:${FILE_PATH_DIRS})|\\.(?:[A-Za-z0-9_\\-]+))(?:/${FILE_PATH_CHARS})*`);
var UNIX_RELATIVE_FILE_PATH = new RegExp(`(?:\\./)?(?:${FILE_PATH_DIRS})(?:/${FILE_PATH_CHARS})+`);
var WINDOWS_FILE_PATH = /[A-Z]:\\(?:[A-Za-z0-9_\-\. ]+\\?)+/;
var ANY_CJK = new RegExp(`[${CJK}]`);
var CJK_PUNCTUATION = new RegExp(`([${CJK}])([!;,\\?:]+)(?=[${CJK}${AN}])`, "g");
var AN_PUNCTUATION_CJK = new RegExp(`([${AN}])([!;,\\?]+)([${CJK}])`, "g");
var CJK_TILDE = new RegExp(`([${CJK}])(~+)(?!=)(?=[${CJK}${AN}])`, "g");
var CJK_TILDE_EQUALS = new RegExp(`([${CJK}])(~=)`, "g");
var CJK_PERIOD = new RegExp(`([${CJK}])(\\.)(?![${AN}\\./])(?=[${CJK}${AN}])`, "g");
var AN_PERIOD_CJK = new RegExp(`([${AN}])(\\.)([${CJK}])`, "g");
var AN_COLON_CJK = new RegExp(`([${AN}])(:)([${CJK}])`, "g");
var DOTS_CJK = new RegExp(`([\\.]{2,}|\u2026)([${CJK}])`, "g");
var FIX_CJK_COLON_ANS = new RegExp(`([${CJK}])\\:([${UPPER_AN}\\(\\)])`, "g");
var CJK_QUOTE = new RegExp(`([${CJK}])([${QUOTES}])`, "g");
var QUOTE_CJK = new RegExp(`([${QUOTES}])([${CJK}])`, "g");
var FIX_QUOTE_ANY_QUOTE = new RegExp(`([${QUOTES}]+)[ ]*(.+?)[ ]*([${QUOTES}]+)`, "g");
var QUOTE_AN = new RegExp(`([\u201d])([${AN}])`, "g");
var CJK_QUOTE_AN = new RegExp(`([${CJK}])(")([${AN}])`, "g");
var CJK_SINGLE_QUOTE_BUT_POSSESSIVE = new RegExp(`([${CJK}])('[^s])`, "g");
var SINGLE_QUOTE_CJK = new RegExp(`(')([${CJK}])`, "g");
var FIX_POSSESSIVE_SINGLE_QUOTE = new RegExp(`([${AN}${CJK}])( )('s)`, "g");
var HASH_ANS_CJK_HASH = new RegExp(`([${CJK}])(#)([${CJK}]+)(#)([${CJK}])`, "g");
var CJK_HASH = new RegExp(`([${CJK}])(#([^ ]))`, "g");
var HASH_CJK = new RegExp(`(([^ ])#)([${CJK}])`, "g");
var CJK_OPERATOR_ANS = new RegExp(`([${CJK}])([${OPERATORS_WITH_HYPHEN}])([${AN}])`, "g");
var ANS_OPERATOR_CJK = new RegExp(`([${AN}])([${OPERATORS_WITH_HYPHEN}])([${CJK}])`, "g");
var ANS_OPERATOR_ANS = new RegExp(`([${AN}])([${OPERATORS_NO_HYPHEN}])([${AN}])`, "g");
var ANS_HYPHEN_ANS_NOT_COMPOUND = new RegExp(`([A-Za-z])(-(?![a-z]))([A-Za-z0-9])|([A-Za-z]+[0-9]+)(-(?![a-z]))([0-9])|([0-9])(-(?![a-z0-9]))([A-Za-z])`, "g");
var CJK_SLASH_CJK = new RegExp(`([${CJK}])([/])([${CJK}])`, "g");
var CJK_SLASH_ANS = new RegExp(`([${CJK}])([/])([${AN}])`, "g");
var ANS_SLASH_CJK = new RegExp(`([${AN}])([/])([${CJK}])`, "g");
var ANS_SLASH_ANS = new RegExp(`([${AN}])([/])([${AN}])`, "g");
var SINGLE_LETTER_GRADE_CJK = new RegExp(`\\b([${A}])([${GRADE_OPERATORS}])([${CJK}])`, "g");
var CJK_LESS_THAN = new RegExp(`([${CJK}])(<)([${AN}])`, "g");
var LESS_THAN_CJK = new RegExp(`([${AN}])(<)([${CJK}])`, "g");
var CJK_GREATER_THAN = new RegExp(`([${CJK}])(>)([${AN}])`, "g");
var GREATER_THAN_CJK = new RegExp(`([${AN}])(>)([${CJK}])`, "g");
var ANS_LESS_THAN_ANS = new RegExp(`([${AN}])(<)([${AN}])`, "g");
var ANS_GREATER_THAN_ANS = new RegExp(`([${AN}])(>)([${AN}])`, "g");
var CJK_LEFT_BRACKET = new RegExp(`([${CJK}])([${LEFT_BRACKETS_EXTENDED}])`, "g");
var RIGHT_BRACKET_CJK = new RegExp(`([${RIGHT_BRACKETS_EXTENDED}])([${CJK}])`, "g");
var ANS_CJK_LEFT_BRACKET_ANY_RIGHT_BRACKET = new RegExp(`([${AN}${CJK}])[ ]*([\u201c])([${AN}${CJK}\\-_ ]+)([\u201d])`, "g");
var LEFT_BRACKET_ANY_RIGHT_BRACKET_ANS_CJK = new RegExp(`([\u201c])([${AN}${CJK}\\-_ ]+)([\u201d])[ ]*([${AN}${CJK}])`, "g");
var AN_LEFT_BRACKET = new RegExp(`([${AN}])(?<!\\.[${AN}]*)([${LEFT_BRACKETS_BASIC}])`, "g");
var RIGHT_BRACKET_AN = new RegExp(`([${RIGHT_BRACKETS_BASIC}])([${AN}])`, "g");
var CJK_UNIX_ABSOLUTE_FILE_PATH = new RegExp(`([${CJK}])(${UNIX_ABSOLUTE_FILE_PATH.source})`, "g");
var CJK_UNIX_RELATIVE_FILE_PATH = new RegExp(`([${CJK}])(${UNIX_RELATIVE_FILE_PATH.source})`, "g");
var CJK_WINDOWS_PATH = new RegExp(`([${CJK}])(${WINDOWS_FILE_PATH.source})`, "g");
var UNIX_ABSOLUTE_FILE_PATH_SLASH_CJK = new RegExp(`(${UNIX_ABSOLUTE_FILE_PATH.source}/)([${CJK}])`, "g");
var UNIX_RELATIVE_FILE_PATH_SLASH_CJK = new RegExp(`(${UNIX_RELATIVE_FILE_PATH.source}/)([${CJK}])`, "g");
var CJK_ANS = new RegExp(`([${CJK}])([${ANS_CJK_AFTER}])`, "g");
var ANS_CJK = new RegExp(`([${ANS_BEFORE_CJK}])([${CJK}])`, "g");
var S_A = new RegExp(`(%)([${A}])`, "g");
var MIDDLE_DOT = /([ ]*)([\u00b7\u2022\u2027])([ ]*)/g;
var SOLITARY_NBSP = /(?<=\S)[ ]*\u00a0[ ]*(?=\S)/g;
var PlaceholderReplacer = class {
	placeholder;
	startDelimiter;
	endDelimiter;
	items = [];
	index = 0;
	pattern;
	constructor(placeholder, startDelimiter, endDelimiter) {
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
};
var Pangu = class {
	version;
	constructor() {
		this.version = "7.3.0";
	}
	spacingText(text) {
		if (typeof text !== "string") {
			console.warn(`spacingText(text) only accepts string but got ${typeof text}`);
			return text;
		}
		if (text.length <= 1 || !ANY_CJK.test(text)) return text;
		const self = this;
		let newText = text;
		const backtickManager = new PlaceholderReplacer("BACKTICK_CONTENT_", "", "");
		newText = newText.replace(/`([^`]+)`/g, (_match, content) => {
			return `\`${backtickManager.store(content)}\``;
		});
		const htmlTagManager = new PlaceholderReplacer("HTML_TAG_PLACEHOLDER_", "", "");
		let hasHtmlTags = false;
		if (newText.includes("<")) {
			hasHtmlTags = true;
			newText = newText.replace(/<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s+[^>]*)?>/g, (match) => {
				const processedTag = match.replace(/(\w+)="([^"]*)"/g, (_attrMatch, attrName, attrValue) => {
					return `${attrName}="${self.spacingText(attrValue)}"`;
				});
				return htmlTagManager.store(processedTag);
			});
		}
		newText = newText.replace(SOLITARY_NBSP, " ");
		newText = newText.replace(DOTS_CJK, "$1 $2");
		newText = newText.replace(CJK_PUNCTUATION, "$1$2 ");
		newText = newText.replace(AN_PUNCTUATION_CJK, "$1$2 $3");
		newText = newText.replace(CJK_TILDE, "$1$2 ");
		newText = newText.replace(CJK_TILDE_EQUALS, "$1 $2 ");
		newText = newText.replace(CJK_PERIOD, "$1$2 ");
		newText = newText.replace(AN_PERIOD_CJK, "$1$2 $3");
		newText = newText.replace(AN_COLON_CJK, "$1$2 $3");
		newText = newText.replace(FIX_CJK_COLON_ANS, "$1：$2");
		newText = newText.replace(CJK_QUOTE, "$1 $2");
		newText = newText.replace(QUOTE_CJK, "$1 $2");
		newText = newText.replace(FIX_QUOTE_ANY_QUOTE, "$1$2$3");
		newText = newText.replace(QUOTE_AN, "$1 $2");
		newText = newText.replace(CJK_QUOTE_AN, "$1$2 $3");
		newText = newText.replace(FIX_POSSESSIVE_SINGLE_QUOTE, "$1's");
		const singleQuoteCJKManager = new PlaceholderReplacer("SINGLE_QUOTE_CJK_PLACEHOLDER_", "", "");
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
			if (textLength >= 5) newText = newText.replace(HASH_ANS_CJK_HASH, "$1 $2$3$4 $5");
			newText = newText.replace(CJK_HASH, "$1 $2");
			newText = newText.replace(HASH_CJK, "$1 $3");
		} else if (slashCount <= 1) {
			if (textLength >= 5) newText = newText.replace(HASH_ANS_CJK_HASH, "$1 $2$3$4 $5");
			newText = newText.replace(CJK_HASH, "$1 $2");
			newText = newText.replace(HASH_CJK, "$1 $3");
		} else {
			if (textLength >= 5) newText = newText.replace(HASH_ANS_CJK_HASH, "$1 $2$3$4 $5");
			newText = newText.replace(new RegExp(`([^/])([${CJK}])(#[A-Za-z0-9]+)$`), "$1$2 $3");
		}
		const compoundWordManager = new PlaceholderReplacer("COMPOUND_WORD_PLACEHOLDER_", "", "");
		newText = newText.replace(/\b(?:[A-Za-z0-9]*[a-z][A-Za-z0-9]*-[A-Za-z0-9]+|[A-Za-z0-9]+-[A-Za-z0-9]*[a-z][A-Za-z0-9]*|[A-Za-z]+-[0-9]+|[A-Za-z]+[0-9]+-[A-Za-z0-9]+)(?:-[A-Za-z0-9]+)*\b/g, (match) => {
			return compoundWordManager.store(match);
		});
		newText = newText.replace(SINGLE_LETTER_GRADE_CJK, "$1$2 $3");
		newText = newText.replace(CJK_OPERATOR_ANS, "$1 $2 $3");
		newText = newText.replace(ANS_OPERATOR_CJK, "$1 $2 $3");
		newText = newText.replace(ANS_OPERATOR_ANS, "$1 $2 $3");
		newText = newText.replace(ANS_HYPHEN_ANS_NOT_COMPOUND, (match, ...groups) => {
			if (groups[0] && groups[1] && groups[2]) return `${groups[0]} ${groups[1]} ${groups[2]}`;
			else if (groups[3] && groups[4] && groups[5]) return `${groups[3]} ${groups[4]} ${groups[5]}`;
			else if (groups[6] && groups[7] && groups[8]) return `${groups[6]} ${groups[7]} ${groups[8]}`;
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
			const filePathManager = new PlaceholderReplacer("FILE_PATH_PLACEHOLDER_", "", "");
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
		newText = newText.replace(MIDDLE_DOT, "・");
		const fixBracketSpacing = (text) => {
			for (const { pattern, open, close } of [
				{
					pattern: /<([^<>]*)>/g,
					open: "<",
					close: ">"
				},
				{
					pattern: /\(([^()]*)\)/g,
					open: "(",
					close: ")"
				},
				{
					pattern: /\[([^\[\]]*)\]/g,
					open: "[",
					close: "]"
				},
				{
					pattern: /\{([^{}]*)\}/g,
					open: "{",
					close: "}"
				}
			]) text = text.replace(pattern, (_match, innerContent) => {
				if (!innerContent) return `${open}${close}`;
				return `${open}${innerContent.replace(/^ +| +$/g, "")}${close}`;
			});
			return text;
		};
		newText = fixBracketSpacing(newText);
		if (hasHtmlTags) newText = htmlTagManager.restore(newText);
		newText = backtickManager.restore(newText);
		return newText;
	}
	hasProperSpacing(text) {
		return this.spacingText(text) === text;
	}
};
var pangu = new Pangu();
//#endregion
export { ANY_CJK, Pangu, pangu as default, pangu };

//# sourceMappingURL=index.js.map