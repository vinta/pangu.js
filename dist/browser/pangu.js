var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { Pangu } from "../shared/index.js";
function once(func) {
  let executed = false;
  return function(...args) {
    if (executed) {
      return void 0;
    }
    executed = true;
    return func(...args);
  };
}
function debounce(func, delay, mustRunDelay = Infinity) {
  let timer = null;
  let startTime = null;
  return function(...args) {
    const currentTime = Date.now();
    if (timer) {
      clearTimeout(timer);
    }
    if (!startTime) {
      startTime = currentTime;
    }
    if (currentTime - startTime >= mustRunDelay) {
      func(...args);
      startTime = currentTime;
    } else {
      timer = window.setTimeout(() => {
        func(...args);
      }, delay);
    }
  };
}
class IdleQueue {
  constructor() {
    __publicField(this, "queue", []);
    __publicField(this, "isProcessing", false);
    __publicField(this, "onComplete");
  }
  add(work) {
    this.queue.push(work);
    this.scheduleProcessing();
  }
  clear() {
    this.queue.length = 0;
    this.onComplete = void 0;
  }
  setOnComplete(onComplete) {
    this.onComplete = onComplete;
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
    var _a;
    while (deadline.timeRemaining() > 0 && this.queue.length > 0) {
      const work = this.queue.shift();
      work == null ? void 0 : work();
    }
    this.isProcessing = false;
    if (this.queue.length > 0) {
      this.scheduleProcessing();
    } else {
      (_a = this.onComplete) == null ? void 0 : _a.call(this);
    }
  }
}
const _BrowserPangu = class _BrowserPangu extends Pangu {
  constructor() {
    super();
    __publicField(this, "isAutoSpacingPageExecuted", false);
    __publicField(this, "idleQueue", new IdleQueue());
    __publicField(this, "autoSpacingPageObserver", null);
    __publicField(this, "idleSpacingConfig", {
      enabled: true,
      chunkSize: 40,
      // Process 40 text nodes per idle cycle
      timeout: 2e3
      // 2 second timeout for idle processing
    });
    __publicField(this, "visibilityCheckConfig", {
      enabled: false,
      commonHiddenPatterns: {
        clipRect: true,
        // clip: rect(1px, 1px, 1px, 1px) patterns
        displayNone: true,
        // display: none
        visibilityHidden: true,
        // visibility: hidden
        opacityZero: true,
        // opacity: 0
        heightWidth1px: true
        // height: 1px; width: 1px
      }
    });
  }
  autoSpacingPage({ pageDelayMs = 1e3, nodeDelayMs = 500, nodeMaxWaitMs = 2e3 } = {}) {
    if (!(document.body instanceof Node)) {
      return;
    }
    if (this.isAutoSpacingPageExecuted) {
      return;
    }
    this.isAutoSpacingPageExecuted = true;
    const spacingPageOnce = once(() => {
      this.spacingPage();
    });
    const videos = document.getElementsByTagName("video");
    if (videos.length === 0) {
      setTimeout(() => {
        spacingPageOnce();
      }, pageDelayMs);
    } else {
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        if (video.readyState === 4) {
          setTimeout(() => {
            spacingPageOnce();
          }, 3e3);
          break;
        }
        video.addEventListener("loadeddata", () => {
          setTimeout(() => {
            spacingPageOnce();
          }, 4e3);
        });
      }
    }
    this.setupAutoSpacingPageObserver(nodeDelayMs, nodeMaxWaitMs);
  }
  spacingPage() {
    this.spacingPageTitle();
    this.spacingPageBody();
  }
  spacingPageTitle() {
    const titleElement = document.querySelector("head > title");
    if (titleElement) {
      this.spacingNode(titleElement);
    }
  }
  spacingPageBody() {
    this.spacingNode(document.body);
  }
  spacingNode(contextNode) {
    this.spacingNodeWithTreeWalker(contextNode);
  }
  spacingElementById(idName) {
    const element = document.getElementById(idName);
    if (element) {
      this.spacingNode(element);
    }
  }
  spacingElementByClassName(className) {
    const elements = document.getElementsByClassName(className);
    for (let i = 0; i < elements.length; i++) {
      this.spacingNode(elements[i]);
    }
  }
  spacingElementByTagName(tagName) {
    const elements = document.getElementsByTagName(tagName);
    for (let i = 0; i < elements.length; i++) {
      this.spacingNode(elements[i]);
    }
  }
  stopAutoSpacingPage() {
    if (this.autoSpacingPageObserver) {
      this.autoSpacingPageObserver.disconnect();
      this.autoSpacingPageObserver = null;
    }
    this.isAutoSpacingPageExecuted = false;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isContentEditable(node) {
    return node.isContentEditable || node.getAttribute && node.getAttribute("g_editable") === "true";
  }
  isSpecificTag(node, tagRegex) {
    return node && node.nodeName && tagRegex.test(node.nodeName);
  }
  isInsideSpecificTag(node, tagRegex, checkCurrent = false) {
    let currentNode = node;
    if (checkCurrent) {
      if (this.isSpecificTag(currentNode, tagRegex)) {
        return true;
      }
    }
    while (currentNode.parentNode) {
      currentNode = currentNode.parentNode;
      if (this.isSpecificTag(currentNode, tagRegex)) {
        return true;
      }
    }
    return false;
  }
  hasIgnoredClass(node) {
    if (node instanceof Element && node.classList.contains(_BrowserPangu.ignoredClass)) {
      return true;
    }
    if (node.parentNode && node.parentNode instanceof Element && node.parentNode.classList.contains(_BrowserPangu.ignoredClass)) {
      return true;
    }
    return false;
  }
  canIgnoreNode(node) {
    let currentNode = node;
    if (currentNode && (this.isSpecificTag(currentNode, _BrowserPangu.ignoredTags) || this.isContentEditable(currentNode) || this.hasIgnoredClass(currentNode))) {
      return true;
    }
    while (currentNode.parentNode) {
      currentNode = currentNode.parentNode;
      if (currentNode && (this.isSpecificTag(currentNode, _BrowserPangu.ignoredTags) || this.isContentEditable(currentNode))) {
        return true;
      }
    }
    return false;
  }
  isFirstTextChild(parentNode, targetNode) {
    const { childNodes } = parentNode;
    for (let i = 0; i < childNodes.length; i++) {
      const childNode = childNodes[i];
      if (childNode.nodeType !== Node.COMMENT_NODE && childNode.textContent) {
        return childNode === targetNode;
      }
    }
    return false;
  }
  isLastTextChild(parentNode, targetNode) {
    const { childNodes } = parentNode;
    for (let i = childNodes.length - 1; i > -1; i--) {
      const childNode = childNodes[i];
      if (childNode.nodeType !== Node.COMMENT_NODE && childNode.textContent) {
        return childNode === targetNode;
      }
    }
    return false;
  }
  processTextNodes(textNodes) {
    let currentTextNode;
    let nextTextNode = null;
    for (let i = 0; i < textNodes.length; i++) {
      currentTextNode = textNodes[i];
      if (!currentTextNode) {
        continue;
      }
      if (this.canIgnoreNode(currentTextNode)) {
        nextTextNode = currentTextNode;
        continue;
      }
      if (currentTextNode instanceof Text) {
        if (currentTextNode.data.length === 1 && /["\u201c\u201d]/.test(currentTextNode.data)) {
          if (currentTextNode.previousSibling) {
            const prevNode = currentTextNode.previousSibling;
            if (prevNode.nodeType === Node.ELEMENT_NODE && prevNode.textContent) {
              const lastChar = prevNode.textContent.slice(-1);
              if (/[\u4e00-\u9fff]/.test(lastChar)) {
                currentTextNode.data = ` ${currentTextNode.data}`;
              }
            }
          }
        } else {
          const newText = this.spacingText(currentTextNode.data);
          if (currentTextNode.data !== newText) {
            currentTextNode.data = newText;
          }
        }
      }
      if (nextTextNode) {
        if (currentTextNode.nextSibling && _BrowserPangu.spaceLikeTags.test(currentTextNode.nextSibling.nodeName)) {
          nextTextNode = currentTextNode;
          continue;
        }
        if (!(currentTextNode instanceof Text) || !(nextTextNode instanceof Text)) {
          continue;
        }
        const currentEndsWithSpace = currentTextNode.data.endsWith(" ");
        const nextStartsWithSpace = nextTextNode.data.startsWith(" ");
        let hasWhitespaceBetween = false;
        let currentAncestor = currentTextNode;
        while (currentAncestor.parentNode && this.isLastTextChild(currentAncestor.parentNode, currentAncestor) && !_BrowserPangu.spaceSensitiveTags.test(currentAncestor.parentNode.nodeName)) {
          currentAncestor = currentAncestor.parentNode;
        }
        let nextAncestor = nextTextNode;
        while (nextAncestor.parentNode && this.isFirstTextChild(nextAncestor.parentNode, nextAncestor) && !_BrowserPangu.spaceSensitiveTags.test(nextAncestor.parentNode.nodeName)) {
          nextAncestor = nextAncestor.parentNode;
        }
        let nodeBetween = currentAncestor.nextSibling;
        while (nodeBetween && nodeBetween !== nextAncestor) {
          if (nodeBetween.nodeType === Node.TEXT_NODE && nodeBetween.textContent && /\s/.test(nodeBetween.textContent)) {
            hasWhitespaceBetween = true;
            break;
          }
          nodeBetween = nodeBetween.nextSibling;
        }
        if (currentEndsWithSpace || nextStartsWithSpace || hasWhitespaceBetween) {
          nextTextNode = currentTextNode;
          continue;
        }
        const testText = currentTextNode.data.slice(-1) + nextTextNode.data.slice(0, 1);
        const testNewText = this.spacingText(testText);
        const currentLast = currentTextNode.data.slice(-1);
        const nextFirst = nextTextNode.data.slice(0, 1);
        const isQuote = (char) => /["\u201c\u201d]/.test(char);
        const isCJK = (char) => /[\u4e00-\u9fff]/.test(char);
        const skipSpacing = isQuote(currentLast) && isCJK(nextFirst) || isCJK(currentLast) && isQuote(nextFirst);
        if (testNewText !== testText && !skipSpacing) {
          let nextNode = nextTextNode;
          while (nextNode.parentNode && !_BrowserPangu.spaceSensitiveTags.test(nextNode.nodeName) && this.isFirstTextChild(nextNode.parentNode, nextNode)) {
            nextNode = nextNode.parentNode;
          }
          let currentNode = currentTextNode;
          while (currentNode.parentNode && !_BrowserPangu.spaceSensitiveTags.test(currentNode.nodeName) && this.isLastTextChild(currentNode.parentNode, currentNode)) {
            currentNode = currentNode.parentNode;
          }
          if (currentNode.nextSibling) {
            if (_BrowserPangu.spaceLikeTags.test(currentNode.nextSibling.nodeName)) {
              nextTextNode = currentTextNode;
              continue;
            }
          }
          if (!_BrowserPangu.blockTags.test(currentNode.nodeName)) {
            if (!_BrowserPangu.spaceSensitiveTags.test(nextNode.nodeName)) {
              if (!_BrowserPangu.ignoredTags.test(nextNode.nodeName) && !_BrowserPangu.blockTags.test(nextNode.nodeName)) {
                if (nextTextNode.previousSibling) {
                  if (!_BrowserPangu.spaceLikeTags.test(nextTextNode.previousSibling.nodeName)) {
                    if (nextTextNode instanceof Text && !nextTextNode.data.startsWith(" ")) {
                      if (!this.shouldSkipSpacingAfterNode(currentTextNode)) {
                        nextTextNode.data = ` ${nextTextNode.data}`;
                      }
                    }
                  }
                } else {
                  if (!this.canIgnoreNode(nextTextNode)) {
                    if (nextTextNode instanceof Text && !nextTextNode.data.startsWith(" ")) {
                      if (!this.shouldSkipSpacingAfterNode(currentTextNode)) {
                        nextTextNode.data = ` ${nextTextNode.data}`;
                      }
                    }
                  }
                }
              }
            } else if (!_BrowserPangu.spaceSensitiveTags.test(currentNode.nodeName)) {
              if (currentTextNode instanceof Text && !currentTextNode.data.endsWith(" ")) {
                if (!this.shouldSkipSpacingAfterNode(currentTextNode)) {
                  currentTextNode.data = `${currentTextNode.data} `;
                }
              }
            } else {
              if (!this.shouldSkipSpacingAfterNode(currentTextNode)) {
                const panguSpace = document.createElement("pangu");
                panguSpace.innerHTML = " ";
                if (nextNode.parentNode) {
                  if (nextNode.previousSibling) {
                    if (!_BrowserPangu.spaceLikeTags.test(nextNode.previousSibling.nodeName)) {
                      nextNode.parentNode.insertBefore(panguSpace, nextNode);
                    }
                  } else {
                    nextNode.parentNode.insertBefore(panguSpace, nextNode);
                  }
                }
                if (!panguSpace.previousElementSibling) {
                  if (panguSpace.parentNode) {
                    panguSpace.parentNode.removeChild(panguSpace);
                  }
                }
              }
            }
          }
        }
      }
      nextTextNode = currentTextNode;
    }
  }
  collectTextNodes(contextNode, reverse = false) {
    const nodes = [];
    if (!contextNode || contextNode instanceof DocumentFragment) {
      return nodes;
    }
    const walker = document.createTreeWalker(contextNode, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (!node.nodeValue || !/\S/.test(node.nodeValue)) {
          return NodeFilter.FILTER_REJECT;
        }
        let currentNode = node;
        while (currentNode) {
          if (currentNode instanceof Element) {
            if (_BrowserPangu.ignoredTags.test(currentNode.nodeName)) {
              return NodeFilter.FILTER_REJECT;
            }
            if (this.isContentEditable(currentNode)) {
              return NodeFilter.FILTER_REJECT;
            }
            if (currentNode.classList.contains(_BrowserPangu.ignoredClass)) {
              return NodeFilter.FILTER_REJECT;
            }
          }
          currentNode = currentNode.parentNode;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }
    return reverse ? nodes.reverse() : nodes;
  }
  spacingNodeWithTreeWalker(contextNode) {
    if (!(contextNode instanceof Node) || contextNode instanceof DocumentFragment) {
      return;
    }
    const textNodes = this.collectTextNodes(contextNode, true);
    if (this.idleSpacingConfig.enabled) {
      this.processTextNodesWithIdleCallback(textNodes);
    } else {
      this.processTextNodes(textNodes);
    }
  }
  processTextNodesWithIdleCallback(textNodes, onComplete) {
    if (textNodes.length === 0) {
      onComplete == null ? void 0 : onComplete();
      return;
    }
    if (onComplete) {
      this.idleQueue.setOnComplete(onComplete);
    }
    const chunkSize = this.idleSpacingConfig.chunkSize;
    const chunks = [];
    for (let i = 0; i < textNodes.length; i += chunkSize) {
      chunks.push(textNodes.slice(i, i + chunkSize));
    }
    for (const chunk of chunks) {
      this.idleQueue.add(() => {
        this.processTextNodes(chunk);
      });
    }
  }
  setupAutoSpacingPageObserver(nodeDelayMs, nodeMaxWaitMs) {
    if (this.autoSpacingPageObserver) {
      this.autoSpacingPageObserver.disconnect();
      this.autoSpacingPageObserver = null;
    }
    const queue = [];
    const debouncedSpacingTitle = debounce(
      () => {
        this.spacingPageTitle();
      },
      nodeDelayMs,
      nodeMaxWaitMs
    );
    const debouncedSpacingNode = debounce(
      () => {
        if (this.idleSpacingConfig.enabled) {
          const nodesToProcess = [...queue];
          queue.length = 0;
          if (nodesToProcess.length > 0) {
            const allTextNodes = [];
            for (const node of nodesToProcess) {
              if (!(node instanceof Node) || node instanceof DocumentFragment) {
                continue;
              }
              const textNodes = this.collectTextNodes(node, true);
              allTextNodes.push(...textNodes);
            }
            this.processTextNodesWithIdleCallback(allTextNodes);
          }
        } else {
          while (queue.length) {
            const node = queue.shift();
            if (node) {
              this.spacingNode(node);
            }
          }
        }
      },
      nodeDelayMs,
      nodeMaxWaitMs
    );
    this.autoSpacingPageObserver = new MutationObserver((mutations) => {
      var _a;
      let titleChanged = false;
      for (const mutation of mutations) {
        if (((_a = mutation.target.parentNode) == null ? void 0 : _a.nodeName) === "TITLE" || mutation.target.nodeName === "TITLE") {
          titleChanged = true;
          continue;
        }
        switch (mutation.type) {
          case "characterData":
            const { target: node } = mutation;
            if (node.nodeType === Node.TEXT_NODE && node.parentNode) {
              queue.push(node.parentNode);
            }
            break;
          case "childList":
            for (const node2 of mutation.addedNodes) {
              if (node2.nodeType === Node.ELEMENT_NODE) {
                queue.push(node2);
              } else if (node2.nodeType === Node.TEXT_NODE && node2.parentNode) {
                queue.push(node2.parentNode);
              }
            }
            break;
        }
      }
      if (titleChanged) {
        debouncedSpacingTitle();
      }
      debouncedSpacingNode();
    });
    this.autoSpacingPageObserver.observe(document.body, {
      characterData: true,
      childList: true,
      subtree: true
    });
    this.autoSpacingPageObserver.observe(document.head, {
      characterData: true,
      childList: true,
      subtree: true
      // Need subtree to observe text node changes inside title
    });
  }
  // Idle processing configuration methods
  updateIdleSpacingConfig(config) {
    this.idleSpacingConfig = {
      ...this.idleSpacingConfig,
      ...config
    };
  }
  getIdleSpacingConfig() {
    return { ...this.idleSpacingConfig };
  }
  // Visibility check configuration methods
  updateVisibilityCheckConfig(config) {
    this.visibilityCheckConfig = {
      ...this.visibilityCheckConfig,
      ...config
    };
  }
  getVisibilityCheckConfig() {
    return { ...this.visibilityCheckConfig };
  }
  // Visibility checking utility methods
  isElementVisuallyHidden(element) {
    if (!this.visibilityCheckConfig.enabled) {
      return false;
    }
    const style = getComputedStyle(element);
    const config = this.visibilityCheckConfig.commonHiddenPatterns;
    if (config.displayNone && style.display === "none") {
      return true;
    }
    if (config.visibilityHidden && style.visibility === "hidden") {
      return true;
    }
    if (config.opacityZero && parseFloat(style.opacity) === 0) {
      return true;
    }
    if (config.clipRect) {
      const clip = style.clip;
      if (clip && (clip.includes("rect(1px, 1px, 1px, 1px)") || clip.includes("rect(0px, 0px, 0px, 0px)") || clip.includes("rect(0, 0, 0, 0)"))) {
        return true;
      }
    }
    if (config.heightWidth1px) {
      const height = parseInt(style.height, 10);
      const width = parseInt(style.width, 10);
      if (height === 1 && width === 1) {
        const overflow = style.overflow;
        const position = style.position;
        if (overflow === "hidden" && position === "absolute") {
          return true;
        }
      }
    }
    return false;
  }
  shouldSkipSpacingAfterNode(node) {
    if (!this.visibilityCheckConfig.enabled) {
      return false;
    }
    let elementToCheck = null;
    if (node instanceof Element) {
      elementToCheck = node;
    } else if (node.parentElement) {
      elementToCheck = node.parentElement;
    }
    if (elementToCheck && this.isElementVisuallyHidden(elementToCheck)) {
      return true;
    }
    let currentElement = elementToCheck == null ? void 0 : elementToCheck.parentElement;
    while (currentElement) {
      if (this.isElementVisuallyHidden(currentElement)) {
        return true;
      }
      currentElement = currentElement.parentElement;
    }
    return false;
  }
};
__publicField(_BrowserPangu, "blockTags", /^(div|p|h1|h2|h3|h4|h5|h6)$/i);
__publicField(_BrowserPangu, "ignoredTags", /^(code|pre|script|style|textarea|iframe|input)$/i);
__publicField(_BrowserPangu, "presentationalTags", /^(b|code|del|em|i|s|strong|kbd)$/i);
__publicField(_BrowserPangu, "spaceLikeTags", /^(br|hr|i|img|pangu)$/i);
__publicField(_BrowserPangu, "spaceSensitiveTags", /^(a|del|pre|s|strike|u)$/i);
__publicField(_BrowserPangu, "ignoredClass", "no-pangu-spacing");
let BrowserPangu = _BrowserPangu;
const pangu = new BrowserPangu();
export {
  BrowserPangu,
  pangu as default,
  pangu
};
//# sourceMappingURL=pangu.js.map
