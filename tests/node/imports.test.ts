import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

// ESM imports
import { pangu as panguNamed, NodePangu } from '../../dist/node/index.js';
import panguDefault from '../../dist/node/index.js';

const require = createRequire(import.meta.url);

describe('Node.js ESM imports', () => {
  it('should support named import of pangu', () => {
    expect(panguNamed).toBeDefined();
    expect(typeof panguNamed.spacing).toBe('function');
    expect(typeof panguNamed.spacingText).toBe('function');
  });

  it('should support named import of NodePangu', () => {
    expect(NodePangu).toBeDefined();
    expect(typeof NodePangu).toBe('function');
  });

  it('should support default import', () => {
    expect(panguDefault).toBeDefined();
    expect(typeof panguDefault.spacing).toBe('function');
    expect(panguDefault).toBe(panguNamed);
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

describe('Node.js CommonJS imports', () => {
  it('should support default require', () => {
    const module = require('../../dist/node/index.cjs');
    const pangu = module.default || module;
    expect(pangu).toBeDefined();
    expect(typeof pangu.spacing).toBe('function');
    expect(typeof pangu.spacingText).toBe('function');
  });

  it('should support destructured require', () => {
    const { pangu, NodePangu } = require('../../dist/node/index.cjs');
    expect(pangu).toBeDefined();
    expect(typeof pangu.spacing).toBe('function');
    expect(NodePangu).toBeDefined();
    expect(typeof NodePangu).toBe('function');
  });

  it('should create new instances from CommonJS import', () => {
    const { NodePangu } = require('../../dist/node/index.cjs');
    const anotherPangu = new NodePangu();
    expect(anotherPangu).toBeInstanceOf(NodePangu);
    expect(typeof anotherPangu.spacing).toBe('function');
  });

  it('should have consistent behavior between default and named exports', () => {
    const module = require('../../dist/node/index.cjs');
    const { pangu: panguNamed } = module;
    expect(module.default).toBe(panguNamed);
  });
});