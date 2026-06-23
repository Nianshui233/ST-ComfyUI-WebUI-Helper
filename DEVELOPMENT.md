# Development

## Editing Rules

- Keep the extension as plain browser JavaScript modules. There is no bundler.
- Keep `index.js` as the SillyTavern entry point.
- Put UI-only code in categorized `ui/` folders.
- Put isolated feature controllers in categorized `features/` folders.
- Put compatibility and low-level adapters in categorized `lib/` folders.
- Keep reusable pure helpers out of `index.js`; prefer focused modules such as `lib/core/utils.js`, `lib/prompt/sd-prompt.js`, and `lib/storage/image-cache-db.js`.
- Avoid adding dependencies unless there is a clear runtime reason.

## Manual Test Checklist

1. Restart SillyTavern or refresh the browser with cache disabled.
2. Confirm the extension loads without console import errors.
3. Open the image helper panel.
4. Confirm no ComfyUI/WebUI request is sent before pressing Connect.
5. Press Connect for ComfyUI or WebUI and confirm the status indicator changes.
6. Run "scan current chat" and confirm generation buttons appear where expected.
7. Validate a ComfyUI workflow.
8. Generate one image.

## Syntax Check

```bash
npm run check
```

This only checks JavaScript parse validity. It does not replace browser testing inside SillyTavern.

## Module Map

```text
index.js                     SillyTavern entry point only
features/app/                App runtime, composition, lifecycle, and stack wiring
features/ai-prompt/          AI/LLM provider calls, model detection, prompt cleanup, rules, API keys
features/cache/              Generated image cache controller, saver, and grid viewer
features/chat/               Chat scanning and message action orchestration
features/comfyui/            ComfyUI helpers, results, resources, and LoRA workflow injection
features/core/               Runtime config, validators, object cache, connection session
features/generation/         Generation service, generate button controller, img2img state
features/panel/              Panel controller, listeners, mode UI, seed/settings validation
features/progress/           Progress tracker, execution state, preview frame UI
features/resources/          Model/LoRA/embedding resource services
features/settings/           Settings controller, backup import/export, preset controller
features/webui/              WebUI generation and resource services
features/workflow/           Workflow manager, validation, storage, editor tools, debug helpers
lib/browser/                 Browser/userscript adapters
lib/core/                    Small shared browser/runtime helpers
lib/http/                    HTTP request wrapper and retry helper
lib/prompt/                  SD prompt parsing, merging, and logging
lib/storage/                 Generated image cache storage
ui/core/                     Device detection and toast UI
ui/images/                   Image rendering, tooltip preview, comparison mode
ui/panel/                    Panel template/style aggregation, DOM lookup, position handling
ui/presets/                  Shared preset and selection-list UI factories
ui/styles/                   Split panel style chunks
ui/templates/                Split panel HTML template chunks
```
