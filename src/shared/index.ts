// CJK is short for Chinese, Japanese, and Korean
//
// ANS is short for Alphabets, Numbers, and Symbols:
// A is A-Za-z. Only the ANS_* extended sets below (feeding CJK_ANS and ANS_CJK) additionally cover Greek and Coptic, every other A/AN-named rule is bare ASCII
// N includes 0-9
// S varies per rule, see the symbol sets below
//
// For more about Unicode blocks, see https://symbl.cc/en/unicode-table/

// Unicode blocks. A name that ends in a carve-out marks a range that is deliberately smaller than its whole block, so widening it back to the block boundary is a wrong edit, not a tidy-up
export const CJK_RADICALS_SUPPLEMENT = '\u2e80-\u2eff';
export const KANGXI_RADICALS = '\u2f00-\u2fdf';
export const HIRAGANA = '\u3040-\u309f';
export const KATAKANA_NO_MIDDLE_DOT = '\u30a0-\u30fa\u30fc-\u30ff'; // The Katakana block ends at \u30ff, but \u30fb is the character that MIDDLE_DOT normalizes to, so it must not read as CJK itself
export const BOPOMOFO = '\u3100-\u312f';
export const ENCLOSED_CJK_LETTERS_AND_MONTHS = '\u3200-\u32ff';
export const CJK_UNIFIED_IDEOGRAPHS_EXTENSION_A = '\u3400-\u4dbf';
export const CJK_UNIFIED_IDEOGRAPHS = '\u4e00-\u9fff';
export const CJK_COMPATIBILITY_IDEOGRAPHS = '\uf900-\ufaff';
export const GREEK_AND_COPTIC = '\u0370-\u03ff';
export const LATIN_1_SUPPLEMENT_AFTER_NBSP = '\u00a1-\u00ff'; // The Latin-1 Supplement block starts at \u0080, but this range starts one past NBSP (\u00a0) so an NBSP lands in no character class at all. See ADR 0009
export const NUMBER_FORMS = '\u2150-\u218f';
export const DINGBATS = '\u2700-\u27bf';

export const CJK = `${CJK_RADICALS_SUPPLEMENT}${KANGXI_RADICALS}${HIRAGANA}${KATAKANA_NO_MIDDLE_DOT}${BOPOMOFO}${ENCLOSED_CJK_LETTERS_AND_MONTHS}${CJK_UNIFIED_IDEOGRAPHS_EXTENSION_A}${CJK_UNIFIED_IDEOGRAPHS}${CJK_COMPATIBILITY_IDEOGRAPHS}`;

// Basic character classes
export const AN = 'A-Za-z0-9';
export const A = 'A-Za-z';
export const UPPER_AN = 'A-Z0-9'; // For FIX_CJK_COLON_ANS

// Operators. Each rule uses a different set
export const OPERATORS_BASE = '\\+\\*=&';
export const OPERATORS_WITH_HYPHEN = `${OPERATORS_BASE}\\-`; // For CJK_OPERATOR_ANS
export const OPERATORS_NO_PLUS = '\\*=&\\-'; // For ANS_OPERATOR_CJK only. No + because + attaches to the preceding half-width run as a suffix (Disney+, 18+)
export const GRADE_OPERATORS = '\\+\\-\\*'; // For single letter grades

export const QUOTES = '\`"\u05f4'; // Backtick, straight quote, Hebrew punctuation

// Brackets. Each rule uses a different set
export const LEFT_BRACKETS_BASIC = '\\(\\[\\{'; // For AN_LEFT_BRACKET
export const RIGHT_BRACKETS_BASIC = '\\)\\]\\}'; // For RIGHT_BRACKET_AN and ANS_OPERATOR_CJK
export const LEFT_BRACKETS_EXTENDED = '\\(\\[\\{<>\u201c'; // For CJK_LEFT_BRACKET (includes angle brackets + curly quote)
export const RIGHT_BRACKETS_EXTENDED = '\\)\\]\\}<>\u201d'; // For RIGHT_BRACKET_CJK

// ANS extended sets. The two sets are not identical, see the inline notes
// Both ranges start at \u00a1, one past NBSP (\u00a0), so an NBSP is in no character class at all. That inertness is load-bearing: an NBSP already separates the runs it sits between,
// so no rule matches across it and none fires. pangu therefore never rewrites an author's NBSP, it only inserts a space where one is genuinely missing. See ADR 0009
export const ANS_CJK_AFTER = `${A}${GREEK_AND_COPTIC}0-9@\\$%\\^&\\*\\-\\+\\\\=${LATIN_1_SUPPLEMENT_AFTER_NBSP}${NUMBER_FORMS}${DINGBATS}`; // Has @, no punctuation
export const ANS_BEFORE_CJK = `${A}${GREEK_AND_COPTIC}0-9\\$%\\^&\\*\\-\\+\\\\=${LATIN_1_SUPPLEMENT_AFTER_NBSP}${NUMBER_FORMS}${DINGBATS}`; // No @ symbol

// Common directory names in Unix and project paths
// prettier-ignore
export const FILE_PATH_DIRS = 'home|root|usr|etc|var|opt|tmp|dev|mnt|proc|sys|bin|boot|lib|media|run|sbin|srv|node_modules|path|project|src|dist|test|tests|docs|templates|assets|public|static|config|scripts|tools|build|out|target|your|\\.claude|\\.git|\\.vscode';
export const FILE_PATH_CHARS = '[A-Za-z0-9_\\-\\.@\\+\\*]+';

// Unix absolute paths: system directories and common project paths, for example /home, /usr/bin, /etc/nginx.conf, /.bashrc, /node_modules/@babel/core, /path/to/your/project
export const UNIX_ABSOLUTE_FILE_PATH = new RegExp(`/(?:\\.?(?:${FILE_PATH_DIRS})|\\.(?:[A-Za-z0-9_\\-]+))(?:/${FILE_PATH_CHARS})*`);

// Unix relative paths that are common in documentation and blog posts, for example src/main.py, dist/index.js, test/spec.js, ./.claude/CLAUDE.md, templates/*.html
export const UNIX_RELATIVE_FILE_PATH = new RegExp(`(?:\\./)?(?:${FILE_PATH_DIRS})(?:/${FILE_PATH_CHARS})+`);

// Windows paths: C:\Users\name\, D:\Program Files\, C:\Windows\System32
export const WINDOWS_FILE_PATH = /[A-Z]:\\(?:[A-Za-z0-9_\-\. ]+\\?)+/;

export const ANY_CJK = new RegExp(`[${CJK}]`);

// A punctuation run after CJK gets a trailing space and never converts to full-width. Space only when CJK, a letter, or a digit follows, so nothing changes at the end of the text
export const CJK_PUNCTUATION = new RegExp(`([${CJK}])([!;,\\?:]+)(?=[${CJK}${AN}])`, 'g');
// A punctuation run directly before CJK gets a space after it, whatever sits on its left (no left anchor). An already-typed 'CJK ,CJK' shape is a typo, not preserved. See ADR 0007
// CJK_PUNCTUATION still owns colon and punctuation before letters and digits
export const PUNCTUATION_CJK = new RegExp(`([!;,\\?]+)(?=[${CJK}])`, 'g');
// Tilde has its own rule so ~= stays intact. Space only when CJK, a letter, or a digit follows
export const CJK_TILDE = new RegExp(`([${CJK}])(~+)(?!=)(?=[${CJK}${AN}])`, 'g');
export const CJK_TILDE_EQUALS = new RegExp(`([${CJK}])(~=)`, 'g');
// Period has its own rule so file extensions, dot runs, and file paths stay intact; DOTS_CJK handles runs of dots first. Space only when CJK follows: the negative lookahead rejects a letter or digit,
// which reads as a file extension and stays intact
export const CJK_PERIOD = new RegExp(`([${CJK}])(\\.)(?![${AN}\\./])(?=[${CJK}${AN}])`, 'g');
export const AN_PERIOD_CJK = new RegExp(`([${AN}])(\\.)([${CJK}])`, 'g');
export const AN_COLON_CJK = new RegExp(`([${AN}])(:)([${CJK}])`, 'g');
export const DOTS_CJK = new RegExp(`([\\.]{2,}|\u2026)([${CJK}])`, 'g');
// The only case where a colon converts to full-width: after CJK, directly before a parenthesis. The A-Z0-9 half of the class is unreachable, because CJK_PUNCTUATION runs first and owns colon before
// letters and digits, leaving a half-width colon plus a space
export const FIX_CJK_COLON_ANS = new RegExp(`([${CJK}])\\:([${UPPER_AN}\\(\\)])`, 'g');

// The quote class deliberately excludes ' because single quotes have their own rules
export const CJK_QUOTE = new RegExp(`([${CJK}])([${QUOTES}])`, 'g');
export const QUOTE_CJK = new RegExp(`([${QUOTES}])([${CJK}])`, 'g');
// The content class is [\s\S] rather than . so a quoted segment that spans a line break still pairs with its own closing quote. HTML source wrapping puts newlines mid-sentence, and with . that
// closing quote is unreachable, so the scan resyncs on the next quote, pairs closing-to-opening and strips the spaces outside the quotes instead of inside
export const FIX_QUOTE_ANY_QUOTE = new RegExp(`([${QUOTES}]+)[ ]*([\\s\\S]+?)[ ]*([${QUOTES}]+)`, 'g');

// Curly quotes only: CJK_QUOTE, QUOTE_CJK, and FIX_QUOTE_ANY_QUOTE already handle straight quotes
export const QUOTE_AN = new RegExp(`([\u201d])([${AN}])`, 'g');

// A straight quote between CJK and AN (CJK"AN) reads as closing a quoted CJK phrase, so the space goes after the quote
export const CJK_QUOTE_AN = new RegExp(`([${CJK}])(")([${AN}])`, 'g');

export const CJK_SINGLE_QUOTE_BUT_POSSESSIVE = new RegExp(`([${CJK}])('[^s])`, 'g');
export const SINGLE_QUOTE_CJK = new RegExp(`(')([${CJK}])`, 'g');
export const FIX_POSSESSIVE_SINGLE_QUOTE = new RegExp(`([${AN}${CJK}])( )('s)`, 'g');
// Single quotes whose content is only CJK characters
export const SINGLE_QUOTE_PURE_CJK = new RegExp(`(')([${CJK}]+)(')`, 'g');

// Legacy name: the run between the two hashes is CJK only, the ANS in the name has never matched
export const HASH_ANS_CJK_HASH = new RegExp(`([${CJK}])(#)([${CJK}]+)(#)([${CJK}])`, 'g');
// The negated class is the "something is glued to this #, so it is a hashtag" guard, so it has to reject an NBSP the same way it rejects a space. It stays a literal pair rather than \S because \S
// also excludes zero-width characters like U+FEFF, and treating those as a gap would drop the space entirely and leave the runs flush
export const CJK_HASH = new RegExp(`([${CJK}])(#([^ \\u00a0]))`, 'g');
export const HASH_CJK = new RegExp(`(([^ \\u00a0])#)([${CJK}])`, 'g');
// In file path context (multiple slashes), only a final hashtag not preceded by a slash gets a space
export const CJK_FINAL_HASHTAG = new RegExp(`([^/])([${CJK}])(#[A-Za-z0-9]+)$`);

// The operator set is + - * = & only (no | / < >). Only direct CJK contact makes a symbol an operator: a symbol between two half-width characters binds them into a joiner token (A+B, a=1, S&P)
// and never gets spaces, so there is deliberately no between-half-width rule here
// On the left, a closing bracket also counts as the half-width side: ]-CJK reads as an operator whose operand is the bracketed run
export const CJK_OPERATOR_ANS = new RegExp(`([${CJK}])([${OPERATORS_WITH_HYPHEN}])([${AN}])`, 'g');
export const ANS_OPERATOR_CJK = new RegExp(`([${AN}${RIGHT_BRACKETS_BASIC}])([${OPERATORS_NO_PLUS}])([${CJK}])`, 'g');

// Slash patterns for operator vs separator behavior
export const CJK_SLASH_CJK = new RegExp(`([${CJK}])([/])([${CJK}])`, 'g');
export const CJK_SLASH_ANS = new RegExp(`([${CJK}])([/])([${AN}])`, 'g');
export const ANS_SLASH_CJK = new RegExp(`([${AN}])([/])([${CJK}])`, 'g');

// Pipe patterns for separator vs joiner-token behavior, decided per line
export const PIPE_CJK_CONTACT = new RegExp(`[${CJK}]\\||\\|[${CJK}]`);
export const PIPE_SEPARATOR = /([^\s|])[ ]*(\|+)[ ]*(?=[^\s|])/g;

// Plus patterns for separator vs joiner-token behavior, decided per line like the pipe. The separator matches a solitary plus only: a space-adjacent plus is decided and a ++ run is a preserved
// pattern (C++, i++)
export const PLUS_CJK_CONTACT = new RegExp(`[${CJK}]\\+|\\+[${CJK}]`);
export const PLUS_SEPARATOR = /(?<=[^\s+])\+(?=[^\s+])/g;

// Single-letter grades (A+, B-, C*) before CJK get the space after the symbol, not before. The \b keeps the letter single, not the tail of a longer word
export const SINGLE_LETTER_GRADE_CJK = new RegExp(`\\b([${A}])([${GRADE_OPERATORS}])([${CJK}])`, 'g');

// Affix readings attach a symbol to its half-width side at a CJK boundary, overriding the operator reading
// Sign: + attaches to following digits (+886). A hyphen before digits is not a sign: CJK-N falls to CJK_OPERATOR_ANS, because year ranges and site-title separators outnumber glued negative
// numbers. See ADR 0015
export const CJK_SIGN_DIGIT = new RegExp(`([${CJK}])(\\+)([0-9])`, 'g');
// Flag: - attaches to a following single lowercase letter (-m). [a-z] keeps a capitalized word on the operator reading, and the trailing \b keeps a longer lowercase word there too
export const CJK_HYPHEN_FLAG = new RegExp(`([${CJK}])(\\-)([a-z])\\b`, 'g');
// Suffix: + attaches to a preceding half-width run (Disney+, 18+)
export const AN_PLUS_CJK = new RegExp(`([${AN}])(\\+)([${CJK}])`, 'g');

// < and > as comparison operators, not brackets
export const CJK_LESS_THAN = new RegExp(`([${CJK}])(<)([${AN}])`, 'g');
export const LESS_THAN_CJK = new RegExp(`([${AN}])(<)([${CJK}])`, 'g');
export const CJK_GREATER_THAN = new RegExp(`([${CJK}])(>)([${AN}])`, 'g');
export const GREATER_THAN_CJK = new RegExp(`([${AN}])(>)([${CJK}])`, 'g');

// Bracket patterns: ( ) [ ] { } plus < >, which also act as comparison operators
// The curly quotes \u201c and \u201d appear in CJK_LEFT_BRACKET/RIGHT_BRACKET_CJK, but the paired-quote patterns handle them primarily
// Legacy names: the two ..._BRACKET_... rules below hold only \u201c and \u201d in their "bracket" classes and have never matched a real bracket. Real brackets belong to CJK_LEFT_BRACKET,
// RIGHT_BRACKET_CJK, AN_LEFT_BRACKET, and RIGHT_BRACKET_AN
export const CJK_LEFT_BRACKET = new RegExp(`([${CJK}])([${LEFT_BRACKETS_EXTENDED}])`, 'g');
export const RIGHT_BRACKET_CJK = new RegExp(`([${RIGHT_BRACKETS_EXTENDED}])([${CJK}])`, 'g');
export const ANS_CJK_LEFT_BRACKET_ANY_RIGHT_BRACKET = new RegExp(`([${AN}${CJK}])[ ]*([\u201c])([${AN}${CJK}\\-_ ]+)([\u201d])`, 'g');
export const LEFT_BRACKET_ANY_RIGHT_BRACKET_ANS_CJK = new RegExp(`([\u201c])([${AN}${CJK}\\-_ ]+)([\u201d])[ ]*([${AN}${CJK}])`, 'g');
// Some input habits type both quotes of a pair as closing curly quotes (\u201d): the shape CJK\u201dCJK\u201d appears where CJK\u201cCJK\u201d was meant
// A \u201d only opens a \u201d...\u201d pair when no unclosed \u201c precedes it on the line (the lookbehind), otherwise it closes that \u201c
// Runs after RIGHT_BRACKET_CJK, so the [ ]* after the opener strips the space that rule just added inside the pair
// Not portable as a plain regex: the lookbehind is variable-length, which Python `re` and Go `regexp` reject. A port to those engines has to track the unclosed \u201c in code instead
export const ANS_CJK_RIGHT_QUOTE_ANY_RIGHT_QUOTE = new RegExp(`([${AN}${CJK}])[ ]*(?<![\u201c][^\u201c\u201d\n]*)([\u201d])[ ]*([${AN}${CJK}\\-_ ]+?)[ ]*([\u201d])`, 'g');

// A dotted name keeps its call parenthesis tight (`Math.floor(x)`, `array.map(fn)`), a bare name does not (`foo (x)`)
// Not portable as a plain regex: the lookbehind is variable-length, which Python `re` and Go `regexp` reject. A port to those engines has to detect the preceding dot in code instead
export const AN_LEFT_BRACKET = new RegExp(`([${AN}])(?<!\\.[${AN}]*)([${LEFT_BRACKETS_BASIC}])`, 'g');
export const RIGHT_BRACKET_AN = new RegExp(`([${RIGHT_BRACKETS_BASIC}])([${AN}])`, 'g');

export const CJK_UNIX_ABSOLUTE_FILE_PATH = new RegExp(`([${CJK}])(${UNIX_ABSOLUTE_FILE_PATH.source})`, 'g');
export const CJK_UNIX_RELATIVE_FILE_PATH = new RegExp(`([${CJK}])(${UNIX_RELATIVE_FILE_PATH.source})`, 'g');
export const CJK_WINDOWS_PATH = new RegExp(`([${CJK}])(${WINDOWS_FILE_PATH.source})`, 'g');

export const UNIX_ABSOLUTE_FILE_PATH_SLASH_CJK = new RegExp(`(${UNIX_ABSOLUTE_FILE_PATH.source}/)([${CJK}])`, 'g');
export const UNIX_RELATIVE_FILE_PATH_SLASH_CJK = new RegExp(`(${UNIX_RELATIVE_FILE_PATH.source}/)([${CJK}])`, 'g');

export const CJK_ANS = new RegExp(`([${CJK}])([${ANS_CJK_AFTER}])`, 'g');
export const ANS_CJK = new RegExp(`([${ANS_BEFORE_CJK}])([${CJK}])`, 'g');

export const S_A = new RegExp(`(%)([${A}])`, 'g');

export const MIDDLE_DOT = /([ ]*)([\u00b7\u2022\u2027])([ ]*)/g;

// A bare unpaired non-void tag amid prose is a tag mention, not markup: it reads as one unit and is spaced from CJK it directly touches
// A trailing self-closing slash is still bare, but void elements render on their own (<br> or <hr>), so they stay markup even unpaired
export const VOID_HTML_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
export const BARE_HTML_TAG = /^<([a-zA-Z][a-zA-Z0-9]*)\s*\/?>$/;
export const CLOSING_HTML_TAG = /<\/([a-zA-Z][a-zA-Z0-9]*)/g;

// Spacing at direct CJK contact with a tag mention placeholder (\uE002...\uE003)
export const CJK_HTML_TAG_MENTION = new RegExp(`([${CJK}])(?=\uE002)`, 'g');
export const HTML_TAG_MENTION_CJK = new RegExp(`(?<=\uE003)([${CJK}])`, 'g');

// Used by fixBracketSpacing to strip the spaces just inside a bracket pair; everything else between the brackets stays unchanged
export const BRACKET_PATTERNS = [
  { pattern: /<([^<>]*)>/g, open: '<', close: '>' },
  { pattern: /\(([^()]*)\)/g, open: '(', close: ')' },
  { pattern: /\[([^\[\]]*)\]/g, open: '[', close: ']' },
  { pattern: /\{([^{}]*)\}/g, open: '{', close: '}' },
];

export class PlaceholderReplacer {
  // Every spacingText() call creates instances from the same few fixed configs, so compiled patterns are cached and shared across instances
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
    this.version = '10.0.0';
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

    // Hide backtick content from the quote rules; the backticks themselves still get spacing
    const backtickManager = new PlaceholderReplacer('BACKTICK_CONTENT_', '\uE004', '\uE005');
    newText = newText.replace(/`([^`]+)`/g, (_match, content) => {
      return `\`${backtickManager.store(content)}\``;
    });

    const htmlTagManager = new PlaceholderReplacer('HTML_TAG_PLACEHOLDER_', '\uE000', '\uE001');
    const mentionedTagManager = new PlaceholderReplacer('HTML_TAG_MENTION_', '\uE002', '\uE003');
    let hasHtmlTags = false;

    if (newText.includes('<')) {
      hasHtmlTags = true;
      // Matches only opening, closing, and self-closing tags with a real tag name, so stray < > content is not read as a tag
      const HTML_TAG_PATTERN = /<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s+[^>]*)?>/g;

      // Tag names whose closing tag appears anywhere in the text: their opening tags are paired markup
      const closedTagNames = new Set<string>();
      for (const closingTag of newText.matchAll(CLOSING_HTML_TAG)) {
        closedTagNames.add(closingTag[1]!.toLowerCase());
      }

      // Hide every real tag behind a placeholder; attribute values get spacing first
      newText = newText.replace(HTML_TAG_PATTERN, (match) => {
        const bareTag = match.match(BARE_HTML_TAG);
        if (bareTag) {
          const tagName = bareTag[1]!.toLowerCase();
          if (!VOID_HTML_TAGS.has(tagName) && !closedTagNames.has(tagName)) {
            return mentionedTagManager.store(match);
          }
        }
        const processedTag = match.replace(/(\w+)="([^"]*)"/g, (_attrMatch, attrName, attrValue) => {
          const processedValue = this.spacingText(attrValue);
          return `${attrName}="${processedValue}"`;
        });

        return htmlTagManager.store(processedTag);
      });
    }

    // Dot runs go first, before the single-period rule
    newText = newText.replace(DOTS_CJK, '$1 $2');

    newText = newText.replace(CJK_PUNCTUATION, '$1$2 ');
    newText = newText.replace(PUNCTUATION_CJK, '$1 ');
    newText = newText.replace(CJK_TILDE, '$1$2 ');
    newText = newText.replace(CJK_TILDE_EQUALS, '$1 $2 ');
    newText = newText.replace(CJK_PERIOD, '$1$2 ');
    newText = newText.replace(AN_PERIOD_CJK, '$1$2 $3');
    newText = newText.replace(AN_COLON_CJK, '$1$2 $3');
    newText = newText.replace(FIX_CJK_COLON_ANS, '$1：$2');

    newText = newText.replace(CJK_QUOTE, '$1 $2');
    newText = newText.replace(QUOTE_CJK, '$1 $2');
    newText = newText.replace(FIX_QUOTE_ANY_QUOTE, '$1$2$3');

    newText = newText.replace(QUOTE_AN, '$1 $2');
    newText = newText.replace(CJK_QUOTE_AN, '$1$2 $3');

    newText = newText.replace(FIX_POSSESSIVE_SINGLE_QUOTE, "$1's");

    // Quoted pure-CJK content keeps its quotes tight, so hide it before the single-quote rules run
    const singleQuoteCJKManager = new PlaceholderReplacer('SINGLE_QUOTE_CJK_PLACEHOLDER_', '\uE030', '\uE031');

    newText = newText.replace(SINGLE_QUOTE_PURE_CJK, (match) => {
      return singleQuoteCJKManager.store(match);
    });

    newText = newText.replace(CJK_SINGLE_QUOTE_BUT_POSSESSIVE, '$1 $2');
    newText = newText.replace(SINGLE_QUOTE_CJK, '$1 $2');

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
          line = line.replace(CJK_HASH, '$1 $2');
          line = line.replace(HASH_CJK, '$1 $3');
        } else {
          // Multiple slashes read as a path: no hashtag spacing except a final hashtag not preceded by a slash
          line = line.replace(CJK_FINAL_HASHTAG, '$1$2 $3');
        }
        return line;
      })
      .join('\n');

    // Protect compound words from operator spacing
    const compoundWordManager = new PlaceholderReplacer('COMPOUND_WORD_PLACEHOLDER_', '\uE010', '\uE011');

    // Hyphen-joined alphanumeric runs that read as one name, for example state-of-the-art, GPT-4o, claude-4-opus. Qualifies when a part carries a lowercase letter, or when the hyphen joins an
    // all-letters part to an all-digits part (GPT-5), or a letters-plus-digits part to anything (GPT4o-mini). An all-uppercase pair like ABC-DEF does not qualify
    const COMPOUND_WORD_PATTERN = /\b(?:[A-Za-z0-9]*[a-z][A-Za-z0-9]*-[A-Za-z0-9]+|[A-Za-z0-9]+-[A-Za-z0-9]*[a-z][A-Za-z0-9]*|[A-Za-z]+-[0-9]+|[A-Za-z]+[0-9]+-[A-Za-z0-9]+)(?:-[A-Za-z0-9]+)*\b/g;

    newText = newText.replace(COMPOUND_WORD_PATTERN, (match) => {
      return compoundWordManager.store(match);
    });

    // Single-letter grades run before the general operator rules so A+CJK becomes A+ CJK, not A + CJK
    newText = newText.replace(SINGLE_LETTER_GRADE_CJK, '$1$2 $3');

    // Affix readings run before the operator rules so the symbol stays attached to its half-width side
    newText = newText.replace(CJK_SIGN_DIGIT, '$1 $2$3');
    newText = newText.replace(CJK_HYPHEN_FLAG, '$1 $2$3');
    newText = newText.replace(AN_PLUS_CJK, '$1$2 $3');

    newText = newText.replace(CJK_OPERATOR_ANS, '$1 $2 $3');
    newText = newText.replace(ANS_OPERATOR_CJK, '$1 $2 $3');

    newText = newText.replace(CJK_LESS_THAN, '$1 $2 $3');
    newText = newText.replace(LESS_THAN_CJK, '$1 $2 $3');
    newText = newText.replace(CJK_GREATER_THAN, '$1 $2 $3');
    newText = newText.replace(GREATER_THAN_CJK, '$1 $2 $3');

    newText = newText.replace(CJK_UNIX_ABSOLUTE_FILE_PATH, '$1 $2');
    newText = newText.replace(CJK_UNIX_RELATIVE_FILE_PATH, '$1 $2');
    newText = newText.replace(CJK_WINDOWS_PATH, '$1 $2');

    newText = newText.replace(UNIX_ABSOLUTE_FILE_PATH_SLASH_CJK, '$1 $2');
    newText = newText.replace(UNIX_RELATIVE_FILE_PATH_SLASH_CJK, '$1 $2');

    // Slash reading is per line: the line's only slash acts as an operator when CJK touches it. Repeated slashes read as a file path or a list and get no spaces
    // A slash between half-width characters binds tight as a slash token, so no rule fires on it; file paths need no extra protection because the path rules already spaced their CJK edges
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

    // Pipe reading is per line: a pipe in direct CJK contact makes every pipe on the line a separator with spaces on both sides (CJK | CJK, as in concatenated page titles)
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

    // Plus reading is per line: a plus in direct contact with CJK makes every undecided plus on the line a separator with spaces on both sides, as in telecom bundle plans that chain products with +
    // A decided plus keeps its reading: space-adjacent, affix-attached (Disney+, +886), or in a ++ run (C++). A line with no CJK contact keeps its joiner tokens tight (A+B, 5+5)
    newText = newText
      .split('\n')
      .map((line) => {
        if (!PLUS_CJK_CONTACT.test(line)) {
          return line;
        }
        return line.replace(PLUS_SEPARATOR, ' + ');
      })
      .join('\n');

    // A pipe/plus separator space can land just inside a closing quote; re-strip so the first pass already emits what a second pass would (idempotency)
    newText = newText.replace(FIX_QUOTE_ANY_QUOTE, '$1$2$3');

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

    newText = this.fixBracketSpacing(newText);

    if (hasHtmlTags) {
      // A tag mention reads as one unit: space it from CJK it directly touches
      newText = newText.replace(CJK_HTML_TAG_MENTION, '$1 ');
      newText = newText.replace(HTML_TAG_MENTION_CJK, ' $1');
      newText = mentionedTagManager.restore(newText);
      newText = htmlTagManager.restore(newText);
    }

    newText = backtickManager.restore(newText);

    return newText;
  }

  public hasProperSpacing(text: string) {
    return this.spacingText(text) === text;
  }

  // Strip the spaces that earlier rules left just inside a bracket pair: no space after an opening bracket or before a closing bracket
  private fixBracketSpacing(text: string) {
    for (const { pattern, open, close } of BRACKET_PATTERNS) {
      text = text.replace(pattern, (_match, innerContent) => {
        if (!innerContent) {
          return `${open}${close}`;
        }
        const trimmedContent = innerContent.replace(/^ +| +$/g, '');
        return `${open}${trimmedContent}${close}`;
      });
    }
    return text;
  }
}

export const pangu = new Pangu();
