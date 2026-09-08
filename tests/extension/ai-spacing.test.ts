import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ClassifyCandidatesMessage } from '../../browser-extensions/chrome/src/ai-spacing/messages';
import type { LateFix } from '../../src/browser/pangu';
import { pangu as corePangu } from '../../src/shared/index';

async function loadAiSpacing() {
  vi.resetModules();
  const pangu = {
    onTextNodesSettled: vi.fn(),
    applyLateFixes: vi.fn((fixes: readonly LateFix[]) => {
      for (const { node, data } of fixes) {
        node.data = data;
      }
    }),
  };
  vi.doMock('../../src/browser/pangu', () => ({ default: pangu }));
  const { handleClassification } = await import('../../browser-extensions/chrome/src/ai-spacing/service-worker');
  const sendMessage = vi.fn(({ kind, candidates }: ClassifyCandidatesMessage) => handleClassification(kind, candidates));
  vi.stubGlobal('chrome', { runtime: { sendMessage } });
  const { applyAiSpacing, warmUpAiSpacing } = await import('../../browser-extensions/chrome/src/ai-spacing/content-script');
  async function spacingTextWithAi(unspaced: string) {
    const settled = corePangu.spacingText(unspaced);
    const node = { data: settled } as Text;
    await applyAiSpacing([{ node, unspaced, settled }]);
    return node.data;
  }

  return { pangu, sendMessage, applyAiSpacing, warmUpAiSpacing, handleClassification, spacingTextWithAi };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AI spacing results', () => {
  it('joins negative signs when the model answers signed-number', async () => {
    const clone = async () => ({ prompt: async () => '"signed-number"', destroy: vi.fn() });
    vi.stubGlobal('LanguageModel', { params: vi.fn(), availability: async () => 'available', create: async () => ({ clone }) });
    const { spacingTextWithAi } = await loadAiSpacing();

    expect(await spacingTextWithAi('氣溫是-5度左右')).toBe('氣溫是 -5 度左右');
    expect(await spacingTextWithAi('從-5到-3度')).toBe('從 -5 到 -3 度');
    expect(await spacingTextWithAi('Nasdaq-100本週下跌-13.44%')).toBe('Nasdaq-100 本週下跌 -13.44%');
    expect(await spacingTextWithAi('公視+上架了新片，氣溫是-5度')).toBe('公視+ 上架了新片，氣溫是 -5 度');
  });

  it('keeps separators and uncertain readings spaced', async () => {
    const prompt = vi.fn().mockResolvedValueOnce('"range-or-separator"').mockResolvedValueOnce('"unsure"');
    const clone = async () => ({ prompt, destroy: vi.fn() });
    vi.stubGlobal('LanguageModel', { params: vi.fn(), availability: async () => 'available', create: async () => ({ clone }) });
    const { spacingTextWithAi } = await loadAiSpacing();

    expect(await spacingTextWithAi('早鳥票-2張')).toBe('早鳥票 - 2 張');
    expect(await spacingTextWithAi('未知-4')).toBe('未知 - 4');
    expect(prompt).toHaveBeenCalledTimes(2);
  });

  it('restores name suffixes without a model', async () => {
    vi.stubGlobal('LanguageModel', undefined);
    const { spacingTextWithAi, sendMessage } = await loadAiSpacing();

    expect(await spacingTextWithAi('Disney+上架了新片')).toBe('Disney+ 上架了新片');
    expect(await spacingTextWithAi('公視+上架了新片')).toBe('公視+ 上架了新片');
    expect(await spacingTextWithAi('如何使用PTS+（公視+）註冊與觀看？')).toBe('如何使用 PTS+（公視+）註冊與觀看？');
    expect(await spacingTextWithAi('MOD+影劇館+上架')).toBe('MOD + 影劇館+ 上架');
    expect(await spacingTextWithAi('Netflix、Disney+、Apple TV+等串流平台')).toBe('Netflix、Disney+、Apple TV+ 等串流平台');
    expect(await spacingTextWithAi('影劇館+/全選')).toBe('影劇館+/全選');
    expect(await spacingTextWithAi('公視+(免費平台)')).toBe('公視+ (免費平台)');
    expect(await spacingTextWithAi('「公視+」')).toBe('「公視+」');
    expect(await spacingTextWithAi('今天來看公視+')).toBe('今天來看公視+');
    expect(await spacingTextWithAi('vivo X70 Pro+開賣')).toBe('vivo X70 Pro+ 開賣');
    expect(await spacingTextWithAi('評等介於AA-和AA+之間')).toBe('評等介於 AA- 和 AA+ 之間');
    expect(await spacingTextWithAi('血型是AB-的人')).toBe('血型是 AB- 的人');
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('preserves core spacing and author-written gaps without a model', async () => {
    vi.stubGlobal('LanguageModel', undefined);
    const { spacingTextWithAi, sendMessage } = await loadAiSpacing();

    expect(await spacingTextWithAi('打+886這個號碼')).toBe('打 +886 這個號碼');
    expect(await spacingTextWithAi('Disney+上架了C++課程')).toBe('Disney+ 上架了 C++ 課程');
    expect(await spacingTextWithAi('Disney+上架了A+B')).toBe('Disney+ 上架了 A + B');
    expect(await spacingTextWithAi('Switch+健身環套組')).toBe('Switch + 健身環套組');
    expect(await spacingTextWithAi('公視 +上架了新片')).toBe('公視 + 上架了新片');
    expect(await spacingTextWithAi('氣溫是 - 5度')).toBe('氣溫是 - 5 度');
    expect(sendMessage).not.toHaveBeenCalled();
  });
});

describe('AI spacing warm-up', () => {
  it('warms the model when a tight hyphen shape appears in the page', async () => {
    vi.stubGlobal('LanguageModel', undefined);
    vi.stubGlobal('document', { documentElement: { textContent: '公視+上架了新片，氣溫是-5度' } });
    const { sendMessage, warmUpAiSpacing } = await loadAiSpacing();

    warmUpAiSpacing();

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({ type: 'CLASSIFY_CANDIDATES', kind: 'hyphen-sign', candidates: [] });
  });

  it('warms up only once per page', async () => {
    vi.stubGlobal('LanguageModel', undefined);
    vi.stubGlobal('document', { documentElement: { textContent: '公視+上架了新片，氣溫是-5度' } });
    const { sendMessage, warmUpAiSpacing } = await loadAiSpacing();

    warmUpAiSpacing();
    warmUpAiSpacing();

    expect(sendMessage).toHaveBeenCalledTimes(1);
  });

  it.each(['公視+上架了新片', 'abc-5，氣溫是 -5度', '沒有連字號'])('skips model warm-up for %s', async (textContent) => {
    vi.stubGlobal('document', { documentElement: { textContent } });
    const { sendMessage, warmUpAiSpacing } = await loadAiSpacing();

    warmUpAiSpacing();

    expect(sendMessage).not.toHaveBeenCalled();
  });
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
    const { handleClassification } = await loadAiSpacing();

    const warmup = handleClassification('hyphen-sign', []);
    await Promise.resolve();
    expect(create).toHaveBeenCalledTimes(1);
    expect(clone).not.toHaveBeenCalled();

    const batch = handleClassification('hyphen-sign', [{ sentence: '氣溫是-5度', at: 3 }]);
    finishCreation();

    expect(await warmup).toEqual({ ok: true, candidateLabels: [] });
    expect(await batch).toEqual({ ok: true, candidateLabels: ['signed-number'] });
    expect(create).toHaveBeenCalledTimes(1);
    expect(clone).toHaveBeenCalledTimes(1);
  });

  it('retries session creation after a rejected warmup', async () => {
    const create = vi.fn().mockRejectedValueOnce(new Error('creation failed')).mockResolvedValue({ clone: vi.fn() });
    vi.stubGlobal('LanguageModel', { params: vi.fn(), availability: async () => 'available', create });
    const { handleClassification } = await loadAiSpacing();

    expect(await handleClassification('hyphen-sign', [])).toEqual({ ok: false, error: 'Error: creation failed' });
    expect(await handleClassification('hyphen-sign', [])).toEqual({ ok: true, candidateLabels: [] });
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

  it('stops asking the worker for this page without writing when the model is absent', async () => {
    vi.stubGlobal('LanguageModel', undefined);
    const { pangu, sendMessage, applyAiSpacing } = await loadAiSpacing();
    const onTextNodesSettled = pangu.onTextNodesSettled;

    await applyAiSpacing([{ node: {} as Text, unspaced: '氣溫是-5度', settled: '氣溫是 - 5 度' }]);
    await applyAiSpacing([{ node: {} as Text, unspaced: '從-3度', settled: '從 - 3 度' }]);

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(await sendMessage.mock.results[0]!.value).toEqual({ ok: false, error: 'Error: LanguageModel is not exposed in this context' });
    expect(pangu.onTextNodesSettled).toBe(onTextNodesSettled);
    expect(pangu.applyLateFixes).not.toHaveBeenCalled();
  });

  it('applies a brand suffix fix without asking the worker', async () => {
    vi.stubGlobal('LanguageModel', undefined);
    const { pangu, sendMessage, applyAiSpacing } = await loadAiSpacing();
    const textNode = {} as Text;
    const settled = '公視 + 上架了新片';

    await applyAiSpacing([{ node: textNode, unspaced: '公視+上架了新片', settled }]);

    expect(sendMessage).not.toHaveBeenCalled();
    expect(pangu.applyLateFixes).toHaveBeenCalledWith([{ node: textNode, settled, data: '公視+ 上架了新片' }]);
  });

  it('keeps applying brand suffix fixes after the model fails', async () => {
    vi.stubGlobal('LanguageModel', undefined);
    const { pangu, sendMessage, applyAiSpacing } = await loadAiSpacing();
    const textNode = {} as Text;
    const settled = '公視 + 上架了新片，氣溫是 - 5 度';

    await applyAiSpacing([{ node: textNode, unspaced: '公視+上架了新片，氣溫是-5度', settled }]);

    const nextTextNode = {} as Text;
    const nextSettled = '影劇館 + /全選，從 - 3 度';
    await applyAiSpacing([{ node: nextTextNode, unspaced: '影劇館+/全選，從-3度', settled: nextSettled }]);

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(pangu.applyLateFixes).toHaveBeenCalledTimes(2);
    expect(pangu.applyLateFixes).toHaveBeenCalledWith([{ node: textNode, settled, data: '公視+ 上架了新片，氣溫是 - 5 度' }]);
    expect(pangu.applyLateFixes).toHaveBeenNthCalledWith(2, [{ node: nextTextNode, settled: nextSettled, data: '影劇館+/全選，從 - 3 度' }]);
  });

  it('composes a brand suffix fix with a model fix on the same text node', async () => {
    const clone = vi.fn(async () => ({ prompt: async () => '"signed-number"', destroy: vi.fn() }));
    vi.stubGlobal('LanguageModel', { params: vi.fn(), availability: async () => 'available', create: async () => ({ clone }) });
    const { pangu, sendMessage, applyAiSpacing } = await loadAiSpacing();
    const textNode = {} as Text;
    const settled = '公視 + 上架了新片，氣溫是 - 5 度';

    await applyAiSpacing([{ node: textNode, unspaced: '公視+上架了新片，氣溫是-5度', settled }]);

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage.mock.calls[0]![0].kind).toBe('hyphen-sign');
    expect(pangu.applyLateFixes).toHaveBeenCalledWith([{ node: textNode, settled, data: '公視+ 上架了新片，氣溫是 -5 度' }]);
  });
});
