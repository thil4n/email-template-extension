# Gmail Email Templates

A tiny Chrome extension (Manifest V3) to store frequently used email templates and drop them into Gmail with one click.

## Features

- Manage templates (name + body) from the toolbar popup.
- A 📋 button appears in the top-right of every message body — new compose **and inline replies**.
- Click it to search your templates and insert the body at the cursor.
- Templates are stored locally with `chrome.storage.local`.
- **Export / Import** buttons back up all templates to a JSON file and restore them.

## Backup

- **Export** downloads a `email-templates-backup-YYYY-MM-DD.json` file with all your templates.
- **Import** reads such a file and *adds* those templates to your current list (non-destructive — it never deletes what you already have). Re-importing the same file creates duplicates, which you can delete.

Keep an exported copy somewhere safe: uninstalling the extension wipes its local storage.

## Install (unpacked)

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select this folder (`email-template-extension`).
4. Pin the extension, then click its icon to add/edit templates.
5. Open Gmail (`mail.google.com`), start a **Compose** or **Reply**, and click the 📋 button in the top-right of the message body.

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
- Because Gmail's HTML is generated and can change, the compose selectors may need occasional updates.
