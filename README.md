# 2FA Authenticator

A browser extension for generating TOTP (Time-Based One-Time Password) codes — fully offline, no cloud, no tracking. Works on Chrome, Brave, Edge, and Opera.

## Features

- Generates 6-digit TOTP codes compatible with Google Authenticator
- Live 30-second countdown timer
- Search accounts by issuer or account name, with results sorted by best match
- Copy codes with one click
- Add accounts by typing the secret key or uploading a QR code image
- QR code scanning auto-fills issuer, account name, and secret key
- Delete accounts
- Export accounts as a local JSON backup
- Donate page with crypto wallet QR codes
- In-app Privacy page
- 100% client-side — your secrets never leave your device

## Installation

This extension works on any Chromium-based browser — Chrome, Brave, Edge, and Opera.

1. Download or clone this repository
2. Download the QR decoder library and place it in the extension folder:
   - Visit: `https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js`
   - Right-click the page → **Save As** → save as `jsQR.js` in the extension folder
   - Or run in terminal: `curl -o jsQR.js https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js`
3. Open your browser and navigate to the extensions page:
   - Chrome: `chrome://extensions`
   - Brave: `brave://extensions`
   - Edge: `edge://extensions`
   - Opera: `opera://extensions`
4. Enable **Developer mode** (top right toggle)
5. Click **Load unpacked** and select the extension folder

Your extension folder should contain:

```
2fa-authenticator/
├── jsQR.js
├── manifest.json
├── popup.html
├── popup.js
├── styles.css
├── totp.js
├── storage.js
├── icon.png
└── qr/
```

## Usage

- Click the extension icon in your toolbar to open it
- Add an account using the **+ Add account** form:
  - **Type tab** — enter the issuer name, account email/username, and base32 secret key manually
  - **Scan QR tab** — upload a QR code image from your 2FA setup page; issuer, account, and secret are filled in automatically
- Use the **search bar** to filter accounts by issuer or account name — results sort by best match as you type
- Click **Copy** to copy a code to your clipboard
- Click **Import** to load accounts from a `.json` backup or a `.txt` file of `otpauth://` URIs — duplicates and invalid secrets are skipped automatically
- Click **Export** to save a backup of your accounts as a JSON file
- Click **Delete** to enter delete mode — a red remove button appears on each card
- Click **Donate** to support the project with crypto
- Click **Privacy** to view our privacy policy

## Privacy

This extension collects no data. Everything is stored locally in your browser using `chrome.storage.local`. Nothing is sent to any server. The QR decoder (`jsQR`) runs entirely offline inside the extension.

## Contact

For questions or support, reach out at [klaus@mikaelsons.com](mailto:klaus@mikaelsons.com)

## License

MIT — Copyright (c) 2026 Mikaelsons. See [LICENSE](./LICENSE) for details.
