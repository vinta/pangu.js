# pangu.js

Automatic whitespace insertion between CJK and half-width characters, delivered as a text engine, a Node.js tool, a browser DOM processor, and a Chrome extension built on them.

## Language

**CJK**:
The class of Chinese, Japanese, and Korean characters that every spacing rule keys on.

**Half-width**:
Alphabetical letters, numerical digits, and symbols that trigger spacing when adjacent to CJK.
_Avoid_: ANS, alphanumeric

**Text spacing**:
Inserting whitespace between CJK and half-width characters within a single run of text.
_Avoid_: paranoid spacing

**Boundary spacing**:
Deciding whether and where whitespace goes at the boundary between adjacent rendered text runs on a page, including boundaries interrupted by markup or hidden content. Distinct from text spacing, which operates within one run.
_Avoid_: pair spacing, adjacent-node spacing

**Pangu element**:
A marker element injected to render a space at a boundary where neither adjacent text run may be modified.
_Avoid_: space element
