# Machine setup and connection repair

Use these steps on a new machine or when the browser connection fails. Run commands from the repository root. Personal `AGENTS.local.md`, saved sessions, and this conversation are not prerequisites.

## Dependencies

Use Node 22.18+ for native TypeScript imports in the experiment runner; Node 24 LTS satisfies this requirement. The package's general Node minimum is lower. Check `node --version`, then install the checkout's dependencies and the CLI used by the helpers:

```bash
npm install
npm install -g @playwright/cli@latest
npm run build:extension
playwright-cli --version
playwright-cli attach --help
```

The helpers invoke `playwright-cli` directly, so it must be on `PATH`. The install and attach commands are documented in the [Playwright CLI README](https://github.com/microsoft/playwright-cli). Keep dependency versions from `package-lock.json` when reproducing a round.

## Chrome and the model

Use a compatible desktop Chrome with the Prompt API available in extension service workers. Check the current [Prompt API requirements](https://developer.chrome.com/docs/ai/prompt-api), including supported hardware, OS, storage, languages, and model download requirements. Browser installation alone does not provision the model. Record actual capabilities; a requested language may be unsupported even when the API exists.

Use a dedicated browser user-data directory and a loopback debugging endpoint. Chrome 136+ requires a nondefault user-data directory for remote-debugging switches; see [Chrome's remote debugging change](https://developer.chrome.com/blog/remote-debugging-port). Choose the port locally. Put the dedicated profile under the checkout’s ignored `tmp/` directory. Before launch, verify the profile destination is ignored and untracked under [artifact rules](artifacts.md). On macOS:

```bash
pangu_browser_data="$(git rev-parse --show-toplevel)/tmp/pangu-experiment-browser"
"/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta" \
  --remote-debugging-port=9222 \
  --user-data-dir="$pangu_browser_data"
```

Run browser launches outside the execution sandbox through normal escalation, including headless launches and indirect launches from package scripts. Before a full browser suite, confirm each requested browser launches and closes in that same context. On a startup permission or application-registration failure, stop the run and diagnose one launch. Put raw launch logs only in a destination verified ignored and untracked under [artifact rules](artifacts.md).

At `chrome://extensions`, enable Developer mode and [load unpacked](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked) from this checkout's `browser-extensions/chrome/`. Verify the loaded path; derive it from the repository root. Reload after builds when checking shipping integration.

Open the extension options and use `下載模型` if required. In the extension service-worker DevTools console, check `await LanguageModel.availability()` and `await LanguageModel.params()`. Inference requires availability `available` and the production sampling/schema capabilities. The runner does not download a model. Record the browser and Node versions, model/component version from `chrome://on-device-internals` or `chrome://components` where exposed, and actual sampling in the round runtime record. Retain only the relevant model version, never the full component dump. If a version or capability is unavailable, record that limitation explicitly.

## Discover local settings

Copy the [template](../../../../scripts/prompt-experiments/.env.example) to `scripts/prompt-experiments/.env.local` only after verifying the destination is ignored and untracked. Fill these values from the current browser:

| Setting | Discovery | Consumer |
| --- | --- | --- |
| `PANGU_CDP_URL` | Loopback HTTP endpoint matching the launch port, such as `http://127.0.0.1:9222` | Attachment below; collection and integration helpers |
| `PANGU_CHROME_PROFILE_PATH` | Exact Profile Path at `chrome://version` in the intended extension profile | Sweep and source/integration profile checks |
| `PANGU_CHROME_PROFILE_NAME` | Profile menu display name (close/reopen a fresh profile if metadata is not yet written), checked against `Local State`'s `profile.info_cache` entry for that profile directory | Sweep |
| `PANGU_EXTENSION_ID` | Loaded extension's ID at `chrome://extensions` | Sweep and integration/source worker selection |

Use an HTTP CDP endpoint instead of recording a browser-session WebSocket identifier. `chrome://version` must belong to the extension's profile; a generic new CDP tab can use another profile. The sweep checks the actual path through a tab created by the intended extension.

[Node's native env-file support](https://nodejs.org/api/cli.html#--env-filefile) loads values into the Node process. Use `--env-file=scripts/prompt-experiments/.env.local` explicitly. Use `--env-file-if-exists` when the file is optional; externally supplied environment values take precedence. You can also supply the sweep's `--extension-id`, `--profile-path`, and `--profile-name` flags directly without any local file.

Shell variables expand before Node loads an env file. Attach with a Node process that reads the values, rather than expanding unloaded shell variables:

```bash
node --env-file-if-exists=scripts/prompt-experiments/.env.local --input-type=module - <<'JS'
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
assert(process.env.PANGU_CDP_URL, 'Set PANGU_CDP_URL to the verified loopback debugging endpoint');
const result = spawnSync('playwright-cli', ['-s=pangu-eval', 'attach', `--cdp=${process.env.PANGU_CDP_URL}`], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
JS
```

Inspect `playwright-cli list` locally before attaching. Detach a stale `pangu-eval` attachment and attach to the verified endpoint. Keep unfiltered CLI output local. After work, close only temporary inspection pages and run `playwright-cli -s=pangu-eval detach` to leave the browser running.

## Validation layers

Follow the [command reference](../../../../scripts/prompt-experiments/README.md) in order: offline corpus/runner checks, browser production replay, then model inference. Finish source, fixture, role, and runner checks before sending model requests.

The installed worker supplies the sweep's execution context; the sweep imports prompts from this checkout. Shipping integration additionally requires the loaded extension to point to the built checkout and match the frozen prompt/options.

For a clean-machine portability check, use a clean checkout without local config or saved browser state. Discover settings, validate the retained corpus, replay production inputs, run a matched baseline/candidate comparison in a new directory, and collect/validate a new real case. Treat historical candidates as replay examples. Check generated public fields before claiming success. An unavailable browser/model makes that part incomplete; a read-only simulation does not substitute for execution.

Done when offline checks pass, the intended browser/profile/extension and model readiness are verified for the requested layer, and the round has public runtime metadata or an explicit capability limitation.
