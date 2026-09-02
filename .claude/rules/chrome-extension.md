---
paths:
  - 'browser-extensions/chrome/**'
---

# Chrome Extension

- Content scripts are registered dynamically by the service worker (`chrome.scripting.registerContentScripts`) based on user settings. `manifest.json` intentionally has no static `content_scripts` entry.
- Permissions stay minimal: `activeTab` instead of the broad `tabs` permission.
- `vendors/pangu/` is build output. `npm run build:extension` copies `dist/browser/pangu.umd.js` there. Never edit it by hand.
- `requestIdleCallback` never fires in a hidden document (background tab, minimized window), and the `timeout` option does not rescue it. Everything routed through `BrowserPangu.schedule()` waits until the tab is visible again. Focus does not matter, only visibility.
  - Claude-in-Chrome opens tabs as background tabs, so they are hidden until the user selects one. A logged label with an unchanged page in such a tab means the late fix is queued, not broken. Verify scheduled work in a visible tab.
