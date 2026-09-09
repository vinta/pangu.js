import { describe, expect, it } from 'vitest';
import { Pangu } from '../../dist/shared/index.js';

const pangu = new Pangu();

describe('Symbol |', () => {
  it('handle | symbol as separator', () => {
    expect(pangu.spaceText('前面|後面')).toBe('前面 | 後面');
    expect(pangu.spaceText('Mollie|陳上進')).toBe('Mollie | 陳上進');
    expect(pangu.spaceText('陳上進|Mollie')).toBe('陳上進 | Mollie');
    expect(pangu.spaceText('陳上進|貓咪|Mollie')).toBe('陳上進 | 貓咪 | Mollie');
    expect(pangu.spaceText('陳上進|Mollie|貓咪')).toBe('陳上進 | Mollie | 貓咪');
    expect(pangu.spaceText('Mollie|Vinta|貓咪')).toBe('Mollie | Vinta | 貓咪');
    expect(pangu.spaceText('Mollie|陳上進|貓咪')).toBe('Mollie | 陳上進 | 貓咪');
    expect(pangu.spaceText('作詞|林夕')).toBe('作詞 | 林夕');
    expect(pangu.spaceText('文|張三 圖|李四')).toBe('文 | 張三 圖 | 李四');
    expect(pangu.spaceText('支援的 Apple TV 型號|Disney+ 幫助中心|TW')).toBe('支援的 Apple TV 型號 | Disney+ 幫助中心 | TW');

    // DO NOT change if already spacing
    expect(pangu.spaceText('前面 | 後面')).toBe('前面 | 後面');
    expect(pangu.spaceText('Vinta | Mollie')).toBe('Vinta | Mollie');
    expect(pangu.spaceText('Vinta | Mollie | Kitten')).toBe('Vinta | Mollie | Kitten');
    expect(pangu.spaceText('陳上進 | 貓咪 | Mollie')).toBe('陳上進 | 貓咪 | Mollie');
    expect(pangu.spaceText('陳上進 | Mollie | 貓咪')).toBe('陳上進 | Mollie | 貓咪');
    expect(pangu.spaceText('Mollie | Vinta | 貓咪')).toBe('Mollie | Vinta | 貓咪');
    expect(pangu.spaceText('Mollie | 陳上進 | 貓咪')).toBe('Mollie | 陳上進 | 貓咪');
  });

  it('handle | symbol as joiner token', () => {
    expect(pangu.spaceText('Vinta|Mollie')).toBe('Vinta|Mollie'); // If no CJK, DO NOT change
    expect(pangu.spaceText('Vinta|Mollie|Kitten')).toBe('Vinta|Mollie|Kitten');
    expect(pangu.spaceText('ps aux|grep node')).toBe('ps aux|grep node');
    expect(pangu.spaceText('條件是x|y的情況')).toBe('條件是 x|y 的情況');
    expect(pangu.spaceText('得到一個A|B的結果')).toBe('得到一個 A|B 的結果');
    expect(pangu.spaceText('得到一個A||B的結果')).toBe('得到一個 A||B 的結果');
  });
});
