## Pangu.js

Pangu.js is a TypeScript library that automatically adds spacing between Chinese, Japanese, and Korean (CJK) characters and half-width characters (English letters, numbers, and symbols). This improves readability on web pages and in text files.

The project is structured into a shared core, a browser-specific implementation, and a Node.js-specific implementation. It also includes a command-line interface (CLI) and a Chrome extension.

### Project Structure

- **`src/shared`**: The core logic of the library, which is platform-agnostic.
- **`src/node`**: The Node.js-specific implementation, which provides a CLI and can be used to space text files.
- **`src/browser`**: The browser-specific implementation, which uses `MutationObserver` to automatically space web pages.
- **`browser_extensions/chrome`**: The source code for the Chrome extension.
- **`tests`**: The test suite for the project, which includes unit tests and end-to-end tests.

### How to Build

The project is built using `vite`. To build the project, run the following command:

```bash
npm run build
```

This will build the library and the Chrome extension.

### How to Test

The project uses `vitest` and `playwright` for testing. To run the tests, run the following command:

```bash
npm run test
```

### How to Use

The library can be used in the browser, in Node.js, or as a CLI.

**Browser**

```html
<script src="pangu/dist/browser/pangu.umd.js"></script>
<script>
  const text = pangu.spacingText('當你凝視著bug，bug也凝視著你');
  // text = '當你凝視著 bug，bug 也凝視著你'

  pangu.spacingElementById('main');
  pangu.spacingElementByClassName('comment');
  pangu.spacingElementByTagName('p');

  document.addEventListener('DOMContentLoaded', () => {
    // listen to any DOM change and automatically perform spacing via MutationObserver()
    pangu.autoSpacingPage();
  });
</script>
```

**Node.js**

```javascript
import pangu from 'pangu';
// or
const pangu = require('pangu');

const text = pangu.spacingText('不能信任那些Terminal或Editor用白底的人');
// text = '不能信任那些 Terminal 或 Editor 用白底的人'

const content = await pangu.spacingFile('/path/to/text.txt');
```

**CLI**

```bash
pangu "與PM戰鬥的人，應當小心自己不要成為PM"
```

### Commit Guidelines

Strive for atomic commits. Each commit should represent a single, logical change. If your work involves multiple unrelated changes (e.g., a bug fix and a documentation update), please separate them into individual commits. This practice helps maintain a clean and understandable project history.