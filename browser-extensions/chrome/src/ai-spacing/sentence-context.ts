import { MAX_SENTENCE_SIDE, SENTENCE_TERMINATOR, sliceSentence } from './shapes/base';

const pangu = window.pangu;

export function readSentence(node: Text, unspaced: string, at: number, unspacedByNode: ReadonlyMap<Text, string>) {
  function isBoundary(element: Element) {
    const display = getComputedStyle(element).display;
    return element.tagName === 'BR' || (!display.startsWith('inline') && display !== 'contents') || pangu.isIgnoredElement(element) || pangu.visibilityDetector.shouldSkipSpacingAfterNode(element);
  }

  function readSide(text: string, backwards: boolean) {
    const sibling = backwards ? 'previousSibling' : 'nextSibling';
    const child = backwards ? 'lastChild' : 'firstChild';
    let current: Node = node;

    while (text.length < MAX_SENTENCE_SIDE && !SENTENCE_TERMINATOR.test(text)) {
      while (!current[sibling]) {
        const parent = current.parentElement;
        if (!parent || isBoundary(parent)) {
          return text;
        }
        current = parent;
      }
      current = current[sibling]!;

      // Check an element before descending in either direction, so a previous block's last text never leaks into this sentence
      while (current instanceof Element) {
        if (isBoundary(current)) {
          return text;
        }
        if (!current[child]) {
          break;
        }
        current = current[child]!;
      }

      if (current instanceof Text) {
        const data = unspacedByNode.get(current) ?? current.data;
        const remaining = MAX_SENTENCE_SIDE - text.length;
        text = backwards ? data.slice(-remaining) + text : text + data.slice(0, remaining);
      }
    }
    return text;
  }

  const before = readSide(unspaced.slice(Math.max(0, at - MAX_SENTENCE_SIDE), at), true);
  const after = readSide(unspaced.slice(at + 1, at + 1 + MAX_SENTENCE_SIDE), false);
  return sliceSentence(before + unspaced[at] + after, before.length);
}
