import { createRequire } from 'node:module';
import { describe, it, expect } from 'vitest';

const require = createRequire(import.meta.url);

describe('Node.js CommonJS imports', () => {
  it('should handle direct require imports', () => {
    const pangu = require('../../dist/node/index.cjs');

    expect(pangu.spacingText('Hello世界')).toBe('Hello 世界');

    // NodePangu is available as a property on pangu
    const anotherPangu = new pangu.NodePangu();
    expect(anotherPangu.spacingText('Hello世界')).toBe('Hello 世界');
  });

  it('should handle destructured require imports', () => {
    const { NodePangu, pangu } = require('../../dist/node/index.cjs');

    expect(pangu.spacingText('Hello世界')).toBe('Hello 世界');

    const anotherPangu = new NodePangu();
    expect(anotherPangu.spacingText('Hello世界')).toBe('Hello 世界');
  });
});
