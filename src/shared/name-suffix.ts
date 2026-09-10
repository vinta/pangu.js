const PRODUCT_NAME = 'Apple TV|CATCHPLAY|[Dd]iscovery|Disney|ESPN|Fitness|iCloud|Paramount|PS';
const CJK_PRODUCT_NAME = '公視|影劇館';
const PRODUCT_TIER = 'Pro';
const CREDIT_RATING = '(?:tw)?(?:AA|BBB|BB|CCC)|tw[AB]';
const BLOOD_TYPE = 'AB|RhD|Rh';

// Product names and tiers take + only; credit ratings and blood types take + or -
const NAME_SUFFIX = new RegExp(`(?:(?<![A-Za-z0-9])(?:(?:${PRODUCT_NAME}|${PRODUCT_TIER})\\+|(?:${CREDIT_RATING}|${BLOOD_TYPE})[+-])|(?:${CJK_PRODUCT_NAME})\\+)`, 'g');

// A closing mark follows the suffix tight; a word or an opening bracket keeps its boundary space
const CLOSING_AFTER_SUFFIX = /[/)\]}\uff09\u3011\u3015\u3009\u300b\u300d\u300f\uff0c\u3002\u3001\uff1b\uff1a\uff01\uff1f]/;

// Both texts must keep the same + and - symbols in order. In spaceText(), compare before restoring protected content so it cannot become a correction target
export function restoreNameSuffixes(unspaced: string, spaced: string) {
  // ponytail: each listed suffix rescans the text; use one symbol pass if pages with many names make this slow
  for (const nameMatch of unspaced.matchAll(NAME_SUFFIX)) {
    const unspacedIndex = nameMatch.index + nameMatch[0].length - 1;
    const symbol = nameMatch[0].slice(-1);
    const ordinal = unspaced.slice(0, unspacedIndex).split(symbol).length;
    const index = spaced.split(symbol, ordinal).join(symbol).length;
    if (spaced[index - 1] !== ' ') {
      continue;
    }

    const removeAfter = CLOSING_AFTER_SUFFIX.test(unspaced[unspacedIndex + 1] ?? '') && spaced[index + 1] === ' ';
    spaced = spaced.slice(0, index - 1) + symbol + spaced.slice(index + (removeAfter ? 2 : 1));
  }
  return spaced;
}
