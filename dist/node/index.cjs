"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var node_exports = {};
__export(node_exports, {
  NodePangu: () => NodePangu,
  default: () => node_default,
  pangu: () => pangu
});
module.exports = __toCommonJS(node_exports);
var import_promises = require("node:fs/promises");
var import_node_fs = require("node:fs");
var import_shared = require("../shared");
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
var node_default = pangu;
//# sourceMappingURL=index.cjs.map
