# URLs are protected units

Nothing in the engine knew what a URL was. The rules read a URL character by character, so a percent-encoded path came out as `https://%E5%A6%82` becoming `https://% E5% A6%82` (issue 149, the `%` rule fired inside the URL), a percent-encoded Google search URL was cut the same way (issue 147), and a CJK query string `?q=中文&hl=zh-TW` became `?q = 中文 & hl=zh-TW`. The hashtag block relied on a per-line slash count to keep `/wiki/中文#歷史` intact, which ADR 0027 needs gone. Prior art: linkify-it v6, Autolinker.js, twitter-text, the GFM autolink extension and cmark-gfm, Gruber's pattern, url-regex (CVE-2020-7661) and url-regex-safe, huacnlee/autocorrect, doggy8088/vscode-pangu2, zhlint.

The decision:

1. **Scheme-anchored only.** A URL starts at `http://` or `https://`. A letter or digit right before the scheme is not a URL start, so a CJK character right before it is (`你https://`, issue 149's shape).
2. **The body is one negated character class.** It stops at whitespace, a straight quote, angle brackets, a backtick, CJK punctuation, full-width forms, curly quotes, an ellipsis, and the Private Use Area that holds placeholders. Linear time: content scripts see attacker text.
3. **Trailing half-width punctuation and an unbalanced closing parenthesis belong to the prose.** `https://vinta.ws/code/.` ends before the period; `(https://vinta.ws/code/)` keeps its parenthesis outside; `https://en.wikipedia.org/wiki/Foo_(bar)` keeps the balanced one inside.
4. **CJK characters continue the URL.** `/wiki/中文` and `?q=中文` stay inside. The cost is that CJK prose written tight after a half-width URL stays tight (`zh-TW看看`, `155這個issue`); no implementation tells URL-internal CJK from prose.
5. **A URL is hidden behind a placeholder before every rule runs and restored after the HTML tags.** Attribute values reach `spaceText()` through the HTML step, so a URL inside `href="..."` is hidden the same way. Only the left edge needs a rule: CJK right before the placeholder gets a space.

Alternatives rejected:

- **Stop the body before CJK characters** (twitter-text's reading, prototyped as `v3c`): `https://zh.wikipedia.org/wiki/中文#歷史` inside an `href` becomes `wiki/ 中文 #歷史`, `?q=中文&hl=zh-TW` becomes `?q= 中文 & hl=zh-TW`, and issue 155's shape becomes `https://xxxxx/ 自动加空格.html`. Every CJK URL is mangled to buy a space on three tight-prose rows.
- **Scheme-less `www.` and bare domains.** `pangu.js` and `Node.js` are false positives, and the ordinary rules already read those tokens right.
- **Validate candidates with `URL.canParse()`.** It finds nothing in running text, and every `https://x` candidate parses anyway.
- **A linkify-it dependency.** The engine ships dependency-free.

## Consequences

- Issues 149 and 147 are fixed. CJK query strings, fragments, and percent-encoded paths stay intact, in text and inside `href`.
- Three tight-prose rows lose a space: `zh-TW看看`, `155這個issue`, `canParse_static這裡`. The reading stays open as a FIXME (`it.todo` in `url.test.ts`): the wanted output is `zh-TW 看看`, and no rule tells URL-internal CJK from prose written tight after the URL.
- Half-width punctuation written tight between a URL and CJK stays inside the URL, because the CJK after it continues the body: `參考(https://vinta.ws/code/)的說明` reads `參考 (https://vinta.ws/code/)的說明`, and `https://vinta.ws/code/,謝謝` keeps its comma tight. On the previous engine both got the space. Full-width `（）` and `，` stop the body and are unaffected.
- The per-line slash count in the hashtag block is no longer what protects CJK URL fragments, so ADR 0027 can delete it.
- Glossary: new **HTTP URL** entry. The constant is `HTTP_URL` because `URL` would shadow the platform class inside the module.
