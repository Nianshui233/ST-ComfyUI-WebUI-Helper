# Changelog

## 5.4.0

- Added cancel/interrupt for in-progress generation (ComfyUI `/interrupt`, WebUI `/sdapi/v1/interrupt`) with a cancel button on the progress bar.
- Switched ComfyUI result retrieval to WebSocket completion events, with HTTP `/history` polling and preview frames as fallbacks; greatly reduces polling traffic.
- Added optional "direct connection" mode that bypasses SillyTavern's `/proxy` to stop backend log spam and the `MaxListenersExceededWarning` (requires CORS enabled on ComfyUI/WebUI).
- Added ComfyUI LoRA bulk tools: apply shared model/CLIP strengths, select/toggle the current filtered list, enable/disable all, reorder injection order, and copy/export/import LoRA selections.
- Strengthened ComfyUI LoRA injection with sampler-path tracing, dynamic LoRA loader detection, strict post-injection checks, per-LoRA trigger words, MODEL-only/MODEL+CLIP injection modes, injected-node cleanup, and final workflow debug export.
- Improved prompt presets with empty-save prevention, safer load overwrite confirmation, selected-preset overwrite defaults, and refreshed preset lists after settings import.
- Shifted the chat workflow to AI-first image generation: assistant messages now expose `AI生图` / `AI提示词` actions, cache editable prompts on the message, hide prompts behind an edit-on-demand summary, show analyzing/generating/success/failure states, support rewrite/copy/clear, and can optionally auto-analyze or auto-analyze-and-generate after replies stabilize. Legacy marker scanning remains as a compatibility path.
- Moved AI drawing settings into a dedicated `AI/LLM管理` tab and added an optional OpenAI-compatible LLM endpoint with automatic/manual `/models` detection while keeping SillyTavern's current LLM as the default.
- Added reusable AI drawing-analysis rule presets plus a local self-named API Key list for multi-key OpenAI-compatible providers; API keys remain excluded from settings export.
- Added workflow JSON minify and workflow analysis helpers for node counts, placeholders, LoRA readiness, and common warnings.
- Reduced WebUI progress polling frequency.
- Fixed cache-panel refresh revoking blob URLs of images still shown in chat (BlobURLTracker is now bucketed by tag).
- Fixed a TypeError in multi-image (batch) hover tooltips (`ImageTooltip` method names).
- Hardened the generation promise lifecycle (no unhandled rejection on cancel during HTTP fallback) and removed dead code in the connection monitor.

## 5.3.0

- Migrated the original userscript into a SillyTavern third-party extension.
- Added SillyTavern `/proxy` request compatibility for ComfyUI/WebUI API calls.
- Changed connection behavior to manual-only to avoid background polling when unused.
- Added disconnect behavior that stops scanning.
- Added manual current-chat scan.
- Added ComfyUI workflow validation.
- Added full plugin settings export/import.
- Added workflow JSON format/copy helpers and placeholder insertion buttons.
- Split compatibility, feature controllers, and UI code into smaller modules.
