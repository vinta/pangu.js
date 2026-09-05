---
paths:
  - 'browser-extensions/chrome/**'
---

# Chrome Extension

- Content scripts are registered dynamically by the service worker (`chrome.scripting.registerContentScripts`) based on user settings. `manifest.json` intentionally has no static `content_scripts` entry.
- Permissions stay minimal: `activeTab` instead of the broad `tabs` permission.
- Chrome's shipped initial value for `text-autospace` is `no-autospace` (verified in Chrome 150 on 2026-07-23), whatever chromestatus and the blink-dev intent say about default-on. The `html { text-autospace: normal }` content-script CSS is the permanent opt-in on every Chrome version, never redundant. A computed `normal` on a page proves the extension CSS injected.
- Settings are plain functions over `chrome.storage.sync` in `settings/storage.ts`. No cache, store singleton, subscribe machinery, or mutation queue: `storage.sync` reads are local, and every repaint comes from the `onChanged` echo of a write, so UI handlers write and never repaint inline. The one serialization is `registrationQueue` in `service-worker.ts`, because `registerContentScripts()` unregisters everything first and overlapping runs would interleave.
- `vendors/pangu/` is build output. `npm run build:extension` copies `dist/browser/pangu.umd.js` there. Never edit it by hand.
- `requestIdleCallback` never fires in a hidden document (background tab, minimized window), and the `timeout` option does not rescue it. Everything routed through `BrowserPangu.schedule()` waits until the tab is visible again. Focus does not matter, only visibility.
  - Claude-in-Chrome opens tabs as background tabs, so they are hidden until the user selects one. A logged label with an unchanged page in such a tab means the late fix is queued, not broken. Verify scheduled work in a visible tab.
