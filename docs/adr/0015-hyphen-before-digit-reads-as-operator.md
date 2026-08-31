# A hyphen before digits reads as an operator, not a sign

ADR 0003 rule 3 attached `+` and `-` to following digits as signs at a CJK boundary (`打 +886`, `氣溫是 -5 度`). For the hyphen that reading paid for one shape with three: a year range (`2016年-2018年` rendered as `2016 年 -2018 年`), a signed delta (`庫存-2件` as `庫存 -2 件`), and, taken from a real page title, a site-title separator before a percent-led title (`博客來-4%法則：…` as `博客來 -4% 法則：…`). At the hyphen every one of these is the same shape, `CJK-digit`, so no rule can tell them apart: whatever the sign rule decides for `來-4` it decides for `是-5`. A shape rule can only pick the default reading for the shape.

The decision picks the operator reading:

1. `CJK_SIGN_DIGIT` keeps `+` only. `打+886` still renders as `打 +886`.
2. A hyphen directly between CJK and a digit falls to `CJK_OPERATOR_ANS` like any other operator in CJK contact: `2016 年 - 2018 年`, `博客來 - 4% 法則`, `庫存 - 2 件`, `第 1 名 - 第 3 名`, and `氣溫是 - 5 度左右`.
3. The other affix readings are untouched: the lowercase flag (`參數要加 -m 的旗標`), the plus suffix (`Disney+ 上架`), single-letter grades (`D-`), and hyphens between half-width characters (`5-A`, `1-10`, `USB-C`) stay as ADR 0003 left them.

Frequency decides the default. A negative number glued to CJK is rare in real pages: prose writes 零下 5 度 or 負 4%, and the signed numbers in finance and weather copy sit in table cells or after a colon or a space, where nothing CJK touches the hyphen and neither reading fires. Year ranges, site-title separators, and ranked ranges are everyday prose shapes. The sign reading's one test expectation (`氣溫是-5度左右`) was the rule's own illustration, never a user report.

Alternatives rejected:

- Exempt percentages with a `(?![0-9]+%)` lookahead on the sign rule: passes the whole suite, but only because nothing in it has the `CJK-N%` shape. It flips `報酬率-4%左右` to `報酬率 - 4% 左右` and `成長+5%的幅度` to `成長 + 5% 的幅度`, and misses decimals (`殖利率-0.5%` keeps the sign), so it is inconsistent as well as a trade.
- Decide from the CJK before the hyphen (a site-name list, or verbs like 是, 為, 到 that precede a signed number): a lexicon, the machinery ADR 0013 removed, and the reading it would pin is exactly the symbol sense disambiguation the context-aware model experiment exists to test.

## Consequences

- Reverses ADR 0003's accepted cost for the hyphen: `氣溫是-5度左右` now renders as `氣溫是 - 5 度左右`. The test expectation flips in place so the traded cost stays pinned.
- The year range FIXME from ADR 0003 closes: `2016年-2018年` renders as `2016 年 - 2018 年`.
- The two signs are no longer symmetric: `打 +886` but `氣溫是 - 5 度`. Accepted, phone codes and positive markers (`+886`, `+5`) have no range or separator reading competing with them.
- Glued signed percentages in CJK contact space as operators (`報酬率 - 4% 左右`). Authors who want the sign reading write the space themselves (`報酬率 -4% 左右`), and already-spaced text is never collapsed.
