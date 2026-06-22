# Changelog

## 5.4.0

- Added cancel/interrupt for in-progress generation (ComfyUI `/interrupt`, WebUI `/sdapi/v1/interrupt`) with a cancel button on the progress bar.
- Switched ComfyUI result retrieval to WebSocket completion events, with HTTP `/history` polling and preview frames as fallbacks; greatly reduces polling traffic.
- Added optional "direct connection" mode that bypasses SillyTavern's `/proxy` to stop backend log spam and the `MaxListenersExceededWarning` (requires CORS enabled on ComfyUI/WebUI).
- Added ComfyUI LoRA bulk tools: apply shared model/CLIP strengths, select/toggle the current filtered list, enable/disable all, reorder injection order, and copy/export/import LoRA selections.
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
