/**
 * PlaceholderReplacer — protects content from regex replacement by storing it
 * in private Unicode character-delimited placeholders.
 *
 * Used during spacing processing to temporarily protect HTML tags, backtick content,
 * compound words, file paths, and single-quoted CJK text from being modified by
 * intermediate regex passes.
 */
export declare class PlaceholderReplacer {
    private placeholder;
    private startDelimiter;
    private endDelimiter;
    private items;
    private index;
    private pattern;
    constructor(placeholder: string, startDelimiter: string, endDelimiter: string);
    store(item: string): string;
    restore(text: string): string;
    reset(): void;
}
