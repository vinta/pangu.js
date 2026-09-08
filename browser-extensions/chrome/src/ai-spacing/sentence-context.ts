import { CJK, MAX_SENTENCE_SIDE, SENTENCE_TERMINATOR, sliceSentence } from './shapes/base';

const pangu = window.pangu;

// The wide class of the segment-break rule: CJK plus CJK punctuation and full-width forms
const WIDE = new RegExp(`[${CJK}\\u3000-\\u303f\\uff00-\\uffef]`);

// A newline with the collapsible white space around it: spaces, tabs, and other segment breaks. NBSP never collapses
const SEGMENT_BREAK = /[ \t\r\f]*\n[ \t\r\f\n]*/g;

// white-space values under which the browser keeps a newline as a line break. The longhand exists from Chrome 114; older builds answer through the shorthand's legacy keywords
const PRESERVES_BREAKS = /^(preserve|preserve-breaks|break-spaces)$/;
const LEGACY_PRESERVES_BREAKS = /^(pre|pre-wrap|pre-line|break-spaces)$/;

// A superscript or subscript annotates its base and is never prose: a citation marker like [1] would glue to the digits the classifier reads
const SUPERSCRIPT_OR_SUBSCRIPT = /^(sup|sub)$/i;

// A soft line break renders as the browser does (CSS Text, segment break transformation): gone between two wide characters, one space elsewhere
function collapseSegmentBreaks(text: string) {
  return text.replace(SEGMENT_BREAK, '\n').replace(/\n/g, (_, offset: number, whole: string) => (WIDE.test(whole[offset - 1] ?? '') && WIDE.test(whole[offset + 1] ?? '') ? '' : ' '));
}

// The computed value is inherited, so the parent element answers for its text node
function keepsNewlines(textNode: Text) {
  const parent = textNode.parentElement;
  if (!parent) {
    return false;
  }
  const style = getComputedStyle(parent);
  return style.whiteSpaceCollapse ? PRESERVES_BREAKS.test(style.whiteSpaceCollapse) : LEGACY_PRESERVES_BREAKS.test(style.whiteSpace);
}

export function readSentence(node: Text, unspaced: string, at: number, unspacedByNode: ReadonlyMap<Text, string>) {
  // A hidden, ignored, superscript, or subscript sibling is stepped past without ending the sentence, the way core's scanBetweenTextNodes() treats an ignored island as invisible; such an ancestor of the candidate ends its side. Checked before display, since display:none and absolutely positioned screen-reader text are blockified
  function isSkipped(element: Element) {
    return SUPERSCRIPT_OR_SUBSCRIPT.test(element.nodeName) || pangu.isIgnoredElement(element) || pangu.visibilityDetector.shouldSkipSpacingAfterNode(element);
  }

  // Where the line of text ends: a line break or an element that is not inline-level
  function isBlockEdge(element: Element) {
    const display = getComputedStyle(element).display;
    return element.tagName === 'BR' || (!display.startsWith('inline') && display !== 'contents');
  }

  // The part of a text node's data on this side of its nearest line break, or null when the node keeps no newline as a line break
  function lineTowards(textNode: Text, data: string, backwards: boolean) {
    if (!keepsNewlines(textNode)) {
      return null;
    }
    const newline = backwards ? data.lastIndexOf('\n') : data.indexOf('\n');
    if (newline === -1) {
      return null;
    }
    return backwards ? data.slice(newline + 1) : data.slice(0, newline);
  }

  function readSide(text: string, backwards: boolean) {
    const sibling = backwards ? 'previousSibling' : 'nextSibling';
    const child = backwards ? 'lastChild' : 'firstChild';
    let current: Node = node;

    while (text.length < MAX_SENTENCE_SIDE && !SENTENCE_TERMINATOR.test(text)) {
      while (!current[sibling]) {
        const parent = current.parentElement;
        if (!parent || isSkipped(parent) || isBlockEdge(parent)) {
          return text;
        }
        current = parent;
      }
      current = current[sibling]!;

      // Check an element before descending in either direction, so a previous block's last text never leaks into this sentence. A skipped element is left as is, so the loop steps past it to the next sibling
      while (current instanceof Element) {
        if (isSkipped(current)) {
          break;
        }
        if (isBlockEdge(current)) {
          return text;
        }
        if (!current[child]) {
          break;
        }
        current = current[child]!;
      }

      if (current instanceof Text) {
        const data = unspacedByNode.get(current) ?? current.data;
        const line = lineTowards(current, data, backwards);
        const remaining = MAX_SENTENCE_SIDE - text.length;
        text = backwards ? (line ?? data).slice(-remaining) + text : text + (line ?? data).slice(0, remaining);
        if (line !== null) {
          return text;
        }
      }
    }
    return text;
  }

  // The candidate node's own line break closes its side before any neighbor is read
  function readFrom(own: string, backwards: boolean) {
    return lineTowards(node, own, backwards) ?? readSide(own, backwards);
  }

  const before = collapseSegmentBreaks(readFrom(unspaced.slice(Math.max(0, at - MAX_SENTENCE_SIDE), at), true)).trimStart();
  const after = collapseSegmentBreaks(readFrom(unspaced.slice(at + 1, at + 1 + MAX_SENTENCE_SIDE), false)).trimEnd();
  return sliceSentence(before + unspaced[at] + after, before.length);
}
