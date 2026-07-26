# 0009. NBSP suppresses spacing and is never rewritten

Date: 2026-07-26

## Status

Accepted. Reverses the normalization decision recorded in #287 and commit 88ab44c.

## Context

`SOLITARY_NBSP` rewrote an author's U+00A0 into a plain U+0020 before any spacing rule ran:

```js
const SOLITARY_NBSP = /(?<=\S)[ ]* [ ]*(?=\S)/g;
newText = newText.replace(SOLITARY_NBSP, ' ');
```

It was added in #287 on the reasoning that the engine treats NBSP as inert (`ANS_CJK_AFTER` and `ANS_BEFORE_CJK` use `¡-ÿ`, which starts one character past U+00A0), so text containing one was getting different treatment from text containing a plain space.

That reasoning conflated two things. Inertness means no rule matches **across** an NBSP, which is the correct outcome: an NBSP already separates the runs it sits between, so nothing needs inserting. It does not require rewriting the character. Measured against the engine, `第 5 章` comes back completely unchanged without the rule, and `我們說We invited` gains a space only at the genuinely missing `說|We` junction. The normalization was doing almost no spacing work; it was changing bytes.

Rewriting is also outside what pangu claims to do. The library exists to insert whitespace between CJK and half-width characters. Silently replacing a character the author did not ask it to touch is a different operation, and it is unobservable to the user until it changes their layout.

The concrete case that forced the decision is a Google Calendar event description (`fixtures/calendar-event-description.html`), where pangu rewrote two of the four `&nbsp;` in the author's text.

## Decision

pangu never rewrites or deletes an author's NBSP. It only ever inserts U+0020 where a separator is genuinely missing.

`SOLITARY_NBSP` is deleted. The inertness of U+00A0 is now load-bearing rather than incidental, and is documented at the `ANS_CJK_AFTER` / `ANS_BEFORE_CJK` definitions so nobody re-derives it or re-adds a normalization pass.

One guard needed widening. `CJK_HASH` and `HASH_CJK` used `[^ ]` to mean "something is glued to this `#`, so it is a hashtag". An NBSP passed that guard, so `台北 #中文` became `台北 # 中文`, splitting a legitimate hashtag. Both are now `[^  ]`. They are deliberately not `\S`: that would also exclude zero-width characters such as U+FEFF, and treating those as a gap would suppress a space that genuinely belongs, leaving the runs flush.

## Consequences

**NBSP keeps its line-break behavior.** This is the real cost and it was weighed explicitly. U+00A0 is break glue, not merely a same-width space, so preserved NBSPs remove wrap opportunities and WYSIWYG-pasted text wraps in more lines than before. Measured on the calendar fixture in a 180px box: 2 lines before, 3 lines after. This is accepted. Editors such as Google Calendar, Docs and Word emit `&nbsp;` mechanically, so the character often is not authorial intent, but pangu cannot tell the difference and guessing would be a worse contract than not touching it.

**NBSP followed by a plain space stays doubled.** `或  "` paints wider than one space, because CSS collapses a run of plain spaces but never collapses NBSP plus space. The old rule removed that gap. Preserving it is the deliberate choice: the doubled gap is in the author's input, and removing either character would be the rewrite this ADR forbids.

**Author NBSP padding now survives where rules used to absorb it.** `MIDDLE_DOT`, `fixBracketSpacing` and `FIX_QUOTE_ANY_QUOTE` strip only literal spaces, so padding inside brackets and quotes and around a middle dot is kept, and asymmetric input renders asymmetrically (`安室 · 奈美惠` keeps its gaps rather than closing them). This follows from the decision and is not separately fixable without reintroducing rewrites.

**Known gap, not fixed here.** `PIPE_SEPARATOR` refuses to fire when an NBSP touches exactly one side of a pipe, so `作詞 |林夕` stays glued on the right. That is a failure to insert rather than a rewrite, so it does not violate this ADR, but it is a real missing space. Fixing it needs a replacer that re-emits the captured NBSP.

**Verified.** Idempotency converges in one pass (`f(f(x)) === f(x)` over 8,414 inputs). The shared and browser layers agree: every browser-layer whitespace check is `\s`-based, which includes NBSP, and each can only suppress insertion. Text containing no NBSP is unaffected.

## Notes

The engine still rewrites other characters (`MIDDLE_DOT` maps `·` to `・`, `FIX_CJK_COLON_ANS` maps `:` to `：`, and several rules delete literal U+0020). This ADR is specifically about U+00A0 and does not claim the engine is rewrite-free.
