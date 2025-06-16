// UMD build entry that exports pangu instance with BrowserPangu class attached
import pangu, { BrowserPangu } from "./pangu";

// Attach the class to the instance for UMD builds
(pangu as any).BrowserPangu = BrowserPangu;

export default pangu;
