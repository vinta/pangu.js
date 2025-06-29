// CJK is short for Chinese, Japanese, and Korean:
// \u2e80-\u2eff CJK Radicals Supplement
// \u2f00-\u2fdf Kangxi Radicals
// \u3040-\u309f Hiragana
// \u30a0-\u30ff Katakana
// \u3100-\u312f Bopomofo
// \u3200-\u32ff Enclosed CJK Letters and Months
// \u3400-\u4dbf CJK Unified Ideographs Extension A
// \u4e00-\u9fff CJK Unified Ideographs
// \uf900-\ufaff CJK Compatibility Ideographs
//
// ANS is short for Alphabets, Numbers, and Symbols:
// A includes A-Za-z\u0370-\u03ff
// N includes 0-9
// S includes `~!@#$%^&*()-_=+[]{}\|;:'",<.>/?
//
// All J below does not include \u30fb
// Some S below does not include all symbols
//
// For more information about Unicode blocks, see
// https://symbl.cc/en/unicode-table/

const CJK = '\u2e80-\u2eff\u2f00-\u2fdf\u3040-\u309f\u30a0-\u30fa\u30fc-\u30ff\u3100-\u312f\u3200-\u32ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff';

// prettier-ignore
// Unix absolute paths: system dirs + common project paths
// Examples: /home, /usr/bin, /etc/nginx.conf, /.bashrc, /node_modules/@babel/core, /path/to/your/project
const UNIX_ABSOLUTE_FILE_PATH = /\/(?:\.?(?:home|root|usr|etc|var|opt|tmp|dev|mnt|proc|sys|bin|boot|lib|media|run|sbin|srv|node_modules|path|project|src|dist|test|tests|docs|templates|assets|public|static|config|scripts|tools|build|out|target|your)|\.(?:[A-Za-z0-9_\-]+))(?:\/[A-Za-z0-9_\-\.@\+\*]+)*/;

// prettier-ignore
// Unix relative paths common in documentation and blog posts
// Examples: src/main.py, dist/index.js, test/spec.js, ./.claude/CLAUDE.md, templates/*.html
const UNIX_RELATIVE_FILE_PATH = /(?:\.\/)?(?:src|dist|test|tests|docs|templates|assets|public|static|config|scripts|tools|build|out|target|node_modules|\.claude|\.git|\.vscode)(?:\/[A-Za-z0-9_\-\.@\+\*]+)+/;

// Windows paths: C:\Users\name\, D:\Program Files\, C:\Windows\System32
const WINDOWS_FILE_PATH = /[A-Z]:\\(?:[A-Za-z0-9_\-\. ]+\\?)+/;

const ANY_CJK = new RegExp(`[${CJK}]`);

// The symbol part only includes ~ ! ; : , . ? but . only matches one character
const CONVERT_TO_FULLWIDTH_CJK_SYMBOLS_CJK = new RegExp(`([${CJK}])[ ]*([\\:]+|\\.)[ ]*([${CJK}])`, 'g');
const CONVERT_TO_FULLWIDTH_CJK_SYMBOLS = new RegExp(`([${CJK}])[ ]*([~\\!;,\\?]+)[ ]*`, 'g');
const DOTS_CJK = new RegExp(`([\\.]{2,}|\u2026)([${CJK}])`, 'g');
const FIX_CJK_COLON_ANS = new RegExp(`([${CJK}])\\:([A-Z0-9\\(\\)])`, 'g');

// The symbol part does not include '
const CJK_QUOTE = new RegExp(`([${CJK}])([\`"\u05f4])`, 'g');
const QUOTE_CJK = new RegExp(`([\`"\u05f4])([${CJK}])`, 'g');
const FIX_QUOTE_ANY_QUOTE = /([`"\u05f4]+)[ ]*(.+?)[ ]*([`"\u05f4]+)/g;

// Handle curly quotes with alphanumeric characters
// These patterns should only apply to curly quotes, not straight quotes
// Straight quotes are already handled by CJK_QUOTE, QUOTE_CJK and FIX_QUOTE_ANY_QUOTE
const QUOTE_AN = /([\u201d])([A-Za-z0-9])/g; // Only closing curly quotes + AN

// Special handling for straight quotes followed by alphanumeric after CJK
// This catches patterns like: 社"DF where the quote appears to be closing a quoted CJK phrase
const CJK_QUOTE_AN = new RegExp(`([${CJK}])(")([A-Za-z0-9])`, 'g');

const CJK_SINGLE_QUOTE_BUT_POSSESSIVE = new RegExp(`([${CJK}])('[^s])`, 'g');
const SINGLE_QUOTE_CJK = new RegExp(`(')([${CJK}])`, 'g');
const FIX_POSSESSIVE_SINGLE_QUOTE = new RegExp(`([A-Za-z0-9${CJK}])( )('s)`, 'g');

const HASH_ANS_CJK_HASH = new RegExp(`([${CJK}])(#)([${CJK}]+)(#)([${CJK}])`, 'g');
const CJK_HASH = new RegExp(`([${CJK}])(#([^ ]))`, 'g');
const HASH_CJK = new RegExp(`(([^ ])#)([${CJK}])`, 'g');

// The symbol part only includes + - * = & (excluding | / < >)
const CJK_OPERATOR_ANS = new RegExp(`([${CJK}])([\\+\\-\\*=&])([A-Za-z0-9])`, 'g');
const ANS_OPERATOR_CJK = new RegExp(`([A-Za-z0-9])([\\+\\-\\*=&])([${CJK}])`, 'g');
// Handle operators between alphanumeric characters when CJK is present in text
// But exclude hyphens that are part of compound words
const ANS_OPERATOR_ANS = new RegExp(`([A-Za-z0-9])([\\+\\*=&])([A-Za-z0-9])`, 'g');
// Special pattern for hyphens that are NOT part of compound words or dates
// Space hyphens in these cases: letter-letter, letter-number, number-letter, version ranges (letter+number-number)
// But NOT: pure number-number (dates like 2016-12-26)
const ANS_HYPHEN_ANS_NOT_COMPOUND = new RegExp(`([A-Za-z])(-(?![a-z]))([A-Za-z0-9])|([A-Za-z]+[0-9]+)(-(?![a-z]))([0-9])|([0-9])(-(?![a-z0-9]))([A-Za-z])`, 'g');

// Slash patterns for operator vs separator behavior
const CJK_SLASH_CJK = new RegExp(`([${CJK}])([/])([${CJK}])`, 'g');
const CJK_SLASH_ANS = new RegExp(`([${CJK}])([/])([A-Za-z0-9])`, 'g');
const ANS_SLASH_CJK = new RegExp(`([A-Za-z0-9])([/])([${CJK}])`, 'g');
const ANS_SLASH_ANS = new RegExp(`([A-Za-z0-9])([/])([A-Za-z0-9])`, 'g');

// Special handling for single letter grades/ratings (A+, B-, C*) before CJK
// These should have space after the operator, not before
// Use word boundary to ensure it's a single letter, not part of a longer word
const SINGLE_LETTER_GRADE_CJK = new RegExp(`\\b([A-Za-z])([\\+\\-\\*])([${CJK}])`, 'g');

// Special handling for < and > as comparison operators (not brackets)
const CJK_LESS_THAN = new RegExp(`([${CJK}])(<)([A-Za-z0-9])`, 'g');
const LESS_THAN_CJK = new RegExp(`([A-Za-z0-9])(<)([${CJK}])`, 'g');
const CJK_GREATER_THAN = new RegExp(`([${CJK}])(>)([A-Za-z0-9])`, 'g');
const GREATER_THAN_CJK = new RegExp(`([A-Za-z0-9])(>)([${CJK}])`, 'g');
// Handle < and > between alphanumeric characters when CJK is present in text
const ANS_LESS_THAN_ANS = new RegExp(`([A-Za-z0-9])(<)([A-Za-z0-9])`, 'g');
const ANS_GREATER_THAN_ANS = new RegExp(`([A-Za-z0-9])(>)([A-Za-z0-9])`, 'g');

// The bracket part only includes ( ) [ ] { } < > “ ”
const CJK_LEFT_BRACKET = new RegExp(`([${CJK}])([\\(\\[\\{<>\u201c])`, 'g');
const RIGHT_BRACKET_CJK = new RegExp(`([\\)\\]\\}<>\u201d])([${CJK}])`, 'g');
const ANS_CJK_LEFT_BRACKET_ANY_RIGHT_BRACKET = new RegExp(`([A-Za-z0-9${CJK}])[ ]*([\u201c])([A-Za-z0-9${CJK}\\-_ ]+)([\u201d])`, 'g');
const LEFT_BRACKET_ANY_RIGHT_BRACKET_ANS_CJK = new RegExp(`([\u201c])([A-Za-z0-9${CJK}\\-_ ]+)([\u201d])[ ]*([A-Za-z0-9${CJK}])`, 'g');

const AN_LEFT_BRACKET = /([A-Za-z0-9])(?<!\.[A-Za-z0-9]*)([\(\[\{])/g;
const RIGHT_BRACKET_AN = /([\)\]\}])([A-Za-z0-9])/g;

// Special patterns for filesystem paths after CJK
const CJK_UNIX_ABSOLUTE_FILE_PATH = new RegExp(`([${CJK}])(${UNIX_ABSOLUTE_FILE_PATH.source})`, 'g');
const CJK_UNIX_RELATIVE_FILE_PATH = new RegExp(`([${CJK}])(${UNIX_RELATIVE_FILE_PATH.source})`, 'g');
const CJK_WINDOWS_PATH = new RegExp(`([${CJK}])(${WINDOWS_FILE_PATH.source})`, 'g');

// Pattern for Unix paths ending with / followed by CJK
const UNIX_ABSOLUTE_FILE_PATH_SLASH_CJK = new RegExp(`(${UNIX_ABSOLUTE_FILE_PATH.source}/)([${CJK}])`, 'g');
const UNIX_RELATIVE_FILE_PATH_SLASH_CJK = new RegExp(`(${UNIX_RELATIVE_FILE_PATH.source}/)([${CJK}])`, 'g');

const CJK_ANS = new RegExp(`([${CJK}])([A-Za-z\u0370-\u03ff0-9@\\$%\\^&\\*\\-\\+\\\\=\u00a1-\u00ff\u2150-\u218f\u2700—\u27bf])`, 'g');
const ANS_CJK = new RegExp(`([A-Za-z\u0370-\u03ff0-9~\\$%\\^&\\*\\-\\+\\\\=!;:,\\.\\?\u00a1-\u00ff\u2150-\u218f\u2700—\u27bf])([${CJK}])`, 'g');

const S_A = /(%)([A-Za-z])/g;

const MIDDLE_DOT = /([ ]*)([\u00b7\u2022\u2027])([ ]*)/g;

export class Pangu {
  version: string;

  constructor() {
    this.version = '6.1.1';
  }

  public spacingText(text: string) {
    if (typeof text !== 'string') {
      console.warn(`spacingText(text) only accepts string but got ${typeof text}`);
      return text;
    }

    if (text.length <= 1 || !ANY_CJK.test(text)) {
      return text;
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    let newText = text;

    // HTML tag processing variables
    const htmlTags: string[] = [];
    const HTML_TAG_PLACEHOLDER = '\u0000HTML_TAG_PLACEHOLDER_';
    let hasHtmlTags = false;

    // Early return for HTML processing if no HTML tags present
    if (newText.includes('<')) {
      hasHtmlTags = true;
      // More specific HTML tag pattern:
      // - Opening tags: <tagname ...> or <tagname>
      // - Closing tags: </tagname>
      // - Self-closing tags: <tagname ... />
      // This pattern ensures we only match actual HTML tags, not just any < > content
      const HTML_TAG_PATTERN = /<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s+[^>]*)?>/g;

      // Replace all HTML tags with placeholders, but process attribute values
      newText = newText.replace(HTML_TAG_PATTERN, (match) => {
        // Process attribute values inside the tag
        const processedTag = match.replace(/(\w+)="([^"]*)"/g, (_attrMatch, attrName, attrValue) => {
          // Process the attribute value with spacing
          const processedValue = self.spacingText(attrValue);
          return `${attrName}="${processedValue}"`;
        });

        const index = htmlTags.length;
        htmlTags.push(processedTag);
        return `${HTML_TAG_PLACEHOLDER}${index}\u0000`;
      });
    }

    // https://stackoverflow.com/questions/4285472/multiple-regex-replace
    newText = newText.replace(CONVERT_TO_FULLWIDTH_CJK_SYMBOLS_CJK, (_match, leftCjk, symbols, rightCjk) => {
      const fullwidthSymbols = self.convertToFullwidth(symbols);
      return `${leftCjk}${fullwidthSymbols}${rightCjk}`;
    });

    newText = newText.replace(CONVERT_TO_FULLWIDTH_CJK_SYMBOLS, (_match, cjk, symbols) => {
      const fullwidthSymbols = self.convertToFullwidth(symbols);
      return `${cjk}${fullwidthSymbols}`;
    });

    newText = newText.replace(DOTS_CJK, '$1 $2');
    newText = newText.replace(FIX_CJK_COLON_ANS, '$1：$2');

    newText = newText.replace(CJK_QUOTE, '$1 $2');
    newText = newText.replace(QUOTE_CJK, '$1 $2');
    newText = newText.replace(FIX_QUOTE_ANY_QUOTE, '$1$2$3');

    // Handle quotes with alphanumeric - closing quotes followed by AN need space
    newText = newText.replace(QUOTE_AN, '$1 $2');
    // Opening quotes preceded by AN don't need space (they're handled by other patterns)

    // Handle CJK followed by closing quote followed by alphanumeric
    newText = newText.replace(CJK_QUOTE_AN, '$1$2 $3');

    newText = newText.replace(CJK_SINGLE_QUOTE_BUT_POSSESSIVE, '$1 $2');
    newText = newText.replace(SINGLE_QUOTE_CJK, '$1 $2');
    newText = newText.replace(FIX_POSSESSIVE_SINGLE_QUOTE, "$1's");

    // Early return for complex patterns that need longer text
    const textLength = newText.length;

    // Check slash count early to determine hashtag behavior
    const slashCount = (newText.match(/\//g) || []).length;

    // Early return for slash processing if no slashes present
    if (slashCount === 0) {
      // Apply normal hashtag spacing without slash considerations
      // HASH_ANS_CJK_HASH pattern needs at least 5 characters
      if (textLength >= 5) {
        newText = newText.replace(HASH_ANS_CJK_HASH, '$1 $2$3$4 $5');
      }
      newText = newText.replace(CJK_HASH, '$1 $2');
      newText = newText.replace(HASH_CJK, '$1 $3');
    } else if (slashCount <= 1) {
      // Single or no slash - apply normal hashtag spacing
      // HASH_ANS_CJK_HASH pattern needs at least 5 characters
      if (textLength >= 5) {
        newText = newText.replace(HASH_ANS_CJK_HASH, '$1 $2$3$4 $5');
      }
      newText = newText.replace(CJK_HASH, '$1 $2');
      newText = newText.replace(HASH_CJK, '$1 $3');
    } else {
      // Multiple slashes - skip hashtag processing to preserve path structure
      // But add space before final hashtag if it's not preceded by a slash
      // HASH_ANS_CJK_HASH pattern needs at least 5 characters
      if (textLength >= 5) {
        newText = newText.replace(HASH_ANS_CJK_HASH, '$1 $2$3$4 $5');
      }
      newText = newText.replace(new RegExp(`([^/])([${CJK}])(#[A-Za-z0-9]+)$`), '$1$2 $3');
    }

    // Protect compound words from operator spacing
    const COMPOUND_WORD_PLACEHOLDER = '\uE002'; // Private Use Area character
    const compoundWords: string[] = [];
    let compoundIndex = 0;

    // Pattern to detect compound words: alphanumeric-alphanumeric combinations that look like compound words/product names
    // Examples: state-of-the-art, machine-learning, GPT-4o, real-time, end-to-end, gpt-4o, GPT-5, claude-4-opus
    // Match: word-word(s) where at least one part contains lowercase letters OR contains mix of letters and numbers (like GPT-5)
    const COMPOUND_WORD_PATTERN = /\b(?:[A-Za-z0-9]*[a-z][A-Za-z0-9]*-[A-Za-z0-9]+|[A-Za-z0-9]+-[A-Za-z0-9]*[a-z][A-Za-z0-9]*|[A-Za-z]+-[0-9]+|[A-Za-z]+[0-9]+-[A-Za-z0-9]+)(?:-[A-Za-z0-9]+)*\b/g;

    // Store compound words and replace with placeholders
    newText = newText.replace(COMPOUND_WORD_PATTERN, (match) => {
      compoundWords[compoundIndex] = match;
      return `${COMPOUND_WORD_PLACEHOLDER}${compoundIndex++}\uE003`;
    });

    // Handle single letter grades (A+, B-, etc.) before general operator rules
    // This ensures "A+的" becomes "A+ 的" not "A + 的"
    newText = newText.replace(SINGLE_LETTER_GRADE_CJK, '$1$2 $3');

    newText = newText.replace(CJK_OPERATOR_ANS, '$1 $2 $3');
    newText = newText.replace(ANS_OPERATOR_CJK, '$1 $2 $3');
    newText = newText.replace(ANS_OPERATOR_ANS, '$1 $2 $3');
    newText = newText.replace(ANS_HYPHEN_ANS_NOT_COMPOUND, (match, ...groups) => {
      // Handle all patterns in the alternation
      if (groups[0] && groups[1] && groups[2]) {
        // First pattern: letter-alphanumeric
        return `${groups[0]} ${groups[1]} ${groups[2]}`;
      } else if (groups[3] && groups[4] && groups[5]) {
        // Second pattern: version range (letter+number-number)
        return `${groups[3]} ${groups[4]} ${groups[5]}`;
      } else if (groups[6] && groups[7] && groups[8]) {
        // Third pattern: number-letter
        return `${groups[6]} ${groups[7]} ${groups[8]}`;
      }
      return match;
    });

    // Handle < and > as comparison operators
    newText = newText.replace(CJK_LESS_THAN, '$1 $2 $3');
    newText = newText.replace(LESS_THAN_CJK, '$1 $2 $3');
    newText = newText.replace(ANS_LESS_THAN_ANS, '$1 $2 $3');
    newText = newText.replace(CJK_GREATER_THAN, '$1 $2 $3');
    newText = newText.replace(GREATER_THAN_CJK, '$1 $2 $3');
    newText = newText.replace(ANS_GREATER_THAN_ANS, '$1 $2 $3');

    // Add space before filesystem paths after CJK
    // Unix absolute paths: "和/root" -> "和 /root"
    newText = newText.replace(CJK_UNIX_ABSOLUTE_FILE_PATH, '$1 $2');
    // Unix relative paths: "檢查src/main.py" -> "檢查 src/main.py"
    newText = newText.replace(CJK_UNIX_RELATIVE_FILE_PATH, '$1 $2');
    // Windows paths: "檔案在C:\Users" -> "檔案在 C:\Users"
    newText = newText.replace(CJK_WINDOWS_PATH, '$1 $2');

    // Add space after Unix paths ending with / before CJK
    // Absolute paths: "/home/與" -> "/home/ 與"
    newText = newText.replace(UNIX_ABSOLUTE_FILE_PATH_SLASH_CJK, '$1 $2');
    // Relative paths: "build/temp/目錄" -> "build/temp/ 目錄"
    newText = newText.replace(UNIX_RELATIVE_FILE_PATH_SLASH_CJK, '$1 $2');

    // Context-aware slash handling: single slash = operator, multiple slashes = separator
    // But exclude slashes that are part of file paths by protecting them first
    if (slashCount === 1) {
      // Temporarily protect file paths from slash operator processing
      const FILE_PATH_PLACEHOLDER = '\uE000'; // Private Use Area character
      const filePaths: string[] = [];
      let pathIndex = 0;

      // Store all file paths and replace with placeholders
      const allFilePathPattern = new RegExp(`(${UNIX_ABSOLUTE_FILE_PATH.source}|${UNIX_RELATIVE_FILE_PATH.source})`, 'g');
      newText = newText.replace(allFilePathPattern, (match) => {
        filePaths[pathIndex] = match;
        return `${FILE_PATH_PLACEHOLDER}${pathIndex++}\uE001`;
      });

      // Now apply slash operator spacing
      newText = newText.replace(CJK_SLASH_CJK, '$1 $2 $3');
      newText = newText.replace(CJK_SLASH_ANS, '$1 $2 $3');
      newText = newText.replace(ANS_SLASH_CJK, '$1 $2 $3');
      newText = newText.replace(ANS_SLASH_ANS, '$1 $2 $3');

      // Restore file paths
      const FILE_PATH_RESTORE = new RegExp(`${FILE_PATH_PLACEHOLDER}(\\d+)\uE001`, 'g');
      newText = newText.replace(FILE_PATH_RESTORE, (_match, index) => {
        return filePaths[parseInt(index, 10)] || '';
      });
    }
    // If multiple slashes, treat as separator - do nothing (no spaces)

    // Restore compound words from placeholders
    const COMPOUND_WORD_RESTORE = new RegExp(`${COMPOUND_WORD_PLACEHOLDER}(\\d+)\uE003`, 'g');
    newText = newText.replace(COMPOUND_WORD_RESTORE, (_match, index) => {
      return compoundWords[parseInt(index, 10)] || '';
    });

    newText = newText.replace(CJK_LEFT_BRACKET, '$1 $2');
    newText = newText.replace(RIGHT_BRACKET_CJK, '$1 $2');
    newText = newText.replace(ANS_CJK_LEFT_BRACKET_ANY_RIGHT_BRACKET, '$1 $2$3$4');
    newText = newText.replace(LEFT_BRACKET_ANY_RIGHT_BRACKET_ANS_CJK, '$1$2$3 $4');

    newText = newText.replace(AN_LEFT_BRACKET, '$1 $2');
    newText = newText.replace(RIGHT_BRACKET_AN, '$1 $2');

    newText = newText.replace(CJK_ANS, '$1 $2');
    newText = newText.replace(ANS_CJK, '$1 $2');

    newText = newText.replace(S_A, '$1 $2');

    newText = newText.replace(MIDDLE_DOT, '・');

    // Brackets: <fcontentl> (fcontentl) [fcontentl] {fcontentl}
    // f: the first character inside the brackets
    // l: the last character inside the brackets
    // content: the content inside the brackets but exclude the first and last characters
    // DO NOT change the first and last characters inside brackets AT ALL
    // ONLY spacing the content between them

    // Fix spacing inside brackets according to the above rules:
    // Ensure no unwanted spaces immediately after opening or before closing brackets
    const fixBracketSpacing = (text: string): string => {
      // Process each bracket type
      const processBracket = (pattern: RegExp, openBracket: string, closeBracket: string) => {
        text = text.replace(pattern, (_match, innerContent) => {
          if (!innerContent) {
            return `${openBracket}${closeBracket}`;
          }

          // Remove spaces at the very beginning and end of content
          const trimmedContent = innerContent.replace(/^ +| +$/g, '');

          return `${openBracket}${trimmedContent}${closeBracket}`;
        });
      };

      // Only process < > as brackets if they're not HTML tags
      // HTML tags have already been protected by placeholders
      processBracket(/<([^<>]*)>/g, '<', '>');
      processBracket(/\(([^()]*)\)/g, '(', ')');
      processBracket(/\[([^\[\]]*)\]/g, '[', ']');
      processBracket(/\{([^{}]*)\}/g, '{', '}');

      return text;
    };

    newText = fixBracketSpacing(newText);

    // Restore HTML tags from placeholders (only if HTML processing occurred)
    if (hasHtmlTags) {
      const HTML_TAG_RESTORE = new RegExp(`${HTML_TAG_PLACEHOLDER}(\\d+)\u0000`, 'g');
      newText = newText.replace(HTML_TAG_RESTORE, (_match, index) => {
        return htmlTags[parseInt(index, 10)] || '';
      });
    }

    // TODO: TBD
    // Final fix for HTML comments: ensure no space after <!--
    // This is needed because <!-- is not protected as an HTML tag
    // and the ! character gets spaced by ANS_CJK pattern
    // newText = newText.replace(/<!--\s+/g, '<!--');

    return newText;
  }

  // alias for spacingText()
  public spacing(text: string) {
    return this.spacingText(text);
  }

  public hasProperSpacing(text: string) {
    return this.spacingText(text) === text;
  }

  protected convertToFullwidth(symbols: string): string {
    // prettier-ignore
    return symbols
      .replace(/~/g, '～')
      .replace(/!/g, '！')
      .replace(/;/g, '；')
      .replace(/:/g, '：')
      .replace(/,/g, '，')
      .replace(/\./g, '。')
      .replace(/\?/g, '？');
  }
}

export const pangu = new Pangu();

export { ANY_CJK };

export default pangu;
