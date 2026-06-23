# ST-ComfyUI-WebUI-Helper

SillyTavern third-party extension for generating images through ComfyUI or Stable Diffusion WebUI.

This repository is intended to be used as the extension folder:

```text
SillyTavern/public/scripts/extensions/third-party/ST-ComfyUI-WebUI-Helper
```

## Features

- ComfyUI and WebUI connection modes.
- Manual connection only, so SillyTavern does not poll ComfyUI/WebUI while unused.
- AI-first RP image generation: assistant messages get `AI生图` / `AI提示词` actions that use SillyTavern quiet LLM generation to analyze recent context, cache an editable English image prompt on the message, hide that prompt behind an edit-on-demand summary, and then send it through ComfyUI/WebUI without polluting chat text.
- Optional OpenAI-compatible or native Anthropic LLM endpoint for AI prompt analysis in the `AI/LLM管理` tab; SillyTavern's current LLM remains the default, with optional automatic or manual `/models` detection where supported.
- Optional external-LLM thinking mode controls for OpenAI, Anthropic, and DeepSeek-style APIs, including provider strategy, effort, and Anthropic budget settings.
- `AI/LLM管理` supports reusable drawing-analysis rule presets and a local self-named multi-key API Key list; API keys are intentionally excluded from settings export.
- Chat image actions show clear analyzing/generating/success/failure states while disabling duplicate clicks during long operations.
- Optional automatic AI prompt analysis or automatic AI prompt + image generation after assistant replies stabilize.
- Legacy generation-marker scanning remains available as a compatibility path.
- ComfyUI API-format workflow validation.
- Full plugin settings export/import.
- Workflow JSON formatting, copying, and placeholder insertion helpers.
- Workflow JSON minify and analysis helpers for node counts, placeholders, LoRA readiness, and common warnings.
- Workflow, prompt preset, AI drawing-rule preset, LoRA, image cache, and img2img panel controls, with guarded preset overwrite/load behavior.
- ComfyUI LoRA bulk tools: filtered multi-select/toggle, shared model/CLIP weight apply, enable/disable all, injection order controls, and copy/export/import selections.
- ComfyUI LoRA injection tracing: targets the sampler's actual MODEL path, defaults to stable MODEL-only injection when available, can switch to MODEL+CLIP, supports per-LoRA trigger words, strict injection checks, and final workflow debug export.
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
# Or inspect the package.json check script for the complete module list.
```

## Structure

```text
features/
  ai-prompt/                Independent AI/LLM prompt analysis, rule presets, API keys, and model detection
  app/                      App composition, runtime, lifecycle, and feature stacks
  cache/                    Generated-image cache saving, grid view, and preview
  chat/                     Chat scanning, message actions, and message runtime state
  comfyui/                  ComfyUI generation helpers, result parsing, and resource reads
    lora/                   ComfyUI LoRA list, selection, triggers, and workflow injection
  core/                     Runtime config, connection sessions, validators, and object cache
  generation/               ComfyUI/WebUI generation orchestration, button state, and img2img
  panel/                    Settings panel controller, listeners, mode switching, and parameter UI
  progress/                 Generation progress, preview frames, and execution state
  resources/                Model, LoRA, embedding, and sampler resource services
  settings/                 Settings persistence, backup import/export, and preset management
  webui/                    Stable Diffusion WebUI generation and resource services
  workflow/                 Workflow management, validation, debugging, and placeholder conversion
lib/
  browser/                  Blob URL and userscript compatibility helpers
  core/                     Shared utility functions
  http/                     HTTP request wrapper and retry helper
  prompt/                   SD prompt parsing, merging, and validation
  storage/                  Image cache IndexedDB wrapper
ui/
  core/                     Device detection and toast UI
  images/                   Image rendering, hover preview, and comparison mode
  panel/                    Panel template aggregation, style aggregation, DOM lookup, and drag position
  presets/                  Shared preset and local selection-list UI factories
  styles/                   Panel CSS split by feature area
  templates/                Panel HTML split by tab
index.js                     Extension entry point and main generation logic
manifest.json                SillyTavern extension manifest
style.css                    Placeholder; main styles are injected by JS
```

## Notes

- Keep `manifest.json` as the extension entry point unless SillyTavern changes its extension loader behavior.
- After creating the private GitHub repository, update `manifest.json` `homePage` if you want it to point at your own repo.
- This project is private/internal unless you explicitly add a public license.
