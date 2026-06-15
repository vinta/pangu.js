//#region src/node/index.cjs.ts
var { Pangu } = require("../shared/index.cjs");
var { readFileSync } = require("node:fs");
var { readFile } = require("node:fs/promises");
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
pangu.NodePangu = NodePangu;
pangu.pangu = pangu;
pangu.default = pangu;
module.exports = pangu;
//#endregion

//# sourceMappingURL=index.cjs.map