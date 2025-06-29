import { pangu as aliasPangu, NodePangu } from '../../dist/node/index.js';
import panguDefault from '../../dist/node/index.js';
import { describe, it, expect } from 'vitest';

describe('Node.js ESM imports', () => {
  it('should support named import of pangu', () => {
    expect(aliasPangu).toBeDefined();
    expect(typeof aliasPangu.spacing).toBe('function');
    expect(typeof aliasPangu.spacingText).toBe('function');
  });

  it('should support named import of NodePangu', () => {
    expect(NodePangu).toBeDefined();
    expect(typeof NodePangu).toBe('function');
  });

  it('should support default import', () => {
    expect(panguDefault).toBeDefined();
    expect(typeof panguDefault.spacing).toBe('function');
    expect(panguDefault).toBe(aliasPangu);
  });

  it('should create new instances', () => {
    const anotherPangu = new NodePangu();
    expect(anotherPangu).toBeInstanceOf(NodePangu);
    expect(typeof anotherPangu.spacing).toBe('function');
  });

  it('should have working spacing functionality', () => {
    const result = panguDefault.spacingText('Hello世界');
    expect(result).toBe('Hello 世界');
  });
});

