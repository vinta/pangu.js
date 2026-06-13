/**
 * PlaceholderReplacer — protects content from regex replacement by storing it
 * in private Unicode character-delimited placeholders.
 *
 * Used during spacing processing to temporarily protect HTML tags, backtick content,
 * compound words, file paths, and single-quoted CJK text from being modified by
 * intermediate regex passes.
 */
export class PlaceholderReplacer {
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
