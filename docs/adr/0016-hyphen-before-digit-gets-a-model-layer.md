# A hyphen before a digit gets a model layer, not a better rule

[ADR 0015](0015-hyphen-before-digit-reads-as-operator.md) gave the `CJK-digit` hyphen one reading, the operator, because at that shape no rule can separate a year range from a signed number: whatever it decides for `博客來-4%` it decides for `氣溫是-5度`. The sign reading did not stop being correct there, it stopped being derivable. What separates the two is the surrounding sentence, which a shape rule cannot see and a small on-device language model can.

The decision:

1. **Chrome's built-in Prompt API classifies one shape first.** A hyphen-minus directly between a CJK character and a digit, choosing between a signed number and a range or separator. Nothing else in pangu gets a model in this change, and everything else stays rules-only until some other shape earns its own decision.
2. **The model classifies, it never rewrites.** The rules flag the span, the model picks one label from an enum, and the rules insert or remove spaces per label. [ADR 0009](0009-nbsp-suppresses-spacing-never-rewritten.md) holds by construction rather than by review: a component that only ever returns a label cannot rewrite an author's bytes.
3. **Extension-only, on by default, and a late fix.** No model dependency reaches the npm package, the setting is on by default with a toggle to opt out, and the rules pass runs to completion first. With the model absent, disabled, or slow, today's output is what the page gets.

The other ambiguous symbol classes — filename-versus-mention, formula-versus-prose, brand suffixes — are deferred, not ruled out. Their first probe on this contract did not clear the zero-regression bar, which is why the hyphen goes first. But the prompt campaign that followed moved this same model, on this same contract, from failing that bar on the hyphen to clearing it, through prompt work alone. "The model's priors are wrong there" is therefore one probe's reading rather than a closed question, and each class earns its own decision on its own measurements.

Alternatives rejected:
- **Any backend other than the browser's own.** A local model server is a companion install, a hosted API is a network round trip and someone's bill, and a fine-tuned encoder is a training pipeline. None of that belongs behind a text-spacing library that has always been a pure function.
- **A cue-character lexicon instead of a model** — a list of characters that may precede a signed number, consulted by a widened rule. It is cheaper and fully deterministic, but it is an open-ended word list, the machinery [ADR 0013](0013-protected-word-list-removed.md) removed, and ADR 0015 already named it as such when it declined the same idea.

## Consequences

- ADR 0015's operator default is narrowed on one shape, and only for extension users with the model present. Every npm consumer's output is unchanged.
- The two hyphen-sign FIXME expectations in `tests/shared/symbol-minus-signs.test.ts` stay commented out, even though the model layer answers both correctly. They record what the _rules_ cannot do, which has not changed, and a browser-dependent path can never be what a shared-layer test asserts.
- pangu gains a code path whose result depends on a model, so the invariant is that it can never be load-bearing: rules first, model late, silent degradation. A page with no model is not a degraded page, it is the normal one.
- The feature is Chrome-only in practice, since no other browser ships an on-device prompt API. Feature detection at runtime, not a manifest floor bump.
