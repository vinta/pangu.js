import { describe, expect, it } from 'vitest';
import pangu, { BrowserPangu, DomWalker, pangu as namedPangu, TaskQueue, TaskScheduler, VisibilityDetector } from '../../dist/browser/index.js';
import { Pangu } from '../../dist/shared/index.js';

describe('Browser ESM imports', () => {
  it('handle default ESM imports', () => {
    expect(pangu.spaceText('Hello世界')).toBe('Hello 世界');

    const anotherPangu = new BrowserPangu();
    expect(anotherPangu.spaceText('Hello世界')).toBe('Hello 世界');
  });

  it('handle destructured ESM imports', () => {
    expect(namedPangu.spaceText('Hello世界')).toBe('Hello 世界');

    const anotherPangu = new BrowserPangu();
    expect(anotherPangu.spaceText('Hello世界')).toBe('Hello 世界');
  });

  it('handle class imports', () => {
    expect(pangu.taskScheduler).toBeInstanceOf(TaskScheduler);
    expect(pangu.taskScheduler.queue).toBeInstanceOf(TaskQueue);
    expect(pangu.visibilityDetector).toBeInstanceOf(VisibilityDetector);
    expect(typeof DomWalker.isIgnoredElement).toBe('function');
  });

  it('share one Pangu class with pangu/shared', () => {
    expect(pangu).toBeInstanceOf(Pangu);
    expect(new BrowserPangu()).toBeInstanceOf(Pangu);
  });
});
