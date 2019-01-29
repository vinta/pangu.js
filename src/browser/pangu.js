import { Pangu } from '../shared/core';

function debounce(fn, delay, mustRunDelay) {
  let timer = null;
  let startTime = null;
  return () => {
    const self = this;
    const args = arguments;
    const currentTime = + new Date();

    clearTimeout(timer);

    if (!startTime) {
      startTime = currentTime;
    }

    if (currentTime - startTime >= mustRunDelay) {
      fn.apply(self, args);
      startTime = currentTime;
    } else {
      timer = setTimeout(() => {
        fn.apply(self, args);
      }, delay);
    }
  };
}

// https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType

class BrowserPangu extends Pangu {
  constructor() {
    super();

    this.punctuation = '\u3001\u3002\uff01\uff1b\uff0c\uff1a\uff1b\uff1f';
    this.punctuationRegex = new RegExp(`[${this.punctuation}]`);
    this.stopCharRegex = new RegExp(`[ \n\t\\(\\)\\[\\]\\"\\'${this.punctuation}]`);

    this.blockTags = /^(div|p|h1|h2|h3|h4|h5|h6)$/i;
    this.ignoredTags = /^(script|code|pre|textarea)$/i;
    this.presentationalTags = /^(b|code|del|em|i|s|strong)$/i;
    this.spaceLikeTags = /^(br|hr|i|img|pangu)$/i;
    this.spaceSensitiveTags = /^(a|del|pre|s|strike|u)$/i;

    // TODO
    // this.ignoredTags adds iframe|pangu
    // this.ignoreClasses
    // this.ignoreAttributes
  }

  isContentEditable(node) {
    return ((node.isContentEditable) || (node.getAttribute && node.getAttribute('g_editable') === 'true'));
  }

  isSpecificTag(node, tagRegex) {
    return (node && node.nodeName && node.nodeName.search(tagRegex) >= 0);
  }

  isInsideSpecificTag(node, tagRegex) {
    let currentNode = node;
    if (this.isSpecificTag(currentNode, tagRegex)) {
      return true;
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

    // 只判斷第一個含有 text 的 node
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

    // 只判斷倒數第一個含有 text 的 node
    for (let i = childNodes.length - 1; i > -1; i--) {
      const childNode = childNodes[i];
      if (childNode.nodeType !== Node.COMMENT_NODE && childNode.textContent) {
        return childNode === targetNode;
      }
    }
    return false;
  }

  spacingNodeByXPath(xPathQuery, contextNode) {
    // 因為 xPathQuery 會是用 text() 結尾，所以這些 nodes 會是 text 而不是 DOM element
    // snapshotLength 要配合 XPathResult.ORDERED_NODE_SNAPSHOT_TYPE 使用
    // https://developer.mozilla.org/en-US/docs/DOM/document.evaluate
    // https://developer.mozilla.org/en-US/docs/Web/API/XPathResult
    const textNodes = document.evaluate(xPathQuery, contextNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

    let currentTextNode;
    let nextTextNode;

    // 從最下面、最裡面的節點開始，所以是倒序的
    for (let i = textNodes.snapshotLength - 1; i > -1; --i) {
      currentTextNode = textNodes.snapshotItem(i);

      if (this.isInsideSpecificTag(currentTextNode, this.presentationalTags)) {
        const elementNode = currentTextNode.parentNode;

        if (currentTextNode.data.charAt(0).search(this.punctuationRegex) === -1) {
          // TODO
          // 如果 previousSibling 或 nextSibling 是 <pre> 的話不應該加空格
          if (elementNode.previousSibling) {
            const { previousSibling } = elementNode;
            if (previousSibling.nodeType === Node.TEXT_NODE) {
              if (previousSibling.data.substr(-1).search(this.stopCharRegex) === -1) {
                previousSibling.data = `${previousSibling.data} `;
              }
            }
          }
        }

        if (currentTextNode.data.substr(-1).search(this.punctuationRegex) === -1) {
          if (elementNode.nextSibling) {
            const { nextSibling } = elementNode;
            if (nextSibling.nodeType === Node.TEXT_NODE) {
              if (nextSibling.data.charAt(0).search(this.stopCharRegex) === -1) {
                nextSibling.data = ` ${nextSibling.data}`;
              }
            }
          }
        }
      }

      if (this.canIgnoreNode(currentTextNode)) {
        nextTextNode = currentTextNode;
        continue;
      }

      const newText = this.spacing(currentTextNode.data);
      if (currentTextNode.data !== newText) {
        currentTextNode.data = newText;
      }

      // 處理嵌套的 <tag> 中的文字
      if (nextTextNode) {
        // TODO
        // 現在只是簡單地判斷相鄰的下一個 node 是不是 <br>
        // 萬一遇上嵌套的標籤就不行了
        if (currentTextNode.nextSibling && currentTextNode.nextSibling.nodeName.search(this.spaceLikeTags) >= 0) {
          nextTextNode = currentTextNode;
          continue;
        }

        // currentTextNode 的最後一個字 + nextTextNode 的第一個字
        const testText = currentTextNode.data.toString().substr(-1) + nextTextNode.data.toString().substr(0, 1);
        const testNewText = this.spacing(testText);
        if (testNewText !== testText) {
          // 往上找 nextTextNode 的 parent node
          // 直到遇到 spaceSensitiveTags
          // 而且 nextTextNode 必須是第一個 text child
          // 才能把空格加在 nextTextNode 的前面
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
              if ((nextNode.nodeName.search(this.ignoredTags) === -1) && (nextNode.nodeName.search(this.blockTags) === -1)) {
                if (nextTextNode.previousSibling) {
                  if (nextTextNode.previousSibling.nodeName.search(this.spaceLikeTags) === -1) {
                    nextTextNode.data = ` ${nextTextNode.data}`;
                  }
                } else {
                  // dirty hack
                  if (!this.canIgnoreNode(nextTextNode)) {
                    nextTextNode.data = ` ${nextTextNode.data}`;
                  }
                }
              }
            } else if (currentNode.nodeName.search(this.spaceSensitiveTags) === -1) {
              currentTextNode.data = `${currentTextNode.data} `;
            } else {
              const panguSpace = document.createElement('pangu');
              panguSpace.innerHTML = ' ';

              // 避免一直被加空格
              if (nextNode.previousSibling) {
                if (nextNode.previousSibling.nodeName.search(this.spaceLikeTags) === -1) {
                  nextNode.parentNode.insertBefore(panguSpace, nextNode);
                }
              } else {
                nextNode.parentNode.insertBefore(panguSpace, nextNode);
              }

              // TODO
              // 主要是想要避免在元素（通常都是 <li>）的開頭加空格
              // 這個做法有點蠢，但是不管還是先硬上
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

  spacingNode(contextNode) {
    let xPathQuery = './/*/text()[normalize-space(.)]';
    if (contextNode.children && contextNode.children.length === 0) {
      xPathQuery = './/text()[normalize-space(.)]';
    }
    this.spacingNodeByXPath(xPathQuery, contextNode);
  }

  spacingElementById(idName) {
    const xPathQuery = `id("${idName}")//text()`;
    this.spacingNodeByXPath(xPathQuery, document);
  }

  spacingElementByClassName(className) {
    const xPathQuery = `//*[contains(concat(" ", normalize-space(@class), " "), "${className}")]//text()`;
    this.spacingNodeByXPath(xPathQuery, document);
  }

  spacingElementByTagName(tagName) {
    const xPathQuery = `//${tagName}//text()`;
    this.spacingNodeByXPath(xPathQuery, document);
  }

  spacingPageTitle() {
    const xPathQuery = '/html/head/title/text()';
    this.spacingNodeByXPath(xPathQuery, document);
  }

  spacingPageBody() {
    // // >> 任意位置的節點
    // . >> 當前節點
    // .. >> 父節點
    // [] >> 條件
    // text() >> 節點的文字內容，例如 hello 之於 <tag>hello</tag>
    // https://www.w3schools.com/xml/xpath_syntax.asp
    //
    // [@contenteditable]
    // 帶有 contenteditable 屬性的節點
    //
    // normalize-space(.)
    // 當前節點的頭尾的空白字元都會被移除，大於兩個以上的空白字元會被置換成單一空白
    // https://developer.mozilla.org/en-US/docs/Web/XPath/Functions/normalize-space
    //
    // name(..)
    // 父節點的名稱
    // https://developer.mozilla.org/en-US/docs/Web/XPath/Functions/name
    //
    // translate(string, "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz")
    // 將 string 轉換成小寫，因為 XML 是 case-sensitive 的
    // https://developer.mozilla.org/en-US/docs/Web/XPath/Functions/translate
    //
    // 1. 處理 <title>
    // 2. 處理 <body> 底下的節點
    // 3. 略過 contentEditable 的節點
    // 4. 略過特定節點，例如 <script> 和 <style>
    //
    // 注意，以下的 query 只會取出各節點的 text 內容！
    let xPathQuery = '/html/body//*/text()[normalize-space(.)]';
    ['script', 'style', 'textarea'].forEach((tag) => {
      // 理論上這幾個 tag 裡面不會包含其他 tag
      // 所以可以直接用 .. 取父節點
      // ex: [translate(name(..), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz") != "script"]
      xPathQuery = `${xPathQuery}[translate(name(..),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")!="${tag}"]`;
    });
    this.spacingNodeByXPath(xPathQuery, document);
  }

  // TODO: 支援 callback 和 promise
  spacingPage() {
    this.spacingPageTitle();
    this.spacingPageBody();
  }

  autoSpacingPage() {
    if (!(document.body instanceof Node)) {
      return;
    }

    const self = this;
    const queue = [];

    setTimeout(() => {
      self.spacingPage();
    }, 1000);

    // it's possible that multiple workers process the queue at the same time
    const debouncedSpacingNodes = debounce(() => {
      // a single node could be very big which contains a lot of child nodes
      while (queue.length) {
        const node = queue.shift();
        if (node) {
          self.spacingNode(node);
        }
      }
    }, 500, {'maxWait': 2000});

    // https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
    const mutationObserver = new MutationObserver((mutations, observer) => {
      // Element: https://developer.mozilla.org/en-US/docs/Web/API/Element
      // Text: https://developer.mozilla.org/en-US/docs/Web/API/Text
      mutations.forEach((mutation) => {
        switch (mutation.type) { /* eslint-disable indent */
          case 'childList':
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                queue.push(node);
              } else if (node.nodeType === Node.TEXT_NODE) {
                queue.push(node.parentNode);
              }
            });
            break;
          case 'characterData':
            const { target: node } = mutation;
            if (node.nodeType === Node.TEXT_NODE) {
              queue.push(node.parentNode);
            }
            break;
          default:
            break;
        }
      });

      debouncedSpacingNodes();
    });
    mutationObserver.observe(document.body, {
      characterData: true,
      childList: true,
      subtree: true,
    });
  }
}

const pangu = new BrowserPangu();

module.exports = pangu;
module.exports.default = pangu;
module.exports.Pangu = BrowserPangu;
