---
paths:
  - 'browser-extensions/chrome/**'
---

# Chrome Extension

- Content scripts are registered dynamically by the service worker (`chrome.scripting.registerContentScripts`) based on user settings. `manifest.json` intentionally has no static `content_scripts` entry.
- Permissions stay minimal: `activeTab` instead of the broad `tabs` permission.
- `vendors/pangu/` is build output. `npm run build:extension` copies `dist/browser/pangu.umd.js` there. Never edit it by hand.

## Documentation Links

- Chrome Extensions
  - https://developer.chrome.com/docs/extensions/
- Chrome Extension Manifest
  - https://developer.chrome.com/docs/extensions/reference/manifest/
- Chrome Extension Match Patterns
  - https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns
- Chrome Extension Scripting API
  - https://developer.chrome.com/docs/extensions/reference/api/scripting
- Chrome Extension Storage API
  - https://developer.chrome.com/docs/extensions/reference/api/storage
- Chrome Extension i18n API
  - https://developer.chrome.com/docs/extensions/reference/api/i18n
- Chrome Extension Runtime API
  - https://developer.chrome.com/docs/extensions/reference/api/runtime
- Chrome Extension Tabs API
  - https://developer.chrome.com/docs/extensions/reference/api/tabs
- `text-autospace` CSS property
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-autospace
