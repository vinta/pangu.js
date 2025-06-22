import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { Pangu } from "../shared/index.js";
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
export {
  NodePangu,
  pangu as default,
  pangu
};
//# sourceMappingURL=index.js.map
