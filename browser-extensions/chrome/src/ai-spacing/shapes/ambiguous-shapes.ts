import type { AmbiguousShape } from './base';
import { digitPlus } from './digit-plus';
import { hyphenDigit } from './hyphen-digit';
import { plusDigit } from './plus-digit';

export const AMBIGUOUS_SHAPES: readonly AmbiguousShape[] = [hyphenDigit, digitPlus, plusDigit];
