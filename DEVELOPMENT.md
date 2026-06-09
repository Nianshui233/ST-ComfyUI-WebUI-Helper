# Development

## Editing Rules

- Keep the extension as plain browser JavaScript modules. There is no bundler.
- Keep `index.js` as the SillyTavern entry point.
- Put UI-only code in `ui/`.
- Put isolated feature controllers in `features/`.
- Put compatibility and low-level adapters in `lib/`.
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
