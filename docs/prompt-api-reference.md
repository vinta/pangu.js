# Chrome Prompt API: Reference for Extension Integration

Compiled 2026-08-31, before any integration work, from Chrome's own documentation (pages last updated 2026-08-26), the WebML explainer, the blink-dev Intent to Ship, and a set of live probes run on this machine. Every fact below is tagged with where it came from: **[docs]** for a statement I could point at in official documentation, **[probe]** for something measured here on Chrome 152, **[secondary]** for a claim that only appears in blog posts, forum threads, or samples, and **[open]** for a question nobody has answered yet.

This file is a reference, not a plan. It records what the API is and how it behaves. What pangu does with it is decided: a hyphen-only model layer on this API — the decision lives in [ADR 0016](adr/0016-hyphen-before-digit-gets-a-model-layer.md), the design in [`hyphen-sign-model-layer.md`](hyphen-sign-model-layer.md), and neither is restated here.

## Verification basis

The probes were run on 2026-08-31 against Google Chrome 152.0.7977.65 (stable, macOS, this machine's normal profile, with Gemini Nano already downloaded), plus a second set on the Playwright-bundled Chromium 152 with a throwaway unpacked extension, which does not ship the on-device model. Where the two disagree, the branded-Chrome result is the one to trust; the Chromium runs are only useful for "is this global exposed in this execution context", which does not depend on the model being present.

Anything tagged **[probe]** is reproducible: the browser-page probes are plain `LanguageModel` calls from a page console on a secure origin, and the extension-context probe is a throwaway unpacked extension small enough to restate here: an MV3 manifest with `minimum_chrome_version: 138`, the `storage` permission, host permissions for `http://*/*` and `https://*/*`, an `<all_urls>` content script at `document_idle`, and a module service worker. The content script and the worker run the same body — record `typeof LanguageModel`, then `await LanguageModel.availability()`, `await LanguageModel.params()`, and `await LanguageModel.availability()` again with `expectedInputs` and `expectedOutputs` pinned to `zh-TW`, each call in its own try/catch so one rejection cannot hide the others. The content script logs the result; the worker returns it and assigns it to `self.probe` so it can be called from the worker console.

## The API surface in one page

The entry point is the global `LanguageModel`, with no vendor prefix and no `chrome.` namespace. **[docs]**

```js
const availability = await LanguageModel.availability(); // 'unavailable' | 'downloadable' | 'downloading' | 'available'
const session = await LanguageModel.create(options); // a LanguageModel session
const answer = await session.prompt(input, { responseConstraint });
const stream = session.promptStreaming(input); // ReadableStream of incremental chunks
const forked = await session.clone(); // same context, independent continuation
session.destroy();
```

Both `availability()` and `create()` take the same option bag, and the answer to `availability()` is only meaningful for the exact options you intend to pass to `create()`. **[docs]**

## Where it runs

| Context                                      | Exposed?                                                 | Evidence                                                                                                                                                                                                    |
| -------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Top-level page, secure origin                | Yes                                                      | **[probe]** `typeof LanguageModel === 'function'`, `availability()` returned `available`                                                                                                                    |
| Same-origin iframe                           | Yes, by default                                          | **[docs]**                                                                                                                                                                                                  |
| Cross-origin iframe                          | Only with `allow="language-model"` on the iframe element | **[docs]**, Permissions Policy delegation, enforced since Chrome 139 **[secondary]**                                                                                                                        |
| Web Worker                                   | No                                                       | **[docs]** — "The Prompt API isn't available in Web Workers for now, due to the complexity of establishing a responsible document for each worker"                                                          |
| Extension service worker                     | Yes                                                      | **[probe]** global present in an MV3 module service worker; **[secondary]** Google's own `ai.gemini-on-device` sample drives it from the background service worker                                          |
| Extension pages (popup, options, side panel) | Yes                                                      | **[secondary]** they are ordinary top-level `chrome-extension://` documents                                                                                                                                 |
| Offscreen document                           | Expected yes, untested                                   | **[open]** — same reasoning as extension pages, but nobody documents it and I did not probe it                                                                                                              |
| Content script (isolated world)              | Global is present                                        | **[probe]** `typeof LanguageModel === 'function'` and `availability()` was callable from a content script; the probe build had no model, so `create()` and `prompt()` in a content script remain **[open]** |

The content-script row is the one that decided pangu's integration shape (settled since: sessions live in the service worker, where the sampling knobs are — see [`hyphen-sign-model-layer.md`](hyphen-sign-model-layer.md)), and it is only half-answered. The global exists in the isolated world, which contradicts the widespread secondary claim that content scripts cannot touch the API at all — but "the constructor is visible" is not "a session can be created and prompted". Note also that the content-script probe did **not** have `LanguageModel.params`, while the extension service worker did (it returned `null` there only because that build has no model); that asymmetry suggests a content script gets the plain-web surface, not the extension surface, which is a hint that Chrome treats a content script as belonging to the page's origin rather than to the extension.

Settling this needs one run of the same probe extension inside branded Chrome with the model downloaded. `--load-extension` did not work on Chrome 152 here (the extension silently failed to load, no service worker, no content script), so that run has to be a manual "Load unpacked" of the probe extension described above, in a real Chrome window.

Two consequences worth stating in advance. If content scripts can create sessions, each page's script owns its own model access and the service worker is not in the path. If they cannot, every prompt has to be routed content script → `chrome.runtime.sendMessage` → service worker → back, which adds message-passing latency per span and puts the work on an event-driven worker that Chrome can terminate between calls.

### Where the model actually runs

The session object lives in whatever context created it, but the model does not. Chromium loads and executes Gemini Nano in a separate utility process named "On-Device Model Service", which is why its memory shows up as its own row in Chrome's task manager. **[secondary]** Consistent with that, a page's JavaScript heap was flat at 11 MB across a `create()` and three prompts on Chrome 152. **[probe]** Renderer memory is more than the JS heap, so the heap figure alone proves little; the process split is what carries the point.

### Checking the advice that circulates about content scripts

Widely repeated guidance says the API is exposed in content scripts, that prompting from one "consumes memory in the host page's process" and is "affected by page-level lifecycle events", and that the right pattern is to extract text in the content script and message the background or side panel to run the model. Checked claim by claim:

- Any version of this advice written against `ai.languageModel` is stale on its face: `globalThis.ai` is `undefined` on Chrome 152. **[probe]** That dates the text to before the rename and makes its claim of content-script support weak evidence rather than confirmation.
- The memory argument does not hold as stated, per the process split above. The renderer holds a proxy, not the weights.
- The lifecycle argument is true but under-stated in one direction and over-stated in the other. A session cannot outlive the document that created it, so a content-script session dies on every navigation and every tab close, and each new page pays the full `create()` cost again — around 4 s cold here. Against that, the destination proposed as safer is not lifecycle-free either: an MV3 service worker is terminated when idle, taking any live session with it. Neither home avoids re-creation; they fail on different schedules.
- The recommended pattern is nevertheless the better default, for a reason the advice does not give: one base session in the service worker, cloned per call, amortises the create cost across every tab, which is exactly the pattern Chrome's own dos-and-don'ts page prescribes.

The sharper argument for keeping prompts out of content scripts is the surface asymmetry noted above: the content script had no `LanguageModel.params`, while the extension service worker did. If a content script really gets the plain-web surface, it cannot pin `temperature` or `topK`, and unpinned sampling is not a theoretical worry here — two measured runs with byte-identical prompts and identical shuffled menus still swung on sampling alone. A classifier that cannot fix its sampling is disqualified regardless of whether `create()` works in that context at all. This raises the stakes on the open questions below; it does not answer them.

## Version, platform, and policy gates

- **Extensions**: generally available from Chrome 138. The old origin trial (`"permissions": ["aiLanguageModelOriginTrial"]` plus the `chrome.aiOriginTrial.languageModel` namespace) expired at Chrome 147; the docs explicitly say to remove that permission. No permission is required today. **[docs]** / **[secondary]** for the exact trial-era milestones
- **Open web**: origin trial from Chrome 139, stable from Chrome 148. **[secondary]**, from the blink-dev Intent to Ship
- pangu's manifest currently declares `minimum_chrome_version: 99`. Any Prompt API code therefore has to feature-detect at runtime rather than lean on the manifest floor, unless the floor is raised deliberately — and raising it to 138 would drop users the extension currently supports
- **Platforms**: Windows 10 and 11, macOS 13+, Linux, and ChromeOS on Chromebook Plus (platform 16389.0.0+). Android, iOS, non-Plus Chromebooks, and WebView are not supported. **[secondary]**
- **Hardware**: more than 4 GB of VRAM, or a CPU path with 16 GB+ RAM and 4+ cores; audio input specifically requires a GPU. At least 22 GB free disk at download time, and the model is deleted again if free space later falls below 10 GB, after which it re-downloads on next use. **[secondary]**, consistent across several sources
- **Enterprise policy**: `GenAILocalFoundationalModelSettings` can block the model download outright and `BuiltInAIAPIsEnabled` can block the built-in AI APIs while leaving other on-device features alone. There is no JavaScript way to read either; policy shows up as `availability()` returning `unavailable`. **[secondary]**
- Local model state is inspectable at `chrome://on-device-internals`. **[secondary]**
- Inference runs entirely on-device: prompt text is not sent to Google servers, which is the whole reason this API is a candidate for spacing arbitrary page text at all. **[docs]** Chrome's own privacy and safety guidance for the built-in AI APIs defers to the shared Writing Assistance APIs specification, and no Prompt-API-specific telemetry disclosure was found. **[secondary]**

Practical shape of all of this: `availability()` is the only gate that code should test. Everything above collapses into it.

## Availability and download

`availability(options)` resolves to exactly one of `unavailable`, `downloadable`, `downloading`, `available`. **[docs]** Any sample using `readily`, `after-download`, or `no` predates the rename and should not be copied. **[secondary]**

Calling `create()` when the state is `downloadable` starts the download. Progress arrives through a monitor callback:

```js
const session = await LanguageModel.create({
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Downloaded ${e.loaded * 100}%`);
    });
  },
});
```

`e.loaded` is a fraction between 0 and 1, not a byte count, and `e.total` is always 1 — code that computes `e.loaded / e.total * 100` on the assumption of bytes will still happen to work, but code that prints `e.loaded` as bytes will not. **[docs]** for the snippet, **[secondary]** for the "always 1" detail. The extension documentation advises checking for user activation before triggering a download; whether the requirement is enforced differently in extensions than on the web is **[open]**.

The download is a multi-gigabyte one (2.7–4 GB on disk per secondary sources), so it is a foreground, user-visible event, not something to kick off silently on install.

Chrome's model-management documentation (last updated 2025-10-21) adds several facts that any integration has to survive. **[docs]** The first `create()` call triggers a capability check that decides between a larger Gemini Nano variant (around 4B parameters), a smaller one (around 2B), and CPU-based inference, so the model behind the same API is not the same everywhere. Models are purged when free disk space falls below a threshold, when an enterprise policy disables the feature, and when a user has not met the eligibility criteria for 30 days. Most sharply: "the model can be deleted at any time, even mid-session, without regard for running prompts". Model updates are hot-swapped with no downtime, but a prompt issued at the exact moment of a swap can fail.

The operational consequence is that `availability()` is a snapshot, not a guarantee. Any long-lived integration has to treat a mid-flight failure as normal and re-check rather than assume a session stays valid for as long as it holds a reference.

## Sessions

`create()` accepts `initialPrompts`, `signal`, `expectedInputs`, `expectedOutputs`, `monitor`, and — in extension contexts — `temperature` and `topK`. **[docs]**

There is no separate `systemPrompt` option any more: the system message is `initialPrompts[0]` with `role: 'system'`, it must be first (a system role elsewhere in the array throws `TypeError`), and it is never evicted when the context window overflows. **[docs]**

Context accounting was renamed. The current names are `session.contextUsage`, `session.contextWindow`, `session.measureContextUsage()`, and the `contextoverflow` event; the older `inputUsage`, `inputQuota`, `measureInputUsage()`, and `quotaoverflow` are gone. **[docs]**, and confirmed **[probe]** on a web page: on Chrome 152 a fresh session reported `contextUsage` and `contextWindow` as numbers while `inputUsage`, `inputQuota`, and `measureInputUsage` were all `undefined`. An extension service worker is different: **both** spelling sets coexist there — `contextUsage`/`contextWindow` and `inputUsage`/`inputQuota` all reported values (61/9216 after a short system prompt), with both measure functions present. **[probe]** 2026-09-01, pangu's eval page on Chrome 152. Extension code can use the current names. Overflow rejects with `QuotaExceededError`, which is a real global on Chrome 152 **[probe]** and carries `requested` and `contextWindow` properties **[secondary]**. When the window fills, Chrome evicts the oldest prompt/response pairs one at a time. **[docs]**

`clone()` forks a session's context so each call starts from the same primed state without paying `create()` again; `destroy()` frees the session and makes an in-flight `prompt()` reject and an in-flight stream error with `AbortError`; `append()` adds messages without generating a response and can itself overflow the window. **[docs]**

For an extension service worker, sessions are in-memory objects and cannot outlive worker termination, so anything stateful has to be reconstructible from stored `initialPrompts`. Measured 2026-09-01 **[probe]**: MV3 idle termination has no special interaction beyond that — the session dies with the worker, and recreating the base session on the next message cost ~4.4–5.3 s (see open question 3 below). A related **[secondary]** claim left unisolated: Chrome unloads the underlying model roughly a minute after the last session is destroyed, and the suggested mitigation is to keep one idle session alive.

## Prompting

`prompt()` takes either a string or an array of `{role, content}` messages, and returns the full response; `promptStreaming()` returns a `ReadableStream` of incremental chunks (not cumulative text), consumable with `for await`. **[docs]** Both accept `{signal}` for abort.

A response can be primed by ending the message array with an assistant turn marked `prefix: true`, which makes the model continue that text rather than answer it:

````js
const sheet = await session.prompt([
  { role: 'user', content: 'Create a TOML character sheet for a gnome barbarian' },
  { role: 'assistant', content: '```toml\n', prefix: true },
]);
````

**[docs]**

Multimodal inputs are declared through `expectedInputs` and passed as `{type: 'image'|'audio', value}`. Accepted image values include `HTMLImageElement`, `SVGImageElement`, `HTMLVideoElement`, `HTMLCanvasElement`, `ImageBitmap`, `OffscreenCanvas`, `VideoFrame`, `Blob`, and `ImageData`; audio accepts `AudioBuffer`, `ArrayBuffer`, `ArrayBufferView`, and `Blob`. Audio requires a GPU. **[docs]** The exact Chrome version where each modality became generally available is **[open]** — sources cite both 138 and 148.

## Structured output

`responseConstraint` takes a JSON Schema object, and the docs also describe passing a regular expression. **[docs]** The response is always a **string** that has to be `JSON.parse`d, even for a bare scalar schema.

Enum constraints work, which matters because Chrome's own documentation never demonstrates one:

```js
const raw = await session.prompt(question, {
  responseConstraint: { type: 'string', enum: ['filename', 'extension-mention', 'unsure'] },
});
JSON.parse(raw); // 'extension-mention'
```

**[probe]** — on Chrome 152 this returned the quoted string `"extension-mention"` for a zh-TW question about `.png`. Enum constraints are well-attested in practice even though the documentation is silent about them.

By default Chrome injects the constraint into the prompt, which consumes context window. `omitResponseConstraintInput: true` suppresses that injection, and the documented caveat is that you must then describe the required format in the prompt text yourself. **[docs]** In practice the model still answered correctly with the constraint omitted from the input **[probe]**, but that was one trivial case and proves nothing about harder ones.

Whether the constraint is enforced by grammar-constrained decoding is still undocumented, but the failure mode question is closed operationally **[probe]** 2026-09-01: across 300+ enum-constrained calls in the extension retest, every response parsed as a member of the enum — no constraint failure was ever observed (see open question 5 below). Grammar-constrained decoding is what would make an enum answer a single forced token rather than a suggestion, and the observed behaviour is consistent with it.

## Sampling knobs

`LanguageModel.params()`, `temperature`, and `topK` are documented as the extension-context surface: "Legacy numerical parameters (`topK`, `temperature`) and the `LanguageModel.params()` method are supported" for Chrome Extensions. **[docs]** On the open web these numeric knobs sit behind a separate experimental origin trial from Chrome 148 that replaces them with enum `samplingMode` values. **[secondary]**

Measured behaviour on a plain page in Chrome 152 **[probe]**: `LanguageModel.params` is `undefined`, but `create({temperature: 0, topK: 1})` resolved **without throwing**. So a page cannot read the model's parameter limits, and cannot tell whether the numbers it passed had any effect — the call silently succeeds either way. Do not treat a successful `create()` with `temperature: 0` as evidence of determinism outside an extension.

In an extension service worker the knobs are real. **[probe]** 2026-09-01, pangu's eval page on Chrome 152: `LanguageModel.params` exists there, but its return JSON-serializes as `{}` (IDL attributes are not own-enumerable), so `maxTopK` and friends are unreadable in practice; `create({temperature: 0, topK: 1})` was accepted, and two independent 69-answer runs with identical inputs reproduced byte-identically — which is the actual proof the knobs pin sampling. Determinism per input is total; answers still change when the prompt bytes change (menu order included).

When they are supported, `temperature` and `topK` must be supplied together or not at all. **[secondary]**

## Languages

The documented set is exactly `en`, `ja`, `es`, `de`, `fr`, with "Support for additional languages is in development". **[docs]** No Chinese locale is in it, and none has been added as of 2026-08-31.

What that means in practice, measured on Chrome 152 **[probe]**:

| Call                                                         | Result                                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `availability()` with no options                             | `available`                                                                     |
| `availability()` declaring `en` or `ja`                      | `available`                                                                     |
| `availability()` declaring `zh`, `zh-Hant`, or `zh-TW`       | `unavailable` (returns, does not throw)                                         |
| `create()` declaring `zh-TW`                                 | rejects, `NotSupportedError: The requested language options are not supported.` |
| `create()` with no language declaration, then a zh-TW prompt | works, answers correctly                                                        |

So a declared-language check is a hard gate that zh-TW fails, and an undeclared session is the only way to run Traditional Chinese. The explainer's position on undeclared sessions is that the API then "assumes input languages are unknown", that declaring languages is recommended, and that a `NotSupportedError` can still surface later at prompt time instead of at creation. **[secondary]**, from the explainer. Declarations exist to trigger any needed downloads and to fail fast; the explainer states that declaring an output language does _not_ steer the model's output language. **[secondary]**

The consequence for pangu is worth being blunt about: running zh-TW through this API means running it outside its declared support envelope, on purpose, with the runtime error deferred rather than removed.

## Measured numbers, Chrome 152, this machine

All **[probe]**, single samples, model already downloaded and warm:

| Measurement                                                       | Value                              |
| ----------------------------------------------------------------- | ---------------------------------- |
| `create()` with a short system prompt, first call in the page     | 3840 ms                            |
| `prompt()` with an enum constraint, zh-TW question, on a clone    | 743 ms                             |
| `prompt()` with an enum constraint, first call in a fresh session | 672 ms                             |
| Same prompt on later clones of a warm session                     | 114 ms, 112 ms                     |
| Two clones prompting concurrently via `Promise.all`               | 473 ms total, both answers correct |
| `contextWindow`                                                   | 9216 tokens                        |
| `contextUsage` after a short system prompt                        | 15 tokens                          |
| `contextUsage` after one constrained zh-TW question and answer    | 84 tokens                          |
| `measureContextUsage('test')`                                     | 6 tokens                           |

The warm figures matter as much as the cold one: the first constrained prompt against a fresh session cost 672 ms, while the next two cost 114 ms and 112 ms. Per-span classification is therefore a sub-150 ms operation once the session is warm, and the first call carries a one-off penalty that pre-warming is meant to absorb.

Two things stand out. The context window is 9216 tokens, which is small enough that page-scale input is out of the question and per-span prompting is the only viable shape. And `create()` is roughly five times the cost of a `prompt()` call, which is the concrete argument for the `clone()`-per-call pattern the experiment harness already uses.

An independent third-party setup repository reports the same context window of 9216 tokens, "shared between input and output", along with roughly 50 tokens per second of generation and a time to first token of 80–90 ms warm, rising to about 2.9 s when the input approaches the window. **[secondary]** That brackets the warm figures measured here and is the only outside corroboration of the window size I found. The same repository documents two details worth keeping: the download is triggered only by `create()` and never by an `availability()` check alone, and `chrome://flags/#optimization-guide-on-device-model` has an "Enabled BypassPerfRequirement" setting that allows testing on machines that fail the hardware bar. Its claim that production use needs an origin trial token or extension distribution was true when written and is stale now that the web API shipped in Chrome 148.

Concurrency is still undocumented, but it is now measured **[probe]** 2026-09-01: two clones prompting concurrently through a whole 23-span batch produced zero errors and answers identical to a sequential run, while per-span latency roughly doubled — the On-Device Model Service executes inference effectively single-lane, so concurrency is safe and buys no throughput (see open question 4 below).

The probes also ran in a **hidden** tab (`document.visibilityState === 'hidden'`) and worked normally, so the API itself is not gated on page visibility. **[probe]** This is worth recording because pangu's own scheduling is: `requestIdleCallback` never fires in a hidden tab, which has repeatedly made automated timing measurements lie.

## Official usage guidance

Chrome publishes a dos-and-don'ts page for the built-in AI APIs (last updated 2026-04-30). Everything in this section is **[docs]**. Most of it assumes a feature that generates user-visible text, which pangu's contract does not; the items below are the ones that survive that filter.

- **Pre-warm the session as soon as user intent is established**, not when the first result is needed: "Unless necessary, don't wait for the user to click 'Generate' to initialize the session." The 3840 ms `create()` measured above is exactly this cost. The caveat attached to it is that `initialPrompts` can only be set at creation, so pre-warming has to wait until the system prompt is final.
- **Put system instructions in `initialPrompts` at `create()`**, never as part of the first `prompt()` call, which the page says increases first-prompt latency significantly.
- **Keep a base session holding only the system instructions and `clone()` it per task.** The stated reason is that cloning "saves the overhead of re-parsing system instructions". The page also warns against cloning a session that already carries interaction history, and against reusing one session for unrelated tasks.
- **`destroy()` clones when done**, keeping the base alive: "Each session consumes memory, which creates unnecessary resource usage."
- **Send the model only what the task needs.** The page names raw text, metadata, HTML tags, and large unfiltered lists as things to strip, prefers `.innerText` over `.innerHTML`, and states that "Latency grows significantly with input size". With a 9216-token window, this is a hard constraint rather than a tip.
- **Use `responseConstraint`, not natural-language format instructions.** Asking for JSON in prose is called out as the anti-pattern because "Models might include conversational filler that breaks your parser."
- **Do not express length limits as a schema constraint.** A `maxLength`-style constraint makes the model "switch to high-density tokens like foreign languages or emoji to compress meaning, resulting in nonsensical output"; truncate client-side instead. An enum constraint is unaffected, but this is the shape of failure to expect when a constraint fights the model.
- **Cache results for repeated inputs**, in `sessionStorage` or IndexedDB, normalising the input (trim, lowercase) to raise the hit rate and setting a conservative TTL. For pangu this is the cheapest available win, because the same ambiguous spans recur across pages and across visits, and a cache hit costs nothing at all.

Two further recommendations exist and do not apply here. The page's streaming section requires treating model output as untrusted and sanitising the full combined output rather than per chunk, because "malicious code could be split across updates" — pangu never inserts model output into the DOM, since the model returns a label and the rules insert the spaces. The UX recommendations (progress cues, undo and version navigation, letting the user override the result, even an artificial one-to-two-second delay so a near-instant answer feels trustworthy) all assume a visible generation step that pangu does not have.

## Recognising stale code samples

The API has been renamed several times, and search results are full of dead spellings. Tells, oldest first: **[secondary]**

- `window.ai.createTextSession()` — 2024 era, gone
- `window.ai.languageModel.create()` / `ai.languageModel.create()` — superseded
- `chrome.aiOriginTrial.languageModel` and `"permissions": ["aiLanguageModelOriginTrial"]` — extension origin trial, expired at Chrome 147
- `availability()` compared against `readily` / `after-download` / `no` — three-state naming, replaced by the four-state set
- `inputUsage`, `inputQuota`, `measureInputUsage()`, `quotaoverflow` — replaced by the `context*` names
- Anything asserting `temperature`/`topK` work on a normal web page — they are extension-surface knobs, and a plain page accepts them without complaint and gives you no way to tell whether they took effect

## Open questions to settle before integrating

Questions 2–5 were answered on 2026-09-01 by an extension-context retest, run through a temporary eval page that routed every call through the service-worker classifier. All answers are **[probe]**, Chrome 152, this machine.

1. **Can a content script create and prompt a session?** Still open — the global is exposed there, but the probe build had no model. Moot for pangu: the settled design routes prompts through the service worker because that is where the sampling knobs live.
2. ~~Does `params()` exist in an extension service worker, and do `temperature: 0` / `topK: 1` pin sampling there?~~ **Answered**: `params()` exists but its return is unreadable in practice (JSON-serializes as `{}`, IDL attributes not own-enumerable); the knobs are accepted, and two independent 69-answer runs reproduced byte-identically, so sampling is fully pinned. The worker session reports both quota spelling sets (see Sessions above).
3. ~~What happens to a session when the MV3 service worker is terminated?~~ **Answered**: the in-memory session dies with the worker and the cost is one `create()` (~4.4–5.3 s measured, against 3840 ms on a warm page) on the next message; a 90 s-idle probe answered in 5.1 s total with a correct label. Stateless recreate-on-miss handles it. The model-unload-after-a-minute claim was not isolated separately.
4. ~~Is there a concurrency limit or a global lock?~~ **Answered**: two concurrent clones are safe (no errors, answers identical to sequential) and useless — per-span latency doubles, so the On-Device Model Service is effectively single-lane and concurrency buys no throughput.
5. ~~What does the model do when a constraint cannot be satisfied?~~ **Closed operationally**: across 300+ constrained calls in the retest, every response parsed as a member of the enum — no constraint failure was ever observed, so a per-span `try`/`catch` that records the error is sufficient and no dedicated fallback path exists in the integration.
6. **Which Chrome version is the real floor**, and what happens to the `minimum_chrome_version: 99` users who will never have this API.

## Sources

- Prompt API, Chrome for Developers — https://developer.chrome.com/docs/ai/prompt-api (last updated 2026-08-26, fetched 2026-08-31)
- Prompt API in Chrome Extensions — https://developer.chrome.com/docs/extensions/ai/prompt-api (last updated 2026-08-26, fetched 2026-08-31)
- Structured output for the Prompt API — https://developer.chrome.com/docs/ai/structured-output-for-prompt-api (last updated 2025-05-13)
- Session management — https://developer.chrome.com/docs/ai/session-management (fetched 2026-08-31)
- Built-in AI dos and don'ts — https://developer.chrome.com/docs/ai/built-in-ai-dos-donts (last updated 2026-04-30, fetched 2026-08-31)
- Understand built-in model management — https://developer.chrome.com/docs/ai/understand-built-in-model-management (last updated 2025-10-21, fetched 2026-08-31)
- Looking inside Chromium's on-device AI stack, Island — https://www.island.io/blog/looking-inside-chromiums-on-device-ai-stack (source for the "On-Device Model Service" utility process)
- Prompt API explainer, W3C Web Machine Learning CG — https://github.com/webmachinelearning/prompt-api
- Intent to Ship: Prompt API, blink-dev, 2026-04-01 — https://www.mail-archive.com/blink-dev@chromium.org/msg16247.html
- `ai.gemini-on-device` extension sample — https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/functional-samples/ai.gemini-on-device
- Gemini Nano CPU support — https://developer.chrome.com/blog/gemini-nano-cpu-support
- `Ar9av/gemini-nano-chrome`, third-party setup and verification scripts — https://github.com/Ar9av/gemini-nano-chrome (corroborates the context window and warm latency; its origin-trial claim is stale)
