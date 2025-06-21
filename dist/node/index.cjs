"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const promises = require("node:fs/promises");
const node_fs = require("node:fs");
const index = require("../shared/index.cjs");
class NodePangu extends index.Pangu {
  async spacingFile(path) {
    const data = await promises.readFile(path, "utf8");
    return this.spacingText(data);
  }
  spacingFileSync(path) {
    return this.spacingText(node_fs.readFileSync(path, "utf8"));
  }
}
const pangu = new NodePangu();
exports.NodePangu = NodePangu;
exports.default = pangu;
exports.pangu = pangu;
//# sourceMappingURL=index.cjs.map
