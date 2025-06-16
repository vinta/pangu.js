import * as fs from "fs";
import { Pangu } from "../shared/index.js";
class NodePangu extends Pangu {
  spacingFile(path, callback) {
    return new Promise((resolve, reject) => {
      fs.readFile(path, "utf8", (err, data) => {
        if (err) {
          reject(err);
          if (callback) {
            return callback(err);
          }
          return;
        }
        const spacingData = this.spacingSync(data);
        resolve(spacingData);
        if (callback) {
          return callback(null, spacingData);
        }
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
