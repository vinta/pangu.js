import { Pangu } from "../shared/index.js";
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
//#region src/node/index.ts
var NodePangu = class extends Pangu {
	async spacingFile(path) {
		const data = await readFile(path, "utf8");
		return this.spacingText(data);
	}
	spacingFileSync(path) {
		return this.spacingText(readFileSync(path, "utf8"));
	}
};
var pangu = new NodePangu();
//#endregion
export { NodePangu, pangu as default, pangu };

//# sourceMappingURL=index.js.map