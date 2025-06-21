import pangu, { BrowserPangu } from './pangu';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(pangu as any).BrowserPangu = BrowserPangu;

// Declare global for UMD builds
declare global {
  interface Window {
    pangu: typeof pangu & { BrowserPangu: typeof BrowserPangu };
  }
}

export default pangu;
