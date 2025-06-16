import { Pangu as u } from "../shared/index.js";
function N(h) {
  let e = !1;
  return function(...i) {
    if (!e)
      return e = !0, h.apply(this, i);
  };
}
function f(h, e, i = 1 / 0) {
  let c = null, t = null;
  return function(...a) {
    const o = Date.now();
    c && clearTimeout(c), t || (t = o), o - t >= i ? (h.apply(this, a), t = o) : c = window.setTimeout(() => {
      h.apply(this, a);
    }, e);
  };
}
class T extends u {
  constructor() {
    super(), this.blockTags = /^(div|p|h1|h2|h3|h4|h5|h6)$/i, this.ignoredTags = /^(script|code|pre|textarea)$/i, this.presentationalTags = /^(b|code|del|em|i|s|strong|kbd)$/i, this.spaceLikeTags = /^(br|hr|i|img|pangu)$/i, this.spaceSensitiveTags = /^(a|del|pre|s|strike|u)$/i, this.isAutoSpacingPageExecuted = !1;
  }
  isContentEditable(e) {
    return e.isContentEditable || e.getAttribute && e.getAttribute("g_editable") === "true";
  }
  isSpecificTag(e, i) {
    return e && e.nodeName && e.nodeName.search(i) >= 0;
  }
  isInsideSpecificTag(e, i, c = !1) {
    let t = e;
    if (c && this.isSpecificTag(t, i))
      return !0;
    for (; t.parentNode; )
      if (t = t.parentNode, this.isSpecificTag(t, i))
        return !0;
    return !1;
  }
  canIgnoreNode(e) {
    let i = e;
    if (i && (this.isSpecificTag(i, this.ignoredTags) || this.isContentEditable(i)))
      return !0;
    for (; i.parentNode; )
      if (i = i.parentNode, i && (this.isSpecificTag(i, this.ignoredTags) || this.isContentEditable(i)))
        return !0;
    return !1;
  }
  isFirstTextChild(e, i) {
    const { childNodes: c } = e;
    for (let t = 0; t < c.length; t++) {
      const a = c[t];
      if (a.nodeType !== Node.COMMENT_NODE && a.textContent)
        return a === i;
    }
    return !1;
  }
  isLastTextChild(e, i) {
    const { childNodes: c } = e;
    for (let t = c.length - 1; t > -1; t--) {
      const a = c[t];
      if (a.nodeType !== Node.COMMENT_NODE && a.textContent)
        return a === i;
    }
    return !1;
  }
  spacingNodeByXPath(e, i) {
    if (!(i instanceof Node) || i instanceof DocumentFragment)
      return;
    const c = document.evaluate(e, i, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    let t, a;
    for (let o = c.snapshotLength - 1; o > -1; --o) {
      if (t = c.snapshotItem(o), this.isSpecificTag(t.parentNode, this.presentationalTags) && !this.isInsideSpecificTag(t.parentNode, this.ignoredTags)) {
        const g = t.parentNode;
        if (g.previousSibling) {
          const { previousSibling: r } = g;
          if (r.nodeType === Node.TEXT_NODE) {
            const n = r.data.substr(-1) + t.data.toString().charAt(0), s = this.spacingSync(n);
            n !== s && (r.data = `${r.data} `);
          }
        }
        if (g.nextSibling) {
          const { nextSibling: r } = g;
          if (r.nodeType === Node.TEXT_NODE) {
            const n = t.data.substr(-1) + r.data.toString().charAt(0), s = this.spacingSync(n);
            n !== s && (r.data = ` ${r.data}`);
          }
        }
      }
      if (this.canIgnoreNode(t)) {
        a = t;
        continue;
      }
      const p = this.spacingSync(t.data);
      if (t.data !== p && (t.data = p), a) {
        if (t.nextSibling && t.nextSibling.nodeName.search(this.spaceLikeTags) >= 0) {
          a = t;
          continue;
        }
        const g = t.data.toString().substr(-1) + a.data.toString().substr(0, 1);
        if (this.spacingSync(g) !== g) {
          let n = a;
          for (; n.parentNode && n.nodeName.search(this.spaceSensitiveTags) === -1 && this.isFirstTextChild(n.parentNode, n); )
            n = n.parentNode;
          let s = t;
          for (; s.parentNode && s.nodeName.search(this.spaceSensitiveTags) === -1 && this.isLastTextChild(s.parentNode, s); )
            s = s.parentNode;
          if (s.nextSibling && s.nextSibling.nodeName.search(this.spaceLikeTags) >= 0) {
            a = t;
            continue;
          }
          if (s.nodeName.search(this.blockTags) === -1)
            if (n.nodeName.search(this.spaceSensitiveTags) === -1)
              n.nodeName.search(this.ignoredTags) === -1 && n.nodeName.search(this.blockTags) === -1 && (a.previousSibling ? a.previousSibling.nodeName.search(this.spaceLikeTags) === -1 && (a.data = ` ${a.data}`) : this.canIgnoreNode(a) || (a.data = ` ${a.data}`));
            else if (s.nodeName.search(this.spaceSensitiveTags) === -1)
              t.data = `${t.data} `;
            else {
              const d = document.createElement("pangu");
              d.innerHTML = " ", n.previousSibling ? n.previousSibling.nodeName.search(this.spaceLikeTags) === -1 && n.parentNode.insertBefore(d, n) : n.parentNode.insertBefore(d, n), d.previousElementSibling || d.parentNode && d.parentNode.removeChild(d);
            }
        }
      }
      a = t;
    }
  }
  spacingNodeSync(e) {
    let i = ".//*/text()[normalize-space(.)]";
    e instanceof Element && e.children && e.children.length === 0 && (i = ".//text()[normalize-space(.)]"), this.spacingNodeByXPath(i, e);
  }
  async spacingNode(e) {
    return this.spacingNodeSync(e);
  }
  spacingElementByIdSync(e) {
    const i = `id("${e}")//text()`;
    this.spacingNodeByXPath(i, document);
  }
  async spacingElementById(e) {
    return this.spacingElementByIdSync(e);
  }
  spacingElementByClassNameSync(e) {
    const i = `//*[contains(concat(" ", normalize-space(@class), " "), "${e}")]//text()`;
    this.spacingNodeByXPath(i, document);
  }
  async spacingElementByClassName(e) {
    return this.spacingElementByClassNameSync(e);
  }
  spacingElementByTagNameSync(e) {
    const i = `//${e}//text()`;
    this.spacingNodeByXPath(i, document);
  }
  async spacingElementByTagName(e) {
    return this.spacingElementByTagNameSync(e);
  }
  spacingPageTitleSync() {
    this.spacingNodeByXPath("/html/head/title/text()", document);
  }
  async spacingPageTitle() {
    return this.spacingPageTitleSync();
  }
  spacingPageBodySync() {
    let e = "/html/body//*/text()[normalize-space(.)]";
    ["script", "style", "textarea"].forEach((i) => {
      e = `${e}[translate(name(..),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")!="${i}"]`;
    }), this.spacingNodeByXPath(e, document);
  }
  async spacingPageBody() {
    return this.spacingPageBodySync();
  }
  spacingPageSync() {
    this.spacingPageTitleSync(), this.spacingPageBodySync();
  }
  async spacingPage() {
    await this.spacingPageTitle(), await this.spacingPageBody();
  }
  autoSpacingPage(e = 1e3, i = 500, c = 2e3) {
    if (!(document.body instanceof Node) || this.isAutoSpacingPageExecuted)
      return;
    this.isAutoSpacingPageExecuted = !0;
    const t = N(() => {
      this.spacingPageSync();
    }), a = document.getElementsByTagName("video");
    if (a.length === 0)
      setTimeout(() => {
        t();
      }, e);
    else
      for (let n = 0; n < a.length; n++) {
        const s = a[n];
        if (s.readyState === 4) {
          setTimeout(() => {
            t();
          }, 3e3);
          break;
        }
        s.addEventListener("loadeddata", () => {
          setTimeout(() => {
            t();
          }, 4e3);
        });
      }
    const o = [], p = this, g = f(() => {
      for (; o.length; ) {
        const n = o.shift();
        n && p.spacingNodeSync(n);
      }
    }, i, c);
    new MutationObserver((n) => {
      n.forEach((s) => {
        switch (s.type) {
          /* eslint-disable indent */
          case "childList":
            s.addedNodes.forEach((l) => {
              l.nodeType === Node.ELEMENT_NODE ? o.push(l) : l.nodeType === Node.TEXT_NODE && l.parentNode && o.push(l.parentNode);
            });
            break;
          case "characterData":
            const { target: d } = s;
            d.nodeType === Node.TEXT_NODE && d.parentNode && o.push(d.parentNode);
            break;
        }
      }), g();
    }).observe(document.body, {
      characterData: !0,
      childList: !0,
      subtree: !0
    });
  }
}
const m = new T();
export {
  T as BrowserPangu,
  m as default,
  m as pangu
};
//# sourceMappingURL=pangu.js.map
