---
paths:
  - 'browser-extensions/chrome/**'
  - 'src/browser/**'
---

# Chrome Extension

- The Chrome floor is declared three times and all must agree: `minimum_chrome_version` in `manifest.json`, `build.target` in `browser-extensions/vite.config.extension.ts`, and the `available` year of `baseline-js/use-baseline` in `eslint.config.js`. A bump also drops the fallbacks it makes dead and gets a CHANGELOG line.
- Chrome's shipped initial value for `text-autospace` is `no-autospace` (verified in Chrome 150 on 2026-07-23), whatever chromestatus and the blink-dev intent say about default-on. The `html { text-autospace: normal }` content-script CSS is the permanent opt-in on every Chrome version, never redundant. A computed `normal` on a page proves the extension CSS injected.
- `requestIdleCallback` never fires in a hidden document (background tab, minimized window), and the `timeout` option does not rescue it. Everything routed through `BrowserPangu.schedule()` waits until the tab is visible again. Focus does not matter, only visibility.
  - `claude-in-chrome` opens tabs as background tabs, so they are hidden until the user selects one. A logged label with an unchanged page in such a tab means the late fix is queued, not broken. Verify scheduled work in a visible tab.
