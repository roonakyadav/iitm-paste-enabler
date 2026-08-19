# IITM Paste Enabler

A lightweight Chrome/Chromium extension that restores normal **Ctrl+V pasting** inside the coding editor on the IITM study platform.

Built specifically for:

```text
https://ds.study.iitm.ac.in/student_dashboard/
```

The extension is designed for local use and works entirely in the browser without requiring an external server or API.

---

## Features

* **Normal Ctrl+V support** inside the IITM coding editor
* Designed for the **Ace Editor** used by the platform
* Automatically runs when an IITM page is opened
* No DevTools console scripts required
* Enable or disable the extension from the browser toolbar
* Runs only on `seek.study.iitm.ac.in`
* Lightweight and local
* No external backend
* No account or API key required

---

## How It Works

The IITM coding interface uses **Ace Editor** and can intercept the browser's normal paste behavior.

IITM Paste Enabler works at the page level and connects the browser's paste/keyboard interaction with the Ace editor so that copied text can be inserted directly into the editor.

```text
Clipboard
    │
    ▼
Ctrl + V
    │
    ▼
IITM Paste Enabler
    │
    ▼
Ace Editor
    │
    ▼
Code inserted into editor
```

---

## Installation

This extension is intended for local installation.

### Requirements

* Google Chrome, Chromium, or Microsoft Edge
* Developer Mode enabled
* The extension source code

### Install

1. Download or clone this repository.

2. Open:

```text
chrome://extensions
```

For Microsoft Edge:

```text
edge://extensions
```

3. Enable **Developer mode**.

4. Click **Load unpacked**.

5. Select the project directory:

```text
iitm-paste-enabler-v2/
```

6. The extension should now appear in your extensions list.

7. Open:

```text
https://seek.study.iitm.ac.in/
```

8. Refresh the page after installing the extension.

---

## Usage

Once installed:

1. Open an IITM coding question.
2. Click inside the code editor.
3. Copy the code you want.
4. Press:

```text
Ctrl + V
```

The code should be inserted into the editor.

The extension can be enabled or disabled from its toolbar popup.

---

## Project Structure

```text
iitm-paste-enabler-v2/
│
├── logo.png
├── manifest.json
├── paste.js
├── popup.html
├── popup.js
└── README.md
```

### `manifest.json`

Defines the Chrome extension, permissions, content scripts, host permissions, and popup configuration.

### `paste.js`

Contains the main logic responsible for interacting with the IITM page and its editor.

### `popup.html`

Defines the extension popup interface.

### `popup.js`

Handles the popup state and enable/disable functionality.

### `logo.png`

Extension icon.

---

## Permissions

The extension is intentionally restricted to the IITM study website.

Its main host permission is:

```text
https://seek.study.iitm.ac.in/*
```

This prevents the content script from unnecessarily running on unrelated websites.

---

## Privacy

IITM Paste Enabler does not use:

* Analytics
* Advertising
* External servers
* A remote database
* User accounts
* API keys

The extension exists entirely as a local browser customization.

---

## Limitations

This extension targets the specific IITM coding environment and its current editor implementation.

Changes to the IITM website, editor implementation, or paste-handling behavior may cause the extension to stop working or require an update.

It is **not intended to be a universal paste-unblocking extension** for arbitrary websites.

---

## Development

Clone the repository and open the project directory:

```bash
git clone <repository-url>
cd iitm-paste-enabler-v2
```

There is no build system required for the current version.

After changing the extension code:

1. Open `chrome://extensions`
2. Find **IITM Paste Enabler**
3. Click **Reload**
4. Refresh the IITM page

---

## Contributing

Contributions and improvements are welcome.

Useful areas for improvement include:

* More reliable Ace editor detection
* Better keyboard handling
* Improved popup UI
* Extension settings
* Better compatibility with future IITM UI changes
* Automated testing

---

## License

Add the license you want to use for the project before publishing it publicly.

---

## Disclaimer

This is an independent browser extension created for improving the local user experience of the IITM study platform.

It is not affiliated with or endorsed by IIT Madras.
