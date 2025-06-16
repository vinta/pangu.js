const n = "⺀-⻿⼀-⿟぀-ゟ゠-ヺー-ヿ㄀-ㄯ㈀-㋿㐀-䶿一-鿿豈-﫿", s = new RegExp(`[${n}]`), a = new RegExp(`([${n}])[ ]*([\\:]+|\\.)[ ]*([${n}])`, "g"), E = new RegExp(`([${n}])[ ]*([~\\!;,\\?]+)[ ]*`, "g"), l = new RegExp(`([\\.]{2,}|…)([${n}])`, "g"), o = new RegExp(`([${n}])\\:([A-Z0-9\\(\\)])`, "g"), A = new RegExp(`([${n}])([\`"״])`, "g"), T = new RegExp(`([\`"״])([${n}])`, "g"), S = /([`"\u05f4]+)[ ]*(.+?)[ ]*([`"\u05f4]+)/g, R = /([\u201d])([A-Za-z0-9])/g, C = new RegExp(`([${n}])(")([A-Za-z0-9])`, "g"), w = new RegExp(`([${n}])('[^s])`, "g"), K = new RegExp(`(')([${n}])`, "g"), u = new RegExp(`([A-Za-z0-9${n}])( )('s)`, "g"), i = new RegExp(`([${n}])(#)([${n}]+)(#)([${n}])`, "g"), O = new RegExp(`([${n}])(#([^ ]))`, "g"), J = new RegExp(`(([^ ])#)([${n}])`, "g"), N = new RegExp(`([${n}])([\\+\\-\\*\\/=&\\|<>])([A-Za-z0-9])`, "g"), x = new RegExp(`([A-Za-z0-9])([\\+\\-\\*\\/=&\\|<>])([${n}])`, "g"), I = /([/]) ([a-z\-_\./]+)/g, L = /([/\.])([A-Za-z\-_\./]+) ([/])/g, H = new RegExp(`([${n}])([\\(\\[\\{<>“])`, "g"), h = new RegExp(`([\\)\\]\\}<>”])([${n}])`, "g"), z = /([\(\[\{<\u201c]+)[ ]*(.+?)[ ]*([\)\]\}>\u201d]+)/, F = new RegExp(`([A-Za-z0-9${n}])[ ]*([“])([A-Za-z0-9${n}\\-_ ]+)([”])`, "g"), Z = new RegExp(`([“])([A-Za-z0-9${n}\\-_ ]+)([”])[ ]*([A-Za-z0-9${n}])`, "g"), B = /([A-Za-z0-9])([\(\[\{])/g, y = /([\)\]\}])([A-Za-z0-9])/g, U = new RegExp(`([${n}])([A-Za-zͰ-Ͽ0-9@\\$%\\^&\\*\\-\\+\\\\=\\|/¡-ÿ⅐-↏✀—➿])`, "g"), f = new RegExp(`([A-Za-zͰ-Ͽ0-9~\\$%\\^&\\*\\-\\+\\\\=\\|/!;:,\\.\\?¡-ÿ⅐-↏✀—➿])([${n}])`, "g"), Q = /(%)([A-Za-z])/g, d = /([ ]*)([\u00b7\u2022\u2027])([ ]*)/g;
class G {
  constructor() {
    this.version = "4.0.7";
  }
  convertToFullwidth($) {
    return $.replace(/~/g, "～").replace(/!/g, "！").replace(/;/g, "；").replace(/:/g, "：").replace(/,/g, "，").replace(/\./g, "。").replace(/\?/g, "？");
  }
  spacingSync($) {
    if (typeof $ != "string")
      return console.warn(`spacing(text) only accepts string but got ${typeof $}`), $;
    if ($.length <= 1 || !s.test($))
      return $;
    const c = this;
    let e = $;
    return e = e.replace(a, (t, _, r, g) => {
      const p = c.convertToFullwidth(r);
      return `${_}${p}${g}`;
    }), e = e.replace(E, (t, _, r) => {
      const g = c.convertToFullwidth(r);
      return `${_}${g}`;
    }), e = e.replace(l, "$1 $2"), e = e.replace(o, "$1：$2"), e = e.replace(A, "$1 $2"), e = e.replace(T, "$1 $2"), e = e.replace(S, "$1$2$3"), e = e.replace(R, "$1 $2"), e = e.replace(C, "$1$2 $3"), e = e.replace(w, "$1 $2"), e = e.replace(K, "$1 $2"), e = e.replace(u, "$1's"), e = e.replace(i, "$1 $2$3$4 $5"), e = e.replace(O, "$1 $2"), e = e.replace(J, "$1 $3"), e = e.replace(N, "$1 $2 $3"), e = e.replace(x, "$1 $2 $3"), e = e.replace(I, "$1$2"), e = e.replace(L, "$1$2$3"), e = e.replace(H, "$1 $2"), e = e.replace(h, "$1 $2"), e = e.replace(z, "$1$2$3"), e = e.replace(F, "$1 $2$3$4"), e = e.replace(Z, "$1$2$3 $4"), e = e.replace(B, "$1 $2"), e = e.replace(y, "$1 $2"), e = e.replace(U, "$1 $2"), e = e.replace(f, "$1 $2"), e = e.replace(Q, "$1 $2"), e = e.replace(d, "・"), e;
  }
  spacing($, c) {
    if (c) {
      let e;
      try {
        e = this.spacingSync($);
      } catch (t) {
        c(t);
        return;
      }
      c(null, e);
    } else
      return new Promise((e, t) => {
        try {
          const _ = this.spacingSync($);
          e(_);
        } catch (_) {
          t(_);
        }
      });
  }
  spacingText($, c) {
    return this.spacing($, c);
  }
  spacingTextSync($) {
    return this.spacingSync($);
  }
}
const D = new G();
export {
  G as Pangu,
  D as default,
  D as pangu
};
//# sourceMappingURL=index.js.map
