// NOTE: In service workers, we can't export directly, everything goes through messages
import { classifyCandidates } from './ai-spacing/in-service-worker';
import type { ClassifyCandidatesResponse, MessageToServiceWorker } from './ai-spacing/messages';
import type { Settings } from './settings/storage';
import { getSettings, onSettingsChanged, reconcileSettings } from './settings/storage';
import { isValidMatchPattern, shouldShowOffIcon } from './settings/urls';

const SCRIPT_ID = 'paranoid-auto-spacing';
const TEXT_AUTOSPACE_SCRIPT_ID = 'text-autospace';

// DEFAULT_ICON_PATHS must stay in sync with action.default_icon in manifest.json: per-tab setIcon overrides need an explicit restore, there is no "reset to manifest" call.
// setIcon paths resolve against this worker's own URL (dist/service-worker.js), unlike manifest icon paths which are extension-root-relative, so entries must be worker-relative ../icons/... forms.
// Both bare icons/... and root-absolute /icons/... fail to load here
const DEFAULT_ICON_PATHS = { '16': '../icons/icon-16.png', '24': '../icons/icon-24.png', '32': '../icons/icon-32.png' };
const OFF_ICON_PATHS = { '16': '../icons/off-icon-16.png', '24': '../icons/off-icon-24.png', '32': '../icons/off-icon-32.png' };

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

  const settings = await getSettings();

  if (settings.is_enable_text_autospace) {
    // Visual-only native autospacing, deliberately not gated by spacing_mode, filter_mode, blacklist, or whitelist (see docs/adr/0008)
    await registerContentScript({
      id: TEXT_AUTOSPACE_SCRIPT_ID,
      css: ['dist/content-script.css'],
      matches: ['http://*/*', 'https://*/*'],
      allFrames: true,
    });
  }

  if (settings.spacing_mode === 'spacing_when_load') {
    const contentScript: chrome.scripting.RegisteredContentScript = {
      id: SCRIPT_ID,
      js: ['vendors/pangu/pangu.umd.js', 'dist/content-script.js'],
      matches: ['http://*/*', 'https://*/*'],
      runAt: 'document_idle',
    };

    // Just in case there are invalid match patterns from old settings
    const validBlacklist = settings.blacklist.filter((pattern) => isValidMatchPattern(pattern));
    const validWhitelist = settings.whitelist.filter((pattern) => isValidMatchPattern(pattern));
    if (settings.filter_mode === 'blacklist' && validBlacklist.length > 0) {
      contentScript.excludeMatches = validBlacklist;
    } else if (settings.filter_mode === 'whitelist' && validWhitelist.length > 0) {
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

// The paper bag only marks spacing the user turned off: manual mode bags every tab, a filter-excluded url bags its tab (#296). Pages the extension merely cannot run on (chrome://, new tab pages, urls it cannot read) keep the face, so the icon is deliberately looser than the popup status row, which still reports those as 神隱中.
async function updateTabIcon(tabId: number, url: string | undefined, settings: Settings) {
  const path = shouldShowOffIcon(settings, url) ? OFF_ICON_PATHS : DEFAULT_ICON_PATHS;
  try {
    await chrome.action.setIcon({ tabId, path });
  } catch {
    // The tab can be closed between the triggering event and this write
  }
}

async function updateAllTabIcons() {
  const settings = await getSettings();
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map((tab) => (tab.id === undefined ? undefined : updateTabIcon(tab.id, tab.url, settings))));
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

// The url is often not set yet on onCreated (new tab pages never get one at all, and a missing url is never user-excluded, so it keeps the face), onUpdated below refines it as soon as navigation commits
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

// AI spacing's only entry point, registered synchronously at module scope for the same reason as onSettingsChanged above. It reads no settings: whether the feature is on is the content script's
// question, and it is the gate.
// Chrome closes the message channel when a listener returns a promise, so the listener stays a plain function that returns true and lets an async helper call sendResponse. classifyCandidates reports
// failure in its response rather than rejecting, so there is no path that leaves a caller without an answer.
chrome.runtime.onMessage.addListener((message: MessageToServiceWorker, _sender: chrome.runtime.MessageSender, sendResponse: (response: ClassifyCandidatesResponse) => void) => {
  if (message.type === 'CLASSIFY_CANDIDATES') {
    classifyCandidates(message.kind, message.candidates).then(sendResponse);
    return true;
  }

  // A message this worker does not answer must leave its channel closing normally
  return false;
});
