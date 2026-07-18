import pangu$1, { ANY_CJK, Pangu } from "../shared/index.js";
//#region src/browser/boundary-spacing.ts
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
//#endregion
//#region src/browser/dom-walker.ts
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
				if (currentNode instanceof Element && this.isIgnoredElement(currentNode)) return NodeFilter.FILTER_REJECT;
				currentNode = currentNode.parentNode;
			}
			return NodeFilter.FILTER_ACCEPT;
		} });
		while (walker.nextNode()) nodes.push(walker.currentNode);
		return reverse ? nodes.reverse() : nodes;
	}
	static findBoundaryNode(textNode, edge) {
		let node = textNode;
		while (node.parentNode && !this.spaceSensitiveTags.test(node.nodeName) && (edge === "first" ? this.isFirstTextChild(node.parentNode, node) : this.isLastTextChild(node.parentNode, node))) node = node.parentNode;
		return node;
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
	static isIgnoredElement(element) {
		return this.ignoredTags.test(element.nodeName) || this.isContentEditable(element) || element.classList.contains(this.ignoredClass);
	}
	static isContentEditable(node) {
		return node instanceof HTMLElement && (node.isContentEditable || node.getAttribute("g_editable") === "true");
	}
};
//#endregion
//#region src/browser/task-scheduler.ts
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
//#endregion
//#region src/browser/visibility-detector.ts
var VisibilityDetector = class {
	config = { enabled: true };
	isElementVisuallyHidden(element) {
		if (!this.config.enabled) return false;
		const style = getComputedStyle(element);
		if (style.display === "none") return true;
		if (style.visibility === "hidden") return true;
		if (parseFloat(style.opacity) === 0) return true;
		const clip = style.clip;
		if (clip && (clip.includes("rect(1px, 1px, 1px, 1px)") || clip.includes("rect(0px, 0px, 0px, 0px)") || clip.includes("rect(0, 0, 0, 0)"))) return true;
		const height = parseInt(style.height, 10);
		const width = parseInt(style.width, 10);
		if (height === 1 && width === 1) {
			const overflow = style.overflow;
			const position = style.position;
			if (overflow === "hidden" && position === "absolute") return true;
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
//#endregion
//#region src/browser/pangu.ts
function once(func) {
	let executed = false;
	return function(...args) {
		if (executed) return;
		executed = true;
		return func(...args);
	};
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
	isSpaceLikeSibling(node) {
		return !!node && DomWalker.spaceLikeTags.test(node.nodeName);
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
				const currentBoundaryNode = DomWalker.findBoundaryNode(currentTextNode, "last");
				const nextBoundaryNode = DomWalker.findBoundaryNode(nextTextNode, "first");
				const { whitespaceBetween, contentBetween } = this.scanBetweenTextRuns(currentBoundaryNode, nextBoundaryNode);
				const currentRun = currentTextNode;
				const nextRun = nextTextNode;
				switch (decideBoundarySpacing({
					currentLast: currentTextNode.data.slice(-1),
					nextFirst: nextTextNode.data.slice(0, 1),
					currentEndsWithSpace: currentTextNode.data.endsWith(" "),
					nextStartsWithSpace: nextTextNode.data.startsWith(" "),
					whitespaceBetween,
					contentBetween,
					spaceLikeSiblingAfterCurrent: this.isSpaceLikeSibling(currentTextNode.nextSibling),
					spaceLikeSiblingAfterCurrentBoundary: this.isSpaceLikeSibling(currentBoundaryNode.nextSibling),
					spaceLikeSiblingBeforeNext: this.isSpaceLikeSibling(nextTextNode.previousSibling),
					spaceLikeSiblingBeforeNextBoundary: this.isSpaceLikeSibling(nextBoundaryNode.previousSibling),
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
	findPreviousElementLastChar(textNode) {
		const previousNode = textNode.previousSibling;
		if (previousNode && previousNode.nodeType === Node.ELEMENT_NODE && previousNode.textContent) return previousNode.textContent.slice(-1);
		return null;
	}
	scanBetweenTextRuns(currentBoundaryNode, nextBoundaryNode) {
		let whitespaceBetween = false;
		let contentBetween = false;
		const scan = (node) => {
			if (node.nodeType === Node.TEXT_NODE && node.textContent) {
				if (/\s/.test(node.textContent)) whitespaceBetween = true;
				if (/\S/.test(node.textContent)) contentBetween = true;
			} else if (node instanceof Element && !DomWalker.isIgnoredElement(node)) for (let child = node.firstChild; child; child = child.nextSibling) scan(child);
		};
		let containerOfNext = null;
		let node = currentBoundaryNode;
		while (node && !containerOfNext) {
			let sibling = node.nextSibling;
			while (sibling && !sibling.contains(nextBoundaryNode)) {
				scan(sibling);
				sibling = sibling.nextSibling;
			}
			containerOfNext = sibling;
			node = node.parentNode;
		}
		while (containerOfNext && containerOfNext !== nextBoundaryNode) {
			let child = containerOfNext.firstChild;
			while (child && !child.contains(nextBoundaryNode)) {
				scan(child);
				child = child.nextSibling;
			}
			containerOfNext = child;
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
export { BrowserPangu, pangu as default, pangu };

//# sourceMappingURL=pangu.js.map