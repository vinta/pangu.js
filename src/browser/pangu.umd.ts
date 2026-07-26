import pangu, { BrowserPangu } from './pangu.js';

// The UMD global carries the class as a property of the instance, so `window.pangu.BrowserPangu` stays constructible for <script> consumers
const panguUmd = Object.assign(pangu, { BrowserPangu });

// Declare global for UMD builds
declare global {
  interface Window {
    pangu: typeof panguUmd;
  }
}

export default panguUmd;
