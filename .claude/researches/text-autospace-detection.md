# Detecting text-autospace Support

## Method 1: CSS.supports() API

```javascript
function isTextAutospaceSupported() {
  // Check if CSS.supports exists (not in IE)
  if (typeof CSS === 'undefined' || !CSS.supports) {
    return false;
  }
  
  // Check for standard text-autospace support
  if (CSS.supports('text-autospace', 'normal')) {
    return true;
  }
  
  // Check for vendor prefixes (IE8 used -ms-text-autospace)
  if (CSS.supports('-ms-text-autospace', 'ideograph-alpha')) {
    return true;
  }
  
  return false;
}
```

## Method 2: Style Property Detection

```javascript
function detectTextAutospace() {
  const testElement = document.createElement('div');
  const style = testElement.style;
  
  // Check for unprefixed property
  if ('textAutospace' in style) {
    return true;
  }
  
  // Check for vendor prefixes
  const prefixes = ['webkit', 'moz', 'ms', 'o'];
  for (const prefix of prefixes) {
    const prop = prefix + 'TextAutospace';
    if (prop in style) {
      return true;
    }
  }
  
  return false;
}
```

## Method 3: Computed Style Test

```javascript
function hasTextAutospaceSupport() {
  // Create a test element
  const testEl = document.createElement('div');
  testEl.style.cssText = 'text-autospace: normal;';
  document.body.appendChild(testEl);
  
  // Get computed style
  const computedStyle = window.getComputedStyle(testEl);
  const supported = computedStyle.textAutospace !== undefined && 
                   computedStyle.textAutospace !== '';
  
  // Clean up
  document.body.removeChild(testEl);
  
  return supported;
}
```

## Comprehensive Detection Function

```javascript
function canUseTextAutospace() {
  // Method 1: Try CSS.supports first (most reliable)
  if (typeof CSS !== 'undefined' && CSS.supports) {
    // Check various text-autospace values
    const values = ['normal', 'ideograph-alpha', 'ideograph-numeric', 'inter-word'];
    for (const value of values) {
      if (CSS.supports('text-autospace', value)) {
        return true;
      }
    }
  }
  
  // Method 2: Check style property
  const div = document.createElement('div');
  if ('textAutospace' in div.style || 'msTextAutospace' in div.style) {
    return true;
  }
  
  return false;
}
```

## Browser Support Status

As of 2024:
- **Chrome 120+**: Behind flag `chrome://flags/#enable-experimental-web-platform-features`
- **Safari 18.4+**: Supported
- **Firefox**: Not supported
- **IE8**: Supported with `-ms-text-autospace` prefix

## Usage in pangu.js

```javascript
// In content script
if (canUseTextAutospace()) {
  // Apply CSS solution
  const style = document.createElement('style');
  style.textContent = `
    body {
      text-autospace: normal;
    }
  `;
  document.head.appendChild(style);
} else {
  // Fall back to JavaScript processing
  pangu.autoSpacingPage();
}
```

## Notes

1. The `text-autospace` property is still experimental in Chrome
2. Different browsers may support different values
3. Always provide a fallback for unsupported browsers
4. The CSS approach is much more performant than JavaScript regex processing