import { pangu as namedPangu, NodePangu } from '../../dist/node/index.js';
import pangu from '../../dist/node/index.js';
import { describe, it, expect } from 'vitest';

describe('Node.js ESM imports', () => {
  it('should handle default ESM imports', () => {
    expect(pangu.spacingText('Hello世界')).toBe('Hello 世界');

    // In ESM, NodePangu is a named export, not a property of pangu
    const anotherPangu = new NodePangu();
    expect(anotherPangu.spacingText('Hello世界')).toBe('Hello 世界');
  });

  it('should handle destructured ESM imports', () => {
    expect(namedPangu.spacingText('Hello世界')).toBe('Hello 世界');

    const anotherPangu = new NodePangu();
    expect(anotherPangu.spacingText('Hello世界')).toBe('Hello 世界');
  });
});
