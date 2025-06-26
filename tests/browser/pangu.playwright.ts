import type { BrowserPangu } from '../../dist/browser/pangu';
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

declare global {
  const pangu: BrowserPangu;
  interface Window {
    pangu: BrowserPangu;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadFixture(filename: string): string {
  const fixturePath = join(__dirname, '../_fixtures', filename);
  return readFileSync(fixturePath, 'utf8');
}

test.describe('BrowserPangu', () => {
  test.beforeEach(async ({ page }) => {
    await page.addScriptTag({ path: 'dist/browser/pangu.umd.js' });
    await page.waitForFunction(() => typeof window.pangu !== 'undefined');
  });

  test.describe('spacing()', () => {
    test('should process text strings', async ({ page }) => {
      const result = await page.evaluate(() => {
        return pangu.spacing('新八的構造成分有95%是眼鏡、3%是水、2%是垃圾');
      });

      expect(result).toBe('新八的構造成分有 95% 是眼鏡、3% 是水、2% 是垃圾');
    });
  });

  test.describe('spacingNode()', () => {
    test('should process text nodes', async ({ page }) => {
      const result = await page.evaluate(() => {
        const textNode = document.createTextNode('早安！こんにちは！안녕하세요!');
        document.body.appendChild(textNode);

        pangu.spacingNode(textNode);

        return textNode.textContent;
      });

      expect(result).toBe('早安！こんにちは！안녕하세요!');
    });

    test('should process element nodes', async ({ page }) => {
      const result = await page.evaluate(() => {
        const div = document.createElement('div');
        div.textContent = '新八的構造成分有95%是眼鏡、3%是水、2%是垃圾';
        document.body.appendChild(div);

        pangu.spacingNode(div);

        return div.textContent;
      });

      expect(result).toBe('新八的構造成分有 95% 是眼鏡、3% 是水、2% 是垃圾');
    });
  });

  test.describe('spacingElementById()', () => {
    test('should process elements by ID', async ({ page }) => {
      const htmlContent = loadFixture('id_name.html');
      const expected = loadFixture('id_name_expected.html').trim();

      await page.setContent(htmlContent);

      await page.evaluate(() => {
        pangu.spacingElementById('e1');
      });

      const actual = await page.evaluate(() => document.body.innerHTML.trim());

      expect(actual).toBe(expected);
    });
  });

  test.describe('spacingElementByClassName()', () => {
    test('should process elements by class name (single element)', async ({ page }) => {
      const htmlContent = loadFixture('class_name_1.html');
      const expected = loadFixture('class_name_1_expected.html').trim();

      await page.setContent(htmlContent);

      await page.evaluate(() => {
        pangu.spacingElementByClassName('e2');
      });

      const actual = await page.evaluate(() => document.body.innerHTML.trim());

      expect(actual).toBe(expected);
    });

    test('should process elements by class name (multiple elements)', async ({ page }) => {
      const htmlContent = loadFixture('class_name_2.html');
      const expected = loadFixture('class_name_2_expected.html').trim();

      await page.setContent(htmlContent);

      await page.evaluate(() => {
        pangu.spacingElementByClassName('e4');
      });

      const actual = await page.evaluate(() => document.body.innerHTML.trim());

      expect(actual).toBe(expected);
    });

    test('should process elements by class name (nested elements)', async ({ page }) => {
      const htmlContent = loadFixture('class_name_3.html');
      const expected = loadFixture('class_name_3_expected.html').trim();

      await page.setContent(htmlContent);

      await page.evaluate(() => {
        pangu.spacingElementByClassName('e5');
      });

      const actual = await page.evaluate(() => document.body.innerHTML.trim());

      expect(actual).toBe(expected);
    });
  });

  test.describe('spacingElementByTagName()', () => {
    test('should process elements by tag name', async ({ page }) => {
      const htmlContent = loadFixture('tag_name.html');
      const expected = loadFixture('tag_name_expected.html').trim();

      await page.setContent(htmlContent);

      await page.evaluate(() => {
        pangu.spacingElementByTagName('article');
      });

      const actual = await page.evaluate(() => document.body.innerHTML.trim());

      expect(actual).toBe(expected);
    });
  });

  test.describe('spacingPageTitle()', () => {
    test('should process page title', async ({ page }) => {
      await page.evaluate(() => {
        document.title = "Mr.龍島主道：「Let's Party!各位高明博雅君子！」";
        pangu.spacingPageTitle();
      });

      const title = await page.title();
      expect(title).toBe("Mr. 龍島主道：「Let's Party! 各位高明博雅君子！」");
    });
  });

  test.describe('spacingPageBody()', () => {
    test('should process page body', async ({ page }) => {
      const htmlContent = loadFixture('body.html');
      const expected = loadFixture('body_expected.html').trim();

      await page.setContent(htmlContent);

      await page.evaluate(() => {
        pangu.spacingPageBody();
      });

      const actual = await page.evaluate(() => document.body.innerHTML.trim());

      expect(actual).toBe(expected);
    });
  });

  test.describe('spacingPage()', () => {
    test('should process entire page (title and body)', async ({ page }) => {
      const htmlContent = loadFixture('body.html');
      const expected = loadFixture('body_expected.html').trim();

      await page.setContent(htmlContent);
      await page.evaluate(() => {
        document.title = '花學姊的梅杜莎';
        pangu.spacingPage();
      });

      const title = await page.title();
      expect(title).toBe('花學姊的梅杜莎');

      const actual = await page.evaluate(() => document.body.innerHTML.trim());

      expect(actual).toBe(expected);
    });

    test('should not process contenteditable elements', async ({ page }) => {
      await page.setContent('<div contenteditable="true">abc漢字1</div>');

      await page.evaluate(() => {
        pangu.spacingPageBody();
      });

      const content = await page.content();
      expect(content).toContain('<div contenteditable="true">abc漢字1</div>');
    });

    test('should not add spaces to input field values', async ({ page }) => {
      const htmlContent = loadFixture('input_fields.html');
      
      await page.setContent(htmlContent);
      
      await page.evaluate(() => {
        pangu.spacingPage();
      });
      
      // Check that input values are unchanged
      const textInput = await page.inputValue('#text-input');
      const emailInput = await page.inputValue('#email-input');
      const passwordInput = await page.inputValue('#password-input');
      const textarea = await page.inputValue('#textarea');
      
      // Input fields should not be modified
      expect(textInput).toBe('測試test123');
      expect(emailInput).toBe('user@example中文.com');
      expect(passwordInput).toBe('密碼password123');
      
      // Textarea was already in ignoredTags, so it should also not be modified
      expect(textarea).toBe('測試test123');
    });
    
    test('should still add spaces to text outside input fields', async ({ page }) => {
      const htmlContent = loadFixture('input_fields_mixed.html');
      const expected = loadFixture('input_fields_mixed_expected.html').trim();
      
      await page.setContent(htmlContent);
      
      await page.evaluate(() => {
        pangu.spacingPage();
      });
      
      const actual = await page.evaluate(() => document.body.innerHTML.trim());
      
      expect(actual).toBe(expected);
      
      // Also verify input value remains unchanged
      const inputValue = await page.inputValue('#input');
      expect(inputValue).toBe('測試text123');
    });
  });

  test.describe('autoSpacingPage()', () => {
    test('should handle dynamic content with MutationObserver', async ({ page }) => {
      await page.evaluate(() => {
        pangu.autoSpacingPage({});
      });

      await page.waitForTimeout(50);

      const result = await page.evaluate(async () => {
        const div = document.createElement('div');
        div.textContent = '新八的構造成分有95%是眼鏡';
        div.id = 'test-div';
        document.body.appendChild(div);

        await new Promise((resolve) => setTimeout(resolve, 600));

        return document.getElementById('test-div')?.textContent;
      });

      expect(result).toBe('新八的構造成分有 95% 是眼鏡');
    });
  });

  test.describe('CJK Detection', () => {
    // Note: These tests use page.setContent() which replaces the entire page,
    // removing the pangu.js loaded in beforeEach, so we need to reload it

    test('should skip pages without CJK content', async ({ page }) => {
      const htmlContent = loadFixture('cjk_detection_english_only.html');
      await page.setContent(htmlContent);
      await page.addScriptTag({ path: 'dist/browser/pangu.umd.js' });

      const consoleMessages: string[] = [];
      page.on('console', (msg) => {
        consoleMessages.push(msg.text());
      });

      await page.evaluate(() => {
        window.pangu.smartAutoSpacingPage();
      });

      await page.waitForTimeout(100);

      expect(consoleMessages).toContain('No CJK content detected, setting up observer');
    });

    test('should process pages with CJK content', async ({ page }) => {
      const htmlContent = loadFixture('cjk_detection_with_cjk.html');
      await page.setContent(htmlContent);
      await page.addScriptTag({ path: 'dist/browser/pangu.umd.js' });

      const consoleMessages: string[] = [];
      page.on('console', (msg) => {
        consoleMessages.push(msg.text());
      });

      await page.evaluate(() => {
        window.pangu.smartAutoSpacingPage();
      });

      await page.waitForTimeout(1500);

      expect(consoleMessages).not.toContain('No CJK content detected, setting up observer');

      const text = await page.textContent('#test');
      expect(text).toBe('新八的構造成分有 95% 是眼鏡、3% 是水、2% 是垃圾');
    });

    test('should detect CJK in page title', async ({ page }) => {
      const htmlContent = loadFixture('cjk_detection_title_only.html');
      await page.setContent(htmlContent);
      await page.addScriptTag({ path: 'dist/browser/pangu.umd.js' });

      const hasCjk = await page.evaluate(() => {
        return window.pangu.hasCjk();
      });

      expect(hasCjk).toBe(true);
    });

    test('should detect dynamically added CJK content', async ({ page }) => {
      const htmlContent = loadFixture('cjk_detection_dynamic_initial.html');
      await page.setContent(htmlContent);
      await page.addScriptTag({ path: 'dist/browser/pangu.umd.js' });

      await page.evaluate(() => {
        window.pangu.smartAutoSpacingPage();
      });

      await page.waitForTimeout(100);

      await page.evaluate(() => {
        const div = document.getElementById('content');
        if (div) {
          div.innerHTML = '動態新增的中文內容with English';
        }
      });

      await page.waitForTimeout(800);

      const text = await page.textContent('#content');
      expect(text).toBe('動態新增的中文內容 with English');
    });
  });
});
