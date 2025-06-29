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
const FILESYSTEM_PATH = /(?:[A-Z]:)?\/(?:\.?(?:home|root|usr|etc|var|opt|tmp|dev|mnt|proc|sys|bin|boot|lib|media|run|sbin|srv|node_modules|path)|\.(?:[A-Za-z0-9_\-]+))(?:\/[A-Za-z0-9_\-\.@\+]+)*/;

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

// Pattern for detecting list-like structures with separators
// Matches patterns like: 分类1|分类2|分类3 or name1/name2/name3
// For slashes: preserve if 2+ slashes (3+ segments)
// For other separators: preserve any occurrence
// Also matches mixed CJK/non-CJK lists like: 陳上進/貓咪/Mollie
const CJK_SEPARATOR_LIST = new RegExp(`([${CJK}]+(?:[|:_][${CJK}]+)+|[${CJK}]+(?:/[${CJK}A-Za-z0-9]+){2,})`, 'g');

// Special handling for single letter grades/ratings (A+, B-, C*) before CJK
// These should have space after the operator, not before
// Use word boundary to ensure it's a single letter, not part of a longer word
const SINGLE_LETTER_GRADE_CJK = new RegExp(`\\b([A-Za-z])([\\+\\-\\*])([${CJK}])`, 'g');

// Special handling for < and > as comparison operators (not brackets)
const CJK_LESS_THAN = new RegExp(`([${CJK}])(<)([A-Za-z0-9])`, 'g');
const LESS_THAN_CJK = new RegExp(`([A-Za-z0-9])(<)([${CJK}])`, 'g');
const CJK_GREATER_THAN = new RegExp(`([${CJK}])(>)([A-Za-z0-9])`, 'g');
const GREATER_THAN_CJK = new RegExp(`([A-Za-z0-9])(>)([${CJK}])`, 'g');

// the bracket part only includes ( ) [ ] { } < > “ ”
const CJK_LEFT_BRACKET = new RegExp(`([${CJK}])([\\(\\[\\{<>\u201c])`, 'g');
const RIGHT_BRACKET_CJK = new RegExp(`([\\)\\]\\}<>\u201d])([${CJK}])`, 'g');
const ANS_CJK_LEFT_BRACKET_ANY_RIGHT_BRACKET = new RegExp(`([A-Za-z0-9${CJK}])[ ]*([\u201c])([A-Za-z0-9${CJK}\\-_ ]+)([\u201d])`, 'g');
const LEFT_BRACKET_ANY_RIGHT_BRACKET_ANS_CJK = new RegExp(`([\u201c])([A-Za-z0-9${CJK}\\-_ ]+)([\u201d])[ ]*([A-Za-z0-9${CJK}])`, 'g');

const AN_LEFT_BRACKET = /([A-Za-z0-9])(?<!\.[A-Za-z0-9]*)([\(\[\{])/g;
const RIGHT_BRACKET_AN = /([\)\]\}])([A-Za-z0-9])/g;

// Special pattern for filesystem paths like /home, /root, /dev/random after CJK
const CJK_FILESYSTEM_PATH = new RegExp(`([${CJK}])(${FILESYSTEM_PATH.source})`, 'g');

// Pattern for filesystem path ending with / followed by CJK
const FILESYSTEM_PATH_SLASH_CJK = new RegExp(`(${FILESYSTEM_PATH.source}/)([${CJK}])`, 'g');

const CJK_ANS = new RegExp(`([${CJK}])([A-Za-z\u0370-\u03ff0-9@\\$%\\^&\\*\\-\\+\\\\=\u00a1-\u00ff\u2150-\u218f\u2700—\u27bf])`, 'g');
const ANS_CJK = new RegExp(`([A-Za-z\u0370-\u03ff0-9~\\$%\\^&\\*\\-\\+\\\\=!;:,\\.\\?\u00a1-\u00ff\u2150-\u218f\u2700—\u27bf])([${CJK}])`, 'g');

const S_A = /(%)([A-Za-z])/g;

const MIDDLE_DOT = /([ ]*)([\u00b7\u2022\u2027])([ ]*)/g;

export class Pangu {
  version: string;

  constructor() {
    this.version = '6.0.0';
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

    newText = newText.replace(HASH_ANS_CJK_HASH, '$1 $2$3$4 $5');
    newText = newText.replace(CJK_HASH, '$1 $2');
    newText = newText.replace(HASH_CJK, '$1 $3');

    // Handle single letter grades (A+, B-, etc.) before general operator rules
    // This ensures "A+的" becomes "A+ 的" not "A + 的"
    newText = newText.replace(SINGLE_LETTER_GRADE_CJK, '$1$2 $3');

    newText = newText.replace(CJK_OPERATOR_ANS, '$1 $2 $3');
    newText = newText.replace(ANS_OPERATOR_CJK, '$1 $2 $3');

    // Handle < and > as comparison operators
    newText = newText.replace(CJK_LESS_THAN, '$1 $2 $3');
    newText = newText.replace(LESS_THAN_CJK, '$1 $2 $3');
    newText = newText.replace(CJK_GREATER_THAN, '$1 $2 $3');
    newText = newText.replace(GREATER_THAN_CJK, '$1 $2 $3');

    // Add space before filesystem paths after CJK (e.g., "和/root" -> "和 /root")
    newText = newText.replace(CJK_FILESYSTEM_PATH, '$1 $2');

    // Add space after filesystem paths ending with / before CJK (e.g., "/home/與" -> "/home/ 與")
    newText = newText.replace(FILESYSTEM_PATH_SLASH_CJK, '$1 $2');

    // Special handling for separators (|, /, :)
    // When used in list-like structures (3+ segments), preserve without spaces
    // When used as single separators, handle based on the separator type
    const preservedLists: string[] = [];
    const LIST_PLACEHOLDER = '\u0001LIST_PLACEHOLDER_';
    
    // First, preserve list patterns for all separators
    newText = newText.replace(CJK_SEPARATOR_LIST, (match) => {
      const index = preservedLists.length;
      preservedLists.push(match);
      return `${LIST_PLACEHOLDER}${index}\u0001`;
    });
    
    // Handle single separators between CJK
    // Note: Colons are already handled by CONVERT_TO_FULLWIDTH_CJK_SYMBOLS_CJK
    // so we only need to handle |, /, and _ here
    const CJK_SEPARATOR_SINGLE = new RegExp(`([${CJK}])([|/_])([${CJK}])`, 'g');
    newText = newText.replace(CJK_SEPARATOR_SINGLE, (match, p1, sep, p3) => {
      if (sep === '|' || sep === '_') {
        // Pipe and underscore remain as separators without spaces
        return match;
      } else if (sep === '/') {
        // Single slash gets spaces
        return `${p1} ${sep} ${p3}`;
      }
      return match;
    });
    
    // Restore preserved lists
    const LIST_RESTORE = new RegExp(`${LIST_PLACEHOLDER}(\\d+)\u0001`, 'g');
    newText = newText.replace(LIST_RESTORE, (_match, index) => {
      return preservedLists[parseInt(index, 10)] || '';
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

    // Restore HTML tags from placeholders
    const HTML_TAG_RESTORE = new RegExp(`${HTML_TAG_PLACEHOLDER}(\\d+)\u0000`, 'g');
    newText = newText.replace(HTML_TAG_RESTORE, (_match, index) => {
      return htmlTags[parseInt(index, 10)] || '';
    });

    // Final fix for HTML comments: ensure no space after <!--
    // This is needed because <!-- is not protected as an HTML tag
    // and the ! character gets spaced by ANS_CJK pattern
    newText = newText.replace(/<!--\s+/g, '<!--');

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
