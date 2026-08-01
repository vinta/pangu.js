import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol :', () => {
  // When the symbol appears only 1 time in one line
  it('handle : symbol as colon, only add space on the right', () => {
    expect(pangu.spacingText('前面:後面')).toBe('前面: 後面');

    // DO NOT change if already spacing
    expect(pangu.spacingText('前面 : 後面')).toBe('前面 : 後面');
    expect(pangu.spacingText('前面: 後面')).toBe('前面: 後面');
    expect(pangu.spacingText('前面 :後面')).toBe('前面 :後面');

    // Special cases
    expect(pangu.spacingText('電話:123456789')).toBe('電話: 123456789');
    expect(pangu.spacingText('前面:I have no idea後面')).toBe('前面: I have no idea 後面');
    expect(pangu.spacingText('前面: I have no idea後面')).toBe('前面: I have no idea 後面');

    // FIXME
    // expect(pangu.spacingText('前面:)後面')).toBe('前面 :) 後面');
  });

  // When the symbol appears 2+ times or more in one line
  // FIXME
  // it('handle : symbol as separator', () => {
  //   expect(pangu.spacingText('前面:後面:再後面')).toBe('前面:後面:再後面');
  //   expect(pangu.spacingText('前面:後面:再後面:更後面')).toBe('前面:後面:再後面:更後面');
  //   expect(pangu.spacingText('前面:後面:再後面:更後面:超後面')).toBe('前面:後面:再後面:更後面:超後面');
  // });
});
