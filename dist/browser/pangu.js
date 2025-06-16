import { Pangu } from "../shared/index.js";
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
            const testNewText = this.spacingText(testText);
            if (testText !== testNewText) {
              previousSibling.data = `${previousSibling.data} `;
            }
          }
        }
        if (elementNode.nextSibling) {
          const { nextSibling } = elementNode;
          if (nextSibling.nodeType === Node.TEXT_NODE) {
            const testText = currentTextNode.data.substr(-1) + nextSibling.data.toString().charAt(0);
            const testNewText = this.spacingText(testText);
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
      const newText = this.spacingText(currentTextNode.data);
      if (currentTextNode.data !== newText) {
        currentTextNode.data = newText;
      }
      if (nextTextNode) {
        if (currentTextNode.nextSibling && currentTextNode.nextSibling.nodeName.search(this.spaceLikeTags) >= 0) {
          nextTextNode = currentTextNode;
          continue;
        }
        const testText = currentTextNode.data.toString().substr(-1) + nextTextNode.data.toString().substr(0, 1);
        const testNewText = this.spacingText(testText);
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
    const self = this;
    const debouncedSpacingNodes = debounce(() => {
      while (queue.length) {
        const node = queue.shift();
        if (node) {
          self.spacingNodeSync(node);
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
export {
  BrowserPangu,
  pangu as default,
  pangu
};
//# sourceMappingURL=pangu.js.map
