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
const OPERATORS_WITH_HYPHEN = `${OPERATORS_BASE}\\-`; // For CJK_OPERATOR_ANS
const OPERATORS_NO_PLUS = '\\*=&\\-'; // For ANS_OPERATOR_CJK only; no + - it attaches to the preceding half-width run as a suffix (Disney+, 18+)
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
// Pattern to match single quotes around pure CJK text (no spaces, no other characters)
const SINGLE_QUOTE_PURE_CJK = new RegExp(`(')([${CJK}]+)(')`, 'g');

const HASH_ANS_CJK_HASH = new RegExp(`([${CJK}])(#)([${CJK}]+)(#)([${CJK}])`, 'g');
const CJK_HASH = new RegExp(`([${CJK}])(#([^ ]))`, 'g');
const HASH_CJK = new RegExp(`(([^ ])#)([${CJK}])`, 'g');
// In file path context (multiple slashes), only a final hashtag not preceded by a slash gets a space
const CJK_FINAL_HASHTAG = new RegExp(`([^/])([${CJK}])(#[A-Za-z0-9]+)$`);

// The symbol part only includes + - * = & (excluding | / < >)
// Only direct CJK contact makes a symbol an operator: a symbol between two half-width
// characters binds them into a joiner token (A+B, a=1, S&P) and never gets spaces,
// so there is deliberately no between-half-width rule here
const CJK_OPERATOR_ANS = new RegExp(`([${CJK}])([${OPERATORS_WITH_HYPHEN}])([${AN}])`, 'g');
const ANS_OPERATOR_CJK = new RegExp(`([${AN}])([${OPERATORS_NO_PLUS}])([${CJK}])`, 'g');

// Slash patterns for operator vs separator behavior
const CJK_SLASH_CJK = new RegExp(`([${CJK}])([/])([${CJK}])`, 'g');
const CJK_SLASH_ANS = new RegExp(`([${CJK}])([/])([${AN}])`, 'g');
const ANS_SLASH_CJK = new RegExp(`([${AN}])([/])([${CJK}])`, 'g');

// Pipe patterns for separator vs joiner-token behavior, decided per line
const PIPE_CJK_CONTACT = new RegExp(`[${CJK}]\\||\\|[${CJK}]`);
const PIPE_SEPARATOR = /([^\s|])[ ]*(\|+)[ ]*(?=[^\s|])/g;

// Special handling for single letter grades/ratings (A+, B-, C*) before CJK
// These should have space after the operator, not before
// Use word boundary to ensure it's a single letter, not part of a longer word
const SINGLE_LETTER_GRADE_CJK = new RegExp(`\\b([${A}])([${GRADE_OPERATORS}])([${CJK}])`, 'g');

// Affix readings attach a symbol to its half-width side at a CJK boundary, overriding the operator reading
// Sign: + or - attaches to following digits (+886, -5)
const CJK_SIGN_DIGIT = new RegExp(`([${CJK}])([\\+\\-])([0-9])`, 'g');
// Flag: - attaches to a following single lowercase letter (-m)
// [a-z] keeps a capitalized word on the operator reading and the trailing \b keeps a longer lowercase word there too
const CJK_HYPHEN_FLAG = new RegExp(`([${CJK}])(\\-)([a-z])\\b`, 'g');
// Suffix: + attaches to a preceding half-width run (Disney+, 18+)
const AN_PLUS_CJK = new RegExp(`([${AN}])(\\+)([${CJK}])`, 'g');

// Special handling for < and > as comparison operators (not brackets)
const CJK_LESS_THAN = new RegExp(`([${CJK}])(<)([${AN}])`, 'g');
const LESS_THAN_CJK = new RegExp(`([${AN}])(<)([${CJK}])`, 'g');
const CJK_GREATER_THAN = new RegExp(`([${CJK}])(>)([${AN}])`, 'g');
const GREATER_THAN_CJK = new RegExp(`([${AN}])(>)([${CJK}])`, 'g');

// Bracket patterns: ( ) [ ] { } and also < > (though < > are also handled as operators separately)
// Note: The curly quotes “ ” (\u201c \u201d) appear in CJK_LEFT_BRACKET/RIGHT_BRACKET_CJK but are primarily handled in the patterns below
const CJK_LEFT_BRACKET = new RegExp(`([${CJK}])([${LEFT_BRACKETS_EXTENDED}])`, 'g');
const RIGHT_BRACKET_CJK = new RegExp(`([${RIGHT_BRACKETS_EXTENDED}])([${CJK}])`, 'g');
const ANS_CJK_LEFT_BRACKET_ANY_RIGHT_BRACKET = new RegExp(`([${AN}${CJK}])[ ]*([\u201c])([${AN}${CJK}\\-_ ]+)([\u201d])`, 'g');
const LEFT_BRACKET_ANY_RIGHT_BRACKET_ANS_CJK = new RegExp(`([\u201c])([${AN}${CJK}\\-_ ]+)([\u201d])[ ]*([${AN}${CJK}])`, 'g');
// Some input habits type both quotes of a pair as closing curly quotes (\u201d), e.g. \u7537\u4e3b\u201d\u89c1\u8def\u4e0d\u8d70\u201d
// A \u201d only opens a \u201d\u2026\u201d pair when no unclosed \u201c precedes it on the line (the lookbehind), otherwise it
// closes that \u201c. Runs after RIGHT_BRACKET_CJK, so the [ ]* after the opener strips the space that rule
// just added inside the pair
const ANS_CJK_RIGHT_QUOTE_ANY_RIGHT_QUOTE = new RegExp(`([${AN}${CJK}])[ ]*(?<![\u201c][^\u201c\u201d\n]*)([\u201d])[ ]*([${AN}${CJK}\\-_ ]+?)[ ]*([\u201d])`, 'g');

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

// A run of spaces holding exactly one NBSP (\u00a0), bounded by non-whitespace, becomes one space
// Runs of 2+ NBSPs are deliberate formatting (e.g. paragraph indentation) and are preserved
// \u00a0 is not \S so the guards also keep string-edge NBSPs and longer whitespace runs intact
const SOLITARY_NBSP = /(?<=\S)[ ]*\u00a0[ ]*(?=\S)/g;

// Brackets: <fcontentl> (fcontentl) [fcontentl] {fcontentl}
// f: the first character inside the brackets
// l: the last character inside the brackets
// content: the content inside the brackets but exclude the first and last characters
// DO NOT change the first and last characters inside brackets AT ALL
// ONLY spacing the content between them
const BRACKET_PATTERNS = [
  { pattern: /<([^<>]*)>/g, open: '<', close: '>' },
  { pattern: /\(([^()]*)\)/g, open: '(', close: ')' },
  { pattern: /\[([^\[\]]*)\]/g, open: '[', close: ']' },
  { pattern: /\{([^{}]*)\}/g, open: '{', close: '}' },
];

// Fix spacing inside brackets according to the above rules:
// Ensure no unwanted spaces immediately after opening or before closing brackets
const fixBracketSpacing = (text: string) => {
  for (const { pattern, open, close } of BRACKET_PATTERNS) {
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

class PlaceholderReplacer {
  // Instances are created per spacingText() call with a handful of fixed
  // configs, so compiled patterns are shared across instances
  private static patternCache = new Map<string, RegExp>();

  private items: string[] = [];
  private index = 0;
  private pattern: RegExp;

  constructor(
    private placeholder: string,
    private startDelimiter: string,
    private endDelimiter: string,
  ) {
    const cacheKey = `${startDelimiter}${placeholder}${endDelimiter}`;
    let pattern = PlaceholderReplacer.patternCache.get(cacheKey);
    if (!pattern) {
      const escapedStart = this.startDelimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedEnd = this.endDelimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      pattern = new RegExp(`${escapedStart}${this.placeholder}(\\d+)${escapedEnd}`, 'g');
      PlaceholderReplacer.patternCache.set(cacheKey, pattern);
    }
    this.pattern = pattern;
  }

  store(item: string) {
    this.items[this.index] = item;
    return `${this.startDelimiter}${this.placeholder}${this.index++}${this.endDelimiter}`;
  }

  restore(text: string) {
    if (this.index === 0) {
      return text;
    }
    return text.replace(this.pattern, (_match, index) => {
      return this.items[parseInt(index, 10)] || '';
    });
  }
}

export class Pangu {
  version: string;

  constructor() {
    this.version = '8.0.0';
  }

  public spacingText(text: string) {
    if (typeof text !== 'string') {
      console.warn(`spacingText(text) only accepts string but got ${typeof text}`);
      return text;
    }

    if (text.length <= 1 || !ANY_CJK.test(text)) {
      return text;
    }

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
          const processedValue = this.spacingText(attrValue);
          return `${attrName}="${processedValue}"`;
        });

        return htmlTagManager.store(processedTag);
      });
    }

    // Normalize a solitary NBSP amid prose to a regular space before any spacing rules run
    newText = newText.replace(SOLITARY_NBSP, ' ');

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

    // Protect pure CJK content in single quotes
    newText = newText.replace(SINGLE_QUOTE_PURE_CJK, (match) => {
      return singleQuoteCJKManager.store(match);
    });

    // Now process other single quote patterns
    newText = newText.replace(CJK_SINGLE_QUOTE_BUT_POSSESSIVE, '$1 $2');
    newText = newText.replace(SINGLE_QUOTE_CJK, '$1 $2');

    // Restore protected pure CJK content
    newText = singleQuoteCJKManager.restore(newText);

    // HASH_ANS_CJK_HASH pattern needs at least 5 characters
    if (newText.length >= 5) {
      newText = newText.replace(HASH_ANS_CJK_HASH, '$1 $2$3$4 $5');
    }
    // Slash reading is per line, so each line's slash count decides its own hashtag behavior
    newText = newText
      .split('\n')
      .map((line) => {
        if ((line.match(/\//g) || []).length <= 1) {
          // Single or no slash - apply normal hashtag spacing
          line = line.replace(CJK_HASH, '$1 $2');
          line = line.replace(HASH_CJK, '$1 $3');
        } else {
          // Multiple slashes - skip hashtag processing to preserve path structure
          // But add space before final hashtag if it's not preceded by a slash
          line = line.replace(CJK_FINAL_HASHTAG, '$1$2 $3');
        }
        return line;
      })
      .join('\n');

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

    // Affix readings run before the operator rules so the symbol stays attached to its half-width side
    newText = newText.replace(CJK_SIGN_DIGIT, '$1 $2$3');
    newText = newText.replace(CJK_HYPHEN_FLAG, '$1 $2$3');
    newText = newText.replace(AN_PLUS_CJK, '$1$2 $3');

    newText = newText.replace(CJK_OPERATOR_ANS, '$1 $2 $3');
    newText = newText.replace(ANS_OPERATOR_CJK, '$1 $2 $3');

    // Handle < and > as comparison operators
    newText = newText.replace(CJK_LESS_THAN, '$1 $2 $3');
    newText = newText.replace(LESS_THAN_CJK, '$1 $2 $3');
    newText = newText.replace(CJK_GREATER_THAN, '$1 $2 $3');
    newText = newText.replace(GREATER_THAN_CJK, '$1 $2 $3');

    // Add space before filesystem paths after CJK
    newText = newText.replace(CJK_UNIX_ABSOLUTE_FILE_PATH, '$1 $2');
    newText = newText.replace(CJK_UNIX_RELATIVE_FILE_PATH, '$1 $2');
    newText = newText.replace(CJK_WINDOWS_PATH, '$1 $2');

    // Add space after Unix paths ending with / before CJK
    newText = newText.replace(UNIX_ABSOLUTE_FILE_PATH_SLASH_CJK, '$1 $2');
    newText = newText.replace(UNIX_RELATIVE_FILE_PATH_SLASH_CJK, '$1 $2');

    // Slash reading is per line: the line's only slash acts as an operator when CJK
    // touches it. A slash between half-width characters is a slash token and binds
    // tight, so no rule fires on it and file paths need no protection here (their
    // CJK edges were already spaced by the path rules above). Repeated slashes read
    // as a file path or a list - do nothing (no spaces)
    newText = newText
      .split('\n')
      .map((line) => {
        if ((line.match(/\//g) || []).length !== 1) {
          return line;
        }
        line = line.replace(CJK_SLASH_CJK, '$1 $2 $3');
        line = line.replace(CJK_SLASH_ANS, '$1 $2 $3');
        line = line.replace(ANS_SLASH_CJK, '$1 $2 $3');
        return line;
      })
      .join('\n');

    // Pipe reading is per line: a pipe in direct CJK contact makes every pipe on the
    // line a separator with spaces on both sides (作詞 | 林夕, concatenated page titles).
    // A line whose pipes touch no CJK keeps them tight as joiner tokens (x|y, ps aux|grep node)
    newText = newText
      .split('\n')
      .map((line) => {
        if (!PIPE_CJK_CONTACT.test(line)) {
          return line;
        }
        return line.replace(PIPE_SEPARATOR, '$1 $2 ');
      })
      .join('\n');

    // Restore compound words from placeholders
    newText = compoundWordManager.restore(newText);

    newText = newText.replace(CJK_LEFT_BRACKET, '$1 $2');
    newText = newText.replace(RIGHT_BRACKET_CJK, '$1 $2');
    newText = newText.replace(ANS_CJK_LEFT_BRACKET_ANY_RIGHT_BRACKET, '$1 $2$3$4');
    newText = newText.replace(LEFT_BRACKET_ANY_RIGHT_BRACKET_ANS_CJK, '$1$2$3 $4');
    newText = newText.replace(ANS_CJK_RIGHT_QUOTE_ANY_RIGHT_QUOTE, '$1 $2$3$4');

    newText = newText.replace(AN_LEFT_BRACKET, '$1 $2');
    newText = newText.replace(RIGHT_BRACKET_AN, '$1 $2');

    newText = newText.replace(CJK_ANS, '$1 $2');
    newText = newText.replace(ANS_CJK, '$1 $2');

    newText = newText.replace(S_A, '$1 $2');

    newText = newText.replace(MIDDLE_DOT, '・');

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
