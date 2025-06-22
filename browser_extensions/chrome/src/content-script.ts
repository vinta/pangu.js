/**
 * Content script for pangu.js Chrome extension
 *
 * This script is injected into web pages to add spacing between CJK and half-width characters.
 * It can be injected in two ways:
 * 1. Automatically via dynamic registration when auto-spacing is enabled
 * 2. Manually via popup when user clicks the manual spacing button
 */

import type { BrowserPangu } from '../../../src/browser/pangu';
import type { ContentScriptMessage, ContentScriptResponse } from './types';

// Extend the global Window interface to include the pangu object
// The pangu object is injected by pangu.umd.js which loads before this script
declare global {
  interface Window {
    pangu: BrowserPangu;
  }
}

/**
 * Apply auto-spacing with continuous DOM monitoring
 * Sets up a MutationObserver to watch for DOM changes and apply spacing automatically
 */
function autoSpacingPage() {
  const pangu = window.pangu;
  if (pangu) {
    pangu.autoSpacingPage();
  }
}

/**
 * Apply manual spacing (runs once)
 * Processes the current page content without setting up continuous monitoring
 */
function spacingPage() {
  const pangu = window.pangu;
  if (pangu) {
    pangu.spacingPage();
  }
}

// When this script loads via dynamic registration (auto-spacing mode), apply auto-spacing to the page
// Handle both cases: page still loading or already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoSpacingPage);
} else {
  autoSpacingPage();
}

// Listen for messages from the popup
// This allows manual spacing even when auto-spacing is disabled
chrome.runtime.onMessage.addListener((message: ContentScriptMessage, _sender: chrome.runtime.MessageSender, sendResponse: (response: ContentScriptResponse) => void) => {
  if (message.action === 'ping') {
    // Ping is used by popup to check if content script is already loaded
    sendResponse({ success: true });
  } else if (message.action === 'manual_spacing') {
    // Manual spacing requested by user clicking button in popup
    spacingPage();
    sendResponse({ success: true });
  }

  // Return true only when sending response asynchronously
  // Return nothing (or false) when sending response synchronously
});

// Make this file a module to enable global type declarations
export {};
