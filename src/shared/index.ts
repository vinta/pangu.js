// CJK is short for Chinese, Japanese, and Korean.
//
// CJK includes the following Unicode blocks:
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
// For more information about Unicode blocks, see
// https://symbl.cc/en/unicode-table/
//
// ANS is short for Alphabets, Numbers, and Symbols.
//
// A includes A-Za-z\u0370-\u03ff
// N includes 0-9
// S includes `~!@#$%^&*()-_=+[]{}\|;:'",<.>/?
//
// Some S below does not include all symbols

// All J below does not include \u30fb
const CJK = '\u2e80-\u2eff\u2f00-\u2fdf\u3040-\u309f\u30a0-\u30fa\u30fc-\u30ff\u3100-\u312f\u3200-\u32ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff';

// FIXME: This approach is too hacky
// Define filesystem path pattern that can be reused
// Matches Unix paths like /home, /usr/bin, /etc/nginx.conf
// Also matches Windows paths like C:/ D:/
// Only matches paths that clearly start with known system directories, hidden files, or common development directories
// const FILESYSTEM_PATH = /(?:[A-Z]:)?\/(?:\.?(?:home|root|usr|etc|var|opt|tmp|dev|mnt|proc|sys|bin|boot|lib|media|run|sbin|srv|node_modules|path)|\.(?:[A-Za-z0-9_\-]+))(?:\/[A-Za-z0-9_\-\.@\+]+)*/;
// const FILESYSTEM_PATH_WITH_CJK = new RegExp(
//   `(?:[A-Z]:)?/(?:\\.?(?:home|root|usr|etc|var|opt|tmp|dev|mnt|proc|sys|bin|boot|lib|media|run|sbin|srv|node_modules|path|project)|\\.(?:[A-Za-z0-9_\\-]+))(?:/[A-Za-z0-9_\\-\\.@\\+${CJK}]+)*`,
// );

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

// the symbol part only includes + - * = & (excluding | / < >)
const CJK_OPERATOR_ANS = new RegExp(`([${CJK}])([\\+\\-\\*=&])([A-Za-z0-9])`, 'g');
const ANS_OPERATOR_CJK = new RegExp(`([A-Za-z0-9])([\\+\\-\\*=&])([${CJK}])`, 'g');
// Also handle operators between AN-AN when CJK is present in the text
const AN_OPERATOR_AN = new RegExp(`([A-Za-z0-9])([\\+\\-\\*=&])([A-Za-z0-9])`, 'g');

// Pattern for detecting list-like structures with separators
// Matches patterns like: 中文1|中文2|中文3
// For pipe and underscore: preserve without spaces
// For slash: always add spaces (unless it's a file path - handled separately)
// For colon: converted to fullwidth (handled by CONVERT_TO_FULLWIDTH_CJK_SYMBOLS_CJK)
const CJK_SEPARATOR_LIST = new RegExp(`((?=.*[${CJK}])[${CJK}A-Za-z0-9]+(?:[|:_][${CJK}A-Za-z0-9]+)+)`, 'g');

// Special handling for single letter grades/ratings (A+, B-, C*) before CJK
// These should have space after the operator, not before
// Use word boundary to ensure it's a single letter, not part of a longer word
const SINGLE_LETTER_GRADE_CJK = new RegExp(`\\b([A-Za-z])([\\+\\-\\*])([${CJK}])`, 'g');

// Special handling for < and > as comparison operators (not brackets)
const CJK_LESS_THAN = new RegExp(`([${CJK}])(<)([A-Za-z0-9])`, 'g');
const LESS_THAN_CJK = new RegExp(`([A-Za-z0-9])(<)([${CJK}])`, 'g');
const CJK_GREATER_THAN = new RegExp(`([${CJK}])(>)([A-Za-z0-9])`, 'g');
const GREATER_THAN_CJK = new RegExp(`([A-Za-z0-9])(>)([${CJK}])`, 'g');

// Special handling for caret operator
const CJK_CARET_ANS = new RegExp(`([${CJK}])(\\^)([A-Za-z0-9])`, 'g');
const ANS_CARET_CJK = new RegExp(`([A-Za-z0-9])(\\^)([${CJK}])`, 'g');

// Special handling for ++ and -- (increment/decrement operators)
// Match patterns like C++, i++, x-- etc. These are treated as single units
const DOUBLE_PLUS_MINUS = /\b([A-Za-z0-9]+)(\+\+|--)/g;

// Pattern for compound words with hyphens
// Matches patterns like state-of-the-art, machine-learning-powered, etc.
const COMPOUND_WORD_PATTERN = /\b([A-Za-z]+(?:-[A-Za-z]+)+)\b/g;

// the bracket part only includes ( ) [ ] { } < > “ ”
const CJK_LEFT_BRACKET = new RegExp(`([${CJK}])([\\(\\[\\{<>\u201c])`, 'g');
const RIGHT_BRACKET_CJK = new RegExp(`([\\)\\]\\}<>\u201d])([${CJK}])`, 'g');
const ANS_CJK_LEFT_BRACKET_ANY_RIGHT_BRACKET = new RegExp(`([A-Za-z0-9${CJK}])[ ]*([\u201c])([A-Za-z0-9${CJK}\\-_ ]+)([\u201d])`, 'g');
const LEFT_BRACKET_ANY_RIGHT_BRACKET_ANS_CJK = new RegExp(`([\u201c])([A-Za-z0-9${CJK}\\-_ ]+)([\u201d])[ ]*([A-Za-z0-9${CJK}])`, 'g');

const AN_LEFT_BRACKET = /([A-Za-z0-9])(?<!\.[A-Za-z0-9]*)([\(\[\{])/g;
const RIGHT_BRACKET_AN = /([\)\]\}])([A-Za-z0-9])/g;

// Special pattern for filesystem paths like /home, /root, /dev/random after CJK
// const CJK_FILESYSTEM_PATH = new RegExp(`([${CJK}])(${FILESYSTEM_PATH.source})`, 'g');

// Pattern for filesystem path ending with / followed by CJK
// const FILESYSTEM_PATH_SLASH_CJK = new RegExp(`(${FILESYSTEM_PATH.source}/)([${CJK}])`, 'g');

const CJK_ANS = new RegExp(`([${CJK}])([A-Za-z\u0370-\u03ff0-9@\\$%\\^&\\*\\-\\+\\\\=\u00a1-\u00ff\u2150-\u218f\u2700—\u27bf])`, 'g');
const ANS_CJK = new RegExp(`([A-Za-z\u0370-\u03ff0-9~\\$%\\^&\\*\\-\\+\\\\=!;:,\\.\\?\u00a1-\u00ff\u2150-\u218f\u2700—\u27bf])([${CJK}])`, 'g');

const S_A = /(%)([A-Za-z])/g;

const MIDDLE_DOT = /([ ]*)([\u00b7\u2022\u2027])([ ]*)/g;

export class Pangu {
  version: string;

  constructor() {
    this.version = '6.1.0';
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

    // Protect HTML tags from being processed
    const htmlTags: string[] = [];
    const HTML_TAG_PLACEHOLDER = '\u0000HTML_TAG_PLACEHOLDER_';

    // Protect HTML comments specifically
    const htmlComments: string[] = [];
    const HTML_COMMENT_PLACEHOLDER = '\u0000HTML_COMMENT_PLACEHOLDER_';
    const HTML_COMMENT_PATTERN = /<!--[\s\S]*?-->/g;

    // First preserve HTML comments with their content processed
    newText = newText.replace(HTML_COMMENT_PATTERN, (match) => {
      // Extract content between <!-- and -->
      const content = match.slice(4, -3);
      // Process the content
      const processedContent = self.spacingText(content);
      const processedComment = `<!--${processedContent}-->`;
      const index = htmlComments.length;
      htmlComments.push(processedComment);
      return `${HTML_COMMENT_PLACEHOLDER}${index}\u0000`;
    });

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

    // // Preserve quoted paths before quote processing to prevent breaking them
    // const preservedQuotedPaths: string[] = [];
    // const QUOTED_PATH_PLACEHOLDER = '__PANGU_QUOTED_PATH_';
    // const QUOTED_PATH_PATTERN = /"[^"]*\/[^"]*"/g;
    // newText = newText.replace(QUOTED_PATH_PATTERN, (match) => {
    //   const index = preservedQuotedPaths.length;
    //   preservedQuotedPaths.push(match);
    //   return `${QUOTED_PATH_PLACEHOLDER}${index}__`;
    // });

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

    // First handle ++ and -- patterns (C++, i++, etc.)
    // These should be treated as single units with spaces around them
    const preservedIncrements: string[] = [];
    const INCREMENT_PLACEHOLDER = '__PANGU_INCREMENT_';
    newText = newText.replace(DOUBLE_PLUS_MINUS, (_match, varName, operator) => {
      const index = preservedIncrements.length;
      preservedIncrements.push(`${varName}${operator}`);
      return `${INCREMENT_PLACEHOLDER}${index}__`;
    });

    // Preserve compound words with hyphens
    const preservedCompounds: string[] = [];
    const COMPOUND_PLACEHOLDER = '__PANGU_COMPOUND_';
    newText = newText.replace(COMPOUND_WORD_PATTERN, (match) => {
      const index = preservedCompounds.length;
      preservedCompounds.push(match);
      return `${COMPOUND_PLACEHOLDER}${index}__`;
    });

    // Handle single letter grades (A+, B-, etc.) before general operator rules
    // This ensures "A+的" becomes "A+ 的" not "A + 的"
    newText = newText.replace(SINGLE_LETTER_GRADE_CJK, '$1$2 $3');

    newText = newText.replace(CJK_OPERATOR_ANS, '$1 $2 $3');
    newText = newText.replace(ANS_OPERATOR_CJK, '$1 $2 $3');
    // Always handle AN-AN operators
    newText = newText.replace(AN_OPERATOR_AN, '$1 $2 $3');

    // Handle < and > as comparison operators
    newText = newText.replace(CJK_LESS_THAN, '$1 $2 $3');
    newText = newText.replace(LESS_THAN_CJK, '$1 $2 $3');
    newText = newText.replace(CJK_GREATER_THAN, '$1 $2 $3');
    newText = newText.replace(GREATER_THAN_CJK, '$1 $2 $3');
    // Always handle AN-AN cases for < and >
    const AN_LESS_THAN_AN = /([A-Za-z0-9])(<)([A-Za-z0-9])/g;
    const AN_GREATER_THAN_AN = /([A-Za-z0-9])(>)([A-Za-z0-9])/g;
    newText = newText.replace(AN_LESS_THAN_AN, '$1 $2 $3');
    newText = newText.replace(AN_GREATER_THAN_AN, '$1 $2 $3');

    // Handle caret operator
    newText = newText.replace(CJK_CARET_ANS, '$1 $2 $3');
    newText = newText.replace(ANS_CARET_CJK, '$1 $2 $3');
    // Always handle AN-AN cases for caret
    const AN_CARET_AN = /([A-Za-z0-9])(\^)([A-Za-z0-9])/g;
    newText = newText.replace(AN_CARET_AN, '$1 $2 $3');

    // Restore increment/decrement patterns
    const INCREMENT_RESTORE = new RegExp(`${INCREMENT_PLACEHOLDER}(\\d+)__`, 'g');
    newText = newText.replace(INCREMENT_RESTORE, (_match, index) => {
      return preservedIncrements[parseInt(index, 10)] || '';
    });

    // Restore compound words
    const COMPOUND_RESTORE = new RegExp(`${COMPOUND_PLACEHOLDER}(\\d+)__`, 'g');
    newText = newText.replace(COMPOUND_RESTORE, (_match, index) => {
      return preservedCompounds[parseInt(index, 10)] || '';
    });

    // Add space before filesystem paths after CJK (e.g., "和/root" -> "和 /root")
    // newText = newText.replace(CJK_FILESYSTEM_PATH, '$1 $2');

    // Preserve filesystem paths and dates before handling slashes
    const preservedPaths: string[] = [];
    const PATH_PLACEHOLDER = '__PANGU_PATH_PLACEHOLDER_';

    // Preserve filesystem paths (including those with CJK characters)
    // Create a global version of the regex to match all occurrences
    // const FILESYSTEM_PATH_WITH_CJK_GLOBAL = new RegExp(FILESYSTEM_PATH_WITH_CJK.source, 'g');
    // newText = newText.replace(FILESYSTEM_PATH_WITH_CJK_GLOBAL, (match) => {
    //   const index = preservedPaths.length;
    //   preservedPaths.push(match);
    //   return `${PATH_PLACEHOLDER}${index}__`;
    // });

    // Preserve date formats like 114/07/02
    const DATE_PATTERN = /\b\d{2,4}\/\d{1,2}\/\d{1,2}\b/g;
    newText = newText.replace(DATE_PATTERN, (match) => {
      const index = preservedPaths.length;
      preservedPaths.push(match);
      return `${PATH_PLACEHOLDER}${index}__`;
    });

    // Special handling for separators (|, /, :)
    // When used in list-like structures (3+ segments), preserve without spaces
    // When used as single separators, handle based on the separator type
    const preservedLists: string[] = [];
    const LIST_PLACEHOLDER = '__PANGU_LIST_PLACEHOLDER_';

    // First, check for slash patterns that indicate it's being used as a separator
    // Count slashes in the line - if 2 or more, treat all slashes as separators
    const slashCount = (newText.match(/\//g) || []).length;
    const treatSlashAsSeparator = slashCount >= 2;

    // First, preserve list patterns for all separators
    newText = newText.replace(CJK_SEPARATOR_LIST, (match) => {
      const index = preservedLists.length;
      preservedLists.push(match);
      return `${LIST_PLACEHOLDER}${index}__`;
    });

    // Also preserve patterns that are clearly lists (e.g., patterns with multiple slashes)
    if (treatSlashAsSeparator) {
      // Find patterns like A/B/C or 中文/中文/中文 and preserve them
      // Also preserve special cases like "discord: user#1234"
      const SLASH_LIST_PATTERN = /([^\s\/]+(?:\/[^\s\/]+){2,})/g;
      const DISCORD_PATTERN = /discord:\s*[^\s]+/gi;
      
      newText = newText.replace(DISCORD_PATTERN, (match) => {
        const index = preservedLists.length;
        preservedLists.push(match);
        return `${LIST_PLACEHOLDER}${index}__`;
      });
      
      newText = newText.replace(SLASH_LIST_PATTERN, (match) => {
        const index = preservedLists.length;
        preservedLists.push(match);
        return `${LIST_PLACEHOLDER}${index}__`;
      });
    }

    // Handle separators
    // Note: Colons are already handled by CONVERT_TO_FULLWIDTH_CJK_SYMBOLS_CJK
    // Pipe and underscore: no spaces
    // Slash: always add spaces (unless it's a file path)

    // Handle slashes based on context
    if (treatSlashAsSeparator) {
      // Multiple slashes detected - treat as separator in lists
      // Only add spaces around single slashes that are clearly operators
      // Preserve slash lists without spaces
    } else {
      // Single slash or clearly an operator - always add spaces
      // Between CJK characters
      const CJK_SLASH_CJK = new RegExp(`([${CJK}])(/)([${CJK}])`, 'g');
      newText = newText.replace(CJK_SLASH_CJK, '$1 / $3');

      // Between AN and CJK
      const AN_SLASH_CJK = new RegExp(`([A-Za-z0-9])(/)([${CJK}])`, 'g');
      const CJK_SLASH_AN = new RegExp(`([${CJK}])(/)([A-Za-z0-9])`, 'g');
      newText = newText.replace(AN_SLASH_CJK, '$1 / $3');
      newText = newText.replace(CJK_SLASH_AN, '$1 / $3');

      // Always handle AN/AN slashes as operators
      const AN_SLASH_AN = new RegExp(`([A-Za-z0-9])(/)([A-Za-z0-9])`, 'g');
      newText = newText.replace(AN_SLASH_AN, '$1 / $3');

      // Handle slash before/after special characters
      const AN_SLASH_SPECIAL = new RegExp(`([A-Za-z0-9])(/)([#@])`, 'g');
      const CJK_SLASH_SPECIAL = new RegExp(`([${CJK}])(/)([#@:])`, 'g');
      newText = newText.replace(AN_SLASH_SPECIAL, '$1 / $3');
      newText = newText.replace(CJK_SLASH_SPECIAL, '$1 / $3');

      // Handle slash after apostrophe or closing brackets/parentheses
      const APOSTROPHE_SLASH = new RegExp(`(')(/)`, 'g');
      const BRACKET_SLASH = new RegExp(`([\\)\\]\\}\\>])(/)`, 'g');
      newText = newText.replace(APOSTROPHE_SLASH, '$1 / ');
      newText = newText.replace(BRACKET_SLASH, '$1 / ');

      // Generic pattern: any non-space character followed by slash followed by non-space (as fallback)
      const ANY_SLASH_ANY = /([^\s\/])(\/(?=[^\s]))/g;
      newText = newText.replace(ANY_SLASH_ANY, '$1 / ');
    }

    // Handle pipe and underscore as separators (never add spaces)
    const CJK_SEPARATOR_CJK = new RegExp(`([${CJK}])([|_])([${CJK}])`, 'g');
    const AN_SEPARATOR_CJK = new RegExp(`([A-Za-z0-9])([|_])([${CJK}])`, 'g');
    const CJK_SEPARATOR_AN = new RegExp(`([${CJK}])([|_])([A-Za-z0-9])`, 'g');
    // Keep separators without spaces
    newText = newText.replace(CJK_SEPARATOR_CJK, '$1$2$3');
    newText = newText.replace(AN_SEPARATOR_CJK, '$1$2$3');
    newText = newText.replace(CJK_SEPARATOR_AN, '$1$2$3');

    // Restore preserved lists
    const LIST_RESTORE = new RegExp(`${LIST_PLACEHOLDER}(\\d+)__`, 'g');
    newText = newText.replace(LIST_RESTORE, (_match, index) => {
      return preservedLists[parseInt(index, 10)] || '';
    });

    // Restore preserved paths
    const PATH_RESTORE = new RegExp(`${PATH_PLACEHOLDER}(\\d+)__`, 'g');
    newText = newText.replace(PATH_RESTORE, (_match, index) => {
      return preservedPaths[parseInt(index, 10)] || '';
    });

    // Add space after filesystem paths ending with / before CJK (e.g., "/home/與" -> "/home/ 與")
    // This must be done AFTER path restoration
    // newText = newText.replace(FILESYSTEM_PATH_SLASH_CJK, '$1 $2');

    // Handle hash patterns AFTER slash handling to avoid conflicts
    // But first preserve hashtags to avoid adding spaces inside them
    const preservedHashtags: string[] = [];
    const HASHTAG_PLACEHOLDER = '__PANGU_HASHTAG_PLACEHOLDER_';
    const HASHTAG_PATTERN = /#[A-Za-z0-9\u4e00-\u9fff]+/g;
    newText = newText.replace(HASHTAG_PATTERN, (match) => {
      const index = preservedHashtags.length;
      preservedHashtags.push(match);
      return `${HASHTAG_PLACEHOLDER}${index}__`;
    });

    newText = newText.replace(HASH_ANS_CJK_HASH, '$1 $2$3$4 $5');
    newText = newText.replace(CJK_HASH, '$1 $2');
    newText = newText.replace(HASH_CJK, '$1 $3');

    // Restore hashtags
    const HASHTAG_RESTORE = new RegExp(`${HASHTAG_PLACEHOLDER}(\\d+)__`, 'g');
    newText = newText.replace(HASHTAG_RESTORE, (_match, index) => {
      return preservedHashtags[parseInt(index, 10)] || '';
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

    // Special handling for compound brackets: <!-- -->, </ />, etc.
    // Pattern to fix spacing issues with compound brackets
    const FIX_LEFT_BRACKET_ANY_RIGHT_BRACKET = /([(<\[{])(\s*)([^)>\]}]+?)(\s*)([)>\]}])/g;
    newText = newText.replace(FIX_LEFT_BRACKET_ANY_RIGHT_BRACKET, (match, leftBracket, _leftSpace, content, _rightSpace, rightBracket) => {
      // Special case: if it's <!-- --> pattern, don't add spaces
      if (leftBracket === '<' && content.startsWith('!--') && content.endsWith('--') && rightBracket === '>') {
        return match; // Keep as is
      }
      // For other brackets, remove internal spaces at edges
      return `${leftBracket}${content}${rightBracket}`;
    });

    // Restore HTML comments first
    const HTML_COMMENT_RESTORE = new RegExp(`${HTML_COMMENT_PLACEHOLDER}(\\d+)\u0000`, 'g');
    newText = newText.replace(HTML_COMMENT_RESTORE, (_match, index) => {
      return htmlComments[parseInt(index, 10)] || '';
    });

    // Restore HTML tags from placeholders
    const HTML_TAG_RESTORE = new RegExp(`${HTML_TAG_PLACEHOLDER}(\\d+)\u0000`, 'g');
    newText = newText.replace(HTML_TAG_RESTORE, (_match, index) => {
      return htmlTags[parseInt(index, 10)] || '';
    });

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
