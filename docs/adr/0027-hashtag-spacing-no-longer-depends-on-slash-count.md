# Hashtag spacing no longer depends on the line's slash count

The hashtag block read two or more slashes on a line as a path context: on such a line no hashtag got a space, except a final ASCII hashtag not preceded by a slash. The contract lived only in a code comment. It protected two shapes: a CJK URL fragment (`/wiki/中文#歷史`) and a hashtag list (`/#絕地家庭小會議/#今天大掃除了沒有/`). ADR 0026 hides every URL before the rules run, so the first shape no longer needs the count, and the count was wrong on non-URL slash lists: `前端/後端/資料庫：C#和Python` kept `C#和` tight.

The decision:

1. **The hashtag rules run on the whole text, with no per-line slash count.** `CJK_HASH` and `HASH_CJK` apply everywhere; `CJK_FINAL_HASHTAG` is deleted.
2. **A hashtag right after a slash is a hashtag.** `HASH_CJK` excludes `/` on its left, so `/#tag` in a list stays tight instead of reading as a `C#` shape.

## Consequences

- `前端/後端/資料庫：C#和Python` reads `前端/後端/資料庫：C# 和 Python`.
- `看完這篇#pangu 的介紹 https://vinta.ws/code/` reads `看完這篇 #pangu 的介紹 https://vinta.ws/code/`; ADR 0026 alone already fixed it, since hiding the URL dropped the line's slash count to zero.
- The 8964 list row and the `href` with a CJK fragment are unchanged.
