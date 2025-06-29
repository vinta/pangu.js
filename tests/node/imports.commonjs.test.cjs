const pangu = require('../../dist/node/index.cjs');
const { NodePangu, pangu: aliasPangu } = require('../../dist/node/index.cjs');

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Helper to make assertions similar to vitest's expect API
const expect = (actual) => ({
  toBeDefined: () => assert.notEqual(actual, undefined),
  toBe: (expected) => assert.equal(actual, expected),
  toBeInstanceOf: (expected) => assert(actual instanceof expected),
});

describe('Node.js CommonJS imports', () => {
  it('should support direct require usage', () => {
    expect(pangu.version).toBe('6.1.0');

    expect(pangu.spacingText('Hello世界')).toBe('Hello 世界');

    const anotherPangu = new pangu.NodePangu();
    expect(anotherPangu.spacingText('Hello世界')).toBe('Hello 世界');
  });

  it('should support destructured require', () => {
    expect(aliasPangu.spacingText('Hello世界')).toBe('Hello 世界');

    const anotherPangu = new NodePangu();
    expect(anotherPangu.spacingText('Hello世界')).toBe('Hello 世界');
  });
});
