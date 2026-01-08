# 🎯 eGrab - Element Grabber

A powerful Chrome extension that lets you hover-select any element on a webpage and instantly copy its HTML, CSS, or JavaScript—without ever opening DevTools.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chrome](https://img.shields.io/badge/chrome-v88+-yellow.svg)

## ✨ Features

- **🎯 Hover Highlighting** - Visual overlay that follows your cursor, highlighting any element you hover over
- **📋 Copy HTML** - Instantly copy the formatted outer HTML of any element
- **🎨 Copy CSS** - Extract computed styles and matched CSS rules
- **⚡ Copy JavaScript** - Find inline event handlers, data attributes, and related script references
- **📦 Copy ALL** - Export everything (HTML + CSS + JS) in one click
- **🚀 No DevTools Required** - Everything accessible via right-click context menu
- **🌙 Dark Mode Support** - Beautiful overlay that adapts to your system theme

## 📦 Installation

### From Source (Developer Mode)

1. **Download or Clone** this repository:
   ```bash
   git clone https://github.com/yourusername/egrab.git
   ```

2. **Open Chrome Extensions**:
   - Navigate to `chrome://extensions/`
   - Or go to Menu → More Tools → Extensions

3. **Enable Developer Mode**:
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**:
   - Click "Load unpacked"
   - Select the `eGrab` folder

5. **Pin the Extension** (optional):
   - Click the puzzle piece icon in Chrome toolbar
   - Pin eGrab for easy access

## 🚀 Usage

### Basic Workflow

1. **Navigate** to any webpage
2. **Hover** over any element - you'll see a blue highlight overlay
3. **Right-click** on the highlighted element
4. **Select** from the eGrab menu:
   - 📋 **Copy HTML** - Copies the element's outer HTML
   - 🎨 **Copy CSS** - Copies computed and matched CSS styles
   - ⚡ **Copy JavaScript** - Copies inline handlers and related JS
   - 📦 **Copy ALL** - Copies everything combined

### Popup Controls

Click the eGrab icon in your toolbar to:
- Toggle hover highlighting on/off
- View extension status
- Access quick help

## 📋 What Gets Copied

### HTML Output
```html
<button class="btn primary" onclick="handleClick()">
  Click Me
</button>
```

### CSS Output
```css
/* Styles for: button.btn.primary */

/* Computed Styles */
button.btn.primary {
  display: inline-flex;
  background-color: rgb(59, 130, 246);
  color: rgb(255, 255, 255);
  padding: 12px 24px;
  border-radius: 8px;
  /* ... more styles */
}

/* Matched CSS Rules */
.btn {
  font-family: inherit;
  cursor: pointer;
}
.primary {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
}
```

### JavaScript Output
```javascript
/* JavaScript related to: button.btn.primary */

/* Inline Event Handlers */
// onclick
element.onclick = function(event) {
  handleClick()
};

/* Data/Framework Attributes */
const elementAttributes = {
  "data-action": "submit",
  "data-loading": "false",
};

/* Element Selection */
const element = document.querySelector('.btn.primary');
```

## ⚙️ Technical Details

### Permissions Used

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access the current tab when user invokes the extension |
| `contextMenus` | Create right-click menu items |
| `clipboardWrite` | Copy extracted data to clipboard |
| `storage` | Save user preferences |
| `<all_urls>` | Work on any website |

### Manifest Version

This extension uses **Manifest V3**, Chrome's latest extension platform with improved security and performance.

## ⚠️ Known Limitations

1. **External Stylesheets**: CSS rules from external stylesheets with different origins may not be accessible due to CORS restrictions

2. **addEventListener Bindings**: JavaScript event listeners added via `addEventListener()` cannot be detected from content scripts—only inline handlers (`onclick`, etc.) are visible

3. **Shadow DOM**: Elements inside closed Shadow DOM are not accessible

4. **Chrome Pages**: The extension doesn't work on `chrome://` pages or the Chrome Web Store

## 🛠️ Development

### Project Structure
```
eGrab/
├── manifest.json      # Extension configuration
├── background.js      # Service worker (context menu)
├── content.js         # Main functionality (hover + extraction)
├── styles.css         # Overlay styling
├── popup.html         # Popup UI
├── popup.js           # Popup logic
├── icons/             # Extension icons
└── README.md          # Documentation
```

### Building Icons

If you want to create custom icons:
```bash
# Recommended sizes: 16x16, 48x48, 128x128 pixels
# Format: PNG with transparency
```

## 📄 License

MIT License - feel free to use, modify, and distribute.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Support

If you encounter any issues or have suggestions, please [open an issue](https://github.com/yourusername/egrab/issues).

---

Made with ❤️ for developers who want quick element inspection without DevTools.
