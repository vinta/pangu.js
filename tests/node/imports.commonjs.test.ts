import { createRequire } from 'node:module';
import { describe, it, expect } from 'vitest';

const require = createRequire(import.meta.url);

describe('Node.js CommonJS imports', () => {
  it('should support direct require', () => {
    const pangu = require('../../dist/node/index.cjs');

    expect(pangu.spacingText('Hello世界')).toBe('Hello 世界');

    // In CommonJS, NodePangu is a property of pangu
    const anotherPangu = new pangu.NodePangu();
    expect(anotherPangu.spacingText('Hello世界')).toBe('Hello 世界');
  });

  it('should support destructured require', () => {
    const { NodePangu, pangu } = require('../../dist/node/index.cjs');

    expect(pangu.spacingText('Hello世界')).toBe('Hello 世界');

    const anotherPangu = new NodePangu();
    expect(anotherPangu.spacingText('Hello世界')).toBe('Hello 世界');
  });
});
