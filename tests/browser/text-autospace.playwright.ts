import { test, expect } from '@playwright/test';

// The stylesheet the extension actually registers (ADR 0001: test what ships).
// npm run build:extension copies browser-extensions/chrome/src/content-script.css here.
const SHIPPED_STYLESHEET_PATH = 'browser-extensions/chrome/dist/content-script.css';

test.describe('text-autospace stylesheet', () => {
  test.beforeEach(async ({ page }) => {
    await page.setContent('<div id="content"></div>');

    // All three bundled engines support text-autospace as of mid-2026, so this guard
    // only matters on older engine builds, where tests skip instead of fail
    const hasSupport = await page.evaluate(() => CSS.supports('text-autospace', 'normal'));
    test.skip(!hasSupport, 'text-autospace is not supported');

    await page.addStyleTag({ path: SHIPPED_STYLESHEET_PATH });
  });

  test('should enable autospacing at the root', async ({ page }) => {
    const rootValue = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('text-autospace'));

    expect(rootValue).toBe('normal');
  });

  test('should exclude code, pre, textarea, input, and editable regions', async ({ page }) => {
    const result = await page.evaluate(() => {
      const content = document.getElementById('content')!;
      content.innerHTML = `
        <code>const text = '中文abc';</code>
        <pre>中文abc</pre>
        <textarea>中文abc</textarea>
        <input value="中文abc">
        <div contenteditable="">中文abc</div>
        <div contenteditable="true">中文abc</div>
        <div contenteditable="plaintext-only">中文abc</div>
      `;

      const computedValue = (selector: string) => getComputedStyle(content.querySelector(selector)!).getPropertyValue('text-autospace');
      return {
        code: computedValue('code'),
        pre: computedValue('pre'),
        textarea: computedValue('textarea'),
        input: computedValue('input'),
        contenteditableEmpty: computedValue('[contenteditable=""]'),
        contenteditableTrue: computedValue('[contenteditable="true"]'),
        contenteditablePlaintextOnly: computedValue('[contenteditable="plaintext-only"]'),
      };
    });

    expect(result.code).toBe('no-autospace');
    expect(result.pre).toBe('no-autospace');
    expect(result.textarea).toBe('no-autospace');
    expect(result.input).toBe('no-autospace');
    expect(result.contenteditableEmpty).toBe('no-autospace');
    expect(result.contenteditableTrue).toBe('no-autospace');
    expect(result.contenteditablePlaintextOnly).toBe('no-autospace');
  });

  test('should not exclude contenteditable="false"', async ({ page }) => {
    const result = await page.evaluate(() => {
      const content = document.getElementById('content')!;
      content.innerHTML = `
        <div contenteditable="false">中文abc</div>
      `;

      return getComputedStyle(content.querySelector('[contenteditable="false"]')!).getPropertyValue('text-autospace');
    });

    expect(result).toBe('normal');
  });

  test('should yield to site-declared text-autospace', async ({ page }) => {
    const result = await page.evaluate(() => {
      const content = document.getElementById('content')!;
      content.innerHTML = `
        <style>
          .site-declared { text-autospace: no-autospace; }
        </style>
        <div class="site-declared">中文abc</div>
      `;

      return getComputedStyle(content.querySelector('.site-declared')!).getPropertyValue('text-autospace');
    });

    expect(result).toBe('no-autospace');
  });

  test('should widen CJK-letter and CJK-digit junctions', async ({ page }) => {
    const result = await page.evaluate(() => {
      const content = document.getElementById('content')!;
      content.innerHTML = `
        <div style="font-size: 100px; white-space: nowrap">
          <span id="letters-on">中a中a中a</span>
          <span id="letters-off" style="text-autospace: no-autospace">中a中a中a</span>
          <span id="digits-on">中1中1中1</span>
          <span id="digits-off" style="text-autospace: no-autospace">中1中1中1</span>
        </div>
      `;

      const width = (id: string) => document.getElementById(id)!.getBoundingClientRect().width;
      return {
        lettersOn: width('letters-on'),
        lettersOff: width('letters-off'),
        digitsOn: width('digits-on'),
        digitsOff: width('digits-off'),
      };
    });

    expect(result.lettersOn).toBeGreaterThan(result.lettersOff);
    expect(result.digitsOn).toBeGreaterThan(result.digitsOff);
  });

  test('should not widen pairs already separated by a real space', async ({ page }) => {
    const result = await page.evaluate(() => {
      const content = document.getElementById('content')!;
      content.innerHTML = `
        <div style="font-size: 100px; white-space: nowrap">
          <span id="spaced-on">中 a 中 1</span>
          <span id="spaced-off" style="text-autospace: no-autospace">中 a 中 1</span>
        </div>
      `;

      const width = (id: string) => document.getElementById(id)!.getBoundingClientRect().width;
      return {
        spacedOn: width('spaced-on'),
        spacedOff: width('spaced-off'),
      };
    });

    expect(result.spacedOn).toBeCloseTo(result.spacedOff, 0);
  });

  test('should not widen CJK-symbol junctions', async ({ page }) => {
    const result = await page.evaluate(() => {
      const content = document.getElementById('content')!;
      content.innerHTML = `
        <div style="font-size: 100px; white-space: nowrap">
          <span id="symbols-on">中$中%中</span>
          <span id="symbols-off" style="text-autospace: no-autospace">中$中%中</span>
        </div>
      `;

      const width = (id: string) => document.getElementById(id)!.getBoundingClientRect().width;
      return {
        symbolsOn: width('symbols-on'),
        symbolsOff: width('symbols-off'),
      };
    });

    expect(result.symbolsOn).toBeCloseTo(result.symbolsOff, 0);
  });
});
