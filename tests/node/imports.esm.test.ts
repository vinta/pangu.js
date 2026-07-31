import { describe, expect, it } from 'vitest';
import pangu, { pangu as namedPangu, NodePangu } from '../../dist/node/index.js';

describe('Node.js ESM imports', () => {
  it('handle default ESM imports', () => {
    expect(pangu.spacingText('Hello世界')).toBe('Hello 世界');

    // In ESM, NodePangu is a named export, not a property of pangu
    const anotherPangu = new NodePangu();
    expect(anotherPangu.spacingText('Hello世界')).toBe('Hello 世界');
  });

  it('handle destructured ESM imports', () => {
    expect(namedPangu.spacingText('Hello世界')).toBe('Hello 世界');

    const anotherPangu = new NodePangu();
    expect(anotherPangu.spacingText('Hello世界')).toBe('Hello 世界');
  });
});
