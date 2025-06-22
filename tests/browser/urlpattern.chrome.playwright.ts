import { test, expect } from '@playwright/test';

test.describe('URLPattern subdomain wildcards (Chrome)', () => {
  test('should handle various URLPattern scenarios', async ({ page, browserName }) => {
    // Only run this test in Chromium
    test.skip(browserName !== 'chromium', 'This test is Chrome-specific');
    // Navigate to a blank page
    await page.goto('about:blank');
    
    // Run tests in browser context where URLPattern is available
    const results = await page.evaluate(() => {
      const tests: Array<{
        name: string;
        cases: Array<{
          url: string;
          expected: boolean;
          actual: boolean;
          reason?: string;
        }>;
      }> = [];
      
      // Test 1: *://*.example.com/*
      const pattern1 = new URLPattern('*://*.example.com/*');
      tests.push({
        name: '*://*.example.com/*',
        cases: [
          { url: 'https://example.com/', expected: false, reason: 'no subdomain' },
          { url: 'https://ddd.example.com/safdadsf', expected: true },
          { url: 'http://ddd.example.com/safdadsf', expected: true },
          { url: 'https://api.example.com/', expected: true },
          { url: 'https://sub.sub.example.com/path', expected: true },
        ].map(test => ({
          ...test,
          actual: pattern1.test(test.url)
        }))
      });
      
      // Test 2: https://*.google.com/foo*bar
      const pattern2 = new URLPattern('https://*.google.com/foo*bar');
      tests.push({
        name: 'https://*.google.com/foo*bar',
        cases: [
          { url: 'https://example.com/', expected: false, reason: 'wrong domain' },
          { url: 'https://api.google.com/foo/sadfasdfdf/bar', expected: true },
          { url: 'https://api.google.com/foobar', expected: true },
          { url: 'https://google.com/foobar', expected: false, reason: 'no subdomain' },
          { url: 'http://api.google.com/foobar', expected: false, reason: 'wrong protocol' },
        ].map(test => ({
          ...test,
          actual: pattern2.test(test.url)
        }))
      });
      
      // Test 3: file:///*
      const pattern3 = new URLPattern('file:///*');
      tests.push({
        name: 'file:///*',
        cases: [
          { url: 'file:///Users/test/file.txt', expected: true },
          { url: 'file:///C:/Windows/file.txt', expected: true },
          { url: 'file://localhost/Users/test.txt', expected: false, reason: 'has hostname' },
        ].map(test => ({
          ...test,
          actual: pattern3.test(test.url)
        }))
      });
      
      // Test 4: *://example.com/* (no subdomain wildcard)
      const pattern4 = new URLPattern('*://example.com/*');
      tests.push({
        name: '*://example.com/*',
        cases: [
          { url: 'https://example.com/path', expected: true },
          { url: 'http://example.com/path', expected: true },
          { url: 'https://sub.example.com/path', expected: false, reason: 'has subdomain' },
        ].map(test => ({
          ...test,
          actual: pattern4.test(test.url)
        }))
      });
      
      return tests;
    });
    
    // Verify all test results
    for (const group of results) {
      console.log(`\nTesting pattern: ${group.name}`);
      for (const testCase of group.cases) {
        console.log(`  ${testCase.url} => ${testCase.actual} (expected: ${testCase.expected})${testCase.reason ? ` - ${testCase.reason}` : ''}`);
        expect(testCase.actual).toBe(testCase.expected);
      }
    }
  });
});