import { test, expect } from '@playwright/test';

test.describe('URLPattern', () => {
  test.beforeEach(async ({ browserName }) => {
    test.skip(browserName !== 'chromium', 'Only test URLPattern in Chrome');
  });

  test('handle various URLPattern scenarios', async ({ page }) => {
    const testResults = await page.evaluate(() => {
      const results: { pattern: string; url: string; expected: boolean; actual: boolean }[] = [];

      function testPattern(pattern: string, url: string, expected: boolean) {
        const p = new URLPattern(pattern);
        const actual = p.test(url);
        results.push({ pattern, url, expected, actual });
      }
      testPattern('*://example.com/*', 'https://example.com/about', true);
      testPattern('*://example.com/*', 'http://example.com/contact', true);
      testPattern('*://example.com/*', 'https://api.example.com/v2/data', false);

      // NOTE: This is a difference:
      // In URLPattern, *:// matches everything
      // In Chrome Extension Match Pattern, *:// matches only http or https
      // https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns
      testPattern('*://example.com/*', 'ftp://example.com/files', true);

      testPattern('*://*.example.com/*', 'https://example.com/', false);
      testPattern('*://*.example.com/*', 'https://www.example.com/products', true);
      testPattern('*://*.example.com/*', 'http://blog.example.com/posts/2024', true);
      testPattern('*://*.example.com/*', 'https://api.example.com/v1/users', true);
      testPattern('*://*.example.com/*', 'https://staging.api.example.com/health', true);

      testPattern('https://*.google.com/foo*bar', 'https://example.com/', false);
      testPattern('https://*.google.com/foo*bar', 'https://mail.google.com/foo/inbox/bar', true);
      testPattern('https://*.google.com/foo*bar', 'https://docs.google.com/foobar', true);
      testPattern('https://*.google.com/foo*bar', 'https://google.com/foobar', false);
      testPattern('https://*.google.com/foo*bar', 'http://drive.google.com/foobar', false);

      testPattern('file:///*', 'file:///Users/john/Documents/report.pdf', true);
      testPattern('file:///*', 'file:///C:/Windows/System32/drivers/etc/hosts', true);
      testPattern('file:///*', 'file://localhost/Users/shared/config.json', false);

      return results;
    });

    for (const result of testResults) {
      expect(result.actual, `Pattern "${result.pattern}" testing URL "${result.url}"`).toBe(result.expected);
    }
  });
});
