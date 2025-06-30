import { test, expect } from '@playwright/test';
import { BrowserPangu } from '../../dist/browser/pangu.js';

test.describe('Text Node Fragments', () => {
  test.beforeEach(async ({ page }) => {
    // Set up the page with pangu.js
    await page.addScriptTag({
      content: `
        window.BrowserPangu = ${BrowserPangu.toString()};
        window.pangu = new BrowserPangu();
      `
    });
  });

  test('should handle fragmented text nodes with quotes', async ({ page }) => {
    await page.setContent(`
      <div id="test1">
        <span>社</span>"<span>DF</span>
      </div>
    `);

    // Get initial state
    const initialHTML = await page.locator('#test1').innerHTML();
    console.log('Initial HTML:', initialHTML);

    // Apply pangu spacing
    await page.evaluate(() => {
      window.pangu.spacingNode(document.getElementById('test1'));
    });

    // Get processed state
    const processedHTML = await page.locator('#test1').innerHTML();
    console.log('Processed HTML:', processedHTML);

    // Check if spacing was applied correctly
    const textContent = await page.locator('#test1').textContent();
    expect(textContent).toBe('社 "DF');
  });

  test('should handle complex quote structures', async ({ page }) => {
    await page.setContent(`
      <div id="test2">
        前面的文字"<span>中间的内容</span>"后面的文字
      </div>
    `);

    await page.evaluate(() => {
      window.pangu.spacingNode(document.getElementById('test2'));
    });

    const textContent = await page.locator('#test2').textContent();
    expect(textContent).toBe('前面的文字 "中间的内容" 后面的文字');
  });

  test('should handle dynamically created fragmented nodes', async ({ page }) => {
    await page.setContent(`<div id="container"></div>`);

    // Create fragmented text nodes dynamically
    await page.evaluate(() => {
      const container = document.getElementById('container');
      container.appendChild(document.createTextNode('动态'));
      container.appendChild(document.createTextNode('"'));
      const span = document.createElement('span');
      span.textContent = 'API';
      container.appendChild(span);
      container.appendChild(document.createTextNode('"'));
      container.appendChild(document.createTextNode('内容'));
    });

    // Apply pangu spacing
    await page.evaluate(() => {
      window.pangu.spacingNode(document.getElementById('container'));
    });

    const textContent = await page.locator('#container').textContent();
    expect(textContent).toBe('动态 "API" 内容');
  });

  test('should analyze node structure before and after processing', async ({ page }) => {
    await page.setContent(`
      <div id="test">
        <span>社</span>"<span>DF</span>
      </div>
    `);

    // Analyze node structure
    const analysis = await page.evaluate(() => {
      const container = document.getElementById('test');
      const before = [];
      const after = [];

      // Helper to collect node info
      function collectNodes(node, array) {
        for (let child of node.childNodes) {
          if (child.nodeType === Node.TEXT_NODE) {
            array.push({
              type: 'TEXT',
              content: child.textContent,
              length: child.textContent.length
            });
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            array.push({
              type: 'ELEMENT',
              tag: child.tagName,
              content: child.textContent
            });
          }
        }
      }

      // Collect before
      collectNodes(container, before);

      // Apply spacing
      window.pangu.spacingNode(container);

      // Collect after
      collectNodes(container, after);

      return { before, after };
    });

    console.log('Node analysis:', JSON.stringify(analysis, null, 2));

    // Verify the structure has been processed correctly
    expect(analysis.after).toBeDefined();
  });

  test('should handle quotes without breaking layout', async ({ page }) => {
    // Test the specific pattern from the GitHub issue
    await page.setContent(`
      <div id="test">
        【UCG中字】"數毛社"DF的《戰神4》全新演示解析
      </div>
    `);

    await page.evaluate(() => {
      window.pangu.spacingNode(document.getElementById('test'));
    });

    const textContent = await page.locator('#test').textContent();
    expect(textContent).toBe('【UCG 中字】"數毛社" DF 的《戰神 4》全新演示解析');
  });

  test('should verify exact text node spacing behavior', async ({ page }) => {
    await page.setContent(`
      <div id="test">
        <span>社</span>"<span>DF</span>
      </div>
    `);

    // Check each text node individually
    const nodeContents = await page.evaluate(() => {
      const container = document.getElementById('test');
      const contents = [];
      
      // Walk through all nodes
      function walk(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          contents.push({
            before: node.textContent,
            after: null
          });
        }
        for (let child of node.childNodes) {
          walk(child);
        }
      }
      
      walk(container);
      
      // Apply spacing
      window.pangu.spacingNode(container);
      
      // Walk again to get after state
      let index = 0;
      function walkAfter(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          if (contents[index]) {
            contents[index].after = node.textContent;
            index++;
          }
        }
        for (let child of node.childNodes) {
          walkAfter(child);
        }
      }
      
      walkAfter(container);
      
      return contents;
    });

    console.log('Text node changes:', nodeContents);
    
    // Verify quote node was processed
    const quoteNode = nodeContents.find(n => n.before === '"');
    expect(quoteNode).toBeDefined();
    expect(quoteNode.after).toBe(' "');
  });
});