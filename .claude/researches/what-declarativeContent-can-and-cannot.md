# What declarativeContent Can and Cannot Do

## Overview

`chrome.declarativeContent` is a Chrome extension API that allows you to show your extension's page action or change its appearance based on the content of a page, without requiring host permissions or content script injection.

## What declarativeContent CANNOT Do

### ❌ Cannot Inject Content Scripts
In Manifest V3, `declarativeContent` **cannot** inject content scripts dynamically. The `RequestContentScript` action was deprecated and removed.

```javascript
// This does NOT work in Manifest V3
chrome.declarativeContent.onPageChanged.addRules([{
  conditions: [...],
  actions: [
    // ❌ RequestContentScript is not available
    new chrome.declarativeContent.RequestContentScript({
      js: ['content-script.js']
    })
  ]
}]);
```

### ❌ Cannot Replace chrome.scripting for Blacklist/Whitelist
The current implementation using `chrome.scripting.registerContentScripts()` cannot be replaced with `declarativeContent`:

```javascript
// Current approach (correct for content script injection)
await chrome.scripting.registerContentScripts([{
  id: 'pangu-content-script',
  matches: ['<all_urls>'],
  excludeMatches: blacklist,  // Dynamic blacklist
  js: ['content-script.js']
}]);

// declarativeContent cannot do this
```

## What declarativeContent CAN Do

### ✅ Control Extension Icon Visibility

```javascript
// Show/hide extension icon based on page conditions
chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
  chrome.declarativeContent.onPageChanged.addRules([{
    conditions: [
      new chrome.declarativeContent.PageStateMatcher({
        pageUrl: { hostEquals: 'example.com' }
      })
    ],
    actions: [
      new chrome.declarativeContent.ShowAction()
    ]
  }]);
});
```

### ✅ Change Extension Icon Dynamically

```javascript
// Different icons for different states
const rules = [
  {
    // Active state - colored icon
    conditions: [
      new chrome.declarativeContent.PageStateMatcher({
        pageUrl: { hostSuffix: '.cn' }
      })
    ],
    actions: [
      new chrome.declarativeContent.SetIcon({
        path: {
          '16': 'icons/active-16.png',
          '32': 'icons/active-32.png',
          '128': 'icons/active-128.png'
        }
      })
    ]
  },
  {
    // Inactive state - grayed icon
    conditions: [
      new chrome.declarativeContent.PageStateMatcher({
        pageUrl: { hostEquals: 'blocked-site.com' }
      })
    ],
    actions: [
      new chrome.declarativeContent.SetIcon({
        path: {
          '128': 'icons/inactive-128.png'
        }
      })
    ]
  }
];
```

### ✅ Show Page Action (Legacy)

```javascript
// Show page action (deprecated in favor of action API)
new chrome.declarativeContent.ShowPageAction()
```

## PageStateMatcher Capabilities

### URL Matching Options

```javascript
new chrome.declarativeContent.PageStateMatcher({
  pageUrl: {
    // Exact host matching
    hostEquals: 'www.example.com',
    
    // Host suffix matching (good for country TLDs)
    hostSuffix: '.cn',
    hostSuffix: '.jp',
    hostSuffix: '.tw',
    
    // Host prefix matching
    hostPrefix: 'news',
    
    // Host contains
    hostContains: 'blog',
    
    // Path matching
    pathEquals: '/article/123',
    pathPrefix: '/blog/',
    pathSuffix: '.html',
    pathContains: '/zh/',
    
    // Query string matching
    queryEquals: 'lang=zh-CN',
    queryPrefix: 'utm_',
    querySuffix: '_CN',
    queryContains: 'chinese',
    
    // URL patterns (regex)
    urlEquals: 'https://example.com/page',
    urlPrefix: 'https://example.com/',
    urlSuffix: '/index.html',
    urlContains: 'chinese',
    urlMatches: '.*\\.cn/.*',  // Regex
    
    // Scheme restrictions
    schemes: ['https', 'http'],
    
    // Port matching
    ports: [80, 443, 8080]
  }
})
```

### CSS Selector Matching

```javascript
new chrome.declarativeContent.PageStateMatcher({
  // Match if these CSS selectors exist (not their content!)
  css: [
    'html[lang^="zh"]',      // Chinese language declaration
    'html[lang="ja"]',       // Japanese language
    'html[lang="ko"]',       // Korean language
    '.chinese-content',      // Class-based detection
    'meta[name="language"][content="zh-CN"]'  // Meta tag
  ]
})
```

### Other Conditions

```javascript
new chrome.declarativeContent.PageStateMatcher({
  // Check if page is bookmarked
  isBookmarked: true,
  
  // Combine with content type (limited use)
  contentType: ['application/pdf']
})
```

## Practical Use Cases for pangu.js

### 1. Visual Feedback System

```javascript
// Show different icons based on site status
function updateIconBasedOnRules(settings) {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    const rules = [];
    
    // Green icon for whitelisted sites
    if (settings.spacing_rule === 'whitelist') {
      settings.whitelist.forEach(pattern => {
        rules.push({
          conditions: [
            new chrome.declarativeContent.PageStateMatcher({
              pageUrl: { urlMatches: patternToRegex(pattern) }
            })
          ],
          actions: [
            new chrome.declarativeContent.SetIcon({
              path: { '128': 'icons/icon-active.png' }
            })
          ]
        });
      });
    }
    
    // Red icon for blacklisted sites
    settings.blacklist.forEach(pattern => {
      rules.push({
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { urlMatches: patternToRegex(pattern) }
          })
        ],
        actions: [
          new chrome.declarativeContent.SetIcon({
            path: { '128': 'icons/icon-disabled.png' }
          })
        ]
      });
    });
    
    // Blue icon for CJK sites
    const cjkSites = ['.cn', '.tw', '.hk', '.jp', '.kr'];
    cjkSites.forEach(tld => {
      rules.push({
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostSuffix: tld }
          })
        ],
        actions: [
          new chrome.declarativeContent.SetIcon({
            path: { '128': 'icons/icon-cjk.png' }
          })
        ]
      });
    });
    
    chrome.declarativeContent.onPageChanged.addRules(rules);
  });
}
```

### 2. Performance Optimization

```javascript
// Only enable extension UI on relevant pages
chrome.runtime.onInstalled.addListener(() => {
  // Disable by default
  chrome.action.disable();
  
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [
        // Enable on CJK language pages
        new chrome.declarativeContent.PageStateMatcher({
          css: ['html[lang^="zh"]', 'html[lang^="ja"]', 'html[lang^="ko"]']
        }),
        // Enable on CJK domains
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: { hostSuffix: '.cn' }
        }),
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: { hostSuffix: '.tw' }
        })
      ],
      actions: [
        new chrome.declarativeContent.ShowAction()
      ]
    }]);
  });
});
```

### 3. Hybrid Approach (Recommended)

```javascript
// Use both APIs for optimal functionality
class PanguExtensionManager {
  // Use chrome.scripting for actual content script injection
  async updateContentScripts(settings) {
    await chrome.scripting.unregisterContentScripts();
    
    if (settings.spacing_mode === 'spacing_when_load') {
      await chrome.scripting.registerContentScripts([{
        id: 'pangu-auto-spacing',
        matches: settings.whitelist.length > 0 ? settings.whitelist : ['<all_urls>'],
        excludeMatches: settings.blacklist,
        js: ['content-script.js']
      }]);
    }
  }
  
  // Use declarativeContent for UI feedback
  updateUIFeedback(settings) {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
      const rules = this.generateIconRules(settings);
      chrome.declarativeContent.onPageChanged.addRules(rules);
    });
  }
}
```

## Key Takeaways

1. **declarativeContent cannot inject content scripts in Manifest V3**
2. **Use chrome.scripting for dynamic content script management**
3. **Use declarativeContent for UI feedback and icon management**
4. **PageStateMatcher is powerful but limited to page metadata, not content**
5. **Combining both APIs provides the best user experience**

## Migration Note

If migrating from Manifest V2 where `RequestContentScript` was available, you must refactor to use `chrome.scripting.registerContentScripts()` instead. There is no direct replacement in declarativeContent API.