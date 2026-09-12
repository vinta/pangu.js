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

Use Chrome Beta's `Default` profile and start it normally. When establishing the connection on macOS, verify that the Profile Path at `chrome://version` is `~/Library/Application Support/Google/Chrome Beta/Default`; sweep checks the configured profile automatically on each run.

In Chrome Beta 144+, enable remote debugging at `chrome://inspect/#remote-debugging`. When a client attaches, have the user approve Chrome's connection dialog. This [connection flow](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session) uses the existing browser session.

Run browser launches outside the execution sandbox through normal escalation, including indirect launches from package scripts. Before a full browser suite, confirm each requested browser launches and closes in that same context. On a startup permission or application-registration failure, stop the run and diagnose one launch. Put raw launch logs only in a destination verified ignored and untracked under [artifact rules](artifacts.md).

At `chrome://extensions`, enable Developer mode and [load unpacked](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked) from this checkout's `browser-extensions/chrome/`. Verify the loaded path; derive it from the repository root. Reload after setup builds.

Open the extension options in that visible Chrome Beta profile and use `下載模型` if required. Complete any required user interaction there; Chrome requires [user activation](https://developer.chrome.com/docs/ai/get-started#user_activation) to create a session when the model is still downloadable or downloading. In the extension service-worker DevTools console, check `await LanguageModel.availability()` and `await LanguageModel.params()`. Inference requires availability `available` and the production sampling/schema capabilities. The runner does not download a model. Record the browser and Node versions, model/component version from `chrome://on-device-internals` or `chrome://components` where exposed, and actual sampling in the round runtime record. Retain only the relevant model version, never the full component dump. If a version or capability is unavailable, record that limitation explicitly.

## Discover local settings

Copy the [template](../../../../scripts/prompt-experiments/.env.example) to `scripts/prompt-experiments/.env.local` only after verifying the destination is ignored and untracked. Fill these values from the current browser:

| Setting                     | Discovery                                                                                                                                                                                                                                                       | Consumer                            |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `PANGU_CDP_URL`             | Loopback WebSocket URL `ws://127.0.0.1:<port>/devtools/browser`; after enabling remote debugging, read the port from the first line of `DevToolsActivePort` in Chrome Beta's user-data directory (`~/Library/Application Support/Google/Chrome Beta/` on macOS) | Attachment below; collection helper |
| `PANGU_CHROME_PROFILE_PATH` | Exact Profile Path at `chrome://version` in the intended extension profile                                                                                                                                                                                      | Sweep and source profile checks     |
| `PANGU_EXTENSION_ID`        | Loaded extension's ID at `chrome://extensions`                                                                                                                                                                                                                  | Sweep and source worker selection   |

This connection flow disables HTTP `/json/version` discovery and accepts `/devtools/browser` without a session UUID; see [Chromium's handler](https://github.com/chromium/chromium/blob/main/content/browser/devtools/devtools_http_handler.cc). Recheck the port after restarting Chrome. `chrome://version` must belong to the extension's profile; a generic new CDP tab can use another profile. The sweep checks the actual path through a tab created by the intended extension.

Read connection settings from `scripts/prompt-experiments/.env.local`. Use `PANGU_CDP_URL` to attach the `pangu-eval` session, and pass the extension ID and profile path to the experiment commands. Verify the settings when establishing or repairing the connection. Sweep checks the extension profile and model readiness on each run; repeat manual inspection only after a relevant change or failed check. Record model/component version separately because sweep does not capture it.

Inspect `playwright-cli list` locally before attaching. Detach a stale `pangu-eval` attachment and attach to the verified endpoint. Keep unfiltered CLI output local. After work, close only temporary inspection pages and run `playwright-cli -s=pangu-eval detach` to leave the browser running.

## Validation layers

Follow the skill's [reuse conditions](../SKILL.md#checks-to-reuse) and use the [command reference](../../../../scripts/prompt-experiments/README.md) for applicable checks. Verify the intended profile and extension before the first browser replay and after connection changes; replay does not perform sweep's profile check. Record passing checks in `REPORT.md` and finish applicable source, fixture, role, and runner checks before inference.

The installed worker supplies the sweep's execution context; the sweep imports the production baseline and separate experiment prompt modules from this checkout. Candidates run in the sweep's own model sessions.

Done when offline checks pass, the intended browser/profile/extension and model readiness are verified for the requested layer, and the round has public runtime metadata or an explicit capability limitation.
