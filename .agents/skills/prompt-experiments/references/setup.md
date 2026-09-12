# Machine setup and connection repair

Use the relevant section for a missing prerequisite or failed connection/runtime check. On a configured machine, start with the skill's [inference steps](../SKILL.md#resume-or-start). Run commands from the repository root.

## Dependencies

Use Node 22.18+ for native TypeScript imports in the experiment runner; Node 24 LTS satisfies this requirement. The package's general Node minimum is lower. Check `node --version`; install missing dependencies and CLI, and build the extension when absent or stale:

```bash
npm install
npm install -g @playwright/cli@latest
npm run build:extension
playwright-cli --version
playwright-cli attach --help
```

The helpers invoke `playwright-cli` directly, so it must be on `PATH`. The install and attach commands are documented in the [Playwright CLI README](https://github.com/microsoft/playwright-cli). Keep dependency versions from `package-lock.json` when reproducing a round.

## Chrome and the model

Use a browser separate from the user's daily browsing for safety and privacy: experiments require full browser control. This setup assumes Chrome Beta is that browser.

Run experiments in a visible window of the user-installed Chrome Beta. Headless Chrome is not supported for this workflow. If Chrome Beta is not installed, suggest downloading and installing it from the [official Chrome Beta page](https://www.google.com/chrome/beta/) before continuing. The Prompt API must be available in the intended extension service worker. Check the current [Prompt API requirements](https://developer.chrome.com/docs/ai/prompt-api), including supported hardware, OS, storage, languages, and model download requirements. Browser installation alone does not provision the model. Record actual capabilities; a requested language may be unsupported even when the API exists.

Use Chrome Beta's `Default` profile and start it normally. Its macOS Profile Path is `~/Library/Application Support/Google/Chrome Beta/Default`.

In Chrome Beta 144+, enable remote debugging at `chrome://inspect/#remote-debugging`. When a client attaches, have the user approve Chrome's connection dialog. This [connection flow](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session) uses the existing browser session.

Run browser launches outside the execution sandbox through normal escalation, including indirect launches from package scripts. Before a full browser suite, confirm each requested browser launches and closes in that same context. On a startup permission or application-registration failure, stop the run and diagnose one launch. Put raw launch logs only in a destination verified ignored and untracked under [artifact rules](artifacts.md).

At `chrome://extensions`, enable Developer mode and [load unpacked](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked) from this checkout's `browser-extensions/chrome/`. Reload after setup builds.

If sweep reports the model is unavailable, open the extension options in that visible profile and use `下載模型` if required. Chrome requires [user activation](https://developer.chrome.com/docs/ai/get-started#user_activation) while the model is downloadable or downloading. Diagnose availability or capability failures in the extension service-worker DevTools console with `await LanguageModel.availability()` and `await LanguageModel.params()`; sweep requires availability `available` and does not download a model.

## Runtime evidence

Record these gaps in sweep's automatic checks once per runtime; refresh affected evidence after reconnect or changes to the browser, profile, model, loaded checkout, or production sampling:

- Verify the extension's loaded path at `chrome://extensions` is this checkout's `browser-extensions/chrome/`.
- Record the relevant model/component version from `chrome://on-device-internals` or `chrome://components`, plus actual session sampling. Record unavailable metadata or capabilities explicitly; retain only public runtime fields.
- Before fixture replay, verify the intended extension and profile. Replay lacks sweep's profile check. Use `chrome://version` in the extension's profile; a generic CDP tab can belong to another profile.

Reuse sweep's evidence for the checks it owns under [checks to reuse](../SKILL.md#checks-to-reuse). Runtime verification is complete when the applicable manual evidence is recorded and the required checks pass.

## Discover local settings

Copy the [template](../../../../scripts/prompt-experiments/.env.example) to `scripts/prompt-experiments/.env.local` only after verifying the destination is ignored and untracked. Fill these values from the current browser:

| Setting                     | Discovery                                                                                                                                                                                                                                                       | Consumer                            |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `PANGU_CDP_URL`             | Loopback WebSocket URL `ws://127.0.0.1:<port>/devtools/browser`; after enabling remote debugging, read the port from the first line of `DevToolsActivePort` in Chrome Beta's user-data directory (`~/Library/Application Support/Google/Chrome Beta/` on macOS) | Attachment below; collection helper |
| `PANGU_CHROME_PROFILE_PATH` | Exact Profile Path at `chrome://version` in the intended extension profile                                                                                                                                                                                      | Sweep and source profile checks     |
| `PANGU_EXTENSION_ID`        | Loaded extension's ID at `chrome://extensions`                                                                                                                                                                                                                  | Sweep and source worker selection   |

This connection flow disables HTTP `/json/version` discovery and accepts `/devtools/browser` without a session UUID; see [Chromium's handler](https://github.com/chromium/chromium/blob/main/content/browser/devtools/devtools_http_handler.cc). Recheck the port after restarting Chrome.

Inspect `playwright-cli list` locally before attaching. Detach a stale `pangu-eval` attachment and attach to the verified endpoint. Keep unfiltered CLI output local. After work, close only temporary inspection pages and run `playwright-cli -s=pangu-eval detach` to leave the browser running.

## Validation layers

Follow the skill's [reuse conditions](../SKILL.md#checks-to-reuse) and use the [command reference](../../../../scripts/prompt-experiments/README.md) for applicable checks. Record passing checks in `REPORT.md` and finish applicable source, fixture, role, and runner checks before inference.

The installed worker supplies the sweep's execution context; the sweep imports the production baseline and separate experiment prompt modules from this checkout. Candidates run in the sweep's own model sessions.

Done when offline checks pass, the intended browser/profile/extension and model readiness are verified for the requested layer, and the round has public runtime metadata or an explicit capability limitation.
