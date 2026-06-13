/**
 * Patterns — all regex patterns for CJK text spacing.
 *
 * CJK is short for Chinese, Japanese, and Korean:
 * \u2e80-\u2eff CJK Radicals Supplement
 * \u2f00-\u2fdf Kangxi Radicals
 * \u3040-\u309f Hiragana
 * \u30a0-\u30ff Katakana
 * \u3100-\u312f Bopomofo
 * \u3200-\u32ff Enclosed CJK Letters and Months
 * \u3400-\u4dbf CJK Unified Ideographs Extension A
 * \u4e00-\u9fff CJK Unified Ideographs
 * \uf900-\ufaff CJK Compatibility Ideographs
 *
 * ANS is short for Alphabets, Numbers, and Symbols:
 * A includes A-Za-z\u0370-\u03ff
 * N includes 0-9
 * S includes `~!@#$%^&*()-_=+[]{}\|;:'",<.>/?
 *
 * All J below does not include \u30fb
 * Some S below does not include all symbols
 *
 * For more information about Unicode blocks, see
 * https://symbl.cc/en/unicode-table/
 */

// ─── Character class constants ─────────────────────────────────────────────────

export const CJK = '\u2e80-\u2eff\u2f00-\u2fdf\u3040-\u309f\u30a0-\u30fa\u30fc-\u30ff\u3100-\u312f\u3200-\u32ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff';

export const AN = 'A-Za-z0-9';
export const A = 'A-Za-z';
const UPPER_AN = 'A-Z0-9'; // For FIX_CJK_COLON_ANS

// ─── Operator sets ──────────────────────────────────────────────────────────────

const OPERATORS_BASE = '\\+\\*=&';
const OPERATORS_WITH_HYPHEN = `${OPERATORS_BASE}\\-`; // For CJK patterns
const OPERATORS_NO_HYPHEN = OPERATORS_BASE; // For ANS_OPERATOR_ANS only
const GRADE_OPERATORS = '\\+\\-\\*'; // For single letter grades

// ─── Quote characters ──────────────────────────────────────────────────────────

const QUOTES = '\`"\u05f4'; // Backtick, straight quote, Hebrew punctuation

// ─── Bracket sets ───────────────────────────────────────────────────────────────

const LEFT_BRACKETS_BASIC = '\\(\\[\\{'; // For AN_LEFT_BRACKET
const RIGHT_BRACKETS_BASIC = '\\)\\]\\}'; // For RIGHT_BRACKET_AN
const LEFT_BRACKETS_EXTENDED = '\\(\\[\\{<>\u201c'; // For CJK_LEFT_BRACKET (includes angle brackets + curly quote)
const RIGHT_BRACKETS_EXTENDED = '\\)\\]\\}<>\u201d'; // For RIGHT_BRACKET_CJK

// ─── ANS extended sets ──────────────────────────────────────────────────────────

// CAREFUL: different symbols!
const ANS_CJK_AFTER = `${A}\u0370-\u03ff0-9@\\$%\\^&\\*\\-\\+\\\\=\u00a1-\u00ff\u2150-\u218f\u2700—\u27bf`; // Has @, no punctuation
const ANS_BEFORE_CJK = `${A}\u0370-\u03ff0-9\\$%\\^&\\*\\-\\+\\\\=\u00a1-\u00ff\u2150-\u218f\u2700—\u27bf`; // No @ symbol

// ─── File path patterns ─────────────────────────────────────────────────────────

// prettier-ignore
const FILE_PATH_DIRS = 'home|root|usr|etc|var|opt|tmp|dev|mnt|proc|sys|bin|boot|lib|media|run|sbin|srv|node_modules|path|project|src|dist|test|tests|docs|templates|assets|public|static|config|scripts|tools|build|out|target|your|\\.claude|\\.git|\\.vscode';
const FILE_PATH_CHARS = '[A-Za-z0-9_\\-\\.@\\+\\*]+';

// Unix absolute paths: system dirs + common project paths
// Examples: /home, /usr/bin, /etc/nginx.conf, /.bashrc, /node_modules/@babel/core, /path/to/your/project
export const UNIX_ABSOLUTE_FILE_PATH = new RegExp(`/(?:\\.?(?:${FILE_PATH_DIRS})|\\.(?:[A-Za-z0-9_\\-]+))(?:/${FILE_PATH_CHARS})*`);

// Unix relative paths common in documentation and blog posts
// Examples: src/main.py, dist/index.js, test/spec.js, ./.claude/CLAUDE.md, templates/*.html
export const UNIX_RELATIVE_FILE_PATH = new RegExp(`(?:\\./)?(?:${FILE_PATH_DIRS})(?:/${FILE_PATH_CHARS})+`);

// Windows paths: C:\Users\name\, D:\Program Files\, C:\Windows\System32
const WINDOWS_FILE_PATH = /[A-Z]:\\(?:[A-Za-z0-9_\-\. ]+\\?)+/;

// ─── Core detection pattern ─────────────────────────────────────────────────────

export const ANY_CJK = new RegExp(`[${CJK}]`);

// ─── Punctuation patterns ───────────────────────────────────────────────────────

// Handle punctuation after CJK - add space but don't convert to full-width
// Support multiple consecutive punctuation marks
// Only add space if followed by CJK, letters, or numbers (not at end of text or before same punctuation)
export const CJK_PUNCTUATION = new RegExp(`([${CJK}])([!;,\\?:]+)(?=[${CJK}${AN}])`, 'g');
// Handle punctuation between AN and CJK - add space after punctuation
export const AN_PUNCTUATION_CJK = new RegExp(`([${AN}])([!;,\\?]+)([${CJK}])`, 'g');
// Handle tilde separately for special cases like ~=
// Only add space if followed by CJK, letters, or numbers (not at end of text)
export const CJK_TILDE = new RegExp(`([${CJK}])(~+)(?!=)(?=[${CJK}${AN}])`, 'g');
export const CJK_TILDE_EQUALS = new RegExp(`([${CJK}])(~=)`, 'g');
// Handle period separately to avoid matching file extensions, multiple dots, and file paths
// Note: Multiple dots are handled by DOTS_CJK pattern first
// Only add space if followed by CJK, letters, or numbers (not at end of text)
export const CJK_PERIOD = new RegExp(`([${CJK}])(\\.)(?![${AN}\\./])(?=[${CJK}${AN}])`, 'g');
// Handle period between AN and CJK - avoid file extensions
export const AN_PERIOD_CJK = new RegExp(`([${AN}])(\\.)([${CJK}])`, 'g');
// Handle colon between AN and CJK
export const AN_COLON_CJK = new RegExp(`([${AN}])(:)([${CJK}])`, 'g');
export const DOTS_CJK = new RegExp(`([\\.]{2,}|\u2026)([${CJK}])`, 'g');
// Special case for colon before uppercase letters/parentheses (convert to full-width)
export const FIX_CJK_COLON_ANS = new RegExp(`([${CJK}])\\:([${UPPER_AN}\\(\\)])`, 'g');

// ─── Quote patterns ─────────────────────────────────────────────────────────────

// The symbol part does not include '
export const CJK_QUOTE = new RegExp(`([${CJK}])([${QUOTES}])`, 'g');
export const QUOTE_CJK = new RegExp(`([${QUOTES}])([${CJK}])`, 'g');
export const FIX_QUOTE_ANY_QUOTE = new RegExp(`([${QUOTES}]+)[ ]*(.+?)[ ]*([${QUOTES}]+)`, 'g');

// Handle curly quotes with alphanumeric characters
// These patterns should only apply to curly quotes, not straight quotes
// Straight quotes are already handled by CJK_QUOTE, QUOTE_CJK and FIX_QUOTE_ANY_QUOTE
export const QUOTE_AN = new RegExp(`([\u201d])([${AN}])`, 'g'); // Only closing curly quotes + AN

// Special handling for straight quotes followed by alphanumeric after CJK
// This catches patterns like: 中文"ABC where the quote appears to be closing a quoted CJK phrase
export const CJK_QUOTE_AN = new RegExp(`([${CJK}])(")([${AN}])`, 'g');

export const CJK_SINGLE_QUOTE_BUT_POSSESSIVE = new RegExp(`([${CJK}])('[^s])`, 'g');
export const SINGLE_QUOTE_CJK = new RegExp(`(')([${CJK}])`, 'g');
export const FIX_POSSESSIVE_SINGLE_QUOTE = new RegExp(`([${AN}${CJK}])( )('s)`, 'g');

// ─── Hash/hashtag patterns ──────────────────────────────────────────────────────

export const HASH_ANS_CJK_HASH = new RegExp(`([${CJK}])(#)([${CJK}]+)(#)([${CJK}])`, 'g');
export const CJK_HASH = new RegExp(`([${CJK}])(#([^ ]))`, 'g');
export const HASH_CJK = new RegExp(`(([^ ])#)([${CJK}])`, 'g');

// ─── Operator patterns ──────────────────────────────────────────────────────────

// The symbol part only includes + - * = & (excluding | / < >)
export const CJK_OPERATOR_ANS = new RegExp(`([${CJK}])([${OPERATORS_WITH_HYPHEN}])([${AN}])`, 'g');
export const ANS_OPERATOR_CJK = new RegExp(`([${AN}])([${OPERATORS_WITH_HYPHEN}])([${CJK}])`, 'g');
// Handle operators between alphanumeric characters when CJK is present in text
// Note: This pattern excludes hyphens entirely (only + * = &) to avoid conflicts with compound words
export const ANS_OPERATOR_ANS = new RegExp(`([${AN}])([${OPERATORS_NO_HYPHEN}])([${AN}])`, 'g');

// Hyphens that should be treated as operators (with spaces) rather than word connectors
// This regex has 3 patterns to catch different cases while preserving compound words:
// 1. Letter-Letter/Number: A-B, X-5 (spaces added) BUT NOT co-author, X-ray, GPT-5 (preserved)
// 2. Mixed alphanumeric-number patterns that aren't already protected as compound words
// 3. Number-Letter: 5-A, 3-B (spaces added) BUT NOT 5-year, 2016-12-26 (preserved)
// Note: Patterns like GPT4-5, v1-2 are protected by COMPOUND_WORD_PATTERN and won't get spaces
// The negative lookahead (?![a-z]) prevents matching hyphens followed by lowercase letters
export const ANS_HYPHEN_ANS_NOT_COMPOUND = new RegExp(`([A-Za-z])(-(?![a-z]))([A-Za-z0-9])|([A-Za-z]+[0-9]+)(-(?![a-z]))([0-9])|([0-9])(-(?![a-z0-9]))([A-Za-z])`, 'g');

// ─── Slash patterns ─────────────────────────────────────────────────────────────

// Slash patterns for operator vs separator behavior
export const CJK_SLASH_CJK = new RegExp(`([${CJK}])([/])([${CJK}])`, 'g');
export const CJK_SLASH_ANS = new RegExp(`([${CJK}])([/])([${AN}])`, 'g');
export const ANS_SLASH_CJK = new RegExp(`([${AN}])([/])([${CJK}])`, 'g');
export const ANS_SLASH_ANS = new RegExp(`([${AN}])([/])([${AN}])`, 'g');

// ─── Grade operator patterns ────────────────────────────────────────────────────

// Special handling for single letter grades/ratings (A+, B-, C*) before CJK
// These should have space after the operator, not before
// Use word boundary to ensure it's a single letter, not part of a longer word
export const SINGLE_LETTER_GRADE_CJK = new RegExp(`\\b([${A}])([${GRADE_OPERATORS}])([${CJK}])`, 'g');

// ─── Comparison operator patterns ───────────────────────────────────────────────

// Special handling for < and > as comparison operators (not brackets)
export const CJK_LESS_THAN = new RegExp(`([${CJK}])(<)([${AN}])`, 'g');
export const LESS_THAN_CJK = new RegExp(`([${AN}])(<)([${CJK}])`, 'g');
export const CJK_GREATER_THAN = new RegExp(`([${CJK}])(>)([${AN}])`, 'g');
export const GREATER_THAN_CJK = new RegExp(`([${AN}])(>)([${CJK}])`, 'g');
// Handle < and > between alphanumeric characters when CJK is present in text
export const ANS_LESS_THAN_ANS = new RegExp(`([${AN}])(<)([${AN}])`, 'g');
export const ANS_GREATER_THAN_ANS = new RegExp(`([${AN}])(>)([${AN}])`, 'g');

// ─── Bracket patterns ───────────────────────────────────────────────────────────

// Bracket patterns: ( ) [ ] { } and also < > (though < > are also handled as operators separately)
// Note: The curly quotes " " (\u201c \u201d) appear in CJK_LEFT_BRACKET/RIGHT_BRACKET_CJK but are primarily handled in the patterns below
export const CJK_LEFT_BRACKET = new RegExp(`([${CJK}])([${LEFT_BRACKETS_EXTENDED}])`, 'g');
export const RIGHT_BRACKET_CJK = new RegExp(`([${RIGHT_BRACKETS_EXTENDED}])([${CJK}])`, 'g');
export const ANS_CJK_LEFT_BRACKET_ANY_RIGHT_BRACKET = new RegExp(`([${AN}${CJK}])[ ]*([\u201c])([${AN}${CJK}\\-_ ]+)([\u201d])`, 'g');
export const LEFT_BRACKET_ANY_RIGHT_BRACKET_ANS_CJK = new RegExp(`([\u201c])([${AN}${CJK}\\-_ ]+)([\u201d])[ ]*([${AN}${CJK}])`, 'g');

export const AN_LEFT_BRACKET = new RegExp(`([${AN}])(?<!\\.[${AN}]*)([${LEFT_BRACKETS_BASIC}])`, 'g');
export const RIGHT_BRACKET_AN = new RegExp(`([${RIGHT_BRACKETS_BASIC}])([${AN}])`, 'g');

// ─── File path spacing patterns ─────────────────────────────────────────────────

// Special patterns for filesystem paths after CJK
export const CJK_UNIX_ABSOLUTE_FILE_PATH = new RegExp(`([${CJK}])(${UNIX_ABSOLUTE_FILE_PATH.source})`, 'g');
export const CJK_UNIX_RELATIVE_FILE_PATH = new RegExp(`([${CJK}])(${UNIX_RELATIVE_FILE_PATH.source})`, 'g');
export const CJK_WINDOWS_PATH = new RegExp(`([${CJK}])(${WINDOWS_FILE_PATH.source})`, 'g');

// Pattern for Unix paths ending with / followed by CJK
export const UNIX_ABSOLUTE_FILE_PATH_SLASH_CJK = new RegExp(`(${UNIX_ABSOLUTE_FILE_PATH.source}/)([${CJK}])`, 'g');
export const UNIX_RELATIVE_FILE_PATH_SLASH_CJK = new RegExp(`(${UNIX_RELATIVE_FILE_PATH.source}/)([${CJK}])`, 'g');

// ─── Core spacing patterns ──────────────────────────────────────────────────────

export const CJK_ANS = new RegExp(`([${CJK}])([${ANS_CJK_AFTER}])`, 'g');
export const ANS_CJK = new RegExp(`([${ANS_BEFORE_CJK}])([${CJK}])`, 'g');

export const S_A = new RegExp(`(%)([${A}])`, 'g');

export const MIDDLE_DOT = /([ ]*)([\u00b7\u2022\u2027])([ ]*)/g;

// ─── Compound word pattern ──────────────────────────────────────────────────────

// Pattern to detect compound words: alphanumeric-alphanumeric combinations that look like compound words/product names
// Examples: state-of-the-art, machine-learning, GPT-4o, real-time, end-to-end, gpt-4o, GPT-5, claude-4-opus
// Match: word-word(s) where at least one part contains lowercase letters OR contains mix of letters and numbers (like GPT-5)
export const COMPOUND_WORD_PATTERN = /\b(?:[A-Za-z0-9]*[a-z][A-Za-z0-9]*-[A-Za-z0-9]+|[A-Za-z0-9]+-[A-Za-z0-9]*[a-z][A-Za-z0-9]*|[A-Za-z]+-[0-9]+|[A-Za-z]+[0-9]+-[A-Za-z0-9]+)(?:-[A-Za-z0-9]+)*\b/g;

// ─── HTML tag pattern ───────────────────────────────────────────────────────────

export const HTML_TAG_PATTERN = /<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s+[^>]*)?>/g;

// ─── Single quote pure CJK pattern ─────────────────────────────────────────────

export const SINGLE_QUOTE_PURE_CJK = new RegExp(`(')([${CJK}]+)(')`, 'g');

// ─── Backtick pattern ───────────────────────────────────────────────────────────

export const BACKTICK_PATTERN = /`([^`]+)`/g;

// ─── HTML attribute pattern ────────────────────────────────────────────────────

export const HTML_ATTR_PATTERN = /(\w+)="([^"]*)"/g;
