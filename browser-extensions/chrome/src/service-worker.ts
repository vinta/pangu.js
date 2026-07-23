// NOTE: In service workers, we can't export directly, everything goes through messages
import { getSettings, onSettingsChanged, reconcileSettings } from './utils/settings';
import type { Settings } from './utils/types';
import { isValidMatchPattern, shouldContentScriptBeActive } from './utils/urls';

const SCRIPT_ID = 'paranoid-auto-spacing';
const TEXT_AUTOSPACE_SCRIPT_ID = 'text-autospace';

// DEFAULT_ICON_PATHS must stay in sync with action.default_icon in manifest.json: per-tab setIcon overrides need an explicit restore, there is no "reset to manifest" call.
const DEFAULT_ICON_PATHS = { '16': 'icons/icon-16.png', '24': 'icons/icon-24.png', '32': 'icons/icon-32.png' };
const OFF_ICON_PATHS = { '16': 'icons/icon-off-16.png', '32': 'icons/icon-off-32.png', '48': 'icons/icon-off-48.png' };

async function unregisterAllContentScripts() {
  try {
    const existingScripts = await chrome.scripting.getRegisteredContentScripts();
    if (existingScripts.length > 0) {
      const scriptIds = existingScripts.map((script) => script.id);
      await chrome.scripting.unregisterContentScripts({ ids: scriptIds });
    }
  } catch (error) {
    console.warn('Failed to unregister existing scripts:', error);
  }
}

// One call per script: registerContentScripts() is all-or-nothing across its array, so a user-supplied pattern that Chrome rejects must not take
// down the other script
async function registerContentScript(contentScript: chrome.scripting.RegisteredContentScript) {
  try {
    await chrome.scripting.registerContentScripts([contentScript]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Duplicate script ID')) {
      console.warn('Script already registered, skipping:', contentScript.id);
    } else {
      console.error(`Error registering content script ${contentScript.id}:`, error);
    }
  }
}

async function registerContentScripts() {
  await unregisterAllContentScripts();

  const current = await getSettings();

  if (current.is_enable_text_autospace) {
    // Visual-only native autospacing, deliberately not gated by spacing_mode, filter_mode, blacklist, or whitelist (see docs/adr/0002)
    await registerContentScript({
      id: TEXT_AUTOSPACE_SCRIPT_ID,
      css: ['dist/content-script.css'],
      matches: ['http://*/*', 'https://*/*'],
      allFrames: true,
    });
  }

  if (current.spacing_mode === 'spacing_when_load') {
    const contentScript: chrome.scripting.RegisteredContentScript = {
      id: SCRIPT_ID,
      js: ['vendors/pangu/pangu.umd.js', 'dist/content-script.js'],
      matches: ['http://*/*', 'https://*/*'],
      runAt: 'document_idle',
    };

    // Just in case there are invalid match patterns from old settings
    const validBlacklist = current.blacklist.filter((pattern) => isValidMatchPattern(pattern));
    const validWhitelist = current.whitelist.filter((pattern) => isValidMatchPattern(pattern));
    if (current.filter_mode === 'blacklist' && validBlacklist.length > 0) {
      contentScript.excludeMatches = validBlacklist;
    } else if (current.filter_mode === 'whitelist' && validWhitelist.length > 0) {
      contentScript.matches = validWhitelist;
    }

    await registerContentScript(contentScript);
  }
}

// registerContentScripts() starts by unregistering everything and reads fresh settings when its turn comes, so queued runs converge on the latest
// state; the queue only keeps overlapping runs from interleaving
let registrationQueue = Promise.resolve();
function queueRegisterContentScripts() {
  registrationQueue = registrationQueue.then(() => registerContentScripts()).catch(console.error);
  return registrationQueue;
}

// The icon mirrors the popup status row exactly: 顯靈中 shows the face, 神隱中 puts on the paper bag, so manual mode hides every tab and chrome:// or new tab pages wearing the bag is deliberate (#296).
async function updateTabIcon(tabId: number, url: string | undefined, current: Settings) {
  const path = shouldContentScriptBeActive(current, url) ? DEFAULT_ICON_PATHS : OFF_ICON_PATHS;
  try {
    await chrome.action.setIcon({ tabId, path });
  } catch {
    // The tab can be closed between the triggering event and this write
  }
}

async function updateAllTabIcons() {
  const current = await getSettings();
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map((tab) => (tab.id === undefined ? undefined : updateTabIcon(tab.id, tab.url, current))));
}

chrome.runtime.onInstalled.addListener(async () => {
  // Reconcile settings when extension is installed or updated to a new version
  await reconcileSettings();
  await queueRegisterContentScripts();
  await updateAllTabIcons();
});

chrome.runtime.onStartup.addListener(async () => {
  // Also register content scripts when extension starts
  await queueRegisterContentScripts();
  await updateAllTabIcons();
});

// The url is often not set yet on onCreated (new tab pages never get one at all, which correctly reads as inactive), onUpdated below refines it as soon as navigation commits
chrome.tabs.onCreated.addListener(async (tab) => {
  if (tab.id !== undefined) {
    await updateTabIcon(tab.id, tab.url || tab.pendingUrl, await getSettings());
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' || changeInfo.url) {
    await updateTabIcon(tabId, tab.url, await getSettings());
  }
});

// Registered synchronously at module scope, as MV3 requires for storage events to wake this worker. The event payload alone says what changed, so a
// cold-started worker reacts correctly without any cached state.
const REGISTRATION_KEYS: (keyof Settings)[] = ['spacing_mode', 'filter_mode', 'blacklist', 'whitelist', 'is_enable_text_autospace'];
const ICON_KEYS: (keyof Settings)[] = ['spacing_mode', 'filter_mode', 'blacklist', 'whitelist'];
onSettingsChanged((changedKeys) => {
  if (changedKeys.some((key) => REGISTRATION_KEYS.includes(key))) {
    queueRegisterContentScripts();
  }
  if (changedKeys.some((key) => ICON_KEYS.includes(key))) {
    updateAllTabIcons().catch(console.error);
  }
});
