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

// Basic character classes
const AN = 'A-Za-z0-9';
const A = 'A-Za-z';
const UPPER_AN = 'A-Z0-9'; // For FIX_CJK_COLON_ANS

// Operators - note the different sets!
const OPERATORS_BASE = '\\+\\*=&';
const OPERATORS_WITH_HYPHEN = `${OPERATORS_BASE}\\-`; // For CJK patterns
const OPERATORS_NO_HYPHEN = OPERATORS_BASE; // For ANS_OPERATOR_ANS only
const GRADE_OPERATORS = '\\+\\-\\*'; // For single letter grades

// Quotes
const QUOTES = '\`"\u05f4'; // Backtick, straight quote, Hebrew punctuation

// Brackets - different sets!
const LEFT_BRACKETS_BASIC = '\\(\\[\\{'; // For AN_LEFT_BRACKET
const RIGHT_BRACKETS_BASIC = '\\)\\]\\}'; // For RIGHT_BRACKET_AN
const LEFT_BRACKETS_EXTENDED = '\\(\\[\\{<>\u201c'; // For CJK_LEFT_BRACKET (includes angle brackets + curly quote)
const RIGHT_BRACKETS_EXTENDED = '\\)\\]\\}<>\u201d'; // For RIGHT_BRACKET_CJK

// ANS extended sets - CAREFUL: different symbols!
const ANS_CJK_AFTER = `${A}\u0370-\u03ff0-9@\\$%\\^&\\*\\-\\+\\\\=\u00a1-\u00ff\u2150-\u218f\u2700—\u27bf`; // Has @, no punctuation
const ANS_BEFORE_CJK = `${A}\u0370-\u03ff0-9\\$%\\^&\\*\\-\\+\\\\=\u00a1-\u00ff\u2150-\u218f\u2700—\u27bf`; // No @ symbol

// File path components - common directories in Unix/project paths
// prettier-ignore
const FILE_PATH_DIRS = 'home|root|usr|etc|var|opt|tmp|dev|mnt|proc|sys|bin|boot|lib|media|run|sbin|srv|node_modules|path|project|src|dist|test|tests|docs|templates|assets|public|static|config|scripts|tools|build|out|target|your|\\.claude|\\.git|\\.vscode';
const FILE_PATH_CHARS = '[A-Za-z0-9_\\-\\.@\\+\\*]+';

// Unix absolute paths: system dirs + common project paths
// Examples: /home, /usr/bin, /etc/nginx.conf, /.bashrc, /node_modules/@babel/core, /path/to/your/project
const UNIX_ABSOLUTE_FILE_PATH = new RegExp(`/(?:\\.?(?:${FILE_PATH_DIRS})|\\.(?:[A-Za-z0-9_\\-]+))(?:/${FILE_PATH_CHARS})*`);

// Unix relative paths common in documentation and blog posts
// Examples: src/main.py, dist/index.js, test/spec.js, ./.claude/CLAUDE.md, templates/*.html
const UNIX_RELATIVE_FILE_PATH = new RegExp(`(?:\\./)?(?:${FILE_PATH_DIRS})(?:/${FILE_PATH_CHARS})+`);

// Windows paths: C:\Users\name\, D:\Program Files\, C:\Windows\System32
const WINDOWS_FILE_PATH = /[A-Z]:\\(?:[A-Za-z0-9_\-\. ]+\\?)+/;

const ANY_CJK = new RegExp(`[${CJK}]`);

// Handle punctuation after CJK - add space but don't convert to full-width
// Support multiple consecutive punctuation marks
// Only add space if followed by CJK, letters, or numbers (not at end of text or before same punctuation)
const CJK_PUNCTUATION = new RegExp(`([${CJK}])([!;,\\?:]+)(?=[${CJK}${AN}])`, 'g');
// Handle punctuation between AN and CJK - add space after punctuation
const AN_PUNCTUATION_CJK = new RegExp(`([${AN}])([!;,\\?]+)([${CJK}])`, 'g');
// Handle tilde separately for special cases like ~=
// Only add space if followed by CJK, letters, or numbers (not at end of text)
const CJK_TILDE = new RegExp(`([${CJK}])(~+)(?!=)(?=[${CJK}${AN}])`, 'g');
const CJK_TILDE_EQUALS = new RegExp(`([${CJK}])(~=)`, 'g');
// Handle period separately to avoid matching file extensions, multiple dots, and file paths
// Note: Multiple dots are handled by DOTS_CJK pattern first
// Only add space if followed by CJK, letters, or numbers (not at end of text)
const CJK_PERIOD = new RegExp(`([${CJK}])(\\.)(?![${AN}\\./])(?=[${CJK}${AN}])`, 'g');
// Handle period between AN and CJK - avoid file extensions
const AN_PERIOD_CJK = new RegExp(`([${AN}])(\\.)([${CJK}])`, 'g');
// Handle colon between AN and CJK
const AN_COLON_CJK = new RegExp(`([${AN}])(:)([${CJK}])`, 'g');
const DOTS_CJK = new RegExp(`([\\.]{2,}|\u2026)([${CJK}])`, 'g');
// Special case for colon before uppercase letters/parentheses (convert to full-width)
const FIX_CJK_COLON_ANS = new RegExp(`([${CJK}])\\:([${UPPER_AN}\\(\\)])`, 'g');

// The symbol part does not include '
const CJK_QUOTE = new RegExp(`([${CJK}])([${QUOTES}])`, 'g');
const QUOTE_CJK = new RegExp(`([${QUOTES}])([${CJK}])`, 'g');
const FIX_QUOTE_ANY_QUOTE = new RegExp(`([${QUOTES}]+)[ ]*(.+?)[ ]*([${QUOTES}]+)`, 'g');

// Handle curly quotes with alphanumeric characters
// These patterns should only apply to curly quotes, not straight quotes
// Straight quotes are already handled by CJK_QUOTE, QUOTE_CJK and FIX_QUOTE_ANY_QUOTE
const QUOTE_AN = new RegExp(`([\u201d])([${AN}])`, 'g'); // Only closing curly quotes + AN

// Special handling for straight quotes followed by alphanumeric after CJK
// This catches patterns like: 中文"ABC where the quote appears to be closing a quoted CJK phrase
const CJK_QUOTE_AN = new RegExp(`([${CJK}])(")([${AN}])`, 'g');

const CJK_SINGLE_QUOTE_BUT_POSSESSIVE = new RegExp(`([${CJK}])('[^s])`, 'g');
const SINGLE_QUOTE_CJK = new RegExp(`(')([${CJK}])`, 'g');
const FIX_POSSESSIVE_SINGLE_QUOTE = new RegExp(`([${AN}${CJK}])( )('s)`, 'g');

const HASH_ANS_CJK_HASH = new RegExp(`([${CJK}])(#)([${CJK}]+)(#)([${CJK}])`, 'g');
const CJK_HASH = new RegExp(`([${CJK}])(#([^ ]))`, 'g');
const HASH_CJK = new RegExp(`(([^ ])#)([${CJK}])`, 'g');

// The symbol part only includes + - * = & (excluding | / < >)
const CJK_OPERATOR_ANS = new RegExp(`([${CJK}])([${OPERATORS_WITH_HYPHEN}])([${AN}])`, 'g');
const ANS_OPERATOR_CJK = new RegExp(`([${AN}])([${OPERATORS_WITH_HYPHEN}])([${CJK}])`, 'g');
// Handle operators between alphanumeric characters when CJK is present in text
// Note: This pattern excludes hyphens entirely (only + * = &) to avoid conflicts with compound words
const ANS_OPERATOR_ANS = new RegExp(`([${AN}])([${OPERATORS_NO_HYPHEN}])([${AN}])`, 'g');

// Hyphens that should be treated as operators (with spaces) rather than word connectors
// This regex has 3 patterns to catch different cases while preserving compound words:
// 1. Letter-Letter/Number: A-B, X-5 (spaces added) BUT NOT co-author, X-ray, GPT-5 (preserved)
// 2. Mixed alphanumeric-number patterns that aren't already protected as compound words
// 3. Number-Letter: 5-A, 3-B (spaces added) BUT NOT 5-year, 2016-12-26 (preserved)
// Note: Patterns like GPT4-5, v1-2 are protected by COMPOUND_WORD_PATTERN and won't get spaces
// The negative lookahead (?![a-z]) prevents matching hyphens followed by lowercase letters
const ANS_HYPHEN_ANS_NOT_COMPOUND = new RegExp(`([A-Za-z])(-(?![a-z]))([A-Za-z0-9])|([A-Za-z]+[0-9]+)(-(?![a-z]))([0-9])|([0-9])(-(?![a-z0-9]))([A-Za-z])`, 'g');

// Slash patterns for operator vs separator behavior
const CJK_SLASH_CJK = new RegExp(`([${CJK}])([/])([${CJK}])`, 'g');
const CJK_SLASH_ANS = new RegExp(`([${CJK}])([/])([${AN}])`, 'g');
const ANS_SLASH_CJK = new RegExp(`([${AN}])([/])([${CJK}])`, 'g');
const ANS_SLASH_ANS = new RegExp(`([${AN}])([/])([${AN}])`, 'g');

// Special handling for single letter grades/ratings (A+, B-, C*) before CJK
// These should have space after the operator, not before
// Use word boundary to ensure it's a single letter, not part of a longer word
const SINGLE_LETTER_GRADE_CJK = new RegExp(`\\b([${A}])([${GRADE_OPERATORS}])([${CJK}])`, 'g');

// Special handling for < and > as comparison operators (not brackets)
const CJK_LESS_THAN = new RegExp(`([${CJK}])(<)([${AN}])`, 'g');
const LESS_THAN_CJK = new RegExp(`([${AN}])(<)([${CJK}])`, 'g');
const CJK_GREATER_THAN = new RegExp(`([${CJK}])(>)([${AN}])`, 'g');
const GREATER_THAN_CJK = new RegExp(`([${AN}])(>)([${CJK}])`, 'g');
// Handle < and > between alphanumeric characters when CJK is present in text
const ANS_LESS_THAN_ANS = new RegExp(`([${AN}])(<)([${AN}])`, 'g');
const ANS_GREATER_THAN_ANS = new RegExp(`([${AN}])(>)([${AN}])`, 'g');

// Bracket patterns: ( ) [ ] { } and also < > (though < > are also handled as operators separately)
// Note: The curly quotes “ ” (\u201c \u201d) appear in CJK_LEFT_BRACKET/RIGHT_BRACKET_CJK but are primarily handled in the patterns below
const CJK_LEFT_BRACKET = new RegExp(`([${CJK}])([${LEFT_BRACKETS_EXTENDED}])`, 'g');
const RIGHT_BRACKET_CJK = new RegExp(`([${RIGHT_BRACKETS_EXTENDED}])([${CJK}])`, 'g');
const ANS_CJK_LEFT_BRACKET_ANY_RIGHT_BRACKET = new RegExp(`([${AN}${CJK}])[ ]*([\u201c])([${AN}${CJK}\\-_ ]+)([\u201d])`, 'g');
const LEFT_BRACKET_ANY_RIGHT_BRACKET_ANS_CJK = new RegExp(`([\u201c])([${AN}${CJK}\\-_ ]+)([\u201d])[ ]*([${AN}${CJK}])`, 'g');

const AN_LEFT_BRACKET = new RegExp(`([${AN}])(?<!\\.[${AN}]*)([${LEFT_BRACKETS_BASIC}])`, 'g');
const RIGHT_BRACKET_AN = new RegExp(`([${RIGHT_BRACKETS_BASIC}])([${AN}])`, 'g');

// Special patterns for filesystem paths after CJK
const CJK_UNIX_ABSOLUTE_FILE_PATH = new RegExp(`([${CJK}])(${UNIX_ABSOLUTE_FILE_PATH.source})`, 'g');
const CJK_UNIX_RELATIVE_FILE_PATH = new RegExp(`([${CJK}])(${UNIX_RELATIVE_FILE_PATH.source})`, 'g');
const CJK_WINDOWS_PATH = new RegExp(`([${CJK}])(${WINDOWS_FILE_PATH.source})`, 'g');

// Pattern for Unix paths ending with / followed by CJK
const UNIX_ABSOLUTE_FILE_PATH_SLASH_CJK = new RegExp(`(${UNIX_ABSOLUTE_FILE_PATH.source}/)([${CJK}])`, 'g');
const UNIX_RELATIVE_FILE_PATH_SLASH_CJK = new RegExp(`(${UNIX_RELATIVE_FILE_PATH.source}/)([${CJK}])`, 'g');

const CJK_ANS = new RegExp(`([${CJK}])([${ANS_CJK_AFTER}])`, 'g');
const ANS_CJK = new RegExp(`([${ANS_BEFORE_CJK}])([${CJK}])`, 'g');

const S_A = new RegExp(`(%)([${A}])`, 'g');

const MIDDLE_DOT = /([ ]*)([\u00b7\u2022\u2027])([ ]*)/g;

class PlaceholderReplacer {
  private items: string[] = [];
  private index = 0;
  private pattern: RegExp;

  constructor(
    private placeholder: string,
    private startDelimiter: string,
    private endDelimiter: string,
  ) {
    const escapedStart = this.startDelimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedEnd = this.endDelimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    this.pattern = new RegExp(`${escapedStart}${this.placeholder}(\\d+)${escapedEnd}`, 'g');
  }

  store(item: string) {
    this.items[this.index] = item;
    return `${this.startDelimiter}${this.placeholder}${this.index++}${this.endDelimiter}`;
  }

  restore(text: string) {
    return text.replace(this.pattern, (_match, index) => {
      return this.items[parseInt(index, 10)] || '';
    });
  }

  reset() {
    this.items = [];
    this.index = 0;
  }
}

export class Pangu {
  version: string;

  constructor() {
    this.version = '7.2.0';
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

    // Protect backtick content from quote processing but allow spacing around backticks
    const backtickManager = new PlaceholderReplacer('BACKTICK_CONTENT_', '\uE004', '\uE005');
    newText = newText.replace(/`([^`]+)`/g, (_match, content) => {
      return `\`${backtickManager.store(content)}\``;
    });

    // Initialize placeholder managers
    const htmlTagManager = new PlaceholderReplacer('HTML_TAG_PLACEHOLDER_', '\uE000', '\uE001');
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

        return htmlTagManager.store(processedTag);
      });
    }

    // Handle multiple dots first (before single period)
    newText = newText.replace(DOTS_CJK, '$1 $2');

    // Handle punctuation after CJK - add space but don't convert to full-width
    newText = newText.replace(CJK_PUNCTUATION, '$1$2 ');
    // Handle punctuation between AN and CJK
    newText = newText.replace(AN_PUNCTUATION_CJK, '$1$2 $3');
    // Handle tilde separately for special cases
    newText = newText.replace(CJK_TILDE, '$1$2 ');
    newText = newText.replace(CJK_TILDE_EQUALS, '$1 $2 ');
    // Handle period separately to avoid file extensions
    newText = newText.replace(CJK_PERIOD, '$1$2 ');
    newText = newText.replace(AN_PERIOD_CJK, '$1$2 $3');
    // Handle colon between AN and CJK
    newText = newText.replace(AN_COLON_CJK, '$1$2 $3');
    // Only convert colon to full-width in specific cases (before uppercase/parentheses)
    newText = newText.replace(FIX_CJK_COLON_ANS, '$1：$2');

    newText = newText.replace(CJK_QUOTE, '$1 $2');
    newText = newText.replace(QUOTE_CJK, '$1 $2');
    newText = newText.replace(FIX_QUOTE_ANY_QUOTE, '$1$2$3');

    // Handle quotes with alphanumeric - closing quotes followed by AN need space
    newText = newText.replace(QUOTE_AN, '$1 $2');
    // Opening quotes preceded by AN don't need space (they're handled by other patterns)

    // Handle CJK followed by closing quote followed by alphanumeric
    newText = newText.replace(CJK_QUOTE_AN, '$1$2 $3');

    // Handle single quotes more intelligently
    // First, handle possessive case
    newText = newText.replace(FIX_POSSESSIVE_SINGLE_QUOTE, "$1's");

    // Process single quotes around pure CJK text differently from mixed content
    const singleQuoteCJKManager = new PlaceholderReplacer('SINGLE_QUOTE_CJK_PLACEHOLDER_', '\uE030', '\uE031');

    // Pattern to match single quotes around pure CJK text (no spaces, no other characters)
    const SINGLE_QUOTE_PURE_CJK = new RegExp(`(')([${CJK}]+)(')`, 'g');

    // Protect pure CJK content in single quotes
    newText = newText.replace(SINGLE_QUOTE_PURE_CJK, (match) => {
      return singleQuoteCJKManager.store(match);
    });

    // Now process other single quote patterns
    newText = newText.replace(CJK_SINGLE_QUOTE_BUT_POSSESSIVE, '$1 $2');
    newText = newText.replace(SINGLE_QUOTE_CJK, '$1 $2');

    // Restore protected pure CJK content
    newText = singleQuoteCJKManager.restore(newText);

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
    const compoundWordManager = new PlaceholderReplacer('COMPOUND_WORD_PLACEHOLDER_', '\uE010', '\uE011');

    // Pattern to detect compound words: alphanumeric-alphanumeric combinations that look like compound words/product names
    // Examples: state-of-the-art, machine-learning, GPT-4o, real-time, end-to-end, gpt-4o, GPT-5, claude-4-opus
    // Match: word-word(s) where at least one part contains lowercase letters OR contains mix of letters and numbers (like GPT-5)
    const COMPOUND_WORD_PATTERN = /\b(?:[A-Za-z0-9]*[a-z][A-Za-z0-9]*-[A-Za-z0-9]+|[A-Za-z0-9]+-[A-Za-z0-9]*[a-z][A-Za-z0-9]*|[A-Za-z]+-[0-9]+|[A-Za-z]+[0-9]+-[A-Za-z0-9]+)(?:-[A-Za-z0-9]+)*\b/g;

    // Store compound words and replace with placeholders
    newText = newText.replace(COMPOUND_WORD_PATTERN, (match) => {
      return compoundWordManager.store(match);
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
    newText = newText.replace(CJK_UNIX_ABSOLUTE_FILE_PATH, '$1 $2');
    newText = newText.replace(CJK_UNIX_RELATIVE_FILE_PATH, '$1 $2');
    newText = newText.replace(CJK_WINDOWS_PATH, '$1 $2');

    // Add space after Unix paths ending with / before CJK
    newText = newText.replace(UNIX_ABSOLUTE_FILE_PATH_SLASH_CJK, '$1 $2');
    newText = newText.replace(UNIX_RELATIVE_FILE_PATH_SLASH_CJK, '$1 $2');

    // Context-aware slash handling: single slash = operator, multiple slashes = separator
    // But exclude slashes that are part of file paths by protecting them first
    if (slashCount === 1) {
      // Temporarily protect file paths from slash operator processing
      const filePathManager = new PlaceholderReplacer('FILE_PATH_PLACEHOLDER_', '\uE020', '\uE021');

      // Store all file paths and replace with placeholders
      const allFilePathPattern = new RegExp(`(${UNIX_ABSOLUTE_FILE_PATH.source}|${UNIX_RELATIVE_FILE_PATH.source})`, 'g');
      newText = newText.replace(allFilePathPattern, (match) => {
        return filePathManager.store(match);
      });

      // Now apply slash operator spacing
      newText = newText.replace(CJK_SLASH_CJK, '$1 $2 $3');
      newText = newText.replace(CJK_SLASH_ANS, '$1 $2 $3');
      newText = newText.replace(ANS_SLASH_CJK, '$1 $2 $3');
      newText = newText.replace(ANS_SLASH_ANS, '$1 $2 $3');

      // Restore file paths
      newText = filePathManager.restore(newText);
    }
    // If multiple slashes, treat as separator - do nothing (no spaces)

    // Restore compound words from placeholders
    newText = compoundWordManager.restore(newText);

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
    const fixBracketSpacing = (text: string) => {
      // Process all bracket types at once
      const bracketPatterns = [
        { pattern: /<([^<>]*)>/g, open: '<', close: '>' },
        { pattern: /\(([^()]*)\)/g, open: '(', close: ')' },
        { pattern: /\[([^\[\]]*)\]/g, open: '[', close: ']' },
        { pattern: /\{([^{}]*)\}/g, open: '{', close: '}' },
      ];

      for (const { pattern, open, close } of bracketPatterns) {
        text = text.replace(pattern, (_match, innerContent) => {
          if (!innerContent) {
            return `${open}${close}`;
          }
          // Remove spaces at the very beginning and end of content
          const trimmedContent = innerContent.replace(/^ +| +$/g, '');
          return `${open}${trimmedContent}${close}`;
        });
      }

      return text;
    };

    newText = fixBracketSpacing(newText);

    // Restore HTML tags from placeholders (only if HTML processing occurred)
    if (hasHtmlTags) {
      newText = htmlTagManager.restore(newText);
    }

    // Restore backtick content
    newText = backtickManager.restore(newText);

    // TODO:
    // Final fix for HTML comments: ensure no space after <!--
    // This is needed because <!-- is not protected as an HTML tag
    // and the ! character gets spaced by ANS_CJK pattern
    // newText = newText.replace(/<!--\s+/g, '<!--');

    return newText;
  }

  public hasProperSpacing(text: string) {
    return this.spacingText(text) === text;
  }
}

export const pangu = new Pangu();

export { ANY_CJK };

export default pangu;
