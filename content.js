/**
 * eGrab - Content Script
 * Handles element hover highlighting, data extraction, and clipboard operations
 */

(function () {
    'use strict';

    // Prevent multiple injections
    if (window.__EGRAB_INITIALIZED__) return;
    window.__EGRAB_INITIALIZED__ = true;

    // ============================================================
    // Configuration & State
    // ============================================================

    const CONFIG = {
        OVERLAY_ID: 'egrab-overlay',
        TOAST_ID: 'egrab-toast',
        HIGHLIGHT_COLOR: 'rgba(59, 130, 246, 0.3)',
        HIGHLIGHT_BORDER: 'rgba(59, 130, 246, 0.8)',
        Z_INDEX: 2147483647
    };

    let state = {
        enabled: false, // Start with highlighting OFF by default
        currentElement: null,
        overlay: null,
        toastTimeout: null
    };

    // ============================================================
    // DOM Utilities
    // ============================================================

    /**
     * Check if an element belongs to eGrab's UI
     */
    function isEgrabElement(el) {
        if (!el) return false;
        return el.id?.startsWith('egrab-') ||
            el.classList?.contains('egrab-element') ||
            el.closest('#egrab-overlay') ||
            el.closest('#egrab-toast');
    }

    /**
     * Create the highlight overlay element
     */
    function createOverlay() {
        if (state.overlay) return state.overlay;

        const overlay = document.createElement('div');
        overlay.id = CONFIG.OVERLAY_ID;
        overlay.className = 'egrab-element';
        overlay.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: ${CONFIG.Z_INDEX};
      background: ${CONFIG.HIGHLIGHT_COLOR};
      border: 2px solid ${CONFIG.HIGHLIGHT_BORDER};
      border-radius: 3px;
      transition: all 0.1s ease-out;
      display: none;
      box-shadow: 0 0 0 1px rgba(0,0,0,0.1), 0 2px 8px rgba(59, 130, 246, 0.2);
    `;

        document.body.appendChild(overlay);
        state.overlay = overlay;
        return overlay;
    }

    /**
     * Update overlay position to match element bounds
     */
    function updateOverlayPosition(element) {
        if (!element || !state.overlay) return;

        const rect = element.getBoundingClientRect();
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        state.overlay.style.display = 'block';
        state.overlay.style.left = `${rect.left}px`;
        state.overlay.style.top = `${rect.top}px`;
        state.overlay.style.width = `${rect.width}px`;
        state.overlay.style.height = `${rect.height}px`;
    }

    /**
     * Hide the overlay
     */
    function hideOverlay() {
        if (state.overlay) {
            state.overlay.style.display = 'none';
        }
    }

    /**
     * Show a toast notification
     */
    function showToast(message, type = 'success') {
        // Remove existing toast
        const existingToast = document.getElementById(CONFIG.TOAST_ID);
        if (existingToast) {
            existingToast.remove();
        }

        if (state.toastTimeout) {
            clearTimeout(state.toastTimeout);
        }

        const toast = document.createElement('div');
        toast.id = CONFIG.TOAST_ID;
        toast.className = 'egrab-element egrab-toast';

        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        toast.innerHTML = `<span class="egrab-toast-icon">${icon}</span><span class="egrab-toast-message">${message}</span>`;

        document.body.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('egrab-toast-visible');
        });

        // Remove after delay
        state.toastTimeout = setTimeout(() => {
            toast.classList.remove('egrab-toast-visible');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    // ============================================================
    // Data Extraction Functions
    // ============================================================

    /**
     * Format HTML with proper indentation
     */
    function formatHTML(html) {
        let formatted = '';
        let indent = 0;
        const tab = '  ';

        // Simple formatting - add newlines after tags
        html = html.replace(/></g, '>\n<');

        const lines = html.split('\n');
        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            // Decrease indent for closing tags
            if (line.match(/^<\/\w/)) {
                indent = Math.max(0, indent - 1);
            }

            formatted += tab.repeat(indent) + line + '\n';

            // Increase indent for opening tags (not self-closing or closing)
            if (line.match(/^<\w[^>]*[^\/]>$/) && !line.match(/^<(br|hr|img|input|meta|link)/i)) {
                indent++;
            }
        }

        return formatted.trim();
    }

    /**
     * Extract HTML from the current element
     */
    function extractHTML() {
        if (!state.currentElement) {
            return { success: false, error: 'No element selected' };
        }

        try {
            const html = state.currentElement.outerHTML;
            const formatted = formatHTML(html);
            return { success: true, data: formatted };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Extract CSS from a single element (helper function)
     */
    function extractElementCSS(element, includeComputed = true) {
        const result = [];
        const selector = getElementSelector(element);

        // 1. Inline styles
        if (element.style && element.style.cssText) {
            result.push(`/* Inline Styles for: ${selector} */`);
            result.push(`${selector} {`);
            const inlineStyles = element.style.cssText.split(';')
                .filter(s => s.trim())
                .map(s => `  ${s.trim()};`);
            result.push(...inlineStyles);
            result.push('}');
        }

        // 2. Computed styles (most important ones)
        if (includeComputed) {
            try {
                const computed = window.getComputedStyle(element);
                const importantProps = [
                    'display', 'position', 'top', 'right', 'bottom', 'left',
                    'width', 'height', 'max-width', 'max-height', 'min-width', 'min-height',
                    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
                    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
                    'border', 'border-radius', 'box-shadow',
                    'background', 'background-color', 'background-image',
                    'color', 'font-family', 'font-size', 'font-weight', 'line-height', 'text-align',
                    'flex', 'flex-direction', 'justify-content', 'align-items', 'gap',
                    'grid', 'grid-template-columns', 'grid-template-rows',
                    'overflow', 'opacity', 'z-index', 'transform', 'transition'
                ];

                const computedStyles = [];
                for (const prop of importantProps) {
                    const value = computed.getPropertyValue(prop);
                    if (value && value !== 'none' && value !== 'normal' && value !== 'auto' && value !== '0px') {
                        computedStyles.push(`  ${prop}: ${value};`);
                    }
                }

                if (computedStyles.length > 0) {
                    result.push(`/* Computed Styles for: ${selector} */`);
                    result.push(`${selector} {`);
                    result.push(...computedStyles);
                    result.push('}');
                }
            } catch (e) {
                // Skip if can't get computed styles
            }
        }

        return result;
    }

    /**
     * Extract CSS from the current element AND all its children
     */
    function extractCSS() {
        if (!state.currentElement) {
            return { success: false, error: 'No element selected' };
        }

        try {
            const element = state.currentElement;
            const result = [];
            const processedSelectors = new Set(); // Avoid duplicates

            // Get root element selector for reference
            const rootSelector = getElementSelector(element);
            result.push(`/* ═══════════════════════════════════════════════════════ */`);
            result.push(`/* CSS for: ${rootSelector} (including children) */`);
            result.push(`/* ═══════════════════════════════════════════════════════ */\n`);

            // Extract CSS for the main element
            result.push('/* ─── Root Element ─── */');
            const rootCSS = extractElementCSS(element, true);
            result.push(...rootCSS);
            processedSelectors.add(rootSelector);

            // Get all child elements
            const children = element.querySelectorAll('*');

            if (children.length > 0) {
                result.push('\n/* ─── Child Elements ─── */');

                for (const child of children) {
                    // Skip egrab elements
                    if (isEgrabElement(child)) continue;

                    const childSelector = getElementSelector(child);

                    // Skip if we've already processed this selector (avoid duplicates)
                    // But allow same tag names with different contexts
                    const uniqueKey = `${childSelector}-${child.tagName}-${Array.from(child.classList).join('-')}`;
                    if (processedSelectors.has(uniqueKey)) continue;
                    processedSelectors.add(uniqueKey);

                    const childCSS = extractElementCSS(child, true);
                    if (childCSS.length > 0) {
                        result.push('');
                        result.push(...childCSS);
                    }
                }
            }

            // 3. Matched CSS rules from stylesheets (for root and children)
            result.push('\n/* ─── Matched CSS Rules from Stylesheets ─── */');
            const allElements = [element, ...Array.from(children)];
            const matchedRulesSet = new Set(); // Avoid duplicate rules

            for (const el of allElements) {
                if (isEgrabElement(el)) continue;
                const matchedRules = getMatchedCSSRules(el);
                for (const rule of matchedRules) {
                    if (!matchedRulesSet.has(rule)) {
                        matchedRulesSet.add(rule);
                    }
                }
            }

            if (matchedRulesSet.size > 0) {
                result.push(...Array.from(matchedRulesSet));
            } else {
                result.push('/* No matched stylesheet rules found (may be blocked by CORS) */');
            }

            return { success: true, data: result.join('\n') };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get a CSS selector for an element
     */
    function getElementSelector(element) {
        if (element.id) {
            return `#${element.id}`;
        }

        if (element.className && typeof element.className === 'string') {
            const classes = element.className.trim().split(/\s+/).filter(c => c && !c.startsWith('egrab'));
            if (classes.length > 0) {
                return `${element.tagName.toLowerCase()}.${classes.slice(0, 2).join('.')}`;
            }
        }

        return element.tagName.toLowerCase();
    }

    /**
     * Get matched CSS rules from stylesheets
     */
    function getMatchedCSSRules(element) {
        const matchedRules = [];

        try {
            for (const sheet of document.styleSheets) {
                try {
                    const rules = sheet.cssRules || sheet.rules;
                    if (!rules) continue;

                    for (const rule of rules) {
                        if (rule.type === CSSRule.STYLE_RULE) {
                            try {
                                if (element.matches(rule.selectorText)) {
                                    matchedRules.push(`${rule.selectorText} {\n${formatRuleStyle(rule.style)}\n}`);
                                }
                            } catch (e) {
                                // Selector may be invalid, skip
                            }
                        }
                    }
                } catch (e) {
                    // CORS restriction on external stylesheets
                    continue;
                }
            }
        } catch (e) {
            // Ignore errors
        }

        return matchedRules;
    }

    /**
     * Format CSS rule style
     */
    function formatRuleStyle(style) {
        const result = [];
        for (let i = 0; i < style.length; i++) {
            const prop = style[i];
            const value = style.getPropertyValue(prop);
            const priority = style.getPropertyPriority(prop);
            result.push(`  ${prop}: ${value}${priority ? ' !important' : ''};`);
        }
        return result.join('\n');
    }

    /**
     * Extract JavaScript related to the current element
     */
    function extractJS() {
        if (!state.currentElement) {
            return { success: false, error: 'No element selected' };
        }

        try {
            const element = state.currentElement;
            const result = [];
            const selector = getElementSelector(element);

            result.push(`/* JavaScript related to: ${selector} */\n`);

            // 1. Inline event handlers
            const eventAttributes = [];
            const eventNames = [
                'onclick', 'ondblclick', 'onmousedown', 'onmouseup', 'onmouseover', 'onmouseout', 'onmousemove',
                'onkeydown', 'onkeyup', 'onkeypress',
                'onfocus', 'onblur', 'onchange', 'oninput', 'onsubmit', 'onreset',
                'onload', 'onerror', 'onscroll', 'onresize',
                'ondragstart', 'ondrag', 'ondragend', 'ondragover', 'ondragenter', 'ondragleave', 'ondrop',
                'ontouchstart', 'ontouchmove', 'ontouchend', 'ontouchcancel'
            ];

            for (const eventName of eventNames) {
                const handler = element.getAttribute(eventName);
                if (handler) {
                    eventAttributes.push({ event: eventName, handler });
                }
            }

            if (eventAttributes.length > 0) {
                result.push('/* Inline Event Handlers */');
                for (const { event, handler } of eventAttributes) {
                    result.push(`// ${event}`);
                    result.push(`element.${event} = function(event) {`);
                    result.push(`  ${handler}`);
                    result.push(`};\n`);
                }
            }

            // 2. Data attributes (often used by JS frameworks)
            const dataAttrs = [];
            for (const attr of element.attributes) {
                if (attr.name.startsWith('data-') ||
                    attr.name.startsWith('ng-') ||
                    attr.name.startsWith('v-') ||
                    attr.name.startsWith('x-') ||
                    attr.name.startsWith('@') ||
                    attr.name.startsWith(':')) {
                    dataAttrs.push({ name: attr.name, value: attr.value });
                }
            }

            if (dataAttrs.length > 0) {
                result.push('/* Data/Framework Attributes */');
                result.push('const elementAttributes = {');
                for (const { name, value } of dataAttrs) {
                    result.push(`  "${name}": "${value.replace(/"/g, '\\"')}",`);
                }
                result.push('};\n');
            }

            // 3. Find script tags that might reference this element
            const scriptReferences = findScriptReferences(element);
            if (scriptReferences.length > 0) {
                result.push('/* Potentially Related Script References */');
                for (const ref of scriptReferences) {
                    result.push(ref);
                }
            }

            // 4. Element selector for programmatic access
            result.push('\n/* Element Selection */');
            if (element.id) {
                result.push(`const element = document.getElementById('${element.id}');`);
            } else if (element.className && typeof element.className === 'string') {
                const className = element.className.split(' ')[0];
                if (className) {
                    result.push(`const element = document.querySelector('.${className}');`);
                } else {
                    result.push(`const element = document.querySelector('${element.tagName.toLowerCase()}');`);
                }
            } else {
                result.push(`const element = document.querySelector('${element.tagName.toLowerCase()}');`);
            }

            if (result.length <= 3) {
                result.push('\n// No inline JavaScript handlers or data attributes found.');
                result.push('// Note: addEventListener() bindings cannot be detected from content scripts.');
            }

            return { success: true, data: result.join('\n') };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Find script tags that might reference the element
     */
    function findScriptReferences(element) {
        const references = [];
        const searchTerms = [];

        // Collect search terms
        if (element.id) {
            searchTerms.push(element.id);
        }
        if (element.className && typeof element.className === 'string') {
            const classes = element.className.split(' ').filter(c => c.length > 2);
            searchTerms.push(...classes.slice(0, 3));
        }

        if (searchTerms.length === 0) return references;

        // Search inline scripts
        const scripts = document.querySelectorAll('script:not([src])');
        for (const script of scripts) {
            const content = script.textContent || '';
            for (const term of searchTerms) {
                if (content.includes(term)) {
                    const lines = content.split('\n');
                    for (let i = 0; i < lines.length; i++) {
                        if (lines[i].includes(term)) {
                            references.push(`// Line ~${i + 1}: ${lines[i].trim().substring(0, 100)}`);
                            if (references.length >= 5) break;
                        }
                    }
                    break;
                }
            }
            if (references.length >= 5) break;
        }

        return references;
    }

    /**
     * Extract all data (HTML + CSS + JS)
     */
    function extractAll() {
        if (!state.currentElement) {
            return { success: false, error: 'No element selected' };
        }

        const results = [];
        const selector = getElementSelector(state.currentElement);

        results.push('═'.repeat(60));
        results.push(`eGrab Export - ${selector}`);
        results.push(`Captured at: ${new Date().toISOString()}`);
        results.push('═'.repeat(60));

        // HTML
        results.push('\n' + '─'.repeat(40));
        results.push('📋 HTML');
        results.push('─'.repeat(40));
        const htmlResult = extractHTML();
        results.push(htmlResult.success ? htmlResult.data : `Error: ${htmlResult.error}`);

        // CSS
        results.push('\n' + '─'.repeat(40));
        results.push('🎨 CSS');
        results.push('─'.repeat(40));
        const cssResult = extractCSS();
        results.push(cssResult.success ? cssResult.data : `Error: ${cssResult.error}`);

        // JavaScript
        results.push('\n' + '─'.repeat(40));
        results.push('⚡ JavaScript');
        results.push('─'.repeat(40));
        const jsResult = extractJS();
        results.push(jsResult.success ? jsResult.data : `Error: ${jsResult.error}`);

        results.push('\n' + '═'.repeat(60));
        results.push('End of eGrab Export');
        results.push('═'.repeat(60));

        return { success: true, data: results.join('\n') };
    }

    // ============================================================
    // Clipboard Operations
    // ============================================================

    /**
     * Copy text to clipboard
     */
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return { success: true };
        } catch (error) {
            // Fallback for older browsers
            try {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                return { success: true };
            } catch (fallbackError) {
                return { success: false, error: fallbackError.message };
            }
        }
    }

    // ============================================================
    // Event Handlers
    // ============================================================

    /**
     * Handle mouseover events
     */
    function handleMouseOver(event) {
        if (!state.enabled) return;

        const target = event.target;

        // Ignore eGrab elements
        if (isEgrabElement(target)) return;

        // Ignore body and html
        if (target === document.body || target === document.documentElement) return;

        state.currentElement = target;
        updateOverlayPosition(target);
    }

    /**
     * Handle mouseout events
     */
    function handleMouseOut(event) {
        // Only hide if we're leaving to a non-child element
        if (!event.relatedTarget || !state.currentElement?.contains(event.relatedTarget)) {
            // Keep the element selected but you could hide the overlay
            // hideOverlay();
        }
    }

    /**
     * Handle scroll events
     */
    function handleScroll() {
        if (state.currentElement && state.enabled) {
            updateOverlayPosition(state.currentElement);
        }
    }

    /**
     * Handle window resize
     */
    function handleResize() {
        if (state.currentElement && state.enabled) {
            updateOverlayPosition(state.currentElement);
        }
    }

    // ============================================================
    // Message Handler
    // ============================================================

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        const { action } = message;

        switch (action) {
            case 'copyHTML': {
                const result = extractHTML();
                if (result.success) {
                    copyToClipboard(result.data).then((copyResult) => {
                        if (copyResult.success) {
                            showToast('HTML copied to clipboard!', 'success');
                            sendResponse({ success: true });
                        } else {
                            showToast('Failed to copy HTML', 'error');
                            sendResponse({ success: false, error: copyResult.error });
                        }
                    });
                } else {
                    showToast(result.error || 'No element selected', 'error');
                    sendResponse({ success: false, error: result.error });
                }
                return true; // Async response
            }

            case 'copyCSS': {
                const result = extractCSS();
                if (result.success) {
                    copyToClipboard(result.data).then((copyResult) => {
                        if (copyResult.success) {
                            showToast('CSS copied to clipboard!', 'success');
                            sendResponse({ success: true });
                        } else {
                            showToast('Failed to copy CSS', 'error');
                            sendResponse({ success: false, error: copyResult.error });
                        }
                    });
                } else {
                    showToast(result.error || 'No element selected', 'error');
                    sendResponse({ success: false, error: result.error });
                }
                return true;
            }

            case 'copyJS': {
                const result = extractJS();
                if (result.success) {
                    copyToClipboard(result.data).then((copyResult) => {
                        if (copyResult.success) {
                            showToast('JavaScript copied to clipboard!', 'success');
                            sendResponse({ success: true });
                        } else {
                            showToast('Failed to copy JavaScript', 'error');
                            sendResponse({ success: false, error: copyResult.error });
                        }
                    });
                } else {
                    showToast(result.error || 'No element selected', 'error');
                    sendResponse({ success: false, error: result.error });
                }
                return true;
            }

            case 'copyAll': {
                const result = extractAll();
                if (result.success) {
                    copyToClipboard(result.data).then((copyResult) => {
                        if (copyResult.success) {
                            showToast('All data copied to clipboard!', 'success');
                            sendResponse({ success: true });
                        } else {
                            showToast('Failed to copy data', 'error');
                            sendResponse({ success: false, error: copyResult.error });
                        }
                    });
                } else {
                    showToast(result.error || 'No element selected', 'error');
                    sendResponse({ success: false, error: result.error });
                }
                return true;
            }

            case 'toggleHighlight': {
                state.enabled = !state.enabled;
                if (!state.enabled) {
                    hideOverlay();
                    showToast('Highlight disabled', 'info');
                } else {
                    showToast('Highlight enabled', 'info');
                }
                sendResponse({ success: true, enabled: state.enabled });
                return false;
            }

            case 'setEnabled': {
                state.enabled = message.enabled;
                if (!state.enabled) {
                    hideOverlay();
                }
                sendResponse({ success: true });
                return false;
            }

            case 'getState': {
                sendResponse({
                    success: true,
                    enabled: state.enabled,
                    hasElement: !!state.currentElement
                });
                return false;
            }

            default:
                sendResponse({ success: false, error: 'Unknown action' });
                return false;
        }
    });

    // ============================================================
    // Initialization
    // ============================================================

    function init() {
        // Create overlay
        createOverlay();

        // Add event listeners
        document.addEventListener('mouseover', handleMouseOver, true);
        document.addEventListener('mouseout', handleMouseOut, true);
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleResize, { passive: true });

        // Load settings
        chrome.runtime.sendMessage({ type: 'getSettings' }, (response) => {
            if (response) {
                state.enabled = response.highlightEnabled === true; // Default to OFF
                if (response.highlightColor) {
                    CONFIG.HIGHLIGHT_COLOR = response.highlightColor.replace(')', ', 0.3)').replace('rgb', 'rgba');
                }
            }
        });

        console.log('eGrab: Content script initialized');
    }

    // Run initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
