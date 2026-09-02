---
paths:
  - 'browser-extensions/chrome/**'
---

# Chrome Extension

- Content scripts are registered dynamically by the service worker (`chrome.scripting.registerContentScripts`) based on user settings. `manifest.json` intentionally has no static `content_scripts` entry.
- Permissions stay minimal: `activeTab` instead of the broad `tabs` permission.
- `vendors/pangu/` is build output. `npm run build:extension` copies `dist/browser/pangu.umd.js` there. Never edit it by hand.
- `requestIdleCallback` never fires on a hidden/background tab once page load quiesces — the `timeout` option does not rescue it, so anything routed through `BrowserPangu.schedule()` (all spacing batches AND the hyphen-sign late fix, by design: one seam for all text-spacing writes) stalls until the tab gains focus. Claude-in-Chrome automation tabs are hidden background tabs: live verification of scheduled work needs a focused tab, and a logged classifier verdict with an unchanged page on a hidden tab means the fix is waiting for focus, not that the applier is broken. Measured live 2026-09-01: verdicts arrived, the page held rules output for minutes, every fix landed the moment the tab was focused.
