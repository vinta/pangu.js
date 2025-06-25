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

// Helper function to load fixture HTML files
function loadFixture(filename: string): string {
  const fixturePath = join(__dirname, '../_fixtures', filename);
  return readFileSync(fixturePath, 'utf8');
}

test.describe('BrowserPangu', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a blank page with pangu.js loaded
    await page.goto('about:blank');

    // Load pangu.js into the page
    const panguScript = readFileSync(join(__dirname, '../../dist/browser/pangu.umd.js'), 'utf8');
    await page.addScriptTag({ content: panguScript });

    // Wait for pangu to be available
    await page.waitForFunction(() => typeof window.pangu !== 'undefined');
  });

  test.describe('spacing()', () => {
    test('處理 text', async ({ page }) => {
      const result = await page.evaluate(() => {
        return pangu.spacing('新八的構造成分有95%是眼鏡、3%是水、2%是垃圾');
      });

      expect(result).toBe('新八的構造成分有 95% 是眼鏡、3% 是水、2% 是垃圾');
    });
  });

  test.describe('spacingNode()', () => {
    test('處理 text node', async ({ page }) => {
      const result = await page.evaluate(() => {
        const textNode = document.createTextNode('早安！こんにちは！안녕하세요!');
        document.body.appendChild(textNode);

        pangu.spacingNode(textNode);

        return textNode.textContent;
      });

      expect(result).toBe('早安！こんにちは！안녕하세요!');
    });

    test('處理 element node', async ({ page }) => {
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
    test('處理 #idName', async ({ page }) => {
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
    test('處理 #className 之一', async ({ page }) => {
      const htmlContent = loadFixture('class_name_1.html');
      const expected = loadFixture('class_name_1_expected.html').trim();

      await page.setContent(htmlContent);

      await page.evaluate(() => {
        pangu.spacingElementByClassName('e2');
      });

      const actual = await page.evaluate(() => document.body.innerHTML.trim());

      expect(actual).toBe(expected);
    });

    test('處理 #className 之二', async ({ page }) => {
      const htmlContent = loadFixture('class_name_2.html');
      const expected = loadFixture('class_name_2_expected.html').trim();

      await page.setContent(htmlContent);

      await page.evaluate(() => {
        pangu.spacingElementByClassName('e4');
      });

      const actual = await page.evaluate(() => document.body.innerHTML.trim());

      expect(actual).toBe(expected);
    });

    test('處理 #className 之三', async ({ page }) => {
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
    test('處理 <tag>', async ({ page }) => {
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
    test('處理 <title>', async ({ page }) => {
      await page.evaluate(() => {
        document.title = "Mr.龍島主道：「Let's Party!各位高明博雅君子！」";
        pangu.spacingPageTitle();
      });

      const title = await page.title();
      expect(title).toBe("Mr. 龍島主道：「Let's Party! 各位高明博雅君子！」");
    });
  });

  test.describe('spacingPageBody()', () => {
    test('處理 <body>', async ({ page }) => {
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
    test('處理 <body>', async ({ page }) => {
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
  });

  test.describe('autoSpacingPage()', () => {
    test('handles dynamic content with MutationObserver', async ({ page }) => {
      // Start auto spacing
      await page.evaluate(() => {
        pangu.autoSpacingPage({});
      });

      // Wait a bit for MutationObserver to be set up
      await page.waitForTimeout(50);

      // Add some content dynamically and wait for it to be processed
      const result = await page.evaluate(async () => {
        const div = document.createElement('div');
        div.textContent = '新八的構造成分有95%是眼鏡';
        div.id = 'test-div';
        document.body.appendChild(div);

        // Wait for MutationObserver to process (default nodeDelay is 500ms)
        await new Promise((resolve) => setTimeout(resolve, 600));

        return document.getElementById('test-div')?.textContent;
      });

      expect(result).toBe('新八的構造成分有 95% 是眼鏡');
    });
  });

  test.describe('CJK Detection', () => {
    test('should skip pages without CJK content', async ({ page }) => {
      // Create a page with only English content
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>English Only Page</title>
        </head>
        <body>
          <p>This is a page with only English content.</p>
          <p>No Chinese, Japanese, or Korean characters here.</p>
        </body>
        </html>
      `);

      // Add pangu.js
      await page.addScriptTag({ path: 'dist/browser/pangu.umd.js' });

      // Listen for console messages
      const consoleMessages: string[] = [];
      page.on('console', (msg) => {
        if (msg.text().includes('pangu.js:')) {
          consoleMessages.push(msg.text());
        }
      });

      // Run smartAutoSpacingPage
      await page.evaluate(() => {
        window.pangu.smartAutoSpacingPage();
      });

      // Wait a bit for any console messages
      await page.waitForTimeout(100);

      // Check that the appropriate message was logged
      expect(consoleMessages).toContain('pangu.js: No CJK content detected, setting up observer');
    });

    test('should process pages with CJK content', async ({ page }) => {
      // Create a page with CJK content
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Page with CJK</title>
        </head>
        <body>
          <p id="test">新八的構造成分有95%是眼鏡、3%是水、2%是垃圾</p>
        </body>
        </html>
      `);

      // Add pangu.js
      await page.addScriptTag({ path: 'dist/browser/pangu.umd.js' });

      // Listen for console messages
      const consoleMessages: string[] = [];
      page.on('console', (msg) => {
        if (msg.text().includes('pangu.js:')) {
          consoleMessages.push(msg.text());
        }
      });

      // Run smartAutoSpacingPage
      await page.evaluate(() => {
        window.pangu.smartAutoSpacingPage();
      });

      // Wait for spacing to complete
      await page.waitForTimeout(1500);

      // Check that no "skipping" message was logged
      expect(consoleMessages).not.toContain('pangu.js: No CJK content detected, setting up observer');

      // Verify spacing was applied
      const text = await page.textContent('#test');
      expect(text).toBe('新八的構造成分有 95% 是眼鏡、3% 是水、2% 是垃圾');
    });

    test('should detect CJK in page title', async ({ page }) => {
      // Create a page with CJK only in title
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>中文標題</title>
        </head>
        <body>
          <p>English content only in body</p>
        </body>
        </html>
      `);

      // Add pangu.js
      await page.addScriptTag({ path: 'dist/browser/pangu.umd.js' });

      // Check hasCjk returns true
      const hasCjk = await page.evaluate(() => {
        return window.pangu.hasCjk();
      });

      expect(hasCjk).toBe(true);
    });

    test('should detect dynamically added CJK content', async ({ page }) => {
      // Create a page without CJK content initially
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Dynamic Content Test</title>
        </head>
        <body>
          <div id="content">English content</div>
        </body>
        </html>
      `);

      // Add pangu.js
      await page.addScriptTag({ path: 'dist/browser/pangu.umd.js' });

      // Listen for console messages
      const consoleMessages: string[] = [];
      page.on('console', (msg) => {
        if (msg.text().includes('pangu.js:')) {
          consoleMessages.push(msg.text());
        }
      });

      // Run smartAutoSpacingPage
      await page.evaluate(() => {
        window.pangu.smartAutoSpacingPage();
      });

      // Wait a bit
      await page.waitForTimeout(100);

      // Should skip initially
      expect(consoleMessages).toContain('pangu.js: No CJK content detected, setting up observer');

      // Now add CJK content dynamically
      await page.evaluate(() => {
        const div = document.getElementById('content');
        if (div) {
          div.innerHTML = '動態新增的中文內容with English';
        }
      });

      // Wait for observer to detect the change and spacing to complete
      await page.waitForTimeout(800);

      // Check that CJK was detected and spacing started
      expect(consoleMessages).toContain('pangu.js: CJK content detected, starting auto spacing');

      // Verify spacing was applied
      const text = await page.textContent('#content');
      expect(text).toBe('動態新增的中文內容 with English');
    });
  });
});
