# Site filters follow same-document navigation

The DOM content script used to carry the blacklist as `excludeMatches` (or the whitelist as `matches`) on its `chrome.scripting.registerContentScripts()` registration. Chrome evaluates those patterns once, when a document is created. Single-page apps change the url without creating one: on GitHub, the repo root, Issues, one issue, and Code again are a single document updated with `pushState`. A document born on the repo root kept spacing `/issues/316` although the blacklist excludes it, and a document born on `/issues` never spaced the repo root it navigated to, because the script was never injected.

The decisions:

1. **In automatic mode, the DOM script registers on every http(s) page and applies the filters itself.** `shouldAutoSpace()` runs at load and when `currententrychange` reports a different URL. Same-URL history updates preserve manual activation. On an excluded page the script is present but idle until the user clicks the manual button.
2. **The Navigation API is the change signal.** It fires in the isolated world for push, replace, and traverse, with `location.href` already updated, and needs no permission. `webNavigation` would add a "Read your browsing history" warning, which disables a published extension until each user re-approves. Patching `history.pushState` needs a MAIN-world script plus a bridge, because an isolated-world patch never sees the page's calls. `popstate` and `hashchange` do not fire on `pushState`. The Chrome floor moves from 99 to 102 for it.
3. **One matcher.** The popup status row, the icon, and the content script all decide through `URLPattern` now. Registration no longer carries user patterns, so the concern in [ADR 0008](0008-text-autospace-default-on-ignores-filters.md) about a rejected pattern taking down a batched registration no longer applies.

## Consequences

- Filter edits still take effect on the next page load, like the toggles in ADR 0008: the script reads settings once per document.
- Text spaced before a same-document navigation into an excluded page stays spaced. None of the surveyed extensions (Stylus, Vimium, Refined GitHub) undoes earlier work either.
- Stopping spacing disconnects the observer and ignores its delayed callbacks. Already queued spacing and AI fixes may still finish.
- The manual button starts ongoing spacing for the current URL in either mode, ignoring URL filters. AI spacing follows its own toggle. When the URL changes, manual mode stops spacing and automatic mode reapplies its filters. Repeated clicks do not force another pass.
- Manual activation waits for initialization so AI setup finishes before spacing starts. `PING` stays synchronous so the popup can detect an injected script while initialization is pending.
- The icon already follows same-document navigation: `tabs.onUpdated` delivers `changeInfo.url` on `pushState`.
- Whitelist mode with an empty list now spaces nowhere. Registration used to fall back to every page when the list was empty, while the popup status row already reported inactive; the two agree now.
- The model warm-up runs once per document, when spacing first starts with AI enabled. An excluded page stays idle until manual activation.
