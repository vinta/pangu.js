# Site filters follow same-document navigation

The DOM content script used to carry the blacklist as `excludeMatches` (or the whitelist as `matches`) on its `chrome.scripting.registerContentScripts()` registration. Chrome evaluates those patterns once, when a document is created. Single-page apps change the url without creating one: on GitHub, the repo root, Issues, one issue, and Code again are a single document updated with `pushState`. A document born on the repo root kept spacing `/issues/316` although the blacklist excludes it, and a document born on `/issues` never spaced the repo root it navigated to, because the script was never injected.

The decisions:

1. **The DOM script registers on every http(s) page and applies the filters itself.** `shouldAutoSpace()` runs at load and on every Navigation API `currententrychange` event, starting or stopping the page observer. Both core calls are idempotent, so the same-url replace events GitHub fires for scroll restoration are harmless. On an excluded page the script is present but idle.
2. **The Navigation API is the change signal.** It fires in the isolated world for push, replace, and traverse, with `location.href` already updated, and needs no permission. `webNavigation` would add a "Read your browsing history" warning, which disables a published extension until each user re-approves. Patching `history.pushState` needs a MAIN-world script plus a bridge, because an isolated-world patch never sees the page's calls. `popstate` and `hashchange` do not fire on `pushState`. The Chrome floor moves from 99 to 102 for it.
3. **One matcher.** The popup status row, the icon, and the content script all decide through `URLPattern` now. Registration no longer carries user patterns, so the concern in [ADR 0008](0008-text-autospace-default-on-ignores-filters.md) about a rejected pattern taking down a batched registration no longer applies.

## Consequences

- Filter edits still take effect on the next page load, like the toggles in ADR 0008: the script reads settings once per document.
- Text spaced before a same-document navigation into an excluded page stays spaced. None of the surveyed extensions (Stylus, Vimium, Refined GitHub) undoes earlier work either.
- In `spacing_when_load` mode, the manual button on an excluded page now does a single pass: the script is already there, so the popup no longer injects a copy that went on auto spacing. Manual mode is unchanged: only the popup injects the script there, and `shouldAutoSpace()` lets it through regardless of filters.
- The icon already follows same-document navigation: `tabs.onUpdated` delivers `changeInfo.url` on `pushState`.
- Whitelist mode with an empty list now spaces nowhere. Registration used to fall back to every page when the list was empty, while the popup status row already reported inactive; the two agree now.
- The model warm-up runs once per document, on the first url that spaces. Before, injection itself was the gate, so a page the filters exclude never reached it; now the script is present there and must not warm up a model that never gets used.
