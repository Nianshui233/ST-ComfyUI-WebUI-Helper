# ST-ComfyUI-WebUI-Helper

SillyTavern third-party extension for generating images through ComfyUI or Stable Diffusion WebUI.

This repository is intended to be used as the extension folder:

```text
SillyTavern/public/scripts/extensions/third-party/ST-ComfyUI-WebUI-Helper
```

## Features

- ComfyUI and WebUI connection modes.
- Manual connection only, so SillyTavern does not poll ComfyUI/WebUI while unused.
- Manual current-chat scan for generation markers.
- ComfyUI API-format workflow validation.
- Full plugin settings export/import.
- Workflow JSON formatting, copying, and placeholder insertion helpers.
- Workflow, prompt preset, LoRA, image cache, and img2img panel controls.
- SillyTavern `/proxy` based request compatibility for cross-origin API calls.
- Optional direct-connection mode that bypasses the SillyTavern proxy (requires CORS enabled on ComfyUI/WebUI) to avoid backend log spam.
- WebSocket-based ComfyUI result retrieval, with HTTP polling and preview frames as fallbacks.
- Cancel/interrupt button for in-progress generation.

## Install

Clone this private repository into SillyTavern's third-party extension directory:

```bash
cd SillyTavern/public/scripts/extensions/third-party
git clone <your-private-repo-url> ST-ComfyUI-WebUI-Helper
```

Then restart SillyTavern and enable the extension from the Extensions panel.

## Local Checks

No build step is required. Run syntax checks with:

```bash
npm run check
```

Or directly:

```bash
node --check index.js
node --check lib/tampermonkey-compat.js
node --check features/connection-session.js
node --check features/manual-scan.js
node --check features/workflow-validation.js
node --check ui/panel-template.js
node --check ui/panel-styles.js
node --check ui/panel-elements.js
node --check ui/panel-position.js
```

## Structure

```text
features/
  connection-session.js      Connection status and manual session checks
  manual-scan.js             Scan on/off and manual scan controller
  workflow-validation.js     ComfyUI workflow validation
lib/
  tampermonkey-compat.js     Migrated userscript compatibility helpers
ui/
  panel-template.js          Panel HTML template
  panel-styles.js            Panel CSS template
  panel-elements.js          Panel DOM element lookup
  panel-position.js          Panel drag and saved-position behavior
index.js                     Extension entry point and main generation logic
manifest.json                SillyTavern extension manifest
style.css                    Placeholder; main styles are injected by JS
```

## Notes

- Keep `manifest.json` as the extension entry point unless SillyTavern changes its extension loader behavior.
- After creating the private GitHub repository, update `manifest.json` `homePage` if you want it to point at your own repo.
- This project is private/internal unless you explicitly add a public license.
