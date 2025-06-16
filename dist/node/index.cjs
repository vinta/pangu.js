"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const fs = require("fs");
const shared_index = require("../shared/index.cjs");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const fs__namespace = /* @__PURE__ */ _interopNamespaceDefault(fs);
class NodePangu extends shared_index.Pangu {
  spacingFile(path) {
    return new Promise((resolve, reject) => {
      fs__namespace.readFile(path, "utf8", (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        const spacingData = this.spacingSync(data);
        resolve(spacingData);
      });
    });
  }
  spacingFileSync(path) {
    return this.spacingSync(fs__namespace.readFileSync(path, "utf8"));
  }
}
const pangu = new NodePangu();
exports.NodePangu = NodePangu;
exports.default = pangu;
exports.pangu = pangu;
//# sourceMappingURL=index.cjs.map
