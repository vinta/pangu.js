# Optional Host Permissions Usage for pangu.js

## Overview

`optional_host_permissions` allows Chrome extensions to request access to specific hosts at runtime rather than at install time. This provides better user control and trust, but needs careful implementation to maintain good UX.

## The Challenge

If we only use `optional_host_permissions` without any `host_permissions`, users who want auto-spacing on all websites would need to grant permission for each site individually, which would be a terrible user experience.

## Recommended Solution: Hybrid Permissions Model

### 1. Default Behavior Options

**Manifest Configuration:**
```json
{
  "permissions": ["storage", "activeTab"],
  "optional_host_permissions": ["<all_urls>"]
}
```

**First-Run Experience:**
```javascript
// On install or first run
async function setupDefaultBehavior() {
  const { defaultBehavior } = await chrome.storage.sync.get(['defaultBehavior']);
  
  if (!defaultBehavior) {
    // Show onboarding UI with options:
    // 1. "Enable for all websites" (requests <all_urls>)
    // 2. "I'll enable per site" (no permission request)
  }
}

// Option 1: Enable for all sites
async function enableForAllSites() {
  const granted = await chrome.permissions.request({
    origins: ["<all_urls>"]
  });
  
  if (granted) {
    await chrome.storage.sync.set({ defaultBehavior: 'all-sites' });
    // Register content scripts for all sites
  }
}
```

### 2. Settings Page Options

Provide users with different spacing modes:

```javascript
// Let users switch between modes
// □ Auto-spacing for all websites (default)
// □ Ask me for each website
// □ Use blacklist mode (spacing everywhere except...)
// □ Use whitelist mode (spacing only on...)
```

### 3. Per-Site Permission Management

```javascript
// When user clicks "Enable auto-spacing for this site"
async function enableForSite(origin) {
  const granted = await chrome.permissions.request({
    origins: [origin + '/*']
  });
  
  if (granted) {
    // Register content script for this specific site
    await registerContentScriptForOrigin(origin);
  }
}

// User can revoke permissions per site
async function disableForSite(origin) {
  await chrome.permissions.remove({
    origins: [origin + '/*']
  });
}
```

### 4. Site Management UI

```javascript
// Options page could show:
// ✓ example.com - Auto-spacing enabled
// ✓ github.com - Auto-spacing enabled  
// + Add new site...
```

## Benefits of This Approach

1. **Better User Trust**: No scary "Read and change all your data on all websites" warning at install
2. **Progressive Feature Rollout**: Users can start with limited permissions and expand as needed
3. **No Extension Disabling on Updates**: Adding new optional permissions doesn't disable the extension
4. **User Control**: Users can grant or revoke host permissions on an ad hoc basis

## Implementation Strategy for pangu.js

Given that many users (like power users) want auto-spacing everywhere by default:

1. **Keep current approach** with dynamic registration as the default
2. **Add optional permissions** for users who want more control
3. **Provide mode switching** in settings:
   - "Auto-spacing everywhere" (current behavior, requests <all_urls> once)
   - "Auto-spacing on selected sites only" (uses optional permissions per-site)

This hybrid approach ensures:
- Power users get auto-spacing everywhere by default
- Privacy-conscious users can opt into per-site control
- No breaking changes for existing users
- Better perception of privacy even for users who want all-sites access

## Alternative: Smart Defaults with Opt-Out

Another approach is to use declarative content scripts with user controls:

```json
{
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content-script.js"],
    "run_at": "document_idle"
  }],
  "permissions": ["storage", "activeTab"],
  "optional_host_permissions": ["<all_urls>"]
}
```

Users can then:
- Disable per-site via extension icon
- Switch to whitelist mode in settings
- Never need to grant permissions one by one

## Key Takeaway

The goal is to provide flexibility without sacrificing user experience. Users who want spacing everywhere should be able to enable it with one click, while users who want granular control should have that option too.