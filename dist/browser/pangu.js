var u = (h, t, n) => new Promise((e, a) => {
  var s = (g) => {
    try {
      l(n.next(g));
    } catch (p) {
      a(p);
    }
  }, o = (g) => {
    try {
      l(n.throw(g));
    } catch (p) {
      a(p);
    }
  }, l = (g) => g.done ? e(g.value) : Promise.resolve(g.value).then(s, o);
  l((n = n.apply(h, t)).next());
});
const c = "⺀-⻿⼀-⿟぀-ゟ゠-ヺー-ヿ㄀-ㄯ㈀-㋿㐀-䶿一-鿿豈-﫿", $ = new RegExp(`[${c}]`), N = new RegExp(`([${c}])[ ]*([\\:]+|\\.)[ ]*([${c}])`, "g"), S = new RegExp(`([${c}])[ ]*([~\\!;,\\?]+)[ ]*`, "g"), E = new RegExp(`([\\.]{2,}|…)([${c}])`, "g"), f = new RegExp(`([${c}])\\:([A-Z0-9\\(\\)])`, "g"), _ = new RegExp(`([${c}])([\`"״])`, "g"), y = new RegExp(`([\`"״])([${c}])`, "g"), m = /([`"\u05f4]+)[ ]*(.+?)[ ]*([`"\u05f4]+)/g, A = /([\u201d])([A-Za-z0-9])/g, x = new RegExp(`([${c}])(")([A-Za-z0-9])`, "g"), C = new RegExp(`([${c}])('[^s])`, "g"), w = new RegExp(`(')([${c}])`, "g"), b = new RegExp(`([A-Za-z0-9${c}])( )('s)`, "g"), R = new RegExp(`([${c}])(#)([${c}]+)(#)([${c}])`, "g"), P = new RegExp(`([${c}])(#([^ ]))`, "g"), O = new RegExp(`(([^ ])#)([${c}])`, "g"), B = new RegExp(`([${c}])([\\+\\-\\*\\/=&\\|<>])([A-Za-z0-9])`, "g"), K = new RegExp(`([A-Za-z0-9])([\\+\\-\\*\\/=&\\|<>])([${c}])`, "g"), L = /([/]) ([a-z\-_\./]+)/g, I = /([/\.])([A-Za-z\-_\./]+) ([/])/g, v = new RegExp(`([${c}])([\\(\\[\\{<>“])`, "g"), J = new RegExp(`([\\)\\]\\}<>”])([${c}])`, "g"), z = /([\(\[\{<\u201c]+)[ ]*(.+?)[ ]*([\)\]\}>\u201d]+)/, D = new RegExp(`([A-Za-z0-9${c}])[ ]*([“])([A-Za-z0-9${c}\\-_ ]+)([”])`, "g"), H = new RegExp(`([“])([A-Za-z0-9${c}\\-_ ]+)([”])[ ]*([A-Za-z0-9${c}])`, "g"), F = /([A-Za-z0-9])([\(\[\{])/g, X = /([\)\]\}])([A-Za-z0-9])/g, Q = new RegExp(`([${c}])([A-Za-zͰ-Ͽ0-9@\\$%\\^&\\*\\-\\+\\\\=\\|/¡-ÿ⅐-↏✀—➿])`, "g"), Z = new RegExp(`([A-Za-zͰ-Ͽ0-9~\\$%\\^&\\*\\-\\+\\\\=\\|/!;:,\\.\\?¡-ÿ⅐-↏✀—➿])([${c}])`, "g"), U = /(%)([A-Za-z])/g, k = /([ ]*)([\u00b7\u2022\u2027])([ ]*)/g;
class M {
  constructor() {
    this.version = "4.0.7";
  }
  convertToFullwidth(t) {
    return t.replace(/~/g, "～").replace(/!/g, "！").replace(/;/g, "；").replace(/:/g, "：").replace(/,/g, "，").replace(/\./g, "。").replace(/\?/g, "？");
  }
  spacingSync(t) {
    if (typeof t != "string")
      return console.warn(`spacing(text) only accepts string but got ${typeof t}`), t;
    if (t.length <= 1 || !$.test(t))
      return t;
    const n = this;
    let e = t;
    return e = e.replace(N, (a, s, o, l) => {
      const g = n.convertToFullwidth(o);
      return `${s}${g}${l}`;
    }), e = e.replace(S, (a, s, o) => {
      const l = n.convertToFullwidth(o);
      return `${s}${l}`;
    }), e = e.replace(E, "$1 $2"), e = e.replace(f, "$1：$2"), e = e.replace(_, "$1 $2"), e = e.replace(y, "$1 $2"), e = e.replace(m, "$1$2$3"), e = e.replace(A, "$1 $2"), e = e.replace(x, "$1$2 $3"), e = e.replace(C, "$1 $2"), e = e.replace(w, "$1 $2"), e = e.replace(b, "$1's"), e = e.replace(R, "$1 $2$3$4 $5"), e = e.replace(P, "$1 $2"), e = e.replace(O, "$1 $3"), e = e.replace(B, "$1 $2 $3"), e = e.replace(K, "$1 $2 $3"), e = e.replace(L, "$1$2"), e = e.replace(I, "$1$2$3"), e = e.replace(v, "$1 $2"), e = e.replace(J, "$1 $2"), e = e.replace(z, "$1$2$3"), e = e.replace(D, "$1 $2$3$4"), e = e.replace(H, "$1$2$3 $4"), e = e.replace(F, "$1 $2"), e = e.replace(X, "$1 $2"), e = e.replace(Q, "$1 $2"), e = e.replace(Z, "$1 $2"), e = e.replace(U, "$1 $2"), e = e.replace(k, "・"), e;
  }
  spacing(t, n) {
    if (n) {
      let e;
      try {
        e = this.spacingSync(t);
      } catch (a) {
        n(a);
        return;
      }
      n(null, e);
    } else
      return new Promise((e, a) => {
        try {
          const s = this.spacingSync(t);
          e(s);
        } catch (s) {
          a(s);
        }
      });
  }
  spacingText(t, n) {
    return this.spacing(t, n);
  }
  spacingTextSync(t) {
    return this.spacingSync(t);
  }
}
function G(h) {
  let t = !1;
  return function(...n) {
    if (!t)
      return t = !0, h.apply(this, n);
  };
}
function Y(h, t, n = 1 / 0) {
  let e = null, a = null;
  return function(...s) {
    const o = Date.now();
    e && clearTimeout(e), a || (a = o), o - a >= n ? (h.apply(this, s), a = o) : e = window.setTimeout(() => {
      h.apply(this, s);
    }, t);
  };
}
class V extends M {
  constructor() {
    super(), this.blockTags = /^(div|p|h1|h2|h3|h4|h5|h6)$/i, this.ignoredTags = /^(script|code|pre|textarea)$/i, this.presentationalTags = /^(b|code|del|em|i|s|strong|kbd)$/i, this.spaceLikeTags = /^(br|hr|i|img|pangu)$/i, this.spaceSensitiveTags = /^(a|del|pre|s|strike|u)$/i, this.isAutoSpacingPageExecuted = !1;
  }
  isContentEditable(t) {
    return t.isContentEditable || t.getAttribute && t.getAttribute("g_editable") === "true";
  }
  isSpecificTag(t, n) {
    return t && t.nodeName && t.nodeName.search(n) >= 0;
  }
  isInsideSpecificTag(t, n, e = !1) {
    let a = t;
    if (e && this.isSpecificTag(a, n))
      return !0;
    for (; a.parentNode; )
      if (a = a.parentNode, this.isSpecificTag(a, n))
        return !0;
    return !1;
  }
  canIgnoreNode(t) {
    let n = t;
    if (n && (this.isSpecificTag(n, this.ignoredTags) || this.isContentEditable(n)))
      return !0;
    for (; n.parentNode; )
      if (n = n.parentNode, n && (this.isSpecificTag(n, this.ignoredTags) || this.isContentEditable(n)))
        return !0;
    return !1;
  }
  isFirstTextChild(t, n) {
    const { childNodes: e } = t;
    for (let a = 0; a < e.length; a++) {
      const s = e[a];
      if (s.nodeType !== Node.COMMENT_NODE && s.textContent)
        return s === n;
    }
    return !1;
  }
  isLastTextChild(t, n) {
    const { childNodes: e } = t;
    for (let a = e.length - 1; a > -1; a--) {
      const s = e[a];
      if (s.nodeType !== Node.COMMENT_NODE && s.textContent)
        return s === n;
    }
    return !1;
  }
  spacingNodeByXPath(t, n) {
    if (!(n instanceof Node) || n instanceof DocumentFragment)
      return;
    const e = document.evaluate(t, n, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    let a, s;
    for (let o = e.snapshotLength - 1; o > -1; --o) {
      if (a = e.snapshotItem(o), this.isSpecificTag(a.parentNode, this.presentationalTags) && !this.isInsideSpecificTag(a.parentNode, this.ignoredTags)) {
        const g = a.parentNode;
        if (g.previousSibling) {
          const { previousSibling: p } = g;
          if (p.nodeType === Node.TEXT_NODE) {
            const i = p.data.substr(-1) + a.data.toString().charAt(0), r = this.spacingSync(i);
            i !== r && (p.data = `${p.data} `);
          }
        }
        if (g.nextSibling) {
          const { nextSibling: p } = g;
          if (p.nodeType === Node.TEXT_NODE) {
            const i = a.data.substr(-1) + p.data.toString().charAt(0), r = this.spacingSync(i);
            i !== r && (p.data = ` ${p.data}`);
          }
        }
      }
      if (this.canIgnoreNode(a)) {
        s = a;
        continue;
      }
      const l = this.spacingSync(a.data);
      if (a.data !== l && (a.data = l), s) {
        if (a.nextSibling && a.nextSibling.nodeName.search(this.spaceLikeTags) >= 0) {
          s = a;
          continue;
        }
        const g = a.data.toString().substr(-1) + s.data.toString().substr(0, 1);
        if (this.spacingSync(g) !== g) {
          let i = s;
          for (; i.parentNode && i.nodeName.search(this.spaceSensitiveTags) === -1 && this.isFirstTextChild(i.parentNode, i); )
            i = i.parentNode;
          let r = a;
          for (; r.parentNode && r.nodeName.search(this.spaceSensitiveTags) === -1 && this.isLastTextChild(r.parentNode, r); )
            r = r.parentNode;
          if (r.nextSibling && r.nextSibling.nodeName.search(this.spaceLikeTags) >= 0) {
            s = a;
            continue;
          }
          if (r.nodeName.search(this.blockTags) === -1)
            if (i.nodeName.search(this.spaceSensitiveTags) === -1)
              i.nodeName.search(this.ignoredTags) === -1 && i.nodeName.search(this.blockTags) === -1 && (s.previousSibling ? s.previousSibling.nodeName.search(this.spaceLikeTags) === -1 && (s.data = ` ${s.data}`) : this.canIgnoreNode(s) || (s.data = ` ${s.data}`));
            else if (r.nodeName.search(this.spaceSensitiveTags) === -1)
              a.data = `${a.data} `;
            else {
              const d = document.createElement("pangu");
              d.innerHTML = " ", i.previousSibling ? i.previousSibling.nodeName.search(this.spaceLikeTags) === -1 && i.parentNode.insertBefore(d, i) : i.parentNode.insertBefore(d, i), d.previousElementSibling || d.parentNode && d.parentNode.removeChild(d);
            }
        }
      }
      s = a;
    }
  }
  spacingNodeSync(t) {
    let n = ".//*/text()[normalize-space(.)]";
    t instanceof Element && t.children && t.children.length === 0 && (n = ".//text()[normalize-space(.)]"), this.spacingNodeByXPath(n, t);
  }
  spacingNode(t) {
    return u(this, null, function* () {
      return this.spacingNodeSync(t);
    });
  }
  spacingElementByIdSync(t) {
    const n = `id("${t}")//text()`;
    this.spacingNodeByXPath(n, document);
  }
  spacingElementById(t) {
    return u(this, null, function* () {
      return this.spacingElementByIdSync(t);
    });
  }
  spacingElementByClassNameSync(t) {
    const n = `//*[contains(concat(" ", normalize-space(@class), " "), "${t}")]//text()`;
    this.spacingNodeByXPath(n, document);
  }
  spacingElementByClassName(t) {
    return u(this, null, function* () {
      return this.spacingElementByClassNameSync(t);
    });
  }
  spacingElementByTagNameSync(t) {
    const n = `//${t}//text()`;
    this.spacingNodeByXPath(n, document);
  }
  spacingElementByTagName(t) {
    return u(this, null, function* () {
      return this.spacingElementByTagNameSync(t);
    });
  }
  spacingPageTitleSync() {
    this.spacingNodeByXPath("/html/head/title/text()", document);
  }
  spacingPageTitle() {
    return u(this, null, function* () {
      return this.spacingPageTitleSync();
    });
  }
  spacingPageBodySync() {
    let t = "/html/body//*/text()[normalize-space(.)]";
    ["script", "style", "textarea"].forEach((n) => {
      t = `${t}[translate(name(..),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")!="${n}"]`;
    }), this.spacingNodeByXPath(t, document);
  }
  spacingPageBody() {
    return u(this, null, function* () {
      return this.spacingPageBodySync();
    });
  }
  spacingPageSync() {
    this.spacingPageTitleSync(), this.spacingPageBodySync();
  }
  spacingPage() {
    return u(this, null, function* () {
      yield this.spacingPageTitle(), yield this.spacingPageBody();
    });
  }
  autoSpacingPage(t = 1e3, n = 500, e = 2e3) {
    if (!(document.body instanceof Node) || this.isAutoSpacingPageExecuted)
      return;
    this.isAutoSpacingPageExecuted = !0;
    const a = G(() => {
      this.spacingPageSync();
    }), s = document.getElementsByTagName("video");
    if (s.length === 0)
      setTimeout(() => {
        a();
      }, t);
    else
      for (let i = 0; i < s.length; i++) {
        const r = s[i];
        if (r.readyState === 4) {
          setTimeout(() => {
            a();
          }, 3e3);
          break;
        }
        r.addEventListener("loadeddata", () => {
          setTimeout(() => {
            a();
          }, 4e3);
        });
      }
    const o = [], l = this, g = Y(() => {
      for (; o.length; ) {
        const i = o.shift();
        i && l.spacingNodeSync(i);
      }
    }, n, e);
    new MutationObserver((i) => {
      i.forEach((r) => {
        switch (r.type) {
          /* eslint-disable indent */
          case "childList":
            r.addedNodes.forEach((T) => {
              T.nodeType === Node.ELEMENT_NODE ? o.push(T) : T.nodeType === Node.TEXT_NODE && T.parentNode && o.push(T.parentNode);
            });
            break;
          case "characterData":
            const { target: d } = r;
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
const q = new V();
export {
  V as BrowserPangu,
  q as default,
  q as pangu
};
//# sourceMappingURL=pangu.js.map
