/**
 * eGrab - Background Service Worker
 * Handles context menu creation and messaging with content scripts
 */

// Context menu item IDs
const MENU_ITEMS = {
  PARENT: 'egrab-parent',
  COPY_HTML: 'egrab-copy-html',
  COPY_CSS: 'egrab-copy-css',
  COPY_JS: 'egrab-copy-js',
  COPY_ALL: 'egrab-copy-all',
  SEPARATOR: 'egrab-separator',
  TOGGLE: 'egrab-toggle'
};

// Create context menus when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  // Create parent menu
  chrome.contextMenus.create({
    id: MENU_ITEMS.PARENT,
    title: '🎯 eGrab',
    contexts: ['all']
  });

  // Copy HTML option
  chrome.contextMenus.create({
    id: MENU_ITEMS.COPY_HTML,
    parentId: MENU_ITEMS.PARENT,
    title: '📋 Copy HTML',
    contexts: ['all']
  });

  // Copy CSS option
  chrome.contextMenus.create({
    id: MENU_ITEMS.COPY_CSS,
    parentId: MENU_ITEMS.PARENT,
    title: '🎨 Copy CSS',
    contexts: ['all']
  });

  // Copy JavaScript option
  chrome.contextMenus.create({
    id: MENU_ITEMS.COPY_JS,
    parentId: MENU_ITEMS.PARENT,
    title: '⚡ Copy JavaScript',
    contexts: ['all']
  });

  // Separator
  chrome.contextMenus.create({
    id: MENU_ITEMS.SEPARATOR,
    parentId: MENU_ITEMS.PARENT,
    type: 'separator',
    contexts: ['all']
  });

  // Copy ALL option
  chrome.contextMenus.create({
    id: MENU_ITEMS.COPY_ALL,
    parentId: MENU_ITEMS.PARENT,
    title: '📦 Copy ALL (HTML + CSS + JS)',
    contexts: ['all']
  });

  // Toggle highlight option
  chrome.contextMenus.create({
    id: MENU_ITEMS.TOGGLE,
    parentId: MENU_ITEMS.PARENT,
    title: '👁️ Toggle Highlight',
    contexts: ['all']
  });

  console.log('eGrab: Context menus created successfully');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;

  let action = null;

  switch (info.menuItemId) {
    case MENU_ITEMS.COPY_HTML:
      action = 'copyHTML';
      break;
    case MENU_ITEMS.COPY_CSS:
      action = 'copyCSS';
      break;
    case MENU_ITEMS.COPY_JS:
      action = 'copyJS';
      break;
    case MENU_ITEMS.COPY_ALL:
      action = 'copyAll';
      break;
    case MENU_ITEMS.TOGGLE:
      action = 'toggleHighlight';
      break;
    default:
      return;
  }

  // Send message to content script
  chrome.tabs.sendMessage(tab.id, { action }, (response) => {
    if (chrome.runtime.lastError) {
      // This is expected on chrome://, edge://, about: pages, or pages opened before extension load
      // Don't log as error, just silently ignore or show badge
      const url = tab.url || '';
      if (url.startsWith('chrome://') || url.startsWith('edge://') ||
        url.startsWith('about:') || url.startsWith('chrome-extension://')) {
        // Expected - extension can't run on these pages
        console.log('eGrab: Cannot run on this page type');
      } else {
        // Page might need a refresh
        console.log('eGrab: Page needs refresh for extension to work');
      }
      return;
    }

    if (response?.success) {
      console.log(`eGrab: ${action} completed successfully`);
    } else if (response?.error) {
      console.warn(`eGrab: ${action} issue:`, response.error);
    }
  });
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getSettings') {
    chrome.storage.sync.get(['highlightEnabled', 'highlightColor'], (data) => {
      sendResponse({
        highlightEnabled: data.highlightEnabled === true, // Default to OFF
        highlightColor: data.highlightColor || '#3b82f6'
      });
    });
    return true; // Indicates async response
  }

  if (message.type === 'saveSettings') {
    chrome.storage.sync.set(message.settings, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
