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

## Gemini Code Instructions

### Core Workflow

Always follow: **Understand → Plan → Implement → Verify**

1.  **Understand**: Analyze the request, understand context, identify constraints, and validate assumptions. Use available tools to gather information.
2.  **Plan**: Design a clear approach, anticipate edge cases, and choose the most efficient path.
3.  **Implement**: Apply changes using available tools, adhering to project conventions and best practices.
4.  **Verify**: Confirm changes by running tests, linters, or build commands as appropriate.

### Response Guidelines

-   **Concise & Direct**: Aim for minimal output, focusing strictly on the user's query. Avoid conversational filler.
-   **No Emojis**: Never use emojis in code, comments, commits, or responses.
-   **Clarity over Brevity (When Needed)**: Prioritize clarity for essential explanations or when seeking necessary clarification.
-   **Action over Theory**: Show code or tool usage instead of just describing them.
-   **Model Selection**: Always use the most powerful available model, even if it means longer response times.

### Critical Analysis

-   **Challenge Premise**: Question if the proposed problem is the right one to solve.
-   **Question Assumptions**: Identify and clarify any underlying assumptions.
-   **Propose Alternatives**: Suggest simpler or more effective approaches when applicable.
-   **Direct Feedback**: Provide clear and specific feedback on approaches or issues.

### Implementation Rules

-   **Start Minimal**: Implement the smallest working code that validates the approach.
-   **One File Preference**: Prefer modifying existing files over creating new ones unless necessary.
-   **Self-Documenting Code**: Prioritize clear naming; add comments sparingly, focusing on *why* rather than *what*.
-   **Fast Failure**: Validate inputs early and provide descriptive errors.
-   **No Premature Optimization**: Focus on correctness and clarity before optimizing.

### Automation Guidelines

-   **Reversible Actions**: For actions that are easily reversible (e.g., git commits, file modifications that can be rolled back by git), proceed without explicit confirmation.
