import type { BrowserPangu } from '../../dist/browser/pangu';

declare global {
  const pangu: BrowserPangu;
  interface Window {
    // @ts-expect-error - pangu is defined in the global scope
    pangu: BrowserPangu;
  }
}

export {};