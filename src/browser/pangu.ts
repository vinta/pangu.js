import { Pangu } from "../shared";

function once<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let executed = false;
  return function (...args: Parameters<T>): ReturnType<T> | undefined {
    if (executed) {
      return undefined;
    }
    executed = true;
    return func(...args);
  };
}

function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number,
  mustRunDelay: number = Infinity
): (...args: Parameters<T>) => void {
  let timer: number | null = null;
  let startTime: number | null = null;

  return function (...args: Parameters<T>): void {
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

// https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType

export class BrowserPangu extends Pangu {
  blockTags: RegExp;
  ignoredTags: RegExp;
  presentationalTags: RegExp;
  spaceLikeTags: RegExp;
  spaceSensitiveTags: RegExp;
  isAutoSpacingPageExecuted: boolean;

  constructor() {
    super();

    this.blockTags = /^(div|p|h1|h2|h3|h4|h5|h6)$/i;
    this.ignoredTags = /^(code|pre|script|style|textarea|iframe)$/i;
    this.presentationalTags = /^(b|code|del|em|i|s|strong|kbd)$/i;
    this.spaceLikeTags = /^(br|hr|i|img|pangu)$/i;
    this.spaceSensitiveTags = /^(a|del|pre|s|strike|u)$/i;
    this.isAutoSpacingPageExecuted = false;
  }

  public spacingNodeByXPath(xPathQuery: string, contextNode: Node): void {
    if (!(contextNode instanceof Node) || (contextNode instanceof DocumentFragment)) {
      return;
    }

    // 因為 xPathQuery 會是用 text() 結尾，所以這些 nodes 會是 text 而不是 DOM element
    // snapshotLength 要配合 XPathResult.ORDERED_NODE_SNAPSHOT_TYPE 使用
    // https://developer.mozilla.org/en-US/docs/DOM/document.evaluate
    // https://developer.mozilla.org/en-US/docs/Web/API/XPathResult
    const textNodes = document.evaluate(xPathQuery, contextNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

    let currentTextNode: Node | null;
    let nextTextNode: Node | null = null;

    // 從最下面、最裡面的節點開始，所以是倒序的
    for (let i = textNodes.snapshotLength - 1; i > -1; --i) {
      currentTextNode = textNodes.snapshotItem(i);
      if (!currentTextNode) continue;

      if (currentTextNode.parentNode && this.isSpecificTag(currentTextNode.parentNode, this.presentationalTags) && !this.isInsideSpecificTag(currentTextNode.parentNode, this.ignoredTags)) {
        const elementNode = currentTextNode.parentNode;

        if (elementNode.previousSibling) {
          const { previousSibling } = elementNode;
          if (previousSibling.nodeType === Node.TEXT_NODE) {
            const testText = (previousSibling as Text).data.slice(-1) + (currentTextNode as Text).data.charAt(0);
            const testNewText = this.spacingText(testText);
            if (testText !== testNewText) {
              (previousSibling as Text).data = `${(previousSibling as Text).data} `;
            }
          }
        }

        if (elementNode.nextSibling) {
          const { nextSibling } = elementNode;
          if (nextSibling.nodeType === Node.TEXT_NODE) {
            const testText = (currentTextNode as Text).data.slice(-1) + (nextSibling as Text).data.charAt(0);
            const testNewText = this.spacingText(testText);
            if (testText !== testNewText) {
              (nextSibling as Text).data = ` ${(nextSibling as Text).data}`;
            }
          }
        }
      }

      if (this.canIgnoreNode(currentTextNode)) {
        nextTextNode = currentTextNode;
        continue;
      }

      if (currentTextNode instanceof Text) {
        const newText = this.spacingText(currentTextNode.data);
        if (currentTextNode.data !== newText) {
          currentTextNode.data = newText;
        }
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
        if (!(currentTextNode instanceof Text) || !(nextTextNode instanceof Text)) {
          continue;
        }
        const testText = currentTextNode.data.slice(-1) + nextTextNode.data.slice(0, 1);
        const testNewText = this.spacingText(testText);
        if (testNewText !== testText) {
          // 往上找 nextTextNode 的 parent node
          // 直到遇到 spaceSensitiveTags
          // 而且 nextTextNode 必須是第一個 text child
          // 才能把空格加在 nextTextNode 的前面
          let nextNode: Node = nextTextNode;
          while (nextNode.parentNode && nextNode.nodeName.search(this.spaceSensitiveTags) === -1 && this.isFirstTextChild(nextNode.parentNode, nextNode)) {
            nextNode = nextNode.parentNode;
          }

          let currentNode: Node = currentTextNode;
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
                    if (nextTextNode instanceof Text) {
                      nextTextNode.data = ` ${nextTextNode.data}`;
                    }
                  }
                } else {
                  // dirty hack
                  if (!this.canIgnoreNode(nextTextNode)) {
                    if (nextTextNode instanceof Text) {
                      nextTextNode.data = ` ${nextTextNode.data}`;
                    }
                  }
                }
              }
            } else if (currentNode.nodeName.search(this.spaceSensitiveTags) === -1) {
              if (currentTextNode instanceof Text) {
                currentTextNode.data = `${currentTextNode.data} `;
              }
            } else {
              const panguSpace = document.createElement('pangu');
              panguSpace.innerHTML = ' ';

              // 避免一直被加空格
              if (nextNode.parentNode) {
                if (nextNode.previousSibling) {
                  if (nextNode.previousSibling.nodeName.search(this.spaceLikeTags) === -1) {
                    nextNode.parentNode.insertBefore(panguSpace, nextNode);
                  }
                } else {
                  nextNode.parentNode.insertBefore(panguSpace, nextNode);
                }
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

  public spacingNode(contextNode: Node): void {
    let xPathQuery = './/*/text()[normalize-space(.)]';
    if (contextNode instanceof Element && contextNode.children && contextNode.children.length === 0) {
      xPathQuery = './/text()[normalize-space(.)]';
    }
    this.spacingNodeByXPath(xPathQuery, contextNode);
  }

  public spacingElementById(idName: string): void {
    const xPathQuery = `id("${idName}")//text()`;
    this.spacingNodeByXPath(xPathQuery, document);
  }

  public spacingElementByClassName(className: string): void {
    const xPathQuery = `//*[contains(concat(" ", normalize-space(@class), " "), "${className}")]//text()`;
    this.spacingNodeByXPath(xPathQuery, document);
  }

  public spacingElementByTagName(tagName: string): void {
    const xPathQuery = `//${tagName}//text()`;
    this.spacingNodeByXPath(xPathQuery, document);
  }

  public spacingPageTitle(): void {
    const xPathQuery = '/html/head/title/text()';
    this.spacingNodeByXPath(xPathQuery, document);
  }

  public spacingPageBody(): void {
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

  public spacingPage(): void {
    this.spacingPageTitle();
    this.spacingPageBody();
  }

  public autoSpacingPage(pageDelay = 1000, nodeDelay = 500, nodeMaxWait = 2000): void {
    if (!(document.body instanceof Node)) {
      return;
    }

    if (this.isAutoSpacingPageExecuted) {
      return;
    }
    this.isAutoSpacingPageExecuted = true;

    const onceSpacingPage = once(() => {
      this.spacingPage();
    });

    // TODO
    // this is a dirty hack for https://github.com/vinta/pangu.js/issues/117
    const videos = document.getElementsByTagName('video');
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
          }, 3000);
          break;
        }
        video.addEventListener('loadeddata', () => {
          setTimeout(() => {
            onceSpacingPage();
          }, 4000);
        });
      }
    }

    const queue: Node[] = [];

    // it's possible that multiple workers process the queue at the same time
    const self = this;
    const debouncedSpacingNodes = debounce(() => {
      // a single node could be very big which contains a lot of child nodes
      while (queue.length) {
        const node = queue.shift();
        if (node) {
          self.spacingNode(node);
        }
      }
    }, nodeDelay, nodeMaxWait);

    // https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
    const mutationObserver = new MutationObserver((mutations) => {
      // Element: https://developer.mozilla.org/en-US/docs/Web/API/Element
      // Text: https://developer.mozilla.org/en-US/docs/Web/API/Text
      mutations.forEach((mutation) => {
        switch (mutation.type) { /* eslint-disable indent */
          case 'childList':
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                queue.push(node);
              } else if (node.nodeType === Node.TEXT_NODE && node.parentNode) {
                queue.push(node.parentNode);
              }
            });
            break;
          case 'characterData':
            const { target: node } = mutation;
            if (node.nodeType === Node.TEXT_NODE && node.parentNode) {
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

  protected isContentEditable(node: any): boolean {
    return ((node.isContentEditable) || (node.getAttribute && node.getAttribute('g_editable') === 'true'));
  }

  protected isSpecificTag(node: any, tagRegex: RegExp): boolean {
    return (node && node.nodeName && node.nodeName.search(tagRegex) >= 0);
  }

  protected isInsideSpecificTag(node: any, tagRegex: RegExp, checkCurrent = false): boolean {
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

  protected canIgnoreNode(node: Node): boolean {
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

  protected isFirstTextChild(parentNode: Node, targetNode: Node): boolean {
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

  protected isLastTextChild(parentNode: Node, targetNode: Node): boolean {
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

}

// Create default instance
const pangu = new BrowserPangu();

// Export for TypeScript/ESM
export { pangu };
export default pangu;
