# Testing the Prompt API Integration in a Real Browser: Reference

Compiled 2026-09-01, before any integration work, to answer one question that [`prompt-api-reference.md`](prompt-api-reference.md) deliberately leaves open: how do you exercise this API from an automated test without mocking it, and what can actually be automated versus what stays a manual run?

That file records what the API is and how it behaves; this one records how to reach it from a test harness. The API surface, the availability states, the session and sampling semantics, the language gates, and the measured latencies are all there and are not restated here. The integration decision itself — hyphen-only AI spacing — lives in [ADR 0016](adr/0016-hyphen-before-digit-gets-a-model-layer.md).

Evidence tags follow the sibling document's convention: **[docs]** for something in official documentation, **[probe]** for something measured on this machine, **[secondary]** for a claim that only appears in blog posts or issue threads, **[open]** for an unanswered question.

## Verification basis

Probes were run on 2026-09-01 on macOS against Google Chrome 152.0.7977.65 (branded, stable) and the Chromium 149.0.7827.55 bundled with Playwright 1.61.1, driving a throwaway unpacked extension whose only job is to report `LanguageModel` availability from a content script and from a module service worker, described in [`prompt-api-reference.md`](prompt-api-reference.md). Every table row below tagged **[probe]** came from one of those runs. Where a widely repeated claim was contradicted by a probe, the probe wins and the contradiction is called out.

One correction to the sibling document is worth stating up front. `--load-extension` does not load an extension into branded Chrome, which the earlier probing already established, but the reason and the workaround are now known: the flag was removed from branded builds, and an unrelated CDP command loads the extension anyway. See "Loading the extension into branded Chrome" below.

## The constraint that shapes everything

The two things this project needs from a test browser are not available in the same launch configuration by default.

| Launch configuration                                         | Extension loads?                   | On-device model?                                                           | Evidence    |
| ------------------------------------------------------------ | ---------------------------------- | -------------------------------------------------------------------------- | ----------- |
| Playwright bundled Chromium, `channel: 'chromium'`, headless | Yes                                | No, `availability()` reports `unavailable`                                 | **[probe]** |
| Playwright, no channel, `headless: true`                     | No, silently                       | No, reports `downloadable`                                                 | **[probe]** |
| Playwright, `channel: 'chrome'` (branded 152)                | No                                 | No, reports `unavailable`                                                  | **[probe]** |
| Branded Chrome spawned directly, driven over CDP             | Yes, via `Extensions.loadUnpacked` | Yes in principle, reports `downloadable` on a fresh or file-seeded profile | **[probe]** |

The bundled Chromium ships no on-device model at all, so it can prove wiring but never inference. Branded Chrome has the model but has had the extension side-loading flag removed. The last row is the configuration that reunites them, and it is the one this document recommends.

Two claims that circulate about this were checked and are wrong as stated:

- "Headless disables the on-device model." Not true here. Branded Chrome 152 spawned directly reported the same `availability()` and loaded the same extension under `--headless=new` as it did headed, byte for byte identical probe output. **[probe]** The `unavailable` result that looks like a headless effect comes from Playwright's `channel: 'chrome'` launch path, not from headless mode.
- "`Extensions.loadUnpacked` requires `--remote-debugging-pipe`." Not true on Chrome 152. It worked over an ordinary `--remote-debugging-port`. **[probe]** The pipe requirement is real in the write-ups **[secondary]** and may have been true on earlier versions or may still apply on other platforms, but it is not a constraint here.

## Loading the extension into branded Chrome

`--load-extension` was removed from branded Chrome builds in Chrome 137, and the `--disable-features=DisableLoadExtensionCommandLineSwitch` workaround was removed in Chrome 142. **[secondary]** Chrome for Testing, unbranded Chromium, and other Chromium browsers are unaffected, which is why Playwright's own documentation now tells you to use its bundled Chromium for extension work. **[docs]**

The supported replacement is the `Extensions.loadUnpacked` CDP command, gated behind `--enable-unsafe-extension-debugging`. Spawn Chrome yourself, connect over CDP, and load the extension as a command rather than a flag:

```js
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const child = spawn(CHROME_BINARY, [
  '--remote-debugging-port=9333',
  `--user-data-dir=${AUTOMATION_PROFILE}`,
  '--enable-unsafe-extension-debugging',
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank',
]);

const browser = await chromium.connectOverCDP('http://127.0.0.1:9333');
const session = await browser.newBrowserCDPSession();
const { id } = await session.send('Extensions.loadUnpacked', { path: EXTENSION_DIR });

const context = browser.contexts()[0];
const sw = context.serviceWorkers().find((w) => w.url().startsWith(`chrome-extension://${id}/`));
```

Measured on Chrome 152: the command resolved with the extension id, the MV3 service worker appeared in `context.serviceWorkers()` within about 1.5 s, and `sw.evaluate()` ran against it. **[probe]** The id was identical to the one the same directory received under bundled Chromium, so unpacked extension ids are derived from the absolute path and are stable across runs and across builds as long as the path does not move. **[probe]** Do not hardcode it anyway; read it from the `loadUnpacked` result or the service worker URL.

`--user-data-dir` matters more than it looks. Chrome will not accept the flag pointing at the live profile while Chrome is running, and the on-device model is stored per user-data-dir, so a throwaway directory means a browser with no model. Use one dedicated, persistent automation profile directory that is reused across runs.

## Getting the model into an automation profile

The model is not part of the Chrome installation. On macOS it lives at the root of the user-data-dir, not inside a profile:

```
~/Library/Application Support/Google/Chrome/OptGuideOnDeviceModel        4.0 GB
~/Library/Application Support/Google/Chrome/optimization_guide_model_store  103 MB
```

Both measured on this machine. **[probe]** Because they sit at the user-data-dir root rather than under `Default/` or `Profile 1/`, every profile inside one user-data-dir shares one copy, and a fresh `--user-data-dir` starts with none.

Copying those directories into a fresh user-data-dir is **not** sufficient. An APFS clone of both, plus `OptimizationGuideModelsManifest`, still produced `availability() === 'downloadable'` rather than `available`. **[probe]** The files are recognised but the component is not registered for that profile, and registration state lives elsewhere. Whether copying `Local State` completes the picture is **[open]** — it was not tested, because it is real browser configuration rather than throwaway state.

That leaves one supported path to a usable automation profile: create the dedicated profile once, and let Chrome download the model into it by calling `create()`, exactly as a user would. Roughly 4 GB, one time, per automation user-data-dir. Whether that download actually completes when driven from an automation-launched Chrome, and how long it takes, is **[open]** — this is the single remaining unknown that decides whether real-model tests can be provisioned without hand-holding, and it was left unrun rather than kicked off silently.

Until it is answered, the honest status of a real-model automated test is "very likely workable on a developer machine, unproven".

## CI is not in scope, and that is a finding

There is essentially no open-source prior art for running Prompt API tests against the real model in CI. GoogleChromeLabs' `web-ai-demos` samples ship no automated tests for the AI surface at all. The Puppeteer issue asking specifically how to provision the on-device model from automation (puppeteer#13011) was closed as not planned. No GitHub Actions workflow, Docker image, or caching recipe for Gemini Nano was found. **[secondary]**

The blockers are structural rather than fixable with effort: a roughly 4 GB per-user-data-dir download with no artifact to cache, a hardware bar of more than 4 GB VRAM or 16 GB RAM with 4 cores, at least 22 GB free disk at download time, and a model Chrome may delete mid-session when free space drops. **[secondary]**, cross-referenced in the sibling document. An ephemeral GitHub Actions runner meets none of it.

So CI runs everything except the model, and the model tests run where a provisioned profile exists.

## The three layers

**Unit tests, no browser.** Vitest with a stubbed `LanguageModel` global for the classifier logic, prompt construction, and response parsing. No faithful polyfill of this API exists **[secondary]**, so the stub has to be hand-rolled to the shape recorded in the sibling document — a four-state `availability()`, a `create()` returning an object with `prompt`, `promptStreaming`, `clone`, and `destroy`, and a `prompt()` that resolves to a JSON **string** rather than a parsed value.

**Extension e2e on bundled Chromium, no model.** This is the layer that runs in CI, and it covers more than it sounds like: manifest correctness, service worker startup, content-script injection, `chrome.storage` round-trips, message passing between content script and service worker, popup and options pages, and — most valuably — the whole unavailable-model code path, since `availability()` genuinely returns `unavailable` there without any mocking. **[probe]** Getting the degraded path exercised for free by the platform is worth more than it first appears, because that is the path most users on unsupported hardware will actually take.

```js
const context = await chromium.launchPersistentContext('', {
  channel: 'chromium',
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
});
let [sw] = context.serviceWorkers();
if (!sw) sw = await context.waitForEvent('serviceworker');
const extensionId = sw.url().split('/')[2];
```

Verified working headless on Playwright 1.61.1 with bundled Chromium 149: service worker present, content script injected and logging, `chrome-extension://<id>/…` pages navigable. **[probe]**

**Real-model tests on branded Chrome, capability-gated.** The CDP recipe above, against the provisioned profile, skipped automatically when the model is not there:

```js
test('classifies an ambiguous hyphen span', { tag: '@needs-nano' }, async ({ sw }) => {
  const state = await sw.evaluate(() => LanguageModel.availability());
  test.skip(state !== 'available', `on-device model not provisioned (${state})`);
  // real create() + prompt()
});
```

CI runs `--grep-invert @needs-nano` and stays green. A developer machine with a provisioned profile runs `--grep @needs-nano`. The gate reads `availability()` rather than a Chrome version or an environment variable, because per the sibling document every platform, hardware, policy, and disk-space gate collapses into that one call.

## Gotchas

- **The headless shell silently loads no extensions.** Playwright picks `chromium-headless-shell` whenever `headless: true` is set with no channel, and that binary cannot run extensions. There is no error: the service worker simply never appears. Confirmed **[probe]**. Setting `channel: 'chromium'` selects the full browser and works headless.
- **`channel: 'chrome'` suppresses the model.** Branded Chrome launched through Playwright's channel reported `unavailable` where the same binary spawned directly reported `downloadable`. **[probe]** Playwright's channel launch injects its own flag set; if a test needs the model, spawn Chrome and connect over CDP instead.
- **`LanguageModel.params` is missing in content scripts but present in extension service workers.** Reproduced independently here on both bundled Chromium and branded Chrome 152. **[probe]** This confirms the sibling document's asymmetry finding and its consequence: a content script cannot pin `temperature` or `topK`, so any classifier that needs reproducible sampling must run in the service worker.
- **MV3 service workers are terminated when idle**, taking any live session with them. An `sw.evaluate()` spanning a suspension throws. **[secondary]** Long test bodies that hold a session across a wait are the shape that breaks.
- **`--user-data-dir` cannot point at a running Chrome's profile.** **[secondary]**, not probed here — the live profile was deliberately left alone. Quit Chrome or use a dedicated directory. A dedicated one is correct here anyway, since the model is stored per user-data-dir.
- **Parallel workers fight over one user-data-dir.** The model lives there, so real-model tests cannot each get a fresh temp directory the way the Chromium layer can. Run the `@needs-nano` project with a single worker.
- **`requestIdleCallback` and page visibility.** Headless pages driven by Playwright reported `document.visibilityState === 'visible'` in every configuration probed **[probe]**, so `requestIdleCallback` fires and pangu's scheduler runs normally. This has bitten automated measurement before when pages were hidden rather than headless; the Prompt API itself is not visibility-gated either, per the sibling document's hidden-tab probe.
- **The model can vanish mid-run.** Chrome deletes it when free disk drops below a threshold, on enterprise policy, and after 30 days of ineligibility. **[docs]**, via the sibling document. A suite that passed yesterday can skip today for reasons unrelated to the code.
- **`--enable-unsafe-extension-debugging` is what its name says.** It is a developer flag on a profile that can load arbitrary unpacked extensions over a debugging port. Keep it on the dedicated automation profile and out of any profile used for browsing.

## Open questions

1. **Does `create()` actually download the model into an automation-launched profile, and how long does it take?** The one unknown standing between this plan and a working real-model suite.
2. **Does copying `Local State` into a seeded profile register a cloned model**, turning a 4 GB file copy into a valid provisioning shortcut? Would remove the download entirely if it works.
3. ~~Do `temperature: 0` and `topK: 1` actually pin sampling in an extension service worker on branded Chrome?~~ **Answered 2026-09-01**, not by automation but by a manual run on the live profile through a temporary eval page that routed every call through the service-worker classifier: two independent 69-answer runs reproduced byte-identically, so the knobs fully pin sampling.
4. ~~What does MV3 service worker termination do to a live session?~~ **Answered 2026-09-01**, same manual run: the in-memory session dies with the worker, and the integration's stateless recreate-on-miss handles it for one `create()` (~4.4–5.3 s) on the next message. No further session reconstruction logic is needed.
5. **Is the CDP `Extensions.loadUnpacked` path stable across Chrome updates?** It is explicitly an unsafe-debugging surface, and the flag that preceded it was removed twice.

Questions 3 and 4 falling to a manual page before any automation existed is worth registering: the unlisted eval page (`browser-extensions/chrome/pages/eval.html`) is now the measurement surface for anything that needs the real model on the live profile, and the automation ladder in this file is only needed where runs must be unattended or swept in bulk.

## Suggested skills for the next session

- `find-docs` before touching Playwright, Vitest, or Chrome extension APIs. The API surface here moved three times in two years and every version-specific claim in this file has a date on it for that reason.
- `best-practices` before designing the test harness structure, if the shape proposed here is being reconsidered rather than implemented.
- `commit` when the work is done, passing why the change was made.
- The gotcha in `CLAUDE.md` about code comments applies to any test fixtures added: English, ANS characters only, no CJK sample text pasted from tests.

## Sources

- [`prompt-api-reference.md`](prompt-api-reference.md) — the API itself, probed on Chrome 152 on 2026-08-31
- [ADR 0016](adr/0016-hyphen-before-digit-gets-a-model-layer.md) — the integration decision
- [`ai-spacing.md`](ai-spacing.md) — how AI spacing is built
- Chrome extensions, Playwright — https://playwright.dev/docs/chrome-extensions (fetched 2026-09-01)
- PSA: Removing `--load-extension` flag in Chrome branded builds, chromium-extensions — https://groups.google.com/a/chromium.org/g/chromium-extensions/c/1-g8EFx2BBY
- Chrome 142 removed the `--load-extension` option and the workaround, SeleniumBase issue 4053 — https://github.com/seleniumbase/SeleniumBase/issues/4053
- Replace deprecated `--load-extension` with `Extensions.loadUnpacked` CDP, mozilla/web-ext issue 3388 — https://github.com/mozilla/web-ext/issues/3388
- Allow `enableExtensions` when using `--remote-debugging-port`, puppeteer issue 14536 — https://github.com/puppeteer/puppeteer/issues/14536
- How to load the on-device model component via Puppeteer, puppeteer issue 13011, closed as not planned — https://github.com/puppeteer/puppeteer/issues/13011
- GoogleChromeLabs/web-ai-demos, checked for test infrastructure and found to have none — https://github.com/GoogleChromeLabs/web-ai-demos
