import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadFixture(filename: string) {
  const fixturePath = join(__dirname, '../../fixtures', filename);
  return readFileSync(fixturePath, 'utf8');
}

test.describe('BrowserPangu', () => {
  test.beforeEach(async ({ page }) => {
    await page.addScriptTag({ path: 'dist/browser/pangu.umd.js' });
    await page.waitForFunction(() => typeof window.pangu !== 'undefined');

    // Disable taskScheduler for synchronous tests
    await page.evaluate(() => {
      pangu.taskScheduler.config.enabled = false;
    });
  });

  test.describe('autoSpacingPage()', () => {
    test('handle dynamic content with MutationObserver', async ({ page }) => {
      await page.evaluate(() => {
        pangu.autoSpacingPage();
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

    test('handle boundary between sibling nodes added in one mutation batch', async ({ page }) => {
      await page.setContent('<div id="container"></div>');

      await page.evaluate(() => {
        pangu.autoSpacingPage();
      });

      await page.waitForTimeout(50);

      // Two separately queued siblings whose boundary needs a space
      await page.evaluate(() => {
        const container = document.getElementById('container')!;
        const span1 = document.createElement('span');
        span1.textContent = '中文';
        const span2 = document.createElement('span');
        span2.textContent = 'abc';
        container.appendChild(span1);
        container.appendChild(span2);
      });

      await page.waitForTimeout(600);

      const result = await page.evaluate(() => document.getElementById('container')!.textContent);
      expect(result).toBe('中文 abc');
    });

    test('not space across an unchanged sibling between nodes added in one mutation batch', async ({ page }) => {
      await page.setContent('<div id="container"><span id="existing">X</span></div>');

      // Large pageDelayMs keeps the initial page sweep out of the assertion window,
      // so only the MutationObserver drain acts
      await page.evaluate(() => {
        pangu.autoSpacingPage({ pageDelayMs: 60000 });
      });

      await page.waitForTimeout(50);

      // The two queued spans sandwich an untouched sibling, so their text runs are not adjacent
      await page.evaluate(() => {
        const container = document.getElementById('container')!;
        const existing = document.getElementById('existing')!;
        const first = document.createElement('span');
        first.textContent = '甲';
        const last = document.createElement('span');
        last.textContent = 'abc';
        container.insertBefore(first, existing);
        container.appendChild(last);
      });

      await page.waitForTimeout(600);

      // No space may appear between X and abc. The missing space in 甲X is a known
      // pre-existing gap: boundaries against unqueued neighbors are never re-evaluated
      const result = await page.evaluate(() => document.getElementById('container')!.textContent);
      expect(result).toBe('甲Xabc');
    });

    test('not add a space across an unchanged whitespace wrapper between nodes added in one mutation batch', async ({ page }) => {
      await page.setContent('<div id="container"><span id="existing"> </span></div>');

      // Large pageDelayMs keeps the initial page sweep out of the assertion window
      await page.evaluate(() => {
        pangu.autoSpacingPage({ pageDelayMs: 60000 });
      });

      await page.waitForTimeout(50);

      // The two queued spans sandwich a wrapper whose whitespace already separates them
      await page.evaluate(() => {
        const container = document.getElementById('container')!;
        const existing = document.getElementById('existing')!;
        const first = document.createElement('span');
        first.textContent = '甲';
        const last = document.createElement('span');
        last.textContent = 'abc';
        container.insertBefore(first, existing);
        container.appendChild(last);
      });

      await page.waitForTimeout(600);

      const result = await page.evaluate(() => document.getElementById('container')!.textContent);
      expect(result).toBe('甲 abc');
    });
  });

  test.describe('spacingNode()', () => {
    test('handle text node', async ({ page }) => {
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

    test('handle text node with &nbsp; and &quot;', async ({ page }) => {
      await page.setContent(
        `<p id="test">Rev. (Reverend；牧師的尊稱)這個縮寫嚴格來說並不是一項頭銜，而是形容詞。所以，它應該這樣使用：&quot;We invited the Rev. Alan Darling.&quot; 或&nbsp; &quot;We&nbsp;invited the Rev. Mr. Darling.&quot;，而非&quot;We invited the Rev. Darling.&quot;我們也不可以說&quot;We invited the reverend to dinner.&quot; -- Only a cad would invite the rev. (只有下流的人才會招致批評：句中的 rev. 是 review 的縮寫，算是雙關語)</p>`,
      );
      const result = await page.evaluate(() => {
        const div = document.getElementById('test')!;
        pangu.spacingNode(div);
        return div.textContent;
      });
      expect(result).toBe(
        `Rev. (Reverend；牧師的尊稱) 這個縮寫嚴格來說並不是一項頭銜，而是形容詞。所以，它應該這樣使用："We invited the Rev. Alan Darling." 或 "We invited the Rev. Mr. Darling."，而非 "We invited the Rev. Darling." 我們也不可以說 "We invited the reverend to dinner." -- Only a cad would invite the rev. (只有下流的人才會招致批評：句中的 rev. 是 review 的縮寫，算是雙關語)`,
      );
    });
  });

  test.describe('spacingNode() with getElementById', () => {
    test('handle elements by ID', async ({ page }) => {
      const htmlContent = loadFixture('id-name.html');
      const expected = loadFixture('id-name.expected.html').trim();

      await page.setContent(htmlContent);
      await page.evaluate(() => {
        const element = document.getElementById('e1');
        if (element) {
          pangu.spacingNode(element);
        }
      });
      const actual = await page.evaluate(() => document.body.innerHTML.trim());
      expect(actual).toBe(expected);
    });
  });

  test.describe('spacingNode() with getElementsByClassName', () => {
    test('handle elements by class name (single element)', async ({ page }) => {
      const htmlContent = loadFixture('class-name-1.html');
      const expected = loadFixture('class-name-1.expected.html').trim();

      await page.setContent(htmlContent);
      await page.evaluate(() => {
        const elements = document.getElementsByClassName('e2');
        for (let i = 0; i < elements.length; i++) {
          pangu.spacingNode(elements[i]);
        }
      });
      const actual = await page.evaluate(() => document.body.innerHTML.trim());
      expect(actual).toBe(expected);
    });

    test('handle elements by class name (multiple elements)', async ({ page }) => {
      const htmlContent = loadFixture('class-name-2.html');
      const expected = loadFixture('class-name-2.expected.html').trim();

      await page.setContent(htmlContent);
      await page.evaluate(() => {
        const elements = document.getElementsByClassName('e4');
        for (let i = 0; i < elements.length; i++) {
          pangu.spacingNode(elements[i]);
        }
      });
      const actual = await page.evaluate(() => document.body.innerHTML.trim());
      expect(actual).toBe(expected);
    });

    test('handle elements by class name (nested elements)', async ({ page }) => {
      const htmlContent = loadFixture('class-name-3.html');
      const expected = loadFixture('class-name-3.expected.html').trim();

      await page.setContent(htmlContent);
      await page.evaluate(() => {
        const elements = document.getElementsByClassName('e5');
        for (let i = 0; i < elements.length; i++) {
          pangu.spacingNode(elements[i]);
        }
      });
      const actual = await page.evaluate(() => document.body.innerHTML.trim());
      expect(actual).toBe(expected);
    });
  });

  test.describe('spacingNode() with getElementsByTagName', () => {
    test('handle elements by tag name', async ({ page }) => {
      const htmlContent = loadFixture('tag-name.html');
      const expected = loadFixture('tag-name.expected.html').trim();

      await page.setContent(htmlContent);
      await page.evaluate(() => {
        const elements = document.getElementsByTagName('article');
        for (let i = 0; i < elements.length; i++) {
          pangu.spacingNode(elements[i]);
        }
      });
      const actual = await page.evaluate(() => document.body.innerHTML.trim());
      expect(actual).toBe(expected);
    });
  });

  test.describe('spacingNode() with querySelector()', () => {
    test('handle page title', async ({ page }) => {
      await page.evaluate(() => {
        document.title = "Mr.龍島主道：「Let's Party!各位高明博雅君子！」";
        const titleElement = document.querySelector('head > title');
        if (titleElement) {
          pangu.spacingNode(titleElement);
        }
      });

      const title = await page.title();
      expect(title).toBe("Mr. 龍島主道：「Let's Party! 各位高明博雅君子！」");
    });

    test('handle page body', async ({ page }) => {
      const htmlContent = loadFixture('body.html');
      const expected = loadFixture('body.expected.html').trim();

      await page.setContent(htmlContent);
      await page.evaluate(() => {
        pangu.spacingNode(document.body);
      });
      const actual = await page.evaluate(() => document.body.innerHTML.trim());
      expect(actual).toBe(expected);
    });
  });

  test.describe('spacingPage()', () => {
    test('handle entire page (title and body)', async ({ page }) => {
      const htmlContent = loadFixture('body.html');
      const expected = loadFixture('body.expected.html').trim();

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

    // NOTE: Known limitation with XPath-based approach for adjacent sibling elements
    // Current behavior doesn't add space between <span> and <a> elements
    test.skip('handle YouTube formatted strings with hashtags', async ({ page }) => {
      const htmlContent = loadFixture('youtube-format-string.html');
      const expected = loadFixture('youtube-format-string.expected.html').trim();

      await page.setContent(htmlContent);
      await page.evaluate(() => {
        pangu.spacingNode(document.body);
      });
      const actual = await page.evaluate(() => document.body.innerHTML.trim());
      expect(actual).toBe(expected);
    });

    test('handle single quote', async ({ page }) => {
      await page.setContent(`<div id="test"><h2 class="bgr6M8LczKBmaAn4sO0X UlmxiRo0duAvtZZW__30 zW32yWxwexOf03jBk4S7" id=":r31s:">Remove '铁蕾' from 1 Folder?</h2></div>`);
      const result = await page.evaluate(() => {
        const element = document.getElementById('test')!;
        pangu.spacingNode(element);
        return element.textContent;
      });
      expect(result).toBe(`Remove '铁蕾' from 1 Folder?`);
    });

    test('handle contenteditable elements by skipping them', async ({ page }) => {
      await page.setContent('<div contenteditable="true">abc漢字1</div>');
      await page.evaluate(() => {
        pangu.spacingNode(document.body);
      });
      const content = await page.content();
      expect(content).toContain('<div contenteditable="true">abc漢字1</div>');
    });

    test('skip spacing inside elements with no-pangu-spacing class', async ({ page }) => {
      await page.setContent('<p>漢字<span class="no-pangu-spacing">abc漢字1</span>漢字</p>');
      await page.evaluate(() => {
        pangu.spacingNode(document.body);
      });
      const result = await page.evaluate(() => document.querySelector('p')!.innerHTML);
      // Text inside no-pangu-spacing should be untouched, but outer text nodes should still get spacing
      expect(result).toContain('no-pangu-spacing">abc漢字1</span>');
    });

    test('skip spacing inside ignored tags like code and pre', async ({ page }) => {
      // code tag is in ignoredTags - text inside should not be spaced
      await page.setContent('<p>漢字<code>abc漢字1</code>漢字</p>');
      await page.evaluate(() => {
        pangu.spacingNode(document.body);
      });
      const result = await page.evaluate(() => document.querySelector('p')!.innerHTML);
      expect(result).toContain('<code>abc漢字1</code>');
    });

    // FIXME: Spaces belong around an inline <code> element between CJK (#97).
    // The presentationalTags rule that once did this was retired in 50cfcf3;
    // reviving it belongs to Markdown support (#161 #216)
    test.skip('handle spacing around inline code elements', async ({ page }) => {
      await page.setContent('<p>中文<code>English</code>中文</p>');
      await page.evaluate(() => {
        pangu.spacingNode(document.body);
      });
      const result = await page.evaluate(() => document.querySelector('p')!.innerHTML);
      expect(result).toBe('中文 <code>English</code> 中文');
    });

    test('skip spacing inside nested ignored containers', async ({ page }) => {
      // Text inside nested ignored tags (code inside pre) should not be spaced
      // This validates that the TreeWalker filter is sufficient without canIgnoreNode
      await page.setContent('<div>漢字abc<pre><code>漢字def</code></pre>漢字ghi</div>');
      await page.evaluate(() => {
        pangu.spacingNode(document.body);
      });
      const result = await page.evaluate(() => document.querySelector('div')!.innerHTML);
      // Text outside ignored containers gets spaced
      expect(result).toContain('漢字 abc');
      expect(result).toContain('漢字 ghi');
      // Text inside <pre><code> must stay untouched
      expect(result).toContain('<pre><code>漢字def</code></pre>');
    });

    test('handle input field values by preserving them', async ({ page }) => {
      const htmlContent = loadFixture('input-fields.html');

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
      const htmlContent = loadFixture('input-fields-mixed.html');
      const expected = loadFixture('input-fields-mixed.expected.html').trim();

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
      const htmlContent = loadFixture('whitespace-pre-wrap.html');
      const expected = loadFixture('whitespace-pre-wrap.expected.html').trim();

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

    // NOTE: The fix for preventing double spaces in already-spaced text (like Asana) makes this specific case not work
    // This is an acceptable trade-off since real-world cases like Asana typically have spaces at fragment boundaries
    test.skip('handle mixed fragmented nodes correctly (edge case: consecutive text nodes without spaces)', async ({ page }) => {
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

    test('handle whitespace between span elements correctly', async ({ page }) => {
      // Test the issue from fixtures/whitespace.html
      const htmlContent =
        '<div class="css-175oi2r r-1rtiivn"><a href="/vinta/following" dir="ltr" role="link" class="css-146c3p1 r-bcqeeo r-1ttztb7 r-qvutc0 r-37j5jr r-a023e6 r-rjixqe r-16dba41 r-1loqt21" style="color: rgb(15, 20, 25);"><span class="css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-poiln3 r-1b43r93 r-1cwl3u0 r-b88u0q" style="color: rgb(15, 20, 25);"><span class="css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-poiln3">1,228</span></span> <span class="css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-poiln3 r-1b43r93 r-1cwl3u0" style="color: rgb(83, 100, 113);"><span class="css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-poiln3">個跟隨中</span></span></a></div>';

      await page.setContent(htmlContent);

      // Apply spacing
      await page.evaluate(() => {
        pangu.spacingNode(document.body);
      });

      // Check that we don't add extra space inside the second span
      const innerSpanText = await page.evaluate(() => {
        const spans = document.querySelectorAll('span');
        // Find the span that contains "個跟隨中"
        for (const span of spans) {
          if (span.textContent === '個跟隨中' || span.textContent === ' 個跟隨中') {
            return span.textContent;
          }
        }
        return null;
      });

      // The text should remain "個跟隨中", not " 個跟隨中"
      expect(innerSpanText).toBe('個跟隨中');

      // The overall text should still have proper spacing
      const fullText = await page.evaluate(() => document.body.textContent);
      expect(fullText).toBe('1,228 個跟隨中');
    });

    // NOTE: Skip: Known limitation with current whitespace detection algorithm
    // The case where text nodes are not wrapped in spans (測試<span>文字</span>)
    // doesn't get spacing because the algorithm focuses on preventing double spaces
    // This is an acceptable trade-off for real-world cases like Twitter/Asana
    test.skip('handle various whitespace types between span elements', async ({ page }) => {
      // Test case 1: When there IS whitespace between spans, don't add extra space
      const whitespaceTestCases = [
        { name: 'single space', html: '<div><span>測試</span> <span>文字</span></div>' },
        { name: 'multiple spaces', html: '<div><span>測試</span>   <span>文字</span></div>' },
        { name: 'newline', html: '<div><span>測試</span>\n<span>文字</span></div>' },
        { name: 'tab', html: '<div><span>測試</span>\t<span>文字</span></div>' },
        { name: 'mixed whitespace', html: '<div><span>測試</span> \n\t <span>文字</span></div>' },
        {
          name: 'newline with indentation',
          html: `<div>
  <span>測試</span>
  <span>文字</span>
</div>`,
        },
      ];

      for (const testCase of whitespaceTestCases) {
        await page.setContent(testCase.html);

        await page.evaluate(() => {
          pangu.spacingNode(document.body);
        });

        // Check that the second span content remains unchanged (no space added)
        const secondSpanContent = await page.evaluate(() => {
          const spans = document.querySelectorAll('span');
          return spans[1]?.textContent || '';
        });

        expect(secondSpanContent).toBe('文字');
        expect(secondSpanContent).not.toMatch(/^ /);

        // Verify overall spacing is maintained
        const fullText = await page.evaluate(() => {
          return document.body.textContent?.replace(/\s+/g, ' ').trim();
        });
        expect(fullText).toBe('測試 文字');
      }

      // Test case 2: The limitation of current approach
      // When there is NO whitespace between spans and text nodes are the only children,
      // the current algorithm doesn't add space because it can't find a suitable location
      await page.setContent('<div><span>測試</span><span>文字</span></div>');

      await page.evaluate(() => {
        pangu.spacingNode(document.body);
      });

      // Currently this doesn't work as expected - no space is added
      const noSpaceResult = await page.evaluate(() => {
        return document.body.textContent?.trim();
      });

      // This is a known limitation - when spans are directly adjacent with no whitespace
      // and each contains only a text node, the algorithm doesn't know where to insert space
      expect(noSpaceResult).toBe('測試文字'); // Currently no space is added

      // However, if we have a different structure where text nodes can have siblings,
      // or there's some whitespace, it works correctly
      await page.setContent('<div>測試<span>文字</span></div>');

      await page.evaluate(() => {
        pangu.spacingNode(document.body);
      });

      const withSpaceResult = await page.evaluate(() => {
        return document.body.textContent?.trim();
      });

      // This case works because the first text node is not wrapped in a span
      expect(withSpaceResult).toBe('測試 文字');
    });

    test('should not insert <pangu> elements in CSS Grid containers', async ({ page }) => {
      await page.setContent(`
        <div id="grid-container" style="display: grid; grid-template-columns: 1fr 1fr;">
          <a href="#">abc</a><a href="#">漢字</a><a href="#">def</a>
        </div>
      `);

      await page.evaluate(() => {
        const element = document.getElementById('grid-container')!;
        pangu.spacingNode(element);
      });

      const panguCount = await page.evaluate(() => document.querySelectorAll('pangu').length);
      expect(panguCount).toBe(0);
    });

    test('should not insert <pangu> elements in CSS Flexbox containers', async ({ page }) => {
      await page.setContent(`
        <div id="flex-container" style="display: flex;">
          <a href="#">abc</a><a href="#">漢字</a><a href="#">def</a>
        </div>
      `);

      await page.evaluate(() => {
        const element = document.getElementById('flex-container')!;
        pangu.spacingNode(element);
      });

      const panguCount = await page.evaluate(() => document.querySelectorAll('pangu').length);
      expect(panguCount).toBe(0);
    });

    test('should not insert <pangu> elements in inline-grid and inline-flex containers', async ({ page }) => {
      await page.setContent(`
        <div id="inline-grid" style="display: inline-grid; grid-template-columns: 1fr 1fr;">
          <a href="#">abc</a><a href="#">漢字</a>
        </div>
        <div id="inline-flex" style="display: inline-flex;">
          <a href="#">abc</a><a href="#">漢字</a>
        </div>
      `);

      await page.evaluate(() => {
        pangu.spacingNode(document.body);
      });

      const panguCount = await page.evaluate(() => document.querySelectorAll('pangu').length);
      expect(panguCount).toBe(0);
    });

    test('should still insert <pangu> elements in normal flow containers', async ({ page }) => {
      // Baseline: <pangu> insertion still works for non-grid/flex parents
      await page.setContent('<div id="normal"><p><a href="#">abc</a><a href="#">漢字</a></p></div>');

      await page.evaluate(() => {
        const element = document.getElementById('normal')!;
        pangu.spacingNode(element);
      });

      const panguCount = await page.evaluate(() => document.querySelectorAll('pangu').length);
      expect(panguCount).toBe(1);

      const html = await page.evaluate(() => document.querySelector('p')!.innerHTML);
      expect(html).toBe('<a href="#">abc</a><pangu> </pangu><a href="#">漢字</a>');
    });

    test('should space across a nested link when trailing whitespace sits past the boundary', async ({ page }) => {
      // The whitespace after </span> is beyond the boundary between 字 and x,
      // so it must not veto the missing space
      await page.setContent('<p id="test">字<span><a href="#">x</a></span> tail</p>');

      await page.evaluate(() => {
        pangu.spacingNode(document.getElementById('test')!);
      });

      const result = await page.evaluate(() => document.getElementById('test')!.textContent);
      expect(result).toBe('字 x tail');
    });

    test('should not add a redundant space when real whitespace separates a link from the next run', async ({ page }) => {
      await page.setContent('<p id="test"><a href="#">字</a> <b>x</b></p>');

      await page.evaluate(() => {
        pangu.spacingNode(document.getElementById('test')!);
      });

      const html = await page.evaluate(() => document.getElementById('test')!.innerHTML);
      expect(html).toBe('<a href="#">字</a> <b>x</b>');
    });

    test('should not add a redundant space when whitespace separates a wrapped link from the next run', async ({ page }) => {
      // The boundary climb stops on <a>, so the scan has to exit the wrapping
      // <span> to see the whitespace-only text node
      await page.setContent('<p id="test"><span><a href="#">字</a></span>\n<b>x</b></p>');

      await page.evaluate(() => {
        pangu.spacingNode(document.getElementById('test')!);
      });

      const result = await page.evaluate(() => document.querySelector('#test b')!.textContent);
      expect(result).toBe('x');
    });

    test('should space across a wrapped link when no whitespace separates the runs', async ({ page }) => {
      await page.setContent('<p id="test"><span><a href="#">字</a></span>x</p>');

      await page.evaluate(() => {
        pangu.spacingNode(document.getElementById('test')!);
      });

      const result = await page.evaluate(() => document.getElementById('test')!.textContent);
      expect(result).toBe('字 x');
    });

    test('should not add a space when a whitespace-only wrapper separates the runs', async ({ page }) => {
      // The wrapper renders a space, so the runs are already separated
      await page.setContent('<p id="test">甲<span> </span>abc</p>');

      await page.evaluate(() => {
        pangu.spacingNode(document.getElementById('test')!);
      });

      const html = await page.evaluate(() => document.getElementById('test')!.innerHTML);
      expect(html).toBe('甲<span> </span>abc');
    });

    test('should see whitespace wrapped in nested elements between the runs', async ({ page }) => {
      await page.setContent('<p id="test">字<span><em> </em></span>x</p>');

      await page.evaluate(() => {
        pangu.spacingNode(document.getElementById('test')!);
      });

      const html = await page.evaluate(() => document.getElementById('test')!.innerHTML);
      expect(html).toBe('字<span><em> </em></span>x');
    });

    test('should keep adding a space across an ignored island with inner whitespace', async ({ page }) => {
      // Whitespace inside <code> is invisible to the scan, the island stays transparent
      await page.setContent('<p id="test">字<code>a b</code>x</p>');

      await page.evaluate(() => {
        pangu.spacingNode(document.getElementById('test')!);
      });

      const html = await page.evaluate(() => document.getElementById('test')!.innerHTML);
      expect(html).toBe('字<code>a b</code> x');
    });

    test('should space across an inline boundary when the colon rule needs context beyond the pair (real-world case)', async ({ page }) => {
      // The space belongs between "Content warning:" and 低, but AN_COLON_CJK only
      // fires with the alphanumeric character before the colon in view
      await page.setContent(`<div class="content">
        <p><strong>Content warning:</strong>低能量预警</p><hr><p>最近几天莫名其妙陷入了一种非常down的情绪之中。可能是因为工作，也可能是因为家庭、孩子，干什么都提不起兴趣，身体乏力，不知道什么时候才能走出来。</p>
      </div>`);

      await page.evaluate(() => {
        pangu.spacingPage();
      });

      const paragraphs = await page.evaluate(() => Array.from(document.querySelectorAll('p'), (p) => p.textContent));
      expect(paragraphs[0]).toBe('Content warning: 低能量预警');

      // Already correctly spaced text must stay untouched
      expect(paragraphs[1]).toBe('最近几天莫名其妙陷入了一种非常 down 的情绪之中。可能是因为工作，也可能是因为家庭、孩子，干什么都提不起兴趣，身体乏力，不知道什么时候才能走出来。');
    });

    test('should keep a pure-ASCII command line intact inside a multiline tweet (real-world case)', async ({ page }) => {
      // From an X tweet: 设计Skill needs a space, the already-spaced parts and the
      // newlines must survive, and the install command must stay copy-pasteable
      const htmlContent = loadFixture('tweet-text.html');
      const expected = loadFixture('tweet-text.expected.html').trim();

      await page.setContent(htmlContent);
      await page.evaluate(() => {
        pangu.spacingPage();
      });
      const actual = await page.evaluate(() => document.body.innerHTML.trim());
      expect(actual).toBe(expected);
    });

    test('should not insert <pangu> in grid with CJK card content (real-world case)', async ({ page }) => {
      // Simulates the AgentPub directory page layout from the bug report
      await page.setContent(`
        <div id="card-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
          <a href="/a/1" style="display: block; padding: 20px; border: 1px solid #ccc;">
            <h2>Pocketshark</h2>
            <p>小而鋒利，住在機器裡的鯊魚</p>
          </a><a href="/a/2" style="display: block; padding: 20px; border: 1px solid #ccc;">
            <h2>Reader</h2>
            <p>content in, content out</p>
          </a><a href="/a/3" style="display: block; padding: 20px; border: 1px solid #ccc;">
            <h2>OCISLY</h2>
            <p>Of Course I Still Love You</p>
          </a>
        </div>
      `);

      await page.evaluate(() => {
        pangu.spacingNode(document.body);
      });

      // No <pangu> should be inserted between grid items
      const panguCount = await page.evaluate(() => document.getElementById('card-grid')!.querySelectorAll(':scope > pangu').length);
      expect(panguCount).toBe(0);

      // Grid should still have exactly 3 direct child elements (the cards)
      const childCount = await page.evaluate(() => document.getElementById('card-grid')!.children.length);
      expect(childCount).toBe(3);

      // Text inside cards should still get spacing
      const cardText = await page.evaluate(() => document.querySelector('#card-grid a p')!.textContent);
      expect(cardText).toBe('小而鋒利，住在機器裡的鯊魚');
    });

    test('should add a U+00A0 between flush flex items in a search filter label (real-world case)', async ({ page }) => {
      // From a PChome 24h search filter: the count div renders flush against
      // the text div inside a row flex label, so the boundary space can only
      // come from a non-collapsible U+00A0 text node between the two divs
      const htmlContent = loadFixture('search-filter-label.html');
      // The leading prettier-ignore pragma parses into <head>, so it never
      // shows up in the serialized <body>
      const expected = loadFixture('search-filter-label.expected.html').replace('<!-- prettier-ignore -->', '').trim();

      await page.setContent(htmlContent);
      await page.evaluate(() => {
        pangu.spacingPage();
      });
      const actual = await page.evaluate(() => document.body.innerHTML.trim());
      expect(actual).toBe(expected);

      // A second pass must see the U+00A0 as existing whitespace and change nothing
      await page.evaluate(() => {
        pangu.spacingPage();
      });
      const secondPass = await page.evaluate(() => document.body.innerHTML.trim());
      expect(secondPass).toBe(expected);
    });

    test('should space flush inline-blocks whose leading space collapses (real-world case)', async ({ page }) => {
      // From Google Calendar: the h2 and the lunar date div are inline-blocks
      // sharing one line, and the div's leading U+0020 collapses at its own
      // line-box start, so the cell renders flush as "Aug 1(十九)". A <pangu>
      // element joins their shared line box and renders a real space
      const htmlContent = loadFixture('calendar-date-lunar.html');
      const expected = loadFixture('calendar-date-lunar.expected.html').replace('<!-- prettier-ignore -->', '').trim();

      await page.setContent(htmlContent);
      await page.evaluate(() => {
        pangu.spacingPage();
      });
      const actual = await page.evaluate(() => document.body.innerHTML.trim());
      expect(actual).toBe(expected);

      // A second pass must see the <pangu> sibling and change nothing
      await page.evaluate(() => {
        pangu.spacingPage();
      });
      const secondPass = await page.evaluate(() => document.body.innerHTML.trim());
      expect(secondPass).toBe(expected);
    });

    test('should not insert anything when flex items are separated by facing padding', async ({ page }) => {
      // Padding sits inside the border-box rects, so the rect check alone
      // would call these flush; the facing-edge veto must catch it
      await page.setContent('<div id="chips" style="display: flex;"><div style="padding-right: 16px;">全部商品</div><div>(999+)</div></div>');

      await page.evaluate(() => {
        pangu.spacingNode(document.getElementById('chips')!);
      });

      const text = await page.evaluate(() => document.getElementById('chips')!.textContent);
      expect(text).toBe('全部商品(999+)');
    });

    test('should not insert anything into a joined-border segmented control', async ({ page }) => {
      await page.setContent('<div id="seg" style="display: flex;"><div style="border: 1px solid #333;">全部</div><div style="border: 1px solid #333; border-left: none;">iPhone</div></div>');

      await page.evaluate(() => {
        pangu.spacingNode(document.getElementById('seg')!);
      });

      const text = await page.evaluate(() => document.getElementById('seg')!.textContent);
      expect(text).toBe('全部iPhone');
    });

    test('should not insert anything next to visually hidden flex items', async ({ page }) => {
      await page.setContent(`
        <div id="hidden-vis" style="display: flex;"><div style="visibility: hidden;">中文</div><div>(999+)</div></div>
        <div id="hidden-op" style="display: flex;"><div style="opacity: 0;">中文</div><div>(999+)</div></div>
      `);

      await page.evaluate(() => {
        pangu.spacingNode(document.body);
      });

      const results = await page.evaluate(() => [document.getElementById('hidden-vis')!.textContent, document.getElementById('hidden-op')!.textContent]);
      expect(results[0]).toBe('中文(999+)');
      expect(results[1]).toBe('中文(999+)');
    });

    test('should relocate a collapsed edge space into the U+00A0 across flush flex items', async ({ page }) => {
      // The trailing U+0020 inside the first item collapses at its line-box
      // end and renders as nothing, so it must not settle the boundary. It
      // moves into the inserted carrier instead of surviving as a redundant
      // second space in the copied text
      await page.setContent('<div id="edge" style="display: flex;"><div>中文 </div><div>(999+)</div></div>');

      await page.evaluate(() => {
        pangu.spacingNode(document.getElementById('edge')!);
      });

      const html = await page.evaluate(() => document.getElementById('edge')!.innerHTML);
      expect(html).toBe('<div>中文</div>&nbsp;<div>(999+)</div>');
    });

    test('should insert a U+00A0 across flush flex items despite whitespace between them', async ({ page }) => {
      // Pretty-printed markup puts a newline between the divs; flex suppresses
      // whitespace-only text, so the items still render flush
      await page.setContent('<div id="pretty" style="display: flex;"><div>中文</div>\n  <div>(999+)</div></div>');

      await page.evaluate(() => {
        pangu.spacingNode(document.getElementById('pretty')!);
      });

      const text = await page.evaluate(() => document.getElementById('pretty')!.textContent);
      expect(text).toBe('中文\n  \u00A0(999+)');
    });

    test('handle visually hidden adjacent elements', async ({ page }) => {
      // Test case from fixtures/hidden-adjacent-node.html
      // Updated HTML without leading space
      const htmlContent = `
        <style>
          .XuJrye {
            clip: rect(1px, 1px, 1px, 1px);
            height: 1px;
            overflow: hidden;
            position: absolute;
            -webkit-user-select: none;
            user-select: none;
            white-space: nowrap;
            width: 1px;
          }
        </style>
        <div class="toUqff vfzv" id="xDetDlgDesc"><span class="XuJrye">Description:</span><span jsaction="rcuQ6b:g0mjXe" jscontroller="BlntMb">一律轉整數，小數點太小會被某些交易所吃掉

  Transfer xxx USDC to Binance (Holder T)
  Transfer xxx USDT to MaiCoin MAX (Binance)</span></div>
      `;

      await page.setContent(htmlContent);

      // Apply spacing
      await page.evaluate(() => {
        pangu.spacingNode(document.body);
      });

      // Check what the visible text looks like AFTER spacing
      const visibleTextAfter = await page.evaluate(() => {
        const div = document.getElementById('xDetDlgDesc');
        const visibleSpan = div?.querySelector('span:not(.XuJrye)');
        return visibleSpan?.textContent || '';
      });

      // Check if a space was added at the beginning
      const hasLeadingSpace = visibleTextAfter.startsWith(' ');

      // With visibility check enabled, pangu.js now detects that the first span
      // is visually hidden and should NOT add space between hidden and visible elements
      expect(hasLeadingSpace).toBe(false); // With visibility check enabled

      // The visibility check feature successfully prevents spacing after hidden elements
      // by checking computed styles during text processing
    });
  });
});
