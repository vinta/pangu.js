// Test the browser builds the way verify-browser.html loads them: the UMD file through a <script> tag and the ESM file through a module import, both served from node_modules over HTTP
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { join } = require('node:path');

const { chromium } = require('playwright');

const PAGE_URL = 'http://localhost:8080/';

function startServer() {
  const server = spawn(process.execPath, [join(__dirname, 'server.js')], { stdio: ['ignore', 'pipe', 'inherit'] });
  return new Promise((resolve) => {
    server.stdout.on('data', () => resolve(server));
  });
}

(async () => {
  console.log('=== Testing Browser Builds ===\n');

  const server = await startServer();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const problems = [];
    page.on('pageerror', (error) => problems.push(String(error)));
    page.on('console', (message) => {
      if (message.type() === 'error') {
        problems.push(message.text());
      }
    });
    page.on('requestfailed', (request) => problems.push(`request failed: ${request.url()}`));
    page.on('response', (response) => {
      if (response.status() >= 400) {
        problems.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.goto(PAGE_URL, { waitUntil: 'networkidle' });

    // spaceNode() and autoSpacePage() schedule their DOM writes, so wait for the text instead of reading it right after the click
    const expectText = (selector, text) => page.waitForFunction(([s, t]) => document.querySelector(s).textContent === t, [selector, text], { timeout: 5000 });
    const runButton = (heading) => page.locator('.example', { hasText: heading }).getByRole('button');

    await runButton('UMD Version').click();
    await expectText('#demo1', '測試文字：當你凝視著 bug，bug 也凝視著你');
    console.log('UMD <script> tag: spaceNode() works');

    await runButton('ESM Version').click();
    await expectText('#demo2', '另一個測試：使用 JavaScript 開發 Web 應用程式');
    console.log('ESM module import: spaceText() works');

    await runButton('Auto-spacing Entire Page').click();
    await page.waitForFunction(() => document.body.innerText.includes('這段文字包含 English 和中文 mixed 在一起'), null, { timeout: 5000 });
    console.log('autoSpacePage() works');

    assert.deepEqual(problems, []);
    console.log('No page errors, console errors, or failed requests');

    console.log('\nBrowser builds working correctly!');
  } finally {
    await browser.close();
    server.kill();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
