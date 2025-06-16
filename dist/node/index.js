import * as fs from "fs";
import { Pangu } from "../shared/index.js";
class NodePangu extends Pangu {
  spacingFile(path) {
    return new Promise((resolve, reject) => {
      fs.readFile(path, "utf8", (err, data) => {
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
    return this.spacingSync(fs.readFileSync(path, "utf8"));
  }
}
const pangu = new NodePangu();
export {
  NodePangu,
  pangu as default,
  pangu
};
//# sourceMappingURL=index.js.map
