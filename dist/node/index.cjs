"use strict";
const { Pangu } = require("../shared/index.cjs");
const { readFileSync } = require("node:fs");
const { readFile } = require("node:fs/promises");
class NodePangu extends Pangu {
  async spacingFile(path) {
    const data = await readFile(path, "utf8");
    return this.spacingText(data);
  }
  spacingFileSync(path) {
    return this.spacingText(readFileSync(path, "utf8"));
  }
}
const pangu = new NodePangu();
pangu.NodePangu = NodePangu;
pangu.pangu = pangu;
pangu.default = pangu;
module.exports = pangu;
//# sourceMappingURL=index.cjs.map
