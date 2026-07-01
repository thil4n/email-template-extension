# Gmail Email Templates

A tiny Chrome extension (Manifest V3) to store frequently used email templates and drop them into Gmail with one click.

## Features

- Manage templates (name + optional subject + body) from the toolbar popup.
- A 📋 button appears on the subject row of every Gmail compose window.
- Click it to search your templates and insert one at the cursor.
- Templates are stored locally with `chrome.storage.local`.

## Install (unpacked)

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select this folder (`email-template-extension`).
4. Pin the extension, then click its icon to add/edit templates.
5. Open Gmail (`mail.google.com`), hit **Compose**, and click the 📋 button on the subject line.

If Gmail was already open, reload the tab after loading the extension.

## Files

| File          | Purpose                                             |
| ------------- | --------------------------------------------------- |
| `manifest.json` | Extension manifest (MV3).                         |
| `popup.html/.css/.js` | Template manager UI.                        |
| `content.js` / `content.css` | Injected into Gmail; button + picker. |
| `icons/`      | Toolbar icons.                                      |

## Notes

- Template bodies are plain text; line breaks are preserved. Rich formatting is not stored.
- The subject is only filled if you haven't already typed one, so it won't overwrite your work.
- Because Gmail's HTML is generated and can change, the compose selectors may need occasional updates.
