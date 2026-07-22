---
name: generate-test-texts
description: Harvest real-world CJK/Latin mixed-symbol texts (non-spacing form) into ./tmp for evaluating spacing-rule coverage
disable-model-invocation: true
allowed-tools:
  - WebSearch
  - WebFetch
  - Bash(grep:*)
  - Bash(sort:*)
  - Bash(cat:*)
  - Bash(date:*)
  - Write(tmp/**)
---

# Generate Test Texts

Harvest real-world texts whose CJK and half-width symbol mixes stress `spacingText()`, and deliver them in non-spacing form for fixture authoring. Default is 20 lines. The invocation may override the count or steer the focus toward specific symbols.

Every line is harvested, meaning lifted from a page a real human published. Search-result titles are themselves harvest. If a wanted context refuses to turn up, switch genre or query. Writing a line yourself is the one hard no.

## 1. Inventory covered contexts

Collect what the corpus already tests:

- Fixture inputs: `grep -rhoE "spacingText\('[^']+'\)" tests/shared/*.test.ts | sort -u`
- Prior harvests: `cat tmp/real-world-texts*.txt 2>/dev/null`

Done when, for any symbol context, you can answer covered or uncovered.

## 2. Claim gaps

Plan one line per uncovered context. A gap earns one line, a covered context earns none. Gap families that keep paying:

| Family | Examples |
| --- | --- |
| Fullwidth/halfwidth lookalikes | `｜` vs `\|` vs `│` vs `丨`, `％` vs `%`, `／`, `－` |
| Symbol runs | `SPF50+/PA++++`, `1+1=$50`, `C++`, `......` |
| Brand and model traps | `85度C`, `YouBike 2.0E`, `EMU3000`, `Disney+` |
| Marks glued to CJK | `®` `°C` `★` `×` vs `X`, `@handle`, `#話題#`, `vs.`, `~` |
| Structure | `【】《》「」[]`, `9／21`, `11:00`, `NT$24,280`, `70,000~150,000元` |

Done when every planned line has claimed a gap no other line claims.

## 3. Harvest

WebSearch genres dense in mixed symbols, batching independent queries in one block. Craft queries so the wanted string surfaces in result titles (include brand names and format tokens like 「」, vs, ％). Fetch a page only to verify a doubtful title.

Genres that yield: e-commerce listings (momo, PChome, 蝦皮, Amazon JP), telecom and bundle plans, news and live-stream titles, stock and finance headlines, ticketing and sports schedules, forum and bio strings (PTT, 巴哈, Plurk, weibo), job listings (104 titles are reliably messy), promo campaigns. Mostly zh-TW, plus a few Simplified and Japanese lines.

Done when every claimed gap holds a harvested line with its source URL noted.

## 4. Normalize to non-spacing form

The line must read as if its author never spaced CJK from half-width:

- Delete a space only when a neighbour is CJK or fullwidth punctuation (sites like ePrice and GNN pre-space, strip that).
- Keep spaces inside pure Latin and digit runs: `iPhone 15 Pro Max`, `PChome 24h`.
- Keep every other codepoint byte-for-byte: lookalikes such as `｜／％“”·` stay exactly as published.

Done when each line differs from its source only by deleted CJK-boundary spaces.

## 5. Deliver

Write the texts, one per line and nothing else, to `tmp/real-world-texts-$(date +%Y%m%d-%H%M%S).txt`. Fixture authoring stays with Vinta: he decides each expected spaced form, so the txt file is the deliverable.

Close with a provenance report: the gap each cluster covers, source links, and a flag on every stitched line (clauses or fragments joined from one source). Title-verbatim is the default, stitched lines stay a handful.
