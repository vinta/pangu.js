#!/usr/bin/env node
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region dist/shared/index.js
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
var pangu$1 = new Pangu();
//#endregion
//#region dist/browser/pangu.js
var QUOTE = /["\u201c\u201d]/;
function decideBoundarySpacing(context) {
	if (context.spaceLikeSiblingAfterCurrent) return "none";
	if (context.currentEndsWithSpace || context.nextStartsWithSpace || context.whitespaceBetween) return "none";
	if (context.contentBetween) return "none";
	if (!needsBoundarySpace(context.currentLast, context.nextFirst)) return "none";
	if (context.spaceLikeSiblingAfterCurrentBoundary || context.currentBoundaryIsBlock) return "none";
	if (!context.nextBoundaryIsSpaceSensitive) {
		if (context.nextBoundaryIsIgnored || context.nextBoundaryIsBlock || context.spaceLikeSiblingBeforeNext || context.hiddenBoundaryBefore()) return "none";
		return "prepend-next";
	}
	if (!context.currentBoundaryIsSpaceSensitive) {
		if (context.hiddenBoundaryAfter()) return "none";
		return "append-current";
	}
	if (context.spaceLikeSiblingBeforeNextBoundary || context.hiddenBoundaryAfter()) return "none";
	if (context.inGridOrFlexContainer()) return "none";
	return "insert-element";
}
function decideTextRunSpacing(context) {
	const verdicts = [];
	let { text } = context;
	if (text.startsWith(" ") && context.hiddenBoundaryBefore()) {
		verdicts.push("trim-leading-space");
		text = text.substring(1);
	}
	if (isStandaloneQuote(text)) {
		if (context.previousElementLastChar !== null && ANY_CJK.test(context.previousElementLastChar)) verdicts.push("prepend-space");
	} else verdicts.push("apply-text-spacing");
	return verdicts;
}
function needsBoundarySpace(currentLast, nextFirst) {
	const pair = `${currentLast}${nextFirst}`;
	if (pangu$1.spacingText(pair) === pair) return false;
	return !isQuoteNextToCjk(currentLast, nextFirst);
}
function isQuoteNextToCjk(currentLast, nextFirst) {
	return QUOTE.test(currentLast) && ANY_CJK.test(nextFirst) || ANY_CJK.test(currentLast) && QUOTE.test(nextFirst);
}
function isStandaloneQuote(text) {
	return text.length === 1 && QUOTE.test(text);
}
var DomWalker = class {
	static blockTags = /^(div|p|h1|h2|h3|h4|h5|h6)$/i;
	static ignoredTags = /^(code|pre|script|style|textarea|iframe|input)$/i;
	static spaceLikeTags = /^(br|hr|i|img|pangu)$/i;
	static spaceSensitiveTags = /^(a|del|pre|s|strike|u)$/i;
	static ignoredClass = "no-pangu-spacing";
	static collectTextNodes(contextNode, reverse = false) {
		const nodes = [];
		if (!contextNode || contextNode instanceof DocumentFragment) return nodes;
		const walker = document.createTreeWalker(contextNode, NodeFilter.SHOW_TEXT, { acceptNode: (node) => {
			if (!node.nodeValue || !/\S/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
			let currentNode = node;
			while (currentNode) {
				if (currentNode instanceof Element) {
					if (this.ignoredTags.test(currentNode.nodeName)) return NodeFilter.FILTER_REJECT;
					if (this.isContentEditable(currentNode)) return NodeFilter.FILTER_REJECT;
					if (currentNode.classList.contains(this.ignoredClass)) return NodeFilter.FILTER_REJECT;
				}
				currentNode = currentNode.parentNode;
			}
			return NodeFilter.FILTER_ACCEPT;
		} });
		while (walker.nextNode()) nodes.push(walker.currentNode);
		return reverse ? nodes.reverse() : nodes;
	}
	static isFirstTextChild(parentNode, targetNode) {
		const { childNodes } = parentNode;
		for (let i = 0; i < childNodes.length; i++) {
			const childNode = childNodes[i];
			if (childNode.nodeType !== Node.COMMENT_NODE && childNode.textContent) return childNode === targetNode;
		}
		return false;
	}
	static isLastTextChild(parentNode, targetNode) {
		const { childNodes } = parentNode;
		for (let i = childNodes.length - 1; i > -1; i--) {
			const childNode = childNodes[i];
			if (childNode.nodeType !== Node.COMMENT_NODE && childNode.textContent) return childNode === targetNode;
		}
		return false;
	}
	static isContentEditable(node) {
		return node instanceof HTMLElement && (node.isContentEditable || node.getAttribute("g_editable") === "true");
	}
};
var TaskQueue = class {
	queue = [];
	isProcessing = false;
	add(task) {
		this.queue.push(task);
		this.scheduleProcessing();
	}
	clear() {
		this.queue.length = 0;
	}
	get length() {
		return this.queue.length;
	}
	scheduleProcessing() {
		if (!this.isProcessing && this.queue.length > 0) {
			this.isProcessing = true;
			requestIdleCallback((deadline) => this.process(deadline), { timeout: 5e3 });
		}
	}
	process(deadline) {
		while (deadline.timeRemaining() > 0 && this.queue.length > 0) this.queue.shift()?.();
		this.isProcessing = false;
		if (this.queue.length > 0) this.scheduleProcessing();
	}
};
/**
* Runs queued text spacing work during browser idle time to avoid blocking the UI.
* Tasks execute via requestIdleCallback when the browser has spare time,
* ensuring smooth user experience even when processing large amounts of text.
*/
var TaskScheduler = class {
	config = {
		enabled: true,
		chunkSize: 40,
		timeout: 2e3
	};
	taskQueue = new TaskQueue();
	get queue() {
		return this.taskQueue;
	}
};
var VisibilityDetector = class {
	config = {
		enabled: true,
		commonHiddenPatterns: {
			clipRect: true,
			displayNone: true,
			visibilityHidden: true,
			opacityZero: true,
			heightWidth1px: true
		}
	};
	isElementVisuallyHidden(element) {
		if (!this.config.enabled) return false;
		const style = getComputedStyle(element);
		const patterns = this.config.commonHiddenPatterns;
		if (patterns.displayNone && style.display === "none") return true;
		if (patterns.visibilityHidden && style.visibility === "hidden") return true;
		if (patterns.opacityZero && parseFloat(style.opacity) === 0) return true;
		if (patterns.clipRect) {
			const clip = style.clip;
			if (clip && (clip.includes("rect(1px, 1px, 1px, 1px)") || clip.includes("rect(0px, 0px, 0px, 0px)") || clip.includes("rect(0, 0, 0, 0)"))) return true;
		}
		if (patterns.heightWidth1px) {
			const height = parseInt(style.height, 10);
			const width = parseInt(style.width, 10);
			if (height === 1 && width === 1) {
				const overflow = style.overflow;
				const position = style.position;
				if (overflow === "hidden" && position === "absolute") return true;
			}
		}
		return false;
	}
	shouldSkipSpacingAfterNode(node) {
		if (!this.config.enabled) return false;
		let elementToCheck = null;
		if (node instanceof Element) elementToCheck = node;
		else if (node.parentElement) elementToCheck = node.parentElement;
		if (elementToCheck && this.isElementVisuallyHidden(elementToCheck)) return true;
		let currentElement = elementToCheck?.parentElement;
		while (currentElement) {
			if (this.isElementVisuallyHidden(currentElement)) return true;
			currentElement = currentElement.parentElement;
		}
		return false;
	}
	shouldSkipSpacingBeforeNode(node) {
		if (!this.config.enabled) return false;
		let previousNode = node.previousSibling;
		if (!previousNode && node.parentElement) {
			let parent = node.parentElement;
			while (parent && !previousNode) {
				previousNode = parent.previousSibling;
				if (!previousNode) parent = parent.parentElement;
			}
		}
		if (previousNode) {
			if (previousNode instanceof Element && this.isElementVisuallyHidden(previousNode)) return true;
			else if (previousNode instanceof Text && previousNode.parentElement && this.isElementVisuallyHidden(previousNode.parentElement)) return true;
		}
		return false;
	}
};
function once(func) {
	let executed = false;
	return function(...args) {
		if (executed) return;
		executed = true;
		return func(...args);
	};
}
function isSpaceLikeSibling(node) {
	return !!node && DomWalker.spaceLikeTags.test(node.nodeName);
}
function debounce(func, delay, mustRunDelay = Infinity) {
	let timer = null;
	let startTime = null;
	return function(...args) {
		const currentTime = Date.now();
		if (timer) clearTimeout(timer);
		if (!startTime) startTime = currentTime;
		if (currentTime - startTime >= mustRunDelay) {
			func(...args);
			startTime = currentTime;
		} else timer = window.setTimeout(() => {
			func(...args);
		}, delay);
	};
}
var BrowserPangu = class extends Pangu {
	isAutoSpacingPageExecuted = false;
	autoSpacingPageObserver = null;
	taskScheduler = new TaskScheduler();
	visibilityDetector = new VisibilityDetector();
	autoSpacingPage({ pageDelayMs = 1e3, nodeDelayMs = 500, nodeMaxWaitMs = 2e3 } = {}) {
		if (!(document.body instanceof Node)) return;
		if (this.isAutoSpacingPageExecuted) return;
		this.isAutoSpacingPageExecuted = true;
		this.waitForVideosToLoad(pageDelayMs, once(() => this.spacingPage()));
		this.setupAutoSpacingPageObserver(nodeDelayMs, nodeMaxWaitMs);
	}
	spacingPage() {
		const title = document.querySelector("head > title");
		if (title) this.spacingNode(title);
		this.spacingNode(document.body);
	}
	spacingNode(contextNode) {
		const textNodes = DomWalker.collectTextNodes(contextNode, true);
		this.schedule(textNodes);
	}
	stopAutoSpacingPage() {
		if (this.autoSpacingPageObserver) {
			this.autoSpacingPageObserver.disconnect();
			this.autoSpacingPageObserver = null;
		}
		this.isAutoSpacingPageExecuted = false;
	}
	isElementVisuallyHidden(element) {
		return this.visibilityDetector.isElementVisuallyHidden(element);
	}
	isGridOrFlexContainer(node) {
		if (node.nodeType !== Node.ELEMENT_NODE) return false;
		const display = window.getComputedStyle(node).display;
		return display === "grid" || display === "inline-grid" || display === "flex" || display === "inline-flex";
	}
	spacingTextNodes(textNodes) {
		let currentTextNode;
		let nextTextNode = null;
		for (let i = 0; i < textNodes.length; i++) {
			currentTextNode = textNodes[i];
			if (!currentTextNode) continue;
			if (currentTextNode instanceof Text) this.applyTextRunSpacing(currentTextNode);
			if (nextTextNode) {
				if (!(currentTextNode instanceof Text) || !(nextTextNode instanceof Text)) continue;
				const currentBoundaryNode = this.findCurrentBoundaryNode(currentTextNode);
				const nextBoundaryNode = this.findNextBoundaryNode(nextTextNode);
				const { whitespaceBetween, contentBetween } = this.scanBetweenTextRuns(currentTextNode, nextTextNode);
				const currentRun = currentTextNode;
				const nextRun = nextTextNode;
				switch (decideBoundarySpacing({
					currentLast: currentTextNode.data.slice(-1),
					nextFirst: nextTextNode.data.slice(0, 1),
					currentEndsWithSpace: currentTextNode.data.endsWith(" "),
					nextStartsWithSpace: nextTextNode.data.startsWith(" "),
					whitespaceBetween,
					contentBetween,
					spaceLikeSiblingAfterCurrent: isSpaceLikeSibling(currentTextNode.nextSibling),
					spaceLikeSiblingAfterCurrentBoundary: isSpaceLikeSibling(currentBoundaryNode.nextSibling),
					spaceLikeSiblingBeforeNext: isSpaceLikeSibling(nextTextNode.previousSibling),
					spaceLikeSiblingBeforeNextBoundary: isSpaceLikeSibling(nextBoundaryNode.previousSibling),
					currentBoundaryIsBlock: DomWalker.blockTags.test(currentBoundaryNode.nodeName),
					currentBoundaryIsSpaceSensitive: DomWalker.spaceSensitiveTags.test(currentBoundaryNode.nodeName),
					nextBoundaryIsBlock: DomWalker.blockTags.test(nextBoundaryNode.nodeName),
					nextBoundaryIsIgnored: DomWalker.ignoredTags.test(nextBoundaryNode.nodeName),
					nextBoundaryIsSpaceSensitive: DomWalker.spaceSensitiveTags.test(nextBoundaryNode.nodeName),
					hiddenBoundaryBefore: () => this.isHiddenBoundaryBefore(nextRun),
					hiddenBoundaryAfter: () => this.isHiddenBoundaryAfter(currentRun),
					inGridOrFlexContainer: () => !!nextBoundaryNode.parentNode && this.isGridOrFlexContainer(nextBoundaryNode.parentNode)
				})) {
					case "prepend-next":
						nextTextNode.data = ` ${nextTextNode.data}`;
						break;
					case "append-current":
						currentTextNode.data = `${currentTextNode.data} `;
						break;
					case "insert-element":
						this.insertPanguElement(nextBoundaryNode);
						break;
					case "none": break;
				}
			}
			nextTextNode = currentTextNode;
		}
	}
	applyTextRunSpacing(textNode) {
		const verdicts = decideTextRunSpacing({
			text: textNode.data,
			previousElementLastChar: this.findPreviousElementLastChar(textNode),
			hiddenBoundaryBefore: () => this.isHiddenBoundaryBefore(textNode)
		});
		for (const verdict of verdicts) switch (verdict) {
			case "trim-leading-space":
				textNode.data = textNode.data.substring(1);
				break;
			case "prepend-space":
				textNode.data = ` ${textNode.data}`;
				break;
			case "apply-text-spacing": {
				const newText = this.spacingText(textNode.data);
				if (textNode.data !== newText) textNode.data = newText;
				break;
			}
		}
	}
	insertPanguElement(nextBoundaryNode) {
		const panguSpace = document.createElement("pangu");
		panguSpace.innerHTML = " ";
		if (nextBoundaryNode.parentNode) nextBoundaryNode.parentNode.insertBefore(panguSpace, nextBoundaryNode);
		if (!panguSpace.previousElementSibling) {
			if (panguSpace.parentNode) panguSpace.parentNode.removeChild(panguSpace);
		}
	}
	findCurrentBoundaryNode(currentTextNode) {
		let currentNode = currentTextNode;
		while (currentNode.parentNode && !DomWalker.spaceSensitiveTags.test(currentNode.nodeName) && DomWalker.isLastTextChild(currentNode.parentNode, currentNode)) currentNode = currentNode.parentNode;
		return currentNode;
	}
	findNextBoundaryNode(nextTextNode) {
		let nextNode = nextTextNode;
		while (nextNode.parentNode && !DomWalker.spaceSensitiveTags.test(nextNode.nodeName) && DomWalker.isFirstTextChild(nextNode.parentNode, nextNode)) nextNode = nextNode.parentNode;
		return nextNode;
	}
	findPreviousElementLastChar(textNode) {
		const previousNode = textNode.previousSibling;
		if (previousNode && previousNode.nodeType === Node.ELEMENT_NODE && previousNode.textContent) return previousNode.textContent.slice(-1);
		return null;
	}
	scanBetweenTextRuns(currentTextNode, nextTextNode) {
		let currentAncestor = currentTextNode;
		while (currentAncestor.parentNode && DomWalker.isLastTextChild(currentAncestor.parentNode, currentAncestor) && !DomWalker.spaceSensitiveTags.test(currentAncestor.parentNode.nodeName)) currentAncestor = currentAncestor.parentNode;
		let nextAncestor = nextTextNode;
		while (nextAncestor.parentNode && DomWalker.isFirstTextChild(nextAncestor.parentNode, nextAncestor) && !DomWalker.spaceSensitiveTags.test(nextAncestor.parentNode.nodeName)) nextAncestor = nextAncestor.parentNode;
		let whitespaceBetween = false;
		let contentBetween = false;
		let containerOfNext = null;
		let nodeBetween = currentAncestor.nextSibling;
		while (nodeBetween && nodeBetween !== nextAncestor) {
			if (nodeBetween.nodeType === Node.TEXT_NODE && nodeBetween.textContent && /\s/.test(nodeBetween.textContent)) whitespaceBetween = true;
			if (!containerOfNext) {
				if (nodeBetween.contains(nextAncestor)) containerOfNext = nodeBetween;
				else if (nodeBetween.nodeType === Node.TEXT_NODE && nodeBetween.textContent && /\S/.test(nodeBetween.textContent)) contentBetween = true;
				else if (nodeBetween.nodeType === Node.ELEMENT_NODE && DomWalker.collectTextNodes(nodeBetween).length > 0) contentBetween = true;
			}
			nodeBetween = nodeBetween.nextSibling;
		}
		if (containerOfNext && !contentBetween) {
			const collected = DomWalker.collectTextNodes(containerOfNext);
			if (collected.length > 0 && collected[0] !== nextTextNode) contentBetween = true;
		}
		return {
			whitespaceBetween,
			contentBetween
		};
	}
	isHiddenBoundaryBefore(node) {
		return this.visibilityDetector.shouldSkipSpacingBeforeNode(node);
	}
	isHiddenBoundaryAfter(node) {
		return this.visibilityDetector.shouldSkipSpacingAfterNode(node);
	}
	schedule(textNodes) {
		if (!this.taskScheduler.config.enabled) {
			this.spacingTextNodes(textNodes);
			return;
		}
		if (this.visibilityDetector.config.enabled) {
			this.taskScheduler.queue.add(() => {
				this.spacingTextNodes(textNodes);
			});
			return;
		}
		const { chunkSize } = this.taskScheduler.config;
		for (let i = 0; i < textNodes.length; i += chunkSize) {
			const chunk = textNodes.slice(i, i + chunkSize);
			this.taskScheduler.queue.add(() => {
				this.spacingTextNodes(chunk);
			});
		}
	}
	waitForVideosToLoad(delayMs, onLoaded) {
		const videos = Array.from(document.getElementsByTagName("video"));
		if (videos.length === 0) setTimeout(onLoaded, delayMs);
		else if (videos.every((video) => video.readyState >= 3)) setTimeout(onLoaded, delayMs);
		else {
			let loadedCount = 0;
			const videoCount = videos.length;
			const checkAllLoaded = () => {
				loadedCount++;
				if (loadedCount >= videoCount) setTimeout(onLoaded, delayMs);
			};
			for (const video of videos) if (video.readyState >= 3) checkAllLoaded();
			else video.addEventListener("loadeddata", checkAllLoaded, { once: true });
			setTimeout(onLoaded, delayMs + 5e3);
		}
	}
	setupAutoSpacingPageObserver(nodeDelayMs, nodeMaxWaitMs) {
		if (this.autoSpacingPageObserver) {
			this.autoSpacingPageObserver.disconnect();
			this.autoSpacingPageObserver = null;
		}
		const queue = [];
		const debouncedSpacingTitle = debounce(() => {
			const titleElement = document.querySelector("head > title");
			if (titleElement) this.spacingNode(titleElement);
		}, nodeDelayMs, nodeMaxWaitMs);
		const debouncedSpacingNode = debounce(() => {
			const nodesToProcess = [...queue];
			queue.length = 0;
			if (nodesToProcess.length === 0) return;
			nodesToProcess.sort((a, b) => {
				if (a === b) return 0;
				return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
			});
			const seenTextNodes = /* @__PURE__ */ new Set();
			const allTextNodes = [];
			for (const node of nodesToProcess) for (const textNode of DomWalker.collectTextNodes(node)) if (!seenTextNodes.has(textNode)) {
				seenTextNodes.add(textNode);
				allTextNodes.push(textNode);
			}
			allTextNodes.reverse();
			this.schedule(allTextNodes);
		}, nodeDelayMs, nodeMaxWaitMs);
		this.autoSpacingPageObserver = new MutationObserver((mutations) => {
			let titleChanged = false;
			for (const mutation of mutations) {
				if (mutation.target.parentNode?.nodeName === "TITLE" || mutation.target.nodeName === "TITLE") {
					titleChanged = true;
					continue;
				}
				switch (mutation.type) {
					case "characterData":
						const { target: node } = mutation;
						if (node.nodeType === Node.TEXT_NODE && node.parentNode) queue.push(node.parentNode);
						break;
					case "childList":
						for (const node of mutation.addedNodes) if (node.nodeType === Node.ELEMENT_NODE) queue.push(node);
						else if (node.nodeType === Node.TEXT_NODE && node.parentNode) queue.push(node.parentNode);
						break;
					default: break;
				}
			}
			if (titleChanged) debouncedSpacingTitle();
			debouncedSpacingNode();
		});
		this.autoSpacingPageObserver.observe(document.head, {
			characterData: true,
			childList: true,
			subtree: true
		});
		this.autoSpacingPageObserver.observe(document.body, {
			characterData: true,
			childList: true,
			subtree: true
		});
	}
};
var pangu = new BrowserPangu();
//#endregion
//#region dist/node/cli.js
var usage = `
usage: pangu [-h] [-v] [-t] [-f] [-c] text_or_path

pangu.js -- Paranoid text spacing for good readability, to automatically
insert whitespace between CJK and half-width characters (alphabetical letters,
numerical digits and symbols).

positional arguments:
  text_or_path   the text or file path to apply spacing

optional arguments:
  -h, --help     show this help message and exit
  -v, --version  show program's version number and exit
  -t, --text     specify the input value is a text
  -f, --file     specify the input value is a file path
  -c, --check    check if text has proper spacing (exit 0 if yes, 1 if no)
`.trim();
var [, , ...args] = process.argv;
function printSpacingText(text) {
	if (typeof text === "string") console.log(pangu.spacingText(text));
	else {
		console.log(usage);
		process.exit(1);
	}
}
function printSpacingFile(path) {
	if (typeof path === "string") console.log(pangu.spacingFileSync(path));
	else {
		console.log(usage);
		process.exit(1);
	}
}
function checkSpacing(text) {
	if (typeof text === "string") {
		const hasProperSpacing = pangu.hasProperSpacing(text);
		if (!hasProperSpacing) console.error(`Corrected: ${pangu.spacingText(text)}`);
		process.exit(hasProperSpacing ? 0 : 1);
	} else {
		console.log(usage);
		process.exit(1);
	}
}
if (args.length === 0) {
	console.log(usage);
	process.exit(1);
} else switch (args[0]) {
	case "-h":
	case "--help":
		console.log(usage);
		break;
	case "-v":
	case "--version":
		console.log(pangu.version);
		break;
	case "-t":
	case "--text":
		printSpacingText(args[1]);
		break;
	case "-f":
	case "--file":
		printSpacingFile(args[1]);
		break;
	case "-c":
	case "--check":
		checkSpacing(args[1]);
		break;
	default: printSpacingText(args[0]);
}
process.exit(0);
//#endregion

//# sourceMappingURL=cli.cjs.map