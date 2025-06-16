import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { Pangu } from "../shared";

export class NodePangu extends Pangu {
  async spacingFile(path: string): Promise<string> {
    const data = await readFile(path, "utf8");
    return this.spacingText(data);
  }

  spacingFileSync(path: string): string {
    return this.spacingText(readFileSync(path, "utf8"));
  }
}

// Create default instance
const pangu = new NodePangu();

// Export for TypeScript/ESM
export { pangu };
export default pangu;
