/**
 * eGrab - Popup Script
 * Handles popup UI interactions and settings management
 */

(function () {
    'use strict';

    // DOM Elements
    const highlightToggle = document.getElementById('highlightToggle');
    const statusIndicator = document.getElementById('statusIndicator');

    // State
    let isEnabled = false; // Default to OFF

    /**
     * Initialize popup
     */
    async function init() {
        // Load saved settings
        await loadSettings();

        // Update UI
        updateToggleUI();
        await updateStatus();

        // Setup event listeners
        highlightToggle.addEventListener('click', handleToggleClick);
    }

    /**
     * Load settings from storage
     */
    async function loadSettings() {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'getSettings' }, (response) => {
                if (response) {
                    isEnabled = response.highlightEnabled === true; // Default to OFF
                }
                resolve();
            });
        });
    }

    /**
     * Save settings to storage
     */
    async function saveSettings() {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({
                type: 'saveSettings',
                settings: { highlightEnabled: isEnabled }
            }, resolve);
        });
    }

    /**
     * Handle toggle click
     */
    async function handleToggleClick() {
        isEnabled = !isEnabled;
        updateToggleUI();
        await saveSettings();

        // Notify content script
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'setEnabled',
                    enabled: isEnabled
                });
            } catch (error) {
                // Content script may not be loaded on this page
                console.log('Could not communicate with content script');
            }
        }

        await updateStatus();
    }

    /**
     * Update toggle UI based on state
     */
    function updateToggleUI() {
        if (isEnabled) {
            highlightToggle.classList.add('active');
        } else {
            highlightToggle.classList.remove('active');
        }
    }

    /**
     * Update status indicator
     */
    async function updateStatus() {
        const statusDot = statusIndicator.querySelector('.status-dot');
        const statusText = statusIndicator.querySelector('span:last-child');

        // Check if we can communicate with content script
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab?.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
            statusDot.classList.add('inactive');
            statusText.textContent = 'Not available on this page';
            return;
        }

        if (!isEnabled) {
            statusDot.classList.add('inactive');
            statusText.textContent = 'Highlight disabled';
            return;
        }

        try {
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'getState' });
            if (response?.success) {
                statusDot.classList.remove('inactive');
                statusText.textContent = 'Active on current page';
            } else {
                statusDot.classList.add('inactive');
                statusText.textContent = 'Initializing...';
            }
        } catch (error) {
            statusDot.classList.add('inactive');
            statusText.textContent = 'Refresh page to activate';
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
