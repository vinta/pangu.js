import { Pangu } from '../shared';

export interface AutoSpacingPageConfig {
  pageDelayMs?: number;
  nodeDelayMs?: number;
  nodeMaxWaitMs?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function once<T extends (...args: any[]) => any>(func: T) {
  let executed = false;
  return function (...args: Parameters<T>) {
    if (executed) {
      return undefined;
    }
    executed = true;
    return func(...args);
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => void>(func: T, delay: number, mustRunDelay: number = Infinity) {
  let timer: number | null = null;
  let startTime: number | null = null;

  return function (...args: Parameters<T>) {
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

export class BrowserPangu extends Pangu {
  public isAutoSpacingPageExecuted: boolean;
  protected autoSpacingPageObserver: MutationObserver | null;

  public blockTags: RegExp;
  public ignoredTags: RegExp;
  public presentationalTags: RegExp;
  public spaceLikeTags: RegExp;
  public spaceSensitiveTags: RegExp;
  public ignoredClass: string;

  constructor() {
    super();

    this.isAutoSpacingPageExecuted = false;
    this.autoSpacingPageObserver = null;

    this.blockTags = /^(div|p|h1|h2|h3|h4|h5|h6)$/i;
    this.ignoredTags = /^(code|pre|script|style|textarea|iframe|input)$/i;
    this.presentationalTags = /^(b|code|del|em|i|s|strong|kbd)$/i;
    this.spaceLikeTags = /^(br|hr|i|img|pangu)$/i;
    this.spaceSensitiveTags = /^(a|del|pre|s|strike|u)$/i;
    this.ignoredClass = 'no-pangu-spacing';
  }

  public autoSpacingPage({ pageDelayMs = 1000, nodeDelayMs = 500, nodeMaxWaitMs = 2000 }: AutoSpacingPageConfig = {}) {
    if (!(document.body instanceof Node)) {
      return;
    }

    if (this.isAutoSpacingPageExecuted) {
      return;
    }

    this.isAutoSpacingPageExecuted = true;

    // FIXME
    // Dirty hack for https://github.com/vinta/pangu.js/issues/117
    const spacingPageOnce = once(() => {
      this.spacingPage();
    });
    const videos = document.getElementsByTagName('video');
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
          }, 3000);
          break;
        }
        video.addEventListener('loadeddata', () => {
          setTimeout(() => {
            spacingPageOnce();
          }, 4000);
        });
      }
    }

    this.setupAutoSpacingPageObserver(nodeDelayMs, nodeMaxWaitMs);
  }

  public spacingPage() {
    this.spacingPageTitle();
    this.spacingPageBody();
  }

  public spacingPageTitle() {
    const xPathQuery = '/html/head/title/text()';
    this.spacingNodeByXPath(xPathQuery, document);
  }

  public spacingPageBody() {
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
    for (const tag of ['script', 'style', 'textarea']) {
      // 理論上這幾個 tag 裡面不會包含其他 tag
      // 所以可以直接用 .. 取父節點
      // 例如 [translate(name(..), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz") != "script"]
      xPathQuery = `${xPathQuery}[translate(name(..),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")!="${tag}"]`;
    }
    this.spacingNodeByXPath(xPathQuery, document);
  }

  public spacingNode(contextNode: Node) {
    // Use .//text() to include all text nodes, not just those that are children of elements
    // This handles cases like <div><span>社</span>"<span>DF</span></div>
    // where the quote is a direct child of the div
    //
    // The normalize-space(.) predicate "filters out" text nodes that contain only whitespace
    //
    // Example HTML with CSS {white-space: pre-wrap}
    //   <div>
    //     "整天等"
    //     "EAS"
    //     "build"
    //   </div>
    //
    // This creates these text nodes:
    // 1. "整天等"     -> selected (has content)
    // 2. "\n  "      -> filtered out (whitespace only)
    // 3. "EAS"       -> selected (has content)
    // 4. "\n  "      -> filtered out (whitespace only)
    // 5. "build"     -> selected (has content)
    //
    // Without normalize-space, we'd process the whitespace nodes too, which would:
    // - Impact performance (processing many empty nodes)
    // - Add complexity (algorithm expects meaningful content)
    //
    // However, those filtered whitespace nodes still exist in the DOM and can render
    // as spaces with CSS like white-space: pre-wrap. This is why spacingNodeByXPath
    // includes logic to detect whitespace between selected text nodes.
    const xPathQuery = './/text()[normalize-space(.)]';
    this.spacingNodeByXPath(xPathQuery, contextNode);
  }

  public spacingElementById(idName: string) {
    const xPathQuery = `id("${idName}")//text()`;
    this.spacingNodeByXPath(xPathQuery, document);
  }

  public spacingElementByClassName(className: string) {
    const xPathQuery = `//*[contains(concat(" ", normalize-space(@class), " "), "${className}")]//text()`;
    this.spacingNodeByXPath(xPathQuery, document);
  }

  public spacingElementByTagName(tagName: string) {
    const xPathQuery = `//${tagName}//text()`;
    this.spacingNodeByXPath(xPathQuery, document);
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
  public spacingNodeByXPath(xPathQuery: string, contextNode: Node) {
    // DocumentFragments don't support XPath queries
    if (!(contextNode instanceof Node) || contextNode instanceof DocumentFragment) {
      return;
    }

    // 因為 xPathQuery 會是用 text() 結尾，所以這些 nodes 會是 text 而不是 DOM element
    // snapshotLength 要配合 XPathResult.ORDERED_NODE_SNAPSHOT_TYPE 使用
    // https://developer.mozilla.org/en-US/docs/Web/API/Document/evaluate
    // https://developer.mozilla.org/en-US/docs/Web/API/XPathResult
    const textNodes = document.evaluate(xPathQuery, contextNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

    let currentTextNode: Node | null;
    let nextTextNode: Node | null = null;

    // 從最下面、最裡面的節點開始，所以是倒序的
    for (let i = textNodes.snapshotLength - 1; i > -1; --i) {
      currentTextNode = textNodes.snapshotItem(i);
      if (!currentTextNode) {
        continue;
      }

      // Skip presentational tag handling - it's causing issues with fragmented nodes
      // The main spacing logic below handles most cases correctly

      if (this.canIgnoreNode(currentTextNode)) {
        nextTextNode = currentTextNode;
        continue;
      }

      if (currentTextNode instanceof Text) {
        // Special handling for standalone quote nodes
        if (currentTextNode.data.length === 1 && /["\u201c\u201d]/.test(currentTextNode.data)) {
          // Check context to determine if space is needed before the quote
          if (currentTextNode.previousSibling) {
            const prevNode = currentTextNode.previousSibling;
            if (prevNode.nodeType === Node.ELEMENT_NODE && prevNode.textContent) {
              const lastChar = prevNode.textContent.slice(-1);
              // If previous element ends with CJK, add space before quote
              if (/[\u4e00-\u9fff]/.test(lastChar)) {
                currentTextNode.data = ` ${currentTextNode.data}`;
              }
            }
          }
        } else {
          // Normal text processing
          const newText = this.spacingText(currentTextNode.data);
          if (currentTextNode.data !== newText) {
            currentTextNode.data = newText;
          }
        }
      }

      // 處理嵌套的 <tag> 中的文字
      if (nextTextNode) {
        // TODO
        // 現在只是簡單地判斷相鄰的下一個 node 是不是 <br>
        // 萬一遇上嵌套的標籤就不行了
        if (currentTextNode.nextSibling && this.spaceLikeTags.test(currentTextNode.nextSibling.nodeName)) {
          nextTextNode = currentTextNode;
          continue;
        }

        // currentTextNode 的最後一個字 + nextTextNode 的第一個字
        if (!(currentTextNode instanceof Text) || !(nextTextNode instanceof Text)) {
          continue;
        }

        // Check if there's already proper spacing between nodes
        const currentEndsWithSpace = currentTextNode.data.endsWith(' ');
        const nextStartsWithSpace = nextTextNode.data.startsWith(' ');

        // Check if there's whitespace between the nodes (e.g., newlines that render as spaces with white-space: pre-wrap)
        let hasWhitespaceBetween = false;
        let nodeBetween = currentTextNode.nextSibling;
        while (nodeBetween && nodeBetween !== nextTextNode) {
          if (nodeBetween.nodeType === Node.TEXT_NODE && nodeBetween.textContent && /\s/.test(nodeBetween.textContent)) {
            hasWhitespaceBetween = true;
            break;
          }
          nodeBetween = nodeBetween.nextSibling;
        }

        // If either node already has space at the boundary, or there's whitespace between nodes, skip processing
        if (currentEndsWithSpace || nextStartsWithSpace || hasWhitespaceBetween) {
          nextTextNode = currentTextNode;
          continue;
        }

        const testText = currentTextNode.data.slice(-1) + nextTextNode.data.slice(0, 1);
        const testNewText = this.spacingText(testText);

        // Special handling for quotes to prevent breaking quoted content
        const currentLast = currentTextNode.data.slice(-1);
        const nextFirst = nextTextNode.data.slice(0, 1);
        const isQuote = (char: string) => /["\u201c\u201d]/.test(char);
        const isCJK = (char: string) => /[\u4e00-\u9fff]/.test(char);

        // Skip spacing in these cases:
        // 1. Quote followed by CJK (e.g., "中)
        // 2. CJK followed by quote (e.g., 容")
        const skipSpacing = (isQuote(currentLast) && isCJK(nextFirst)) || (isCJK(currentLast) && isQuote(nextFirst));

        if (testNewText !== testText && !skipSpacing) {
          // 往上找 nextTextNode 的 parent node
          // 直到遇到 spaceSensitiveTags
          // 而且 nextTextNode 必須是第一個 text child
          // 才能把空格加在 nextTextNode 的前面
          let nextNode: Node = nextTextNode;
          while (nextNode.parentNode && !this.spaceSensitiveTags.test(nextNode.nodeName) && this.isFirstTextChild(nextNode.parentNode, nextNode)) {
            nextNode = nextNode.parentNode;
          }

          let currentNode: Node = currentTextNode;
          while (currentNode.parentNode && !this.spaceSensitiveTags.test(currentNode.nodeName) && this.isLastTextChild(currentNode.parentNode, currentNode)) {
            currentNode = currentNode.parentNode;
          }

          if (currentNode.nextSibling) {
            if (this.spaceLikeTags.test(currentNode.nextSibling.nodeName)) {
              nextTextNode = currentTextNode;
              continue;
            }
          }

          if (!this.blockTags.test(currentNode.nodeName)) {
            if (!this.spaceSensitiveTags.test(nextNode.nodeName)) {
              if (!this.ignoredTags.test(nextNode.nodeName) && !this.blockTags.test(nextNode.nodeName)) {
                if (nextTextNode.previousSibling) {
                  if (!this.spaceLikeTags.test(nextTextNode.previousSibling.nodeName)) {
                    if (nextTextNode instanceof Text && !nextTextNode.data.startsWith(' ')) {
                      nextTextNode.data = ` ${nextTextNode.data}`;
                    }
                  }
                } else {
                  // dirty hack
                  if (!this.canIgnoreNode(nextTextNode)) {
                    if (nextTextNode instanceof Text && !nextTextNode.data.startsWith(' ')) {
                      nextTextNode.data = ` ${nextTextNode.data}`;
                    }
                  }
                }
              }
            } else if (!this.spaceSensitiveTags.test(currentNode.nodeName)) {
              if (currentTextNode instanceof Text && !currentTextNode.data.endsWith(' ')) {
                currentTextNode.data = `${currentTextNode.data} `;
              }
            } else {
              const panguSpace = document.createElement('pangu');
              panguSpace.innerHTML = ' ';

              // 避免一直被加空格
              if (nextNode.parentNode) {
                if (nextNode.previousSibling) {
                  if (!this.spaceLikeTags.test(nextNode.previousSibling.nodeName)) {
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

  public stopAutoSpacingPage() {
    if (this.autoSpacingPageObserver) {
      this.autoSpacingPageObserver.disconnect();
      this.autoSpacingPageObserver = null;
    }

    this.isAutoSpacingPageExecuted = false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected isContentEditable(node: any) {
    return node.isContentEditable || (node.getAttribute && node.getAttribute('g_editable') === 'true');
  }

  protected isSpecificTag(node: Node, tagRegex: RegExp) {
    return node && node.nodeName && tagRegex.test(node.nodeName);
  }

  protected isInsideSpecificTag(node: Node, tagRegex: RegExp, checkCurrent = false) {
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

  protected hasIgnoredClass(node: Node) {
    // Check the node itself if it's an element
    if (node instanceof Element && node.classList.contains(this.ignoredClass)) {
      return true;
    }
    // Check the parent node (for text nodes)
    if (node.parentNode && node.parentNode instanceof Element && node.parentNode.classList.contains(this.ignoredClass)) {
      return true;
    }
    return false;
  }

  protected canIgnoreNode(node: Node) {
    let currentNode = node;
    if (currentNode && (this.isSpecificTag(currentNode, this.ignoredTags) || this.isContentEditable(currentNode) || this.hasIgnoredClass(currentNode))) {
      // We will skip processing any children of ignored elements, so don't need to check all ancestors
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

  protected isFirstTextChild(parentNode: Node, targetNode: Node) {
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

  protected isLastTextChild(parentNode: Node, targetNode: Node) {
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

  protected setupAutoSpacingPageObserver(nodeDelayMs: number, nodeMaxWaitMs: number) {
    // Disconnect any existing auto-spacing observer
    if (this.autoSpacingPageObserver) {
      this.autoSpacingPageObserver.disconnect();
      this.autoSpacingPageObserver = null;
    }

    const queue: Node[] = [];

    const debouncedSpacingTitle = debounce(
      () => {
        this.spacingPageTitle();
      },
      nodeDelayMs,
      nodeMaxWaitMs,
    );

    const debouncedSpacingNode = debounce(
      () => {
        // NOTE: a single node could be very big which contains a lot of child nodes
        while (queue.length) {
          const node = queue.shift();
          if (node) {
            this.spacingNode(node);
          }
        }
      },
      nodeDelayMs,
      nodeMaxWaitMs,
    );

    // https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
    this.autoSpacingPageObserver = new MutationObserver((mutations) => {
      let titleChanged = false;

      // Element: https://developer.mozilla.org/en-US/docs/Web/API/Element
      // Text: https://developer.mozilla.org/en-US/docs/Web/API/Text
      for (const mutation of mutations) {
        // Skip to avoid double processing - title handled separately by debouncedSpacingTitle()
        if (mutation.target.parentNode?.nodeName === 'TITLE' || mutation.target.nodeName === 'TITLE') {
          titleChanged = true;
          continue;
        }

        // Queue parent elements for spacing processing
        switch (mutation.type) {
          case 'characterData':
            // Text content changed (e.g., textContent = '新文字new text')
            const { target: node } = mutation;
            if (node.nodeType === Node.TEXT_NODE && node.parentNode) {
              // <p>Hello 世界</p>
              // "Hello 世界" is the text node, <p> is the parent element
              queue.push(node.parentNode); // Queue parent element, not text node
            }
            break;
          case 'childList':
            // New nodes added to DOM (e.g., innerHTML change, appendChild)
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                queue.push(node); // Element added, process its text content
              } else if (node.nodeType === Node.TEXT_NODE && node.parentNode) {
                queue.push(node.parentNode); // Text node added, process its parent
              }
            }
            break;
          default:
            break;
        }
      }

      if (titleChanged) {
        debouncedSpacingTitle();
      }

      debouncedSpacingNode();
    });

    // NOTE: A single MutationObserver can observe multiple targets simultaneously
    // https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/observe:

    // Observe page content changes
    this.autoSpacingPageObserver.observe(document.body, {
      characterData: true,
      childList: true,
      subtree: true,
    });

    // Observe page title changes
    this.autoSpacingPageObserver.observe(document.head, {
      characterData: true,
      childList: true,
      subtree: true, // Need subtree to observe text node changes inside title
    });
  }
}

export const pangu = new BrowserPangu();

export default pangu;
