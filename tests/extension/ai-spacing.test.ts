import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ClassifyCandidatesMessage } from '../../browser-extensions/chrome/src/ai-spacing/messages';

async function loadAiSpacing() {
  vi.resetModules();
  const pangu = { onTextNodesSettled: vi.fn(), applyLateFixes: vi.fn() };
  vi.stubGlobal('window', { pangu });
  const { classifyCandidates } = await import('../../browser-extensions/chrome/src/ai-spacing/service-worker');
  const sendMessage = vi.fn(({ kind, candidates }: ClassifyCandidatesMessage) => classifyCandidates(kind, candidates));
  vi.stubGlobal('chrome', { runtime: { sendMessage } });
  const { applyAiSpacing } = await import('../../browser-extensions/chrome/src/ai-spacing/content-script');
  return { pangu, sendMessage, applyAiSpacing, classifyCandidates };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AI spacing model sessions', () => {
  it('warms up on an empty batch and shares pending creation with another batch', async () => {
    let finishCreation!: () => void;
    const clone = vi.fn(async () => ({ prompt: async () => '"signed-number"', destroy: vi.fn() }));
    const create = vi.fn(async () => {
      await new Promise<void>((resolve) => {
        finishCreation = resolve;
      });
      return { clone };
    });
    vi.stubGlobal('LanguageModel', { params: vi.fn(), availability: async () => 'available', create });
    const { classifyCandidates } = await loadAiSpacing();

    const warmup = classifyCandidates('hyphen-sign', []);
    await Promise.resolve();
    expect(create).toHaveBeenCalledTimes(1);
    expect(clone).not.toHaveBeenCalled();

    const batch = classifyCandidates('hyphen-sign', [{ sentence: '氣溫是-5度', at: 3 }]);
    finishCreation();

    expect(await warmup).toEqual({ ok: true, candidateLabels: [] });
    expect(await batch).toEqual({ ok: true, candidateLabels: ['signed-number'] });
    expect(create).toHaveBeenCalledTimes(1);
    expect(clone).toHaveBeenCalledTimes(1);
  });

  it('retries session creation after a rejected warmup', async () => {
    const create = vi.fn().mockRejectedValueOnce(new Error('creation failed')).mockResolvedValue({ clone: vi.fn() });
    vi.stubGlobal('LanguageModel', { params: vi.fn(), availability: async () => 'available', create });
    const { classifyCandidates } = await loadAiSpacing();

    expect(await classifyCandidates('hyphen-sign', [])).toEqual({ ok: false, error: 'Error: creation failed' });
    expect(await classifyCandidates('hyphen-sign', [])).toEqual({ ok: true, candidateLabels: [] });
    expect(create).toHaveBeenCalledTimes(2);
  });
});

describe('AI spacing message flow', () => {
  it.each(['"負"', 'null', 'signed-number'])('keeps invalid answer %s in place and composes successful fixes into one write', async (invalidAnswer) => {
    const answers = ['"signed-number"', invalidAnswer, '"signed-number"', '"range-or-separator"', '"unsure"'];
    const destroy = vi.fn();
    const prompt = vi.fn(async () => answers.shift());
    const clone = vi.fn(async () => ({ prompt, destroy }));
    vi.stubGlobal('LanguageModel', { params: vi.fn(), availability: async () => 'available', create: async () => ({ clone }) });
    const { pangu, sendMessage, applyAiSpacing } = await loadAiSpacing();
    const onTextNodesSettled = pangu.onTextNodesSettled;
    const textNode = {} as Text;
    const settled = '從 - 5 到 - 3 再到 - 1 度。區間 - 2。未知 - 4';

    await applyAiSpacing([{ node: textNode, unspaced: '從-5到-3再到-1度。區間-2。未知-4', settled }]);

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(await sendMessage.mock.results[0]!.value).toEqual({ ok: true, candidateLabels: ['signed-number', null, 'signed-number', 'range-or-separator', 'unsure'] });
    expect(prompt).toHaveBeenCalledWith(expect.any(String), { responseConstraint: { type: 'string', enum: ['signed-number', 'range-or-separator', 'unsure'] } });
    expect(clone).toHaveBeenCalledTimes(5);
    expect(destroy).toHaveBeenCalledTimes(5);
    expect(pangu.onTextNodesSettled).toBe(onTextNodesSettled);
    expect(pangu.applyLateFixes).toHaveBeenCalledTimes(1);
    expect(pangu.applyLateFixes).toHaveBeenCalledWith([{ node: textNode, settled, data: '從 -5 到 - 3 再到 -1 度。區間 - 2。未知 - 4' }]);
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
