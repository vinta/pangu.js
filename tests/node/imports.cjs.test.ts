import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import type { NodePangu } from '../../src/node/index';

const require = createRequire(import.meta.url);

// require() is untyped, so the test states the CJS module shape itself
type NodeCjsModule = NodePangu & { pangu: NodePangu; NodePangu: typeof NodePangu };

describe('Node.js CommonJS imports', () => {
  it('handle direct require imports', () => {
    const pangu = require('../../dist/node/index.cjs') as NodeCjsModule;

    expect(pangu.spaceText('Hello世界')).toBe('Hello 世界');

    // NodePangu is available as a property on pangu
    const anotherPangu = new pangu.NodePangu();
    expect(anotherPangu.spaceText('Hello世界')).toBe('Hello 世界');
  });

  it('handle destructured require imports', () => {
    const { NodePangu, pangu } = require('../../dist/node/index.cjs') as NodeCjsModule;

    expect(pangu.spaceText('Hello世界')).toBe('Hello 世界');

    const anotherPangu = new NodePangu();
    expect(anotherPangu.spaceText('Hello世界')).toBe('Hello 世界');
  });
});
