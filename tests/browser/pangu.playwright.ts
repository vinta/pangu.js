/**
 * Browser API Tests using Playwright
 * 
 * These tests run in real browsers (Chromium, Firefox, WebKit) for accurate browser testing.
 * They replace the jsdom-based tests which had limitations with browser-specific features.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
// Import the UMD types for window.pangu global
import '../../dist/browser/pangu.umd';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to load fixture HTML files
function loadFixture(filename: string): string {
  const fixturePath = path.join(__dirname, '../_fixtures', filename);
  return fs.readFileSync(fixturePath, 'utf8');
}

test.describe('BrowserPangu', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a blank page with pangu.js loaded
    await page.goto('about:blank');
    
    // Load pangu.js into the page
    const panguScript = fs.readFileSync(
      path.join(__dirname, '../../dist/browser/pangu.umd.js'),
      'utf8'
    );
    await page.addScriptTag({ content: panguScript });
    
    // Wait for pangu to be available
    await page.waitForFunction(() => typeof window.pangu !== 'undefined');
    
  });

  test.describe('spacing()', () => {
    test('處理 text', async ({ page }) => {
      const result = await page.evaluate(() => {
        return window.pangu.spacing('新八的構造成分有95%是眼鏡、3%是水、2%是垃圾');
      });
      
      expect(result).toBe('新八的構造成分有 95% 是眼鏡、3% 是水、2% 是垃圾');
    });
  });


  test.describe('spacingNode()', () => {
    test('處理 text node', async ({ page }) => {
      const result = await page.evaluate(() => {
        const textNode = document.createTextNode('早安！こんにちは！안녕하세요!');
        document.body.appendChild(textNode);
        
        window.pangu.spacingNode(textNode);
        
        return textNode.textContent;
      });
      
      expect(result).toBe('早安！こんにちは！안녕하세요!');
    });

    test('處理 element node', async ({ page }) => {
      const result = await page.evaluate(() => {
        const div = document.createElement('div');
        div.textContent = '新八的構造成分有95%是眼鏡、3%是水、2%是垃圾';
        document.body.appendChild(div);
        
        window.pangu.spacingNode(div);
        
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
        window.pangu.spacingElementById('e1');
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
        window.pangu.spacingElementByClassName('e2');
      });
      
      const actual = await page.evaluate(() => document.body.innerHTML.trim());
      
      expect(actual).toBe(expected);
    });

    test('處理 #className 之二', async ({ page }) => {
      const htmlContent = loadFixture('class_name_2.html');
      const expected = loadFixture('class_name_2_expected.html').trim();
      
      await page.setContent(htmlContent);
      
      await page.evaluate(() => {
        window.pangu.spacingElementByClassName('e4');
      });
      
      const actual = await page.evaluate(() => document.body.innerHTML.trim());
      
      expect(actual).toBe(expected);
    });

    test('處理 #className 之三', async ({ page }) => {
      const htmlContent = loadFixture('class_name_3.html');
      const expected = loadFixture('class_name_3_expected.html').trim();
      
      await page.setContent(htmlContent);
      
      await page.evaluate(() => {
        window.pangu.spacingElementByClassName('e5');
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
        window.pangu.spacingElementByTagName('article');
      });
      
      const actual = await page.evaluate(() => document.body.innerHTML.trim());
      
      expect(actual).toBe(expected);
    });
  });

  test.describe('spacingPageTitle()', () => {
    test('處理 <title>', async ({ page }) => {
      await page.evaluate(() => {
        document.title = "Mr.龍島主道：「Let's Party!各位高明博雅君子！」";
        window.pangu.spacingPageTitle();
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
        window.pangu.spacingPageBody();
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
        window.pangu.spacingPage();
      });
      
      const title = await page.title();
      expect(title).toBe('花學姊的梅杜莎');
      
      const actual = await page.evaluate(() => document.body.innerHTML.trim());
      
      expect(actual).toBe(expected);
    });
    
    test('should not process contenteditable elements', async ({ page }) => {
      await page.setContent('<div contenteditable="true">abc漢字1</div>');
      
      await page.evaluate(() => {
        window.pangu.spacingPageBody();
      });
      
      const content = await page.content();
      expect(content).toContain('<div contenteditable="true">abc漢字1</div>');
    });
  });

  test.describe('autoSpacingPage()', () => {
    test('handles dynamic content with MutationObserver', async ({ page }) => {
      // Start auto spacing
      await page.evaluate(() => {
        window.pangu.autoSpacingPage();
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
        await new Promise(resolve => setTimeout(resolve, 600));
        
        return document.getElementById('test-div')?.textContent;
      });
      
      expect(result).toBe('新八的構造成分有 95% 是眼鏡');
    });
  });
});

// Type declaration is now in global.d.ts