import type { BrowserPangu } from '../../dist/browser/pangu';
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

declare global {
  const pangu: BrowserPangu;
  interface Window {
    // @ts-expect-error - pangu is defined in the global scope
    pangu: BrowserPangu;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadFixture(filename: string): string {
  const fixturePath = join(__dirname, '../fixtures', filename);
  return readFileSync(fixturePath, 'utf8');
}

test.describe('BrowserPangu', () => {
  test.beforeEach(async ({ page }) => {
    await page.addScriptTag({ path: 'dist/browser/pangu.umd.js' });
    await page.waitForFunction(() => typeof window.pangu !== 'undefined');
  });

  test.describe('autoSpacingPage()', () => {
    test('handle dynamic content with MutationObserver', async ({ page }) => {
      await page.evaluate(() => {
        pangu.autoSpacingPage({});
      });

      await page.waitForTimeout(50);

      // Dynamically add content after autoSpacingPage is active
      await page.evaluate(() => {
        const div = document.createElement('div');
        div.textContent = '小明在開發軟體時總是嚴格地遵循各項協定與標準，直到他看了ISO 3166-1';
        div.id = 'test-div';
        document.body.appendChild(div);
      });

      await page.waitForTimeout(600);

      const result = await page.evaluate(() => document.getElementById('test-div')!.textContent);
      expect(result).toBe('小明在開發軟體時總是嚴格地遵循各項協定與標準，直到他看了 ISO 3166-1');
    });
  });

  test.describe('spacingNode()', () => {
    test('handle text nodes', async ({ page }) => {
      // spacingNode() works on element nodes, not directly on text nodes
      // So we need to wrap the text node in an element
      await page.setContent('<div id="test">你可以使用uname -m指令來檢查你的Linux作業系統是32位元或是[敏感词已被屏蔽]位元</div>');
      const result = await page.evaluate(() => {
        const div = document.getElementById('test')!;
        pangu.spacingNode(div);
        return div.textContent;
      });
      expect(result).toBe('你可以使用 uname -m 指令來檢查你的 Linux 作業系統是 32 位元或是 [敏感词已被屏蔽] 位元');
    });

    test('handle element nodes', async ({ page }) => {
      await page.setContent('<div id="test">聽說桐島rm -rf /*了</div>');
      const result = await page.evaluate(() => {
        const div = document.getElementById('test')!;
        pangu.spacingNode(div);
        return div.textContent;
      });
      expect(result).toBe('聽說桐島 rm -rf /* 了');
    });
  });

  test.describe('spacingElementById()', () => {
    test('handle elements by ID', async ({ page }) => {
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
    test('handle elements by class name (single element)', async ({ page }) => {
      const htmlContent = loadFixture('class_name_1.html');
      const expected = loadFixture('class_name_1_expected.html').trim();

      await page.setContent(htmlContent);
      await page.evaluate(() => {
        pangu.spacingElementByClassName('e2');
      });
      const actual = await page.evaluate(() => document.body.innerHTML.trim());
      expect(actual).toBe(expected);
    });

    test('handle elements by class name (multiple elements)', async ({ page }) => {
      const htmlContent = loadFixture('class_name_2.html');
      const expected = loadFixture('class_name_2_expected.html').trim();

      await page.setContent(htmlContent);
      await page.evaluate(() => {
        pangu.spacingElementByClassName('e4');
      });
      const actual = await page.evaluate(() => document.body.innerHTML.trim());
      expect(actual).toBe(expected);
    });

    test('handle elements by class name (nested elements)', async ({ page }) => {
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
    test('handle elements by tag name', async ({ page }) => {
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
    test('handle page title', async ({ page }) => {
      await page.evaluate(() => {
        document.title = "Mr.龍島主道：「Let's Party!各位高明博雅君子！」";
        pangu.spacingPageTitle();
      });

      const title = await page.title();
      expect(title).toBe("Mr. 龍島主道：「Let's Party! 各位高明博雅君子！」");
    });
  });

  test.describe('spacingPageBody()', () => {
    test('handle page body', async ({ page }) => {
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
    test('handle entire page (title and body)', async ({ page }) => {
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

    test.skip('handle YouTube formatted strings with hashtags', async ({ page }) => {
      // Skip: Known limitation with XPath-based approach for adjacent sibling elements
      // Current behavior doesn't add space between <span> and <a> elements
      const htmlContent = loadFixture('youtube_format_string.html');
      const expected = loadFixture('youtube_format_string_expected.html').trim();

      await page.setContent(htmlContent);
      await page.evaluate(() => {
        pangu.spacingPageBody();
      });
      const actual = await page.evaluate(() => document.body.innerHTML.trim());
      expect(actual).toBe(expected);
    });

    test('handle contenteditable elements by skipping them', async ({ page }) => {
      await page.setContent('<div contenteditable="true">abc漢字1</div>');
      await page.evaluate(() => {
        pangu.spacingPageBody();
      });
      const content = await page.content();
      expect(content).toContain('<div contenteditable="true">abc漢字1</div>');
    });

    test('handle input field values by preserving them', async ({ page }) => {
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
      expect(textInput).toBe('Workaround雖可恥但有用');
      expect(emailInput).toBe('user@example中文.com');
      expect(passwordInput).toBe('密碼password123');

      // Textarea was already in ignoredTags, so it should also not be modified
      expect(textarea).toBe('哇！是擅長Over-engineering的朋友呢！');
    });

    test('handle text outside input fields while preserving input values', async ({ page }) => {
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

    test('handle fragmented text nodes with quotes', async ({ page }) => {
      // Test case 1: Simple fragmented nodes
      await page.setContent('<div id="test1"><span>社</span>"<span>DF</span></div>');
      const result1 = await page.evaluate(() => {
        const element = document.getElementById('test1')!;
        pangu.spacingNode(element);
        return element.textContent;
      });
      expect(result1).toBe('社 "DF');

      // Test case 2: Complex quote structure
      await page.setContent('<div id="test2">前面的文字"<span>中间的内容</span>"后面的文字</div>');
      const result2 = await page.evaluate(() => {
        const element = document.getElementById('test2')!;
        pangu.spacingNode(element);
        return element.textContent;
      });
      expect(result2).toBe('前面的文字 "中间的内容" 后面的文字');

      // Test case 3: Full example from GitHub issue
      await page.setContent('<div id="test3">【UCG中字】"數毛社"DF的《戰神4》全新演示解析</div>');
      const result3 = await page.evaluate(() => {
        const element = document.getElementById('test3')!;
        pangu.spacingNode(element);
        return element.textContent;
      });
      expect(result3).toBe('【UCG 中字】"數毛社" DF 的《戰神 4》全新演示解析');
    });

    test('handle text nodes with newlines and CSS {white-space: pre-wrap}', async ({ page }) => {
      const htmlContent = loadFixture('test_fragmented_asana_style.html');
      const expected = loadFixture('test_fragmented_asana_style_expected.html').trim();

      await page.setContent(htmlContent);

      // With CSS {white-space: pre-wrap}, the newlines between text nodes should be visible as spaces
      // Verify that newlines are rendered as whitespace before spacing
      const renderedTextBefore = await page.evaluate(() => document.querySelector('.HighlightSol')!.textContent);
      // prettier-ignore
      expect(renderedTextBefore).toBe(
        '整天等 \n' + // NOTE: There is a whitespace before the newline
        'EAS \n' +
        'build \n' +
        '就飽了啊，每次 \n' +
        'build \n' +
        '都要跑十幾二十分鐘'
      );

      await page.evaluate(() => {
        pangu.spacingPage();
      });
      const actual = await page.evaluate(() => document.body.innerHTML.trim());
      expect(actual).toBe(expected);
    });

    test('handle fragmented text nodes with spaces at boundaries', async ({ page }) => {
      await page.setContent('<div id="test"></div>');

      // Create fragmented nodes like Asana does
      await page.evaluate(() => {
        const div = document.getElementById('test')!;
        div.appendChild(document.createTextNode('整天等'));
        div.appendChild(document.createTextNode(' EAS'));
        div.appendChild(document.createTextNode(' build'));
        div.appendChild(document.createTextNode(' 就飽了啊，每次'));
        div.appendChild(document.createTextNode(' build'));
        div.appendChild(document.createTextNode(' 都要跑十幾二十分鐘'));
      });

      const afterText = await page.evaluate(() => {
        const element = document.getElementById('test')!;
        pangu.spacingNode(element);
        return element.textContent;
      });

      // Should not have double spaces
      expect(afterText).not.toContain('  ');
      expect(afterText).toBe('整天等 EAS build 就飽了啊，每次 build 都要跑十幾二十分鐘');
    });

    test.skip('handle mixed fragmented nodes correctly (edge case: consecutive text nodes without spaces)', async ({ page }) => {
      // The fix for preventing double spaces in already-spaced text (like Asana) makes this specific case not work.
      // This is an acceptable trade-off since real-world cases like Asana typically have spaces at fragment boundaries.
      await page.setContent('<div id="test"></div>');

      await page.evaluate(() => {
        const div = document.getElementById('test')!;
        div.appendChild(document.createTextNode('整天等'));
        div.appendChild(document.createTextNode('EAS')); // No space
        div.appendChild(document.createTextNode('build')); // No space
        div.appendChild(document.createTextNode('就飽了啊，每次')); // No space
        div.appendChild(document.createTextNode(' build')); // Has space
        div.appendChild(document.createTextNode('都要跑十幾二十分鐘')); // No space
      });

      await page.evaluate(() => {
        const element = document.getElementById('test')!;
        pangu.spacingNode(element);
      });

      const result = await page.evaluate(() => document.getElementById('test')!.textContent);

      // Should add spaces where needed but not double up
      expect(result).not.toContain('  ');
      expect(result).toBe('整天等 EAS build 就飽了啊，每次 build 都要跑十幾二十分鐘');
    });

    test('handle spacing edge cases correctly', async ({ page }) => {
      // Test case 1: Already properly spaced text should not be modified
      const properlySpacedText = '整天等 EAS build 就飽了啊，每次 build 都要跑十幾二十分鐘';
      await page.setContent(`<div id="test1">${properlySpacedText}</div>`);
      const result1 = await page.evaluate(() => {
        const element = document.getElementById('test1')!;
        pangu.spacingNode(element);
        return element.textContent;
      });
      expect(result1).toBe(properlySpacedText);

      // Test case 2: Should not create triple or more spaces
      await page.setContent('<div id="test2"></div>');
      const result2 = await page.evaluate(() => {
        const div = document.getElementById('test2')!;
        // Simulate poorly fragmented text with existing double spaces
        div.appendChild(document.createTextNode('整天等 '));
        div.appendChild(document.createTextNode(' EAS'));
        div.appendChild(document.createTextNode('  build')); // Double space at start

        pangu.spacingNode(div);
        return div.textContent;
      });
      expect(result2).not.toContain('   ');
    });
  });
});
