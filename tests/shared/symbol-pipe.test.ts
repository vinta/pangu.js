import { Pangu } from '../../dist/shared/index.js';
import { describe, it, expect } from 'vitest';

const pangu = new Pangu();

describe('Symbol |', () => {
  // A pipe in direct CJK contact makes every pipe on the line a separator,
  // decided per line like slash reading
  it('handle | symbol as separator', () => {
    expect(pangu.spacingText('前面|後面')).toBe('前面 | 後面');
    expect(pangu.spacingText('Mollie|陳上進')).toBe('Mollie | 陳上進');
    expect(pangu.spacingText('陳上進|Mollie')).toBe('陳上進 | Mollie');
    expect(pangu.spacingText('陳上進|貓咪|Mollie')).toBe('陳上進 | 貓咪 | Mollie');
    expect(pangu.spacingText('陳上進|Mollie|貓咪')).toBe('陳上進 | Mollie | 貓咪');
    expect(pangu.spacingText('Mollie|Vinta|貓咪')).toBe('Mollie | Vinta | 貓咪');
    expect(pangu.spacingText('Mollie|陳上進|貓咪')).toBe('Mollie | 陳上進 | 貓咪');
    expect(pangu.spacingText('作詞|林夕')).toBe('作詞 | 林夕');
    expect(pangu.spacingText('文|張三 圖|李四')).toBe('文 | 張三 圖 | 李四');
    expect(pangu.spacingText('支援的 Apple TV 型號|Disney+ 幫助中心|TW')).toBe('支援的 Apple TV 型號 | Disney+ 幫助中心 | TW');

    // DO NOT change if already spacing
    expect(pangu.spacingText('前面 | 後面')).toBe('前面 | 後面');
    expect(pangu.spacingText('Vinta | Mollie')).toBe('Vinta | Mollie');
    expect(pangu.spacingText('Vinta | Mollie | Kitten')).toBe('Vinta | Mollie | Kitten');
    expect(pangu.spacingText('陳上進 | 貓咪 | Mollie')).toBe('陳上進 | 貓咪 | Mollie');
    expect(pangu.spacingText('陳上進 | Mollie | 貓咪')).toBe('陳上進 | Mollie | 貓咪');
    expect(pangu.spacingText('Mollie | Vinta | 貓咪')).toBe('Mollie | Vinta | 貓咪');
    expect(pangu.spacingText('Mollie | 陳上進 | 貓咪')).toBe('Mollie | 陳上進 | 貓咪');
  });

  // On a line where no pipe touches CJK, a pipe binds half-width characters
  // into one token, spaced from CJK as a unit and never split
  it('handle | symbol as pipe token', () => {
    expect(pangu.spacingText('Vinta|Mollie')).toBe('Vinta|Mollie'); // If no CJK, DO NOT change
    expect(pangu.spacingText('Vinta|Mollie|Kitten')).toBe('Vinta|Mollie|Kitten');
    expect(pangu.spacingText('ps aux|grep node')).toBe('ps aux|grep node');
    expect(pangu.spacingText('條件是x|y的情況')).toBe('條件是 x|y 的情況');
    expect(pangu.spacingText('得到一個A|B的結果')).toBe('得到一個 A|B 的結果');
    expect(pangu.spacingText('得到一個A||B的結果')).toBe('得到一個 A||B 的結果');
  });
});
