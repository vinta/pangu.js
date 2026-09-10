# URL filters accept a subset of Chrome match patterns, translated into URLPattern

The options page tells users they can use `*` in a URL and links to Chrome's match pattern docs. Until 9.1.1, Chrome read the entries itself: the DOM content script carried the blacklist as `excludeMatches` and the whitelist as `matches`. [ADR 0020](0020-site-filters-follow-same-document-navigation.md) moved the decision into the content script, which reads the entries through `URLPattern`, as the popup status row and the icon had done since 2025-07. `URLPattern` is not a match pattern parser. Fed the same string, it disagrees on two shapes: `*://*.example.com/*` does not match `https://example.com/`, and `https://example.com/*` does not match `https://example.com:8443/`. Before ADR 0020 the disagreement only mislabeled the popup and the icon. After it, a saved entry with `*.` stops excluding or allowing the apex host.

The decisions:

1. **An entry is a Chrome match pattern in this subset: `<scheme>://<host>[:<port>]<path>`.**
   - scheme: `http`, `https`, or `*` for either.
   - host: `*` for any host, `*.example.com` for the host and every subdomain, or one exact host (a domain, `localhost`, an IPv4 address).
   - port: optional. `:3000` for one port, `:*` or nothing for any port.
   - path: required, starts with `/`. `*` matches any characters, every other character is literal. A `?` starts the query part.

   Everything else Chrome accepts is rejected: `<all_urls>`, `file://`, `ftp://`, `ws://`, `wss://`, `urn:`, `chrome-extension://`, bracketed IPv6 hosts, `*` inside a host except a leading `*.`, and an entry with no path. The content script never runs on those schemes. Chrome rejects a mid-host `*` and a missing path, and the old validator never accepted an IPv6 host, so no synced entry of those shapes exists.

2. **One function translates an entry into a `URLPattern` init dict that carries Chrome's meaning.** The `*` scheme becomes `http{s}?`. `*.example.com` becomes `{*.}?example.com`, MDN's own example for a domain and its subdomains. A missing port becomes `*`. The path splits at the first `?` into `pathname` and `search`, with `URLPattern`'s own syntax characters escaped so `C++` and `(programming_language)` stay literal. Validation on the options page and matching in the content script, the popup, and the icon all go through this function.

Alternatives rejected:

- `webext-patterns`, which converts match patterns to a RegExp: correct, but a dependency for one function.
- A hand-rolled RegExp replacing `URLPattern`: more code to own for no gain.
- `chrome.tabs.query({ url })`, which matches tabs with Chrome's own grammar and throws on an invalid pattern. Probed from the worker on 2026-09-10: it reads `*.host` and ports as Chrome does, and the tab URL is already updated when the content script reacts to `currententrychange`. Rejected because the content script cannot call it: the URL policy becomes a message hop and an async wait with a stale-response guard, `url: []` matches every tab, and one invalid entry throws the whole call. Same line count as the parser, spread over four files.
- Reverting ADR 0020: brings back the same-document navigation bug on GitHub for every default install, to protect a rare shape.

## Consequences

- Saved entries with `*.` or a port behave as they did in 9.1.1, when Chrome read them.
- An entry with no path, such as `https://example.com`, turns from accepted into invalid. Through `URLPattern` it matched the whole host; in 9.1.1 it broke the DOM script registration, so no such entry ever worked in a release.
- The query part is matched on its own, so `https://www.google.com/search?*` also matches the bare `/search`. Chrome would not. Lenient only.
- Every entry that worked in 9.1.1 keeps working. The rejected shapes broke Chrome's registration or failed the old validator, so no synced entry of those shapes ever filtered a page.
- The popup status row and the icon stop mislabeling `*.` entries, since they share the function.
- `tests/browser/urlpattern.playwright.ts` keeps testing raw `URLPattern`, including the apex mismatch. It records why the translation exists.
