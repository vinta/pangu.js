# Hyphens between half-width characters are word connectors, never operators

**Superseded by [ADR 0003](0003-symbols-between-half-width-are-tokens.md), which generalizes this rule to every symbol.**

A `-` between two half-width characters is ambiguous: minus (operator) or hyphen/dash (connector). The algorithm previously treated letter-letter and digit-letter hyphens as operators whenever the text contained CJK anywhere (`得到一個A-B的結果` became `得到一個 A - B 的結果`), which mangled hyphenated passport names (`WANG,HSIAO-MING` became `HSIAO - MING`), acronym pairs (`USB-C`, `X-RAY`), and codes (`5-A`). Since the hyphen/dash reading dominates real-world text, the connector reading wins: `ANS_HYPHEN_ANS_NOT_COMPOUND` was deleted, and a hyphen acts as an operator only in direct contact with CJK (`前面-後面`, `陳上進-Vinta`). This makes `-` contact-gated like `&` (`S&P` stays intact while `陳上進&Vinta` gets spaces), whereas `=` `+` `*` `<` `>` remain text-gated because they have no competing word-joining reading.

Alternatives rejected:

- Keep single-letter pairs (`A-B`) as operators via boundary guards: preserves the minus reading but still splits `X-RAY` and `USB-C`, and the boundary conditions are hard to explain.
- Contact-gate all operators uniformly: `A+B` between CJK is usually genuine arithmetic, and the churn to published output would be far larger.

## Consequences

- `A-B` meaning "A minus B" in CJK prose stays unspaced. Accepted cost; authors who mean subtraction can write ` A - B ` themselves, and already-spaced text is preserved.
- Digit-letter codes (`5-A`) stay intact. The old `5 - A` operator output had no test coverage.
- The glossary terms for this model were **Symbol handling** and **Hyphen reading** in `CONTEXT.md` (contact-gated vs text-gated). **Hyphen reading** has since been folded into **Symbol handling** by ADR 0003.
