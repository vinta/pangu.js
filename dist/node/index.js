import * as s from "fs";
import { Pangu as f } from "../shared/index.js";
class o extends f {
  spacingFile(e, n) {
    return new Promise((r, u) => {
      s.readFile(e, "utf8", (i, a) => {
        if (i)
          return u(i), n ? n(i) : void 0;
        const t = this.spacingSync(a);
        if (r(t), n)
          return n(null, t);
      });
    });
  }
  spacingFileSync(e) {
    return this.spacingSync(s.readFileSync(e, "utf8"));
  }
}
const c = new o();
export {
  o as NodePangu,
  c as default,
  c as pangu
};
//# sourceMappingURL=index.js.map
