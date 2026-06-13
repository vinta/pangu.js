import { PlaceholderReplacer } from './placeholder-replacer';
import {
  CJK,
  ANY_CJK,
  DOTS_CJK,
  CJK_PUNCTUATION,
  AN_PUNCTUATION_CJK,
  CJK_TILDE,
  CJK_TILDE_EQUALS,
  CJK_PERIOD,
  AN_PERIOD_CJK,
  AN_COLON_CJK,
  FIX_CJK_COLON_ANS,
  CJK_QUOTE,
  QUOTE_CJK,
  FIX_QUOTE_ANY_QUOTE,
  QUOTE_AN,
  CJK_QUOTE_AN,
  FIX_POSSESSIVE_SINGLE_QUOTE,
  SINGLE_QUOTE_PURE_CJK,
  CJK_SINGLE_QUOTE_BUT_POSSESSIVE,
  SINGLE_QUOTE_CJK,
  HASH_ANS_CJK_HASH,
  CJK_HASH,
  HASH_CJK,
  COMPOUND_WORD_PATTERN,
  SINGLE_LETTER_GRADE_CJK,
  CJK_OPERATOR_ANS,
  ANS_OPERATOR_CJK,
  ANS_OPERATOR_ANS,
  ANS_HYPHEN_ANS_NOT_COMPOUND,
  CJK_LESS_THAN,
  LESS_THAN_CJK,
  CJK_GREATER_THAN,
  GREATER_THAN_CJK,
  ANS_LESS_THAN_ANS,
  ANS_GREATER_THAN_ANS,
  CJK_UNIX_ABSOLUTE_FILE_PATH,
  CJK_UNIX_RELATIVE_FILE_PATH,
  CJK_WINDOWS_PATH,
  UNIX_ABSOLUTE_FILE_PATH_SLASH_CJK,
  UNIX_RELATIVE_FILE_PATH_SLASH_CJK,
  UNIX_ABSOLUTE_FILE_PATH,
  UNIX_RELATIVE_FILE_PATH,
  CJK_SLASH_CJK,
  CJK_SLASH_ANS,
  ANS_SLASH_CJK,
  ANS_SLASH_ANS,
  CJK_LEFT_BRACKET,
  RIGHT_BRACKET_CJK,
  ANS_CJK_LEFT_BRACKET_ANY_RIGHT_BRACKET,
  LEFT_BRACKET_ANY_RIGHT_BRACKET_ANS_CJK,
  AN_LEFT_BRACKET,
  RIGHT_BRACKET_AN,
  CJK_ANS,
  ANS_CJK,
  S_A,
  MIDDLE_DOT,
  HTML_TAG_PATTERN,
  HTML_ATTR_PATTERN,
  BACKTICK_PATTERN,
} from './patterns';

export class Pangu {
  version: string;

  constructor() {
    this.version = '7.2.1';
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

    // Step 1: Protect backtick content from quote processing but allow spacing around backticks
    const backtickManager = new PlaceholderReplacer('BACKTICK_CONTENT_', '\uE004', '\uE005');
    newText = newText.replace(BACKTICK_PATTERN, (_match, content) => {
      return `\`${backtickManager.store(content)}\``;
    });

    // Step 2: Protect HTML tags with placeholder replacement
    const htmlTagManager = new PlaceholderReplacer('HTML_TAG_PLACEHOLDER_', '\uE000', '\uE001');
    let hasHtmlTags = false;
    if (newText.includes('<')) {
      hasHtmlTags = true;
      newText = newText.replace(HTML_TAG_PATTERN, (match) => {
        const processedTag = match.replace(HTML_ATTR_PATTERN, (_attrMatch, attrName, attrValue) => {
          const processedValue = this.spacingText(attrValue);
          return `${attrName}="${processedValue}"`;
        });
        return htmlTagManager.store(processedTag);
      });
    }

    // Step 3: Apply punctuation spacing (dots, periods, colons, tildes, etc.)
    newText = this.applyPunctuationSpacing(newText);

    // Step 4: Apply quote spacing (double, single, curly quotes)
    const singleQuoteCJKManager = new PlaceholderReplacer('SINGLE_QUOTE_CJK_PLACEHOLDER_', '\uE030', '\uE031');
    newText = this.applyQuoteSpacing(newText, singleQuoteCJKManager);

    // Step 5: Apply hash/hashtag spacing (context-aware with slash count)
    const slashCount = (newText.match(/\//g) || []).length;
    newText = this.applyHashSpacing(newText, slashCount);

    // Step 6: Protect compound words and apply operator spacing
    const compoundWordManager = new PlaceholderReplacer('COMPOUND_WORD_PLACEHOLDER_', '\uE010', '\uE011');
    newText = newText.replace(COMPOUND_WORD_PATTERN, (match) => {
      return compoundWordManager.store(match);
    });
    newText = this.applyOperatorSpacing(newText);

    // Step 7: Apply comparison operator spacing (< >)
    newText = this.applyComparisonOperatorSpacing(newText);

    // Step 8: Apply file path spacing
    newText = this.applyFilePathSpacing(newText);

    // Step 9: Apply context-aware slash spacing
    newText = this.applySlashSpacing(newText, slashCount);

    // Step 10: Restore compound words from placeholders
    newText = compoundWordManager.restore(newText);

    // Step 11: Apply bracket spacing
    newText = this.applyBracketSpacing(newText);

    // Step 12: Apply core CJK-ANS and ANS-CJK spacing, plus percent and middle dot
    newText = newText.replace(CJK_ANS, '$1 $2');
    newText = newText.replace(ANS_CJK, '$1 $2');
    newText = newText.replace(S_A, '$1 $2');
    newText = newText.replace(MIDDLE_DOT, '・');

    // Step 13: Fix bracket inner spacing
    newText = this.fixBracketInnerSpacing(newText);

    // Step 14: Restore HTML tags from placeholders
    if (hasHtmlTags) {
      newText = htmlTagManager.restore(newText);
    }

    // Step 15: Restore backtick content
    newText = backtickManager.restore(newText);

    return newText;
  }

  public hasProperSpacing(text: string) {
    return this.spacingText(text) === text;
  }

  // ─── Private spacing step methods ─────────────────────────────────────────────

  private applyPunctuationSpacing(text: string): string {
    let result = text;

    // Handle multiple dots first (before single period)
    result = result.replace(DOTS_CJK, '$1 $2');

    // Handle punctuation after CJK - add space but don't convert to full-width
    result = result.replace(CJK_PUNCTUATION, '$1$2 ');
    // Handle punctuation between AN and CJK
    result = result.replace(AN_PUNCTUATION_CJK, '$1$2 $3');
    // Handle tilde separately for special cases
    result = result.replace(CJK_TILDE, '$1$2 ');
    result = result.replace(CJK_TILDE_EQUALS, '$1 $2 ');
    // Handle period separately to avoid file extensions
    result = result.replace(CJK_PERIOD, '$1$2 ');
    result = result.replace(AN_PERIOD_CJK, '$1$2 $3');
    // Handle colon between AN and CJK
    result = result.replace(AN_COLON_CJK, '$1$2 $3');
    // Only convert colon to full-width in specific cases (before uppercase/parentheses)
    result = result.replace(FIX_CJK_COLON_ANS, '$1：$2');

    return result;
  }

  private applyQuoteSpacing(text: string, singleQuoteCJKManager: PlaceholderReplacer): string {
    let result = text;

    result = result.replace(CJK_QUOTE, '$1 $2');
    result = result.replace(QUOTE_CJK, '$1 $2');
    result = result.replace(FIX_QUOTE_ANY_QUOTE, '$1$2$3');

    // Handle quotes with alphanumeric - closing quotes followed by AN need space
    result = result.replace(QUOTE_AN, '$1 $2');

    // Handle CJK followed by closing quote followed by alphanumeric
    result = result.replace(CJK_QUOTE_AN, '$1$2 $3');

    // Handle single quotes more intelligently
    // First, handle possessive case
    result = result.replace(FIX_POSSESSIVE_SINGLE_QUOTE, "$1's");

    // Protect pure CJK content in single quotes
    result = result.replace(SINGLE_QUOTE_PURE_CJK, (match) => {
      return singleQuoteCJKManager.store(match);
    });

    // Now process other single quote patterns
    result = result.replace(CJK_SINGLE_QUOTE_BUT_POSSESSIVE, '$1 $2');
    result = result.replace(SINGLE_QUOTE_CJK, '$1 $2');

    // Restore protected pure CJK content
    result = singleQuoteCJKManager.restore(result);

    return result;
  }

  private applyHashSpacing(text: string, slashCount: number): string {
    let result = text;
    const textLength = result.length;

    if (slashCount <= 1) {
      // Apply normal hashtag spacing without slash considerations
      if (textLength >= 5) {
        result = result.replace(HASH_ANS_CJK_HASH, '$1 $2$3$4 $5');
      }
      result = result.replace(CJK_HASH, '$1 $2');
      result = result.replace(HASH_CJK, '$1 $3');
    } else {
      // Multiple slashes - skip hashtag processing to preserve path structure
      // But add space before final hashtag if it's not preceded by a slash
      if (textLength >= 5) {
        result = result.replace(HASH_ANS_CJK_HASH, '$1 $2$3$4 $5');
      }
      result = result.replace(new RegExp(`([^/])([${CJK}])(#[A-Za-z0-9]+)$`), '$1$2 $3');
    }

    return result;
  }

  private applyOperatorSpacing(text: string): string {
    let result = text;

    // Handle single letter grades (A+, B-, etc.) before general operator rules
    result = result.replace(SINGLE_LETTER_GRADE_CJK, '$1$2 $3');

    result = result.replace(CJK_OPERATOR_ANS, '$1 $2 $3');
    result = result.replace(ANS_OPERATOR_CJK, '$1 $2 $3');
    result = result.replace(ANS_OPERATOR_ANS, '$1 $2 $3');
    result = result.replace(ANS_HYPHEN_ANS_NOT_COMPOUND, (match, ...groups) => {
      if (groups[0] && groups[1] && groups[2]) {
        return `${groups[0]} ${groups[1]} ${groups[2]}`;
      } else if (groups[3] && groups[4] && groups[5]) {
        return `${groups[3]} ${groups[4]} ${groups[5]}`;
      } else if (groups[6] && groups[7] && groups[8]) {
        return `${groups[6]} ${groups[7]} ${groups[8]}`;
      }
      return match;
    });

    return result;
  }

  private applyComparisonOperatorSpacing(text: string): string {
    let result = text;

    result = result.replace(CJK_LESS_THAN, '$1 $2 $3');
    result = result.replace(LESS_THAN_CJK, '$1 $2 $3');
    result = result.replace(ANS_LESS_THAN_ANS, '$1 $2 $3');
    result = result.replace(CJK_GREATER_THAN, '$1 $2 $3');
    result = result.replace(GREATER_THAN_CJK, '$1 $2 $3');
    result = result.replace(ANS_GREATER_THAN_ANS, '$1 $2 $3');

    return result;
  }

  private applyFilePathSpacing(text: string): string {
    let result = text;

    // Add space before filesystem paths after CJK
    result = result.replace(CJK_UNIX_ABSOLUTE_FILE_PATH, '$1 $2');
    result = result.replace(CJK_UNIX_RELATIVE_FILE_PATH, '$1 $2');
    result = result.replace(CJK_WINDOWS_PATH, '$1 $2');

    // Add space after Unix paths ending with / before CJK
    result = result.replace(UNIX_ABSOLUTE_FILE_PATH_SLASH_CJK, '$1 $2');
    result = result.replace(UNIX_RELATIVE_FILE_PATH_SLASH_CJK, '$1 $2');

    return result;
  }

  private applySlashSpacing(text: string, slashCount: number): string {
    let result = text;

    // Context-aware slash handling: single slash = operator, multiple slashes = separator
    if (slashCount === 1) {
      const filePathManager = new PlaceholderReplacer('FILE_PATH_PLACEHOLDER_', '\uE020', '\uE021');

      // Store all file paths and replace with placeholders
      const allFilePathPattern = new RegExp(`(${UNIX_ABSOLUTE_FILE_PATH.source}|${UNIX_RELATIVE_FILE_PATH.source})`, 'g');
      result = result.replace(allFilePathPattern, (match) => {
        return filePathManager.store(match);
      });

      // Apply slash operator spacing
      result = result.replace(CJK_SLASH_CJK, '$1 $2 $3');
      result = result.replace(CJK_SLASH_ANS, '$1 $2 $3');
      result = result.replace(ANS_SLASH_CJK, '$1 $2 $3');
      result = result.replace(ANS_SLASH_ANS, '$1 $2 $3');

      // Restore file paths
      result = filePathManager.restore(result);
    }
    // If multiple slashes, treat as separator - do nothing (no spaces)

    return result;
  }

  private applyBracketSpacing(text: string): string {
    let result = text;

    result = result.replace(CJK_LEFT_BRACKET, '$1 $2');
    result = result.replace(RIGHT_BRACKET_CJK, '$1 $2');
    result = result.replace(ANS_CJK_LEFT_BRACKET_ANY_RIGHT_BRACKET, '$1 $2$3$4');
    result = result.replace(LEFT_BRACKET_ANY_RIGHT_BRACKET_ANS_CJK, '$1$2$3 $4');

    result = result.replace(AN_LEFT_BRACKET, '$1 $2');
    result = result.replace(RIGHT_BRACKET_AN, '$1 $2');

    return result;
  }

  private fixBracketInnerSpacing(text: string): string {
    // Brackets: <fcontentl> (fcontentl) [fcontentl] {fcontentl}
    // f: the first character inside the brackets
    // l: the last character inside the brackets
    // content: the content inside the brackets but exclude the first and last characters
    // DO NOT change the first and last characters inside brackets AT ALL
    // ONLY spacing the content between them

    let result = text;

    const bracketPatterns = [
      { pattern: /<([^<>]*)>/g, open: '<', close: '>' },
      { pattern: /\(([^()]*)\)/g, open: '(', close: ')' },
      { pattern: /\[([^\[\]]*)\]/g, open: '[', close: ']' },
      { pattern: /\{([^{}]*)\}/g, open: '{', close: '}' },
    ];

    for (const { pattern, open, close } of bracketPatterns) {
      result = result.replace(pattern, (_match, innerContent) => {
        if (!innerContent) {
          return `${open}${close}`;
        }
        // Remove spaces at the very beginning and end of content
        const trimmedContent = innerContent.replace(/^ +| +$/g, '');
        return `${open}${trimmedContent}${close}`;
      });
    }

    return result;
  }
}

export const pangu = new Pangu();

export { ANY_CJK };

export default pangu;
