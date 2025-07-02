import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Symbol @ 只加左空格', () => {
  it('handle @ symbol as at', () => {
    expect(pangu.spacingText('請@vinta吃大便')).toBe('請 @vinta 吃大便');
    expect(pangu.spacingText('請@vinta_chen吃大便')).toBe('請 @vinta_chen 吃大便');
    expect(pangu.spacingText('請@VintaChen吃大便')).toBe('請 @VintaChen 吃大便');
    expect(pangu.spacingText('請@陳上進 吃大便')).toBe('請 @陳上進 吃大便');
  });
});
