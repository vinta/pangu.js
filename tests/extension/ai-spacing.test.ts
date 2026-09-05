import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ClassifyCandidatesMessage } from '../../browser-extensions/chrome/src/ai-spacing/messages';

async function loadAiSpacing() {
  vi.resetModules();
  const pangu = { onTextNodesSettled: vi.fn(), applyLateFixes: vi.fn() };
  vi.stubGlobal('window', { pangu });
  const { classifyCandidates } = await import('../../browser-extensions/chrome/src/ai-spacing/in-service-worker');
  const sendMessage = vi.fn(({ kind, candidates }: ClassifyCandidatesMessage) => classifyCandidates(kind, candidates));
  vi.stubGlobal('chrome', { runtime: { sendMessage } });
  const { applyAiSpacing } = await import('../../browser-extensions/chrome/src/ai-spacing/in-content-script');
  return { pangu, sendMessage, applyAiSpacing };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AI spacing message flow', () => {
  it('keeps failed candidates in place and composes successful fixes into one write', async () => {
    const answers = ['"負"', '"invalid"', '"負"'];
    const destroy = vi.fn();
    const clone = vi.fn(async () => ({ prompt: async () => answers.shift(), destroy }));
    vi.stubGlobal('LanguageModel', { params: vi.fn(), availability: async () => 'available', create: async () => ({ clone }) });
    const { pangu, sendMessage, applyAiSpacing } = await loadAiSpacing();
    const onTextNodesSettled = pangu.onTextNodesSettled;
    const textNode = {} as Text;
    const settled = '從 - 5 到 - 3 再到 - 1 度';

    await applyAiSpacing([{ node: textNode, unspaced: '從-5到-3再到-1度', settled }]);

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(await sendMessage.mock.results[0]!.value).toEqual({ ok: true, candidateLabels: ['signed-number', null, 'signed-number'] });
    expect(clone).toHaveBeenCalledTimes(3);
    expect(destroy).toHaveBeenCalledTimes(3);
    expect(pangu.onTextNodesSettled).toBe(onTextNodesSettled);
    expect(pangu.applyLateFixes).toHaveBeenCalledTimes(1);
    expect(pangu.applyLateFixes).toHaveBeenCalledWith([{ node: textNode, settled, data: '從 -5 到 - 3 再到 -1 度' }]);
  });

  it('disables AI spacing without writing when the model is absent', async () => {
    vi.stubGlobal('LanguageModel', undefined);
    const { pangu, sendMessage, applyAiSpacing } = await loadAiSpacing();

    await applyAiSpacing([{ node: {} as Text, unspaced: '氣溫是-5度', settled: '氣溫是 - 5 度' }]);

    expect(await sendMessage.mock.results[0]!.value).toEqual({ ok: false, error: 'Error: LanguageModel is not exposed in this context' });
    expect(pangu.onTextNodesSettled).toBeNull();
    expect(pangu.applyLateFixes).not.toHaveBeenCalled();
  });
});
