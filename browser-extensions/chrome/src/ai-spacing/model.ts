// We set expectedOutputs here, only to silence the "No output language was specified" warning, which is logged for extension pages only
// 2026-09-02: we measured that declaring a supported language does not alter the model output
const PAGE_MODEL_LANGUAGES: LanguageModelExpected[] = [{ type: 'text', languages: ['en'] }];

// `unsupported` is ours, not an API value: the browser has no Prompt API at all, so availability() cannot even be asked
export type AiModelAvailability = Availability | 'unsupported';

export async function getAiModelAvailability(): Promise<AiModelAvailability> {
  // The types declare LanguageModel unconditionally, but a browser without the Prompt API has no such global at all
  if (typeof LanguageModel === 'undefined') {
    return 'unsupported';
  }
  return LanguageModel.availability({ expectedOutputs: PAGE_MODEL_LANGUAGES });
}

export function canAiModelRun(availability: AiModelAvailability) {
  return availability !== 'unsupported' && availability !== 'unavailable';
}

// The download is browser-wide and outlives the page that starts it, so the session only exists to start it
export async function startAiModelDownload() {
  const session = await LanguageModel.create({ expectedOutputs: PAGE_MODEL_LANGUAGES });
  session.destroy();
}
