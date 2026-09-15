---
paths:
  - 'browser-extensions/chrome/**'
  - 'src/browser/**'
---

# Chrome Extension

- Content scripts are registered dynamically by the service worker (`chrome.scripting.registerContentScripts`) based on user settings. `manifest.json` intentionally has no static `content_scripts` entry.
- Permissions stay minimal: `activeTab` instead of the broad `tabs` permission.
- The Chrome floor is declared three times and all must agree: `minimum_chrome_version` in `manifest.json`, `build.target` in `browser-extensions/vite.config.extension.ts`, and the `available` year of `baseline-js/use-baseline` in `eslint.config.js`. A bump also drops the fallbacks it makes dead and gets a CHANGELOG line.
- Chrome's shipped initial value for `text-autospace` is `no-autospace` (verified in Chrome 150 on 2026-07-23), whatever chromestatus and the blink-dev intent say about default-on. The `html { text-autospace: normal }` content-script CSS is the permanent opt-in on every Chrome version, never redundant. A computed `normal` on a page proves the extension CSS injected.
- Settings are plain functions over `chrome.storage.sync` in `settings/storage.ts`. No cache, store singleton, subscribe machinery, or mutation queue: `storage.sync` reads are local, and every repaint comes from the `onChanged` echo of a write, so UI handlers write and never repaint inline. The one serialization is `registrationQueue` in `service-worker.ts`, because `registerContentScripts()` unregisters everything first and overlapping runs would interleave.
- `dist/content-script.js` bundles core from `src/browser/pangu.ts`; the extension never loads `pangu.umd.js`. The bundled `pangu` instance owns the `visibilityDetector` whose cache core clears per batch, so read that one instead of constructing another.
- `requestIdleCallback` never fires in a hidden document (background tab, minimized window), and the `timeout` option does not rescue it. Everything routed through `BrowserPangu.schedule()` waits until the tab is visible again. Focus does not matter, only visibility.
  - `claude-in-chrome` opens tabs as background tabs, so they are hidden until the user selects one. A logged label with an unchanged page in such a tab means the late fix is queued, not broken. Verify scheduled work in a visible tab.
