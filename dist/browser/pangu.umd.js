(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, global.pangu = factory());
})(this, function() {
  "use strict";
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
      this.version = "5.0.0";
    }
    convertToFullwidth(symbols) {
      return symbols.replace(/~/g, "～").replace(/!/g, "！").replace(/;/g, "；").replace(/:/g, "：").replace(/,/g, "，").replace(/\./g, "。").replace(/\?/g, "？");
    }
    spacingSync(text) {
      if (typeof text !== "string") {
        console.warn(`spacing(text) only accepts string but got ${typeof text}`);
        return text;
      }
      if (text.length <= 1 || !ANY_CJK.test(text)) {
        return text;
      }
      const self2 = this;
      let newText = text;
      newText = newText.replace(CONVERT_TO_FULLWIDTH_CJK_SYMBOLS_CJK, (_match, leftCjk, symbols, rightCjk) => {
        const fullwidthSymbols = self2.convertToFullwidth(symbols);
        return `${leftCjk}${fullwidthSymbols}${rightCjk}`;
      });
      newText = newText.replace(CONVERT_TO_FULLWIDTH_CJK_SYMBOLS, (_match, cjk, symbols) => {
        const fullwidthSymbols = self2.convertToFullwidth(symbols);
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
    spacing(text) {
      return this.spacingSync(text);
    }
  }
  function once(func) {
    let executed = false;
    return function(...args) {
      if (executed) {
        return;
      }
      executed = true;
      return func.apply(this, args);
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
        func.apply(this, args);
        startTime = currentTime;
      } else {
        timer = window.setTimeout(() => {
          func.apply(this, args);
        }, delay);
      }
    };
  }
  class BrowserPangu extends Pangu {
    constructor() {
      super();
      this.blockTags = /^(div|p|h1|h2|h3|h4|h5|h6)$/i;
      this.ignoredTags = /^(script|code|pre|textarea)$/i;
      this.presentationalTags = /^(b|code|del|em|i|s|strong|kbd)$/i;
      this.spaceLikeTags = /^(br|hr|i|img|pangu)$/i;
      this.spaceSensitiveTags = /^(a|del|pre|s|strike|u)$/i;
      this.isAutoSpacingPageExecuted = false;
    }
    isContentEditable(node) {
      return node.isContentEditable || node.getAttribute && node.getAttribute("g_editable") === "true";
    }
    isSpecificTag(node, tagRegex) {
      return node && node.nodeName && node.nodeName.search(tagRegex) >= 0;
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
    canIgnoreNode(node) {
      let currentNode = node;
      if (currentNode && (this.isSpecificTag(currentNode, this.ignoredTags) || this.isContentEditable(currentNode))) {
        return true;
      }
      while (currentNode.parentNode) {
        currentNode = currentNode.parentNode;
        if (currentNode && (this.isSpecificTag(currentNode, this.ignoredTags) || this.isContentEditable(currentNode))) {
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
    spacingNodeByXPath(xPathQuery, contextNode) {
      if (!(contextNode instanceof Node) || contextNode instanceof DocumentFragment) {
        return;
      }
      const textNodes = document.evaluate(xPathQuery, contextNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      let currentTextNode;
      let nextTextNode;
      for (let i = textNodes.snapshotLength - 1; i > -1; --i) {
        currentTextNode = textNodes.snapshotItem(i);
        if (this.isSpecificTag(currentTextNode.parentNode, this.presentationalTags) && !this.isInsideSpecificTag(currentTextNode.parentNode, this.ignoredTags)) {
          const elementNode = currentTextNode.parentNode;
          if (elementNode.previousSibling) {
            const { previousSibling } = elementNode;
            if (previousSibling.nodeType === Node.TEXT_NODE) {
              const testText = previousSibling.data.substr(-1) + currentTextNode.data.toString().charAt(0);
              const testNewText = this.spacingSync(testText);
              if (testText !== testNewText) {
                previousSibling.data = `${previousSibling.data} `;
              }
            }
          }
          if (elementNode.nextSibling) {
            const { nextSibling } = elementNode;
            if (nextSibling.nodeType === Node.TEXT_NODE) {
              const testText = currentTextNode.data.substr(-1) + nextSibling.data.toString().charAt(0);
              const testNewText = this.spacingSync(testText);
              if (testText !== testNewText) {
                nextSibling.data = ` ${nextSibling.data}`;
              }
            }
          }
        }
        if (this.canIgnoreNode(currentTextNode)) {
          nextTextNode = currentTextNode;
          continue;
        }
        const newText = this.spacingSync(currentTextNode.data);
        if (currentTextNode.data !== newText) {
          currentTextNode.data = newText;
        }
        if (nextTextNode) {
          if (currentTextNode.nextSibling && currentTextNode.nextSibling.nodeName.search(this.spaceLikeTags) >= 0) {
            nextTextNode = currentTextNode;
            continue;
          }
          const testText = currentTextNode.data.toString().substr(-1) + nextTextNode.data.toString().substr(0, 1);
          const testNewText = this.spacingSync(testText);
          if (testNewText !== testText) {
            let nextNode = nextTextNode;
            while (nextNode.parentNode && nextNode.nodeName.search(this.spaceSensitiveTags) === -1 && this.isFirstTextChild(nextNode.parentNode, nextNode)) {
              nextNode = nextNode.parentNode;
            }
            let currentNode = currentTextNode;
            while (currentNode.parentNode && currentNode.nodeName.search(this.spaceSensitiveTags) === -1 && this.isLastTextChild(currentNode.parentNode, currentNode)) {
              currentNode = currentNode.parentNode;
            }
            if (currentNode.nextSibling) {
              if (currentNode.nextSibling.nodeName.search(this.spaceLikeTags) >= 0) {
                nextTextNode = currentTextNode;
                continue;
              }
            }
            if (currentNode.nodeName.search(this.blockTags) === -1) {
              if (nextNode.nodeName.search(this.spaceSensitiveTags) === -1) {
                if (nextNode.nodeName.search(this.ignoredTags) === -1 && nextNode.nodeName.search(this.blockTags) === -1) {
                  if (nextTextNode.previousSibling) {
                    if (nextTextNode.previousSibling.nodeName.search(this.spaceLikeTags) === -1) {
                      nextTextNode.data = ` ${nextTextNode.data}`;
                    }
                  } else {
                    if (!this.canIgnoreNode(nextTextNode)) {
                      nextTextNode.data = ` ${nextTextNode.data}`;
                    }
                  }
                }
              } else if (currentNode.nodeName.search(this.spaceSensitiveTags) === -1) {
                currentTextNode.data = `${currentTextNode.data} `;
              } else {
                const panguSpace = document.createElement("pangu");
                panguSpace.innerHTML = " ";
                if (nextNode.previousSibling) {
                  if (nextNode.previousSibling.nodeName.search(this.spaceLikeTags) === -1) {
                    nextNode.parentNode.insertBefore(panguSpace, nextNode);
                  }
                } else {
                  nextNode.parentNode.insertBefore(panguSpace, nextNode);
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
        nextTextNode = currentTextNode;
      }
    }
    spacingNodeSync(contextNode) {
      let xPathQuery = ".//*/text()[normalize-space(.)]";
      if (contextNode instanceof Element && contextNode.children && contextNode.children.length === 0) {
        xPathQuery = ".//text()[normalize-space(.)]";
      }
      this.spacingNodeByXPath(xPathQuery, contextNode);
    }
    async spacingNode(contextNode) {
      return this.spacingNodeSync(contextNode);
    }
    spacingElementByIdSync(idName) {
      const xPathQuery = `id("${idName}")//text()`;
      this.spacingNodeByXPath(xPathQuery, document);
    }
    async spacingElementById(idName) {
      return this.spacingElementByIdSync(idName);
    }
    spacingElementByClassNameSync(className) {
      const xPathQuery = `//*[contains(concat(" ", normalize-space(@class), " "), "${className}")]//text()`;
      this.spacingNodeByXPath(xPathQuery, document);
    }
    async spacingElementByClassName(className) {
      return this.spacingElementByClassNameSync(className);
    }
    spacingElementByTagNameSync(tagName) {
      const xPathQuery = `//${tagName}//text()`;
      this.spacingNodeByXPath(xPathQuery, document);
    }
    async spacingElementByTagName(tagName) {
      return this.spacingElementByTagNameSync(tagName);
    }
    spacingPageTitleSync() {
      const xPathQuery = "/html/head/title/text()";
      this.spacingNodeByXPath(xPathQuery, document);
    }
    async spacingPageTitle() {
      return this.spacingPageTitleSync();
    }
    spacingPageBodySync() {
      let xPathQuery = "/html/body//*/text()[normalize-space(.)]";
      ["script", "style", "textarea"].forEach((tag) => {
        xPathQuery = `${xPathQuery}[translate(name(..),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")!="${tag}"]`;
      });
      this.spacingNodeByXPath(xPathQuery, document);
    }
    async spacingPageBody() {
      return this.spacingPageBodySync();
    }
    spacingPageSync() {
      this.spacingPageTitleSync();
      this.spacingPageBodySync();
    }
    async spacingPage() {
      await this.spacingPageTitle();
      await this.spacingPageBody();
    }
    autoSpacingPage(pageDelay = 1e3, nodeDelay = 500, nodeMaxWait = 2e3) {
      if (!(document.body instanceof Node)) {
        return;
      }
      if (this.isAutoSpacingPageExecuted) {
        return;
      }
      this.isAutoSpacingPageExecuted = true;
      const onceSpacingPage = once(() => {
        this.spacingPageSync();
      });
      const videos = document.getElementsByTagName("video");
      if (videos.length === 0) {
        setTimeout(() => {
          onceSpacingPage();
        }, pageDelay);
      } else {
        for (let i = 0; i < videos.length; i++) {
          const video = videos[i];
          if (video.readyState === 4) {
            setTimeout(() => {
              onceSpacingPage();
            }, 3e3);
            break;
          }
          video.addEventListener("loadeddata", () => {
            setTimeout(() => {
              onceSpacingPage();
            }, 4e3);
          });
        }
      }
      const queue = [];
      const self2 = this;
      const debouncedSpacingNodes = debounce(() => {
        while (queue.length) {
          const node = queue.shift();
          if (node) {
            self2.spacingNodeSync(node);
          }
        }
      }, nodeDelay, nodeMaxWait);
      const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          switch (mutation.type) {
            /* eslint-disable indent */
            case "childList":
              mutation.addedNodes.forEach((node2) => {
                if (node2.nodeType === Node.ELEMENT_NODE) {
                  queue.push(node2);
                } else if (node2.nodeType === Node.TEXT_NODE && node2.parentNode) {
                  queue.push(node2.parentNode);
                }
              });
              break;
            case "characterData":
              const { target: node } = mutation;
              if (node.nodeType === Node.TEXT_NODE && node.parentNode) {
                queue.push(node.parentNode);
              }
              break;
          }
        });
        debouncedSpacingNodes();
      });
      mutationObserver.observe(document.body, {
        characterData: true,
        childList: true,
        subtree: true
      });
    }
  }
  const pangu = new BrowserPangu();
  pangu.BrowserPangu = BrowserPangu;
  return pangu;
});
//# sourceMappingURL=pangu.umd.js.map
