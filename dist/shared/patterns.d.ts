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
export declare const CJK = "\u2E80-\u2EFF\u2F00-\u2FDF\u3040-\u309F\u30A0-\u30FA\u30FC-\u30FF\u3100-\u312F\u3200-\u32FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF";
export declare const AN = "A-Za-z0-9";
export declare const A = "A-Za-z";
export declare const UNIX_ABSOLUTE_FILE_PATH: RegExp;
export declare const UNIX_RELATIVE_FILE_PATH: RegExp;
export declare const ANY_CJK: RegExp;
export declare const CJK_PUNCTUATION: RegExp;
export declare const AN_PUNCTUATION_CJK: RegExp;
export declare const CJK_TILDE: RegExp;
export declare const CJK_TILDE_EQUALS: RegExp;
export declare const CJK_PERIOD: RegExp;
export declare const AN_PERIOD_CJK: RegExp;
export declare const AN_COLON_CJK: RegExp;
export declare const DOTS_CJK: RegExp;
export declare const FIX_CJK_COLON_ANS: RegExp;
export declare const CJK_QUOTE: RegExp;
export declare const QUOTE_CJK: RegExp;
export declare const FIX_QUOTE_ANY_QUOTE: RegExp;
export declare const QUOTE_AN: RegExp;
export declare const CJK_QUOTE_AN: RegExp;
export declare const CJK_SINGLE_QUOTE_BUT_POSSESSIVE: RegExp;
export declare const SINGLE_QUOTE_CJK: RegExp;
export declare const FIX_POSSESSIVE_SINGLE_QUOTE: RegExp;
export declare const HASH_ANS_CJK_HASH: RegExp;
export declare const CJK_HASH: RegExp;
export declare const HASH_CJK: RegExp;
export declare const CJK_OPERATOR_ANS: RegExp;
export declare const ANS_OPERATOR_CJK: RegExp;
export declare const ANS_OPERATOR_ANS: RegExp;
export declare const ANS_HYPHEN_ANS_NOT_COMPOUND: RegExp;
export declare const CJK_SLASH_CJK: RegExp;
export declare const CJK_SLASH_ANS: RegExp;
export declare const ANS_SLASH_CJK: RegExp;
export declare const ANS_SLASH_ANS: RegExp;
export declare const SINGLE_LETTER_GRADE_CJK: RegExp;
export declare const CJK_LESS_THAN: RegExp;
export declare const LESS_THAN_CJK: RegExp;
export declare const CJK_GREATER_THAN: RegExp;
export declare const GREATER_THAN_CJK: RegExp;
export declare const ANS_LESS_THAN_ANS: RegExp;
export declare const ANS_GREATER_THAN_ANS: RegExp;
export declare const CJK_LEFT_BRACKET: RegExp;
export declare const RIGHT_BRACKET_CJK: RegExp;
export declare const ANS_CJK_LEFT_BRACKET_ANY_RIGHT_BRACKET: RegExp;
export declare const LEFT_BRACKET_ANY_RIGHT_BRACKET_ANS_CJK: RegExp;
export declare const AN_LEFT_BRACKET: RegExp;
export declare const RIGHT_BRACKET_AN: RegExp;
export declare const CJK_UNIX_ABSOLUTE_FILE_PATH: RegExp;
export declare const CJK_UNIX_RELATIVE_FILE_PATH: RegExp;
export declare const CJK_WINDOWS_PATH: RegExp;
export declare const UNIX_ABSOLUTE_FILE_PATH_SLASH_CJK: RegExp;
export declare const UNIX_RELATIVE_FILE_PATH_SLASH_CJK: RegExp;
export declare const CJK_ANS: RegExp;
export declare const ANS_CJK: RegExp;
export declare const S_A: RegExp;
export declare const MIDDLE_DOT: RegExp;
export declare const COMPOUND_WORD_PATTERN: RegExp;
export declare const HTML_TAG_PATTERN: RegExp;
export declare const SINGLE_QUOTE_PURE_CJK: RegExp;
export declare const BACKTICK_PATTERN: RegExp;
export declare const HTML_ATTR_PATTERN: RegExp;
