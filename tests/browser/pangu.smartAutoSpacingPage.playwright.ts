import { test, expect } from '@playwright/test';

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
