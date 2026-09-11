import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ClassifyCandidatesMessage } from '../../../browser-extensions/chrome/src/ai-spacing/messages';
import type { LateFix } from '../../../src/browser/pangu';
import { pangu as corePangu } from '../../../src/shared/index';

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
  vi.doMock('../../../src/browser/pangu', () => ({ default: pangu }));
  const { handleClassification } = await import('../../../browser-extensions/chrome/src/ai-spacing/service-worker');
  const sendMessage = vi.fn(({ kind, candidates }: ClassifyCandidatesMessage) => handleClassification(kind, candidates));
  vi.stubGlobal('chrome', { runtime: { sendMessage } });
  const { applyAiSpacing, warmUpAiSpacing } = await import('../../../browser-extensions/chrome/src/ai-spacing/content-script');
  async function spaceTextWithAi(unspaced: string) {
    const settled = corePangu.spaceText(unspaced);
    const node = { data: settled } as Text;
    await applyAiSpacing([{ node, unspaced, settled }]);
    return node.data;
  }

  return { pangu, sendMessage, applyAiSpacing, warmUpAiSpacing, handleClassification, spaceTextWithAi };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubDigitPlusModel(answer: (question: string) => string | Promise<string>) {
  const prompt = vi.fn((question: string, { responseConstraint }: { responseConstraint: { enum: string[] } }) => {
    expect(responseConstraint.enum).toEqual(['conjunction', 'lower-bound', 'unsure']);
    return answer(question);
  });
  const clone = async () => ({ prompt, destroy: vi.fn() });
  vi.stubGlobal('LanguageModel', { params: vi.fn(), availability: async () => 'available', create: async () => ({ clone }) });
  return prompt;
}

describe('AI spacing results', () => {
  it('routes the five digit-plus originals through core spacing, the worker, and late edits', async () => {
    const prompt = stubDigitPlusModel((question) => (question.startsWith('原句：Switch 2+') ? '"conjunction"' : '"lower-bound"'));
    const { spaceTextWithAi, sendMessage } = await loadAiSpacing();

    expect(await spaceTextWithAi('Switch 2+瑪利歐賽車世界同捆組')).toBe('Switch 2 + 瑪利歐賽車世界同捆組');
    expect(await spaceTextWithAi('有100+的選擇')).toBe('有 100+ 的選擇');
    expect(await spaceTextWithAi('這裡有18+的內容')).toBe('這裡有 18+ 的內容');
    expect(await spaceTextWithAi('評分3.5+的餐廳')).toBe('評分 3.5+ 的餐廳');
    expect(await spaceTextWithAi('Python 3+的版本')).toBe('Python 3+ 的版本');
    expect(prompt).toHaveBeenCalledTimes(5);
    expect(sendMessage.mock.calls.map(([message]) => message.kind)).toEqual(['digit-plus', 'digit-plus', 'digit-plus', 'digit-plus', 'digit-plus']);
  });

  it.each(['"unsure"', '"signed-number"', 'null', 'conjunction'])('retains core digit-plus spacing for answer %s', async (answer) => {
    const prompt = stubDigitPlusModel(() => answer);
    const { spaceTextWithAi, pangu } = await loadAiSpacing();

    expect(await spaceTextWithAi('Switch 2+瑪利歐賽車世界同捆組')).toBe('Switch 2+ 瑪利歐賽車世界同捆組');
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(pangu.applyLateFixes).not.toHaveBeenCalled();
  });

  it('retains core digit-plus spacing when a candidate prompt fails', async () => {
    stubDigitPlusModel(() => Promise.reject(new Error('candidate failed')));
    const { spaceTextWithAi, pangu } = await loadAiSpacing();

    expect(await spaceTextWithAi('Switch 2+瑪利歐賽車世界同捆組')).toBe('Switch 2+ 瑪利歐賽車世界同捆組');
    expect(pangu.applyLateFixes).not.toHaveBeenCalled();
  });

  it('retains core digit-plus spacing when the model is unavailable', async () => {
    const create = vi.fn();
    vi.stubGlobal('LanguageModel', { params: vi.fn(), availability: async () => 'unavailable', create });
    const { spaceTextWithAi, pangu, sendMessage } = await loadAiSpacing();

    expect(await spaceTextWithAi('Switch 2+瑪利歐賽車世界同捆組')).toBe('Switch 2+ 瑪利歐賽車世界同捆組');
    expect(await spaceTextWithAi('有100+的選擇')).toBe('有 100+ 的選擇');
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(create).not.toHaveBeenCalled();
    expect(pangu.applyLateFixes).not.toHaveBeenCalled();
  });

  it('leaves product names and a trailing quantity plus to core without classification', async () => {
    const { spaceTextWithAi, sendMessage } = await loadAiSpacing();

    expect(await spaceTextWithAi('Galaxy S24+手機')).toBe('Galaxy S24 + 手機');
    expect(await spaceTextWithAi('Synology DS224+儲存檔案')).toBe('Synology DS224 + 儲存檔案');
    expect(await spaceTextWithAi('Roborock S7+掃地')).toBe('Roborock S7 + 掃地');
    expect(await spaceTextWithAi('商品數量2+')).toBe('商品數量 2+');
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('joins negative signs when the model answers signed-number', async () => {
    const clone = async () => ({ prompt: async () => '"signed-number"', destroy: vi.fn() });
    vi.stubGlobal('LanguageModel', { params: vi.fn(), availability: async () => 'available', create: async () => ({ clone }) });
    const { spaceTextWithAi } = await loadAiSpacing();

    expect(await spaceTextWithAi('氣溫是-5度左右')).toBe('氣溫是 -5 度左右');
    expect(await spaceTextWithAi('從-5到-3度')).toBe('從 -5 到 -3 度');
    expect(await spaceTextWithAi('Nasdaq-100本週下跌-13.44%')).toBe('Nasdaq-100 本週下跌 -13.44%');
  });

  it('keeps separators and uncertain readings spaced', async () => {
    const prompt = vi.fn().mockResolvedValueOnce('"range-or-separator"').mockResolvedValueOnce('"unsure"');
    const clone = async () => ({ prompt, destroy: vi.fn() });
    vi.stubGlobal('LanguageModel', { params: vi.fn(), availability: async () => 'available', create: async () => ({ clone }) });
    const { spaceTextWithAi } = await loadAiSpacing();

    expect(await spaceTextWithAi('早鳥票-2張')).toBe('早鳥票 - 2 張');
    expect(await spaceTextWithAi('未知-4')).toBe('未知 - 4');
    expect(prompt).toHaveBeenCalledTimes(2);
  });
});

describe('AI spacing warm-up', () => {
  it('warms the digit-plus model once even when the page contains multiple pluses', async () => {
    vi.stubGlobal('LanguageModel', undefined);
    vi.stubGlobal('document', { documentElement: { textContent: 'Switch 2+瑪利歐。有100+的選擇' } });
    const { sendMessage, warmUpAiSpacing } = await loadAiSpacing();

    warmUpAiSpacing();
    warmUpAiSpacing();

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({ type: 'CLASSIFY_CANDIDATES', kind: 'digit-plus', candidates: [] });
  });

  it('warms the model when a tight hyphen shape appears in the page', async () => {
    vi.stubGlobal('LanguageModel', undefined);
    vi.stubGlobal('document', { documentElement: { textContent: '氣溫是-5度' } });
    const { sendMessage, warmUpAiSpacing } = await loadAiSpacing();

    warmUpAiSpacing();

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({ type: 'CLASSIFY_CANDIDATES', kind: 'hyphen-sign', candidates: [] });
  });

  it('warms up only once per page', async () => {
    vi.stubGlobal('LanguageModel', undefined);
    vi.stubGlobal('document', { documentElement: { textContent: '氣溫是-5度' } });
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
  it('combines hyphen deletion and digit-plus insertion in one late fix for the same node', async () => {
    const prompt = vi.fn(async (_question: string, { responseConstraint }: { responseConstraint: { enum: string[] } }) => {
      if (responseConstraint.enum.includes('conjunction')) {
        expect(responseConstraint.enum).toEqual(['conjunction', 'lower-bound', 'unsure']);
        return '"conjunction"';
      }
      expect(responseConstraint.enum).toEqual(['signed-number', 'range-or-separator', 'unsure']);
      return '"signed-number"';
    });
    const create = vi.fn(async () => ({ clone: async () => ({ prompt, destroy: vi.fn() }) }));
    vi.stubGlobal('LanguageModel', { params: vi.fn(), availability: async () => 'available', create });
    const { pangu, sendMessage, applyAiSpacing } = await loadAiSpacing();
    const unspaced = '氣溫是-5度，Switch 2+瑪利歐賽車世界同捆組';
    const settled = corePangu.spaceText(unspaced);
    const node = { data: settled } as Text;

    await applyAiSpacing([{ node, unspaced, settled }]);

    expect(node.data).toBe('氣溫是 -5 度，Switch 2 + 瑪利歐賽車世界同捆組');
    expect(sendMessage.mock.calls.map(([message]) => message.kind)).toEqual(['hyphen-sign', 'digit-plus']);
    expect(create).toHaveBeenCalledTimes(2);
    expect(pangu.applyLateFixes).toHaveBeenCalledTimes(1);
    expect(pangu.applyLateFixes).toHaveBeenCalledWith([{ node, settled, data: '氣溫是 -5 度，Switch 2 + 瑪利歐賽車世界同捆組' }]);
  });

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
});
