"use strict";
var import_shared = require("../shared/index");
var import_node_fs = require("node:fs");
var import_promises = require("node:fs/promises");
class NodePangu extends import_shared.Pangu {
  async spacingFile(path) {
    const data = await (0, import_promises.readFile)(path, "utf8");
    return this.spacingText(data);
  }
  spacingFileSync(path) {
    return this.spacingText((0, import_node_fs.readFileSync)(path, "utf8"));
  }
}
const pangu = new NodePangu();
pangu.NodePangu = NodePangu;
pangu.pangu = pangu;
pangu.default = pangu;
module.exports = pangu;
//# sourceMappingURL=index.cjs.map
