// Chrome logs "No output language was specified in a LanguageModel API request" for any call that declares none, and collects it into the extension's Errors page, which is a user-facing surface. The
// warning is logged for extension pages only, never for the service worker (measured 2026-09-02), so declaring a language on the pages' calls is what clears it. Nothing here is misattested:
// no page call ever produces model output, one probes availability and the other exists only to start the browser-wide download. The classifier, which is the session that actually prompts, stays
// undeclared on purpose -- see in-service-worker.ts. `en` is a member of the supported set (en/ja/es/de/fr); no zh variant is, and declaring one makes availability() report unavailable.
const PAGE_MODEL_LANGUAGES: LanguageModelExpected[] = [{ type: 'text', languages: ['en'] }];

// `unsupported` is ours, not an API value: the browser has no Prompt API at all, so availability() cannot even be asked
export type AiModelAvailability = Availability | 'unsupported';

export async function getAiModelAvailability(): Promise<AiModelAvailability> {
  // The types declare LanguageModel unconditionally, but a browser without the Prompt API has no such global at all
  if (typeof LanguageModel === 'undefined') {
    return 'unsupported';
  }
  // We set expectedOutputs here, only to silence the "No output language was specified" warning, which is logged for extension pages only
  // 2026-09-02: we measured that declaring a supported language does not alter the model output
  return LanguageModel.availability({ expectedOutputs: PAGE_MODEL_LANGUAGES });
}

// False when the model can never run here (no API, or this machine fails its requirements), so the toggle is shown off and disabled. A model that is merely not downloaded yet still counts
export function canAiModelRun(availability: AiModelAvailability) {
  return availability !== 'unsupported' && availability !== 'unavailable';
}

// The download is browser-wide and outlives the page that starts it, so the session only exists to start it
export async function startAiModelDownload() {
  const session = await LanguageModel.create({ expectedOutputs: PAGE_MODEL_LANGUAGES });
  session.destroy();
}
