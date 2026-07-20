---
paths:
  - 'browser-extensions/chrome/**'
---

# Chrome Extension

- Content scripts are registered dynamically by the service worker (`chrome.scripting.registerContentScripts`) based on user settings. `manifest.json` intentionally has no static `content_scripts` entry.
- Permissions stay minimal: `activeTab` instead of the broad `tabs` permission.
- `vendors/pangu/` is build output. `npm run build:extension` copies `dist/browser/pangu.umd.js` there. Never edit it by hand.
