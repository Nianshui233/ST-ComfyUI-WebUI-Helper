# ST-ComfyUI-WebUI-Helper

[中文 README](README.md) · [GitHub Repository](https://github.com/Nianshui233/ST-ComfyUI-WebUI-Helper)

![SillyTavern Extension](https://img.shields.io/badge/SillyTavern-third--party%20extension-66d7c7)
![ComfyUI](https://img.shields.io/badge/ComfyUI-supported-8ab4ff)
![Stable Diffusion WebUI](https://img.shields.io/badge/SD%20WebUI-supported-f0b86c)
![No Build](https://img.shields.io/badge/build-not%20required-73d48f)

A SillyTavern third-party extension for image generation through ComfyUI or Stable Diffusion WebUI.

It is designed for roleplay chats. The extension can ask a separate AI/LLM call to analyze the current chat, produce an image prompt, and send that prompt to your image backend. Your main RP model no longer has to write story text and image prompts in the same reply.

## Who Is This For?

- You use SillyTavern for RP and want images based on the current scene.
- You use ComfyUI or Stable Diffusion WebUI.
- You want RP writing and image-prompt analysis to stay separate.
- You want UI tools for LoRA, workflows, prompt presets, image cache, and logs.
- You want a storyboard mode that splits one scene into multiple image prompts.

## Highlights

| Feature | What it does |
| --- | --- |
| AI Image | Click `AI生图` under a chat message to analyze the scene and generate an image. |
| AI Prompt | Generate an editable hidden image prompt before sending it to the backend. |
| Storyboard mode | Split the current scene into multiple panels and generate them one by one. |
| ComfyUI / WebUI | Supports ComfyUI API-format workflows and Stable Diffusion WebUI. |
| LoRA tools | Search, batch select, order, apply weights, add trigger words, and verify ComfyUI LoRA injection. |
| Workflow tools | Save, import, export, format, minify, validate, and convert workflow placeholders. |
| AI/LLM management | Use SillyTavern's current LLM by default, or configure OpenAI-compatible / Anthropic APIs. |
| Rule presets | Save different analysis rules, such as Danbooru tags or FLUX-style natural-language prompts. |
| API key list | Save multiple self-named local API keys with masked display. |
| Runtime logs | Centralized logs for connection, AI calls, generation, errors, and cache operations. |

## Installation

### 1. Open SillyTavern's third-party extension folder

The extension should live here:

```text
SillyTavern/public/scripts/extensions/third-party/
```

Windows example:

```text
D:\AI\SillyTavern\public\scripts\extensions\third-party\
```

### 2. Clone this repository

```bash
cd SillyTavern/public/scripts/extensions/third-party
git clone https://github.com/Nianshui233/ST-ComfyUI-WebUI-Helper.git
```

The final path should look like this:

```text
SillyTavern/public/scripts/extensions/third-party/ST-ComfyUI-WebUI-Helper
```

### 3. Restart or refresh SillyTavern

Restart SillyTavern, or refresh the browser page. Then enable:

```text
ComfyUI/WebUI Image Helper
```

from the SillyTavern Extensions panel.

## Where Is The Plugin Entry?

After enabling the extension, open it from the bottom-left menu in the SillyTavern chat screen, not from the top extension icon:

![Plugin entry screenshot](docs/images/plugin-entry.png)

1. Click the menu button near the lower-left corner of the chat input area, the spot highlighted by the green arrow in the screenshot.
2. Find `图片生成面板` in the popup menu.
3. Click `图片生成面板` to open this extension's settings panel.
4. If the entry is missing, refresh SillyTavern and confirm that the extension is enabled.

The injected menu entry is named `图片生成面板`.

## First Setup

### Quick ComfyUI setup

1. Open the extension panel.
2. In `基础设置`, choose `ComfyUI`.
3. Enter your ComfyUI URL, usually `http://127.0.0.1:8188`.
4. Click connect.
5. Select a Checkpoint or UNet model.
6. In `生成参数`, set width, height, steps, CFG, sampler, and scheduler.
7. In chat, click `AI生图` or `AI提示词`.

### Quick WebUI setup

1. In `基础设置`, choose `WebUI`.
2. Enter your WebUI URL, usually `http://127.0.0.1:7860`.
3. Click connect and refresh the model list.
4. Configure WebUI generation parameters.
5. Click an image-generation action under a chat message.

### AI/LLM setup

The easiest starting point is:

```text
AI/LLM管理 -> Source -> SillyTavern current LLM
```

That does not require an extra API key. After the basic flow works, you can configure an external provider:

- OpenAI-compatible: OpenAI, DeepSeek, OpenRouter, local compatible servers, and similar providers.
- Anthropic: native Claude API.
- Model selection: automatic or manual `/models` detection where supported.
- Thinking mode: disable it first if a provider rejects reasoning parameters.

## Common Workflows

### Recommended: AI Image

```text
Chat message -> AI生图 -> LLM scene analysis -> ComfyUI/WebUI -> image under the message
```

### Prompt editing: AI Prompt

```text
Chat message -> AI提示词 -> open 绘画提示词 -> edit/save -> generate image
```

### Multi-panel scenes: Storyboard mode

1. Enable `启用连环画模式` in the basic feature settings.
2. Click `连环画` under a chat message.
3. The LLM splits the current scene into multiple panel prompts.
4. Generate one panel at a time, or click `生成全部` for sequential generation.

## ComfyUI Workflow Placeholders

Use ComfyUI API-format JSON and replace key inputs with placeholders.

```text
%prompt%            Positive prompt
%negative_prompt%   Negative prompt
%width%             Width
%height%            Height
%model%             Checkpoint
%unet_model%        UNet model
%seed%              Seed
%steps%             Steps
%cfg%               CFG
%sampler%           Sampler
%scheduler%         Scheduler
%init_image%        img2img reference image
%denoise%           img2img denoise strength
```

The workflow tab includes placeholder buttons, so you do not have to type them manually.

## LoRA Tips

- ComfyUI LoRA injection defaults to the more stable `MODEL-only` mode.
- Switch to `MODEL+CLIP` only when a LoRA explicitly needs text-encoder weights.
- Add trigger words for frequently used LoRAs; the extension can append them to the final positive prompt.
- If a LoRA seems inactive, enable final workflow saving and inspect the exported workflow in ComfyUI.
- Strict checks help catch injection failures and broken sampler model paths.

## FAQ

### The model list is empty

Make sure ComfyUI/WebUI is running, then connect or refresh the model list again. For ComfyUI workflows, also make sure the workflow uses `%model%` or `%unet_model%`.

### `ComfyUI Checkpoint 模型未选择`

Select a Checkpoint in `基础设置`, or select a UNet model if your workflow uses a UNet loader.

### CORS or request failures

By default, requests go through SillyTavern `/proxy`, so CORS is usually not required. If you enable direct connection mode, your ComfyUI/WebUI backend must allow CORS.

### `finish_reason=length`

Increase response length in `AI/LLM管理`, or simplify the drawing-analysis rule. Danbooru tag rules are usually more likely to hit output-length limits than natural-language rules.

### Thinking mode causes API errors

Disable thinking mode first. Different providers support different reasoning parameters. Re-enable it only after normal requests work.

### Image blocks flicker during generation

Recent versions keep the old image visible during generation, use overlay progress UI, and prevent internal DOM updates from causing repeated chat re-renders. If it still happens, please include logs and a screen recording when reporting it.

## Local Checks

No build step is required.

```bash
npm run check
```

## Project Structure

<details>
<summary>Expand structure</summary>

```text
features/
  ai-prompt/                AI/LLM prompt analysis, rule presets, API keys, model detection
  api-image/                API image channels, key rotation, endpoint tests, telemetry
  app/                      Runtime composition, lifecycle, and feature stacks
  cache/                    Generated-image cache saving, grid view, and preview
  chat/                     Chat scanning, message actions, and runtime state
  comfyui/                  ComfyUI helpers, result parsing, and resource reads
    lora/                   ComfyUI LoRA list, selection, triggers, and workflow injection
  core/                     Runtime config, sessions, validators, and object cache
  generation/               ComfyUI/WebUI generation orchestration, button state, img2img
  logs/                     Runtime log service and log panel controller
  panel/                    Settings panel controller, listeners, mode switching, parameter UI
  progress/                 Generation progress, preview frames, and execution state
  resources/                Model, LoRA, embedding, and sampler resource services
  settings/                 Settings persistence, backup import/export, preset management
  storyboard/               Storyboard analysis, persistence, rendering, and actions
  webui/                    Stable Diffusion WebUI generation and resource services
  workflow/                 Workflow management, validation, debugging, placeholder conversion
lib/
  browser/                  Blob URL and userscript compatibility helpers
  core/                     Shared utility functions
  http/                     HTTP request wrapper and retry helper
  prompt/                   SD prompt parsing, merging, and validation
  storage/                  Image cache IndexedDB wrapper
ui/
  core/                     Device detection and toast UI
  images/                   Image rendering, hover preview, and comparison mode
  panel/                    Panel template/style aggregation, DOM lookup, drag position
  presets/                  Shared preset and local selection-list UI factories
  styles/                   Panel CSS split by feature area
  templates/                Panel HTML split by tab
index.js                     SillyTavern extension entry point
manifest.json                SillyTavern extension manifest
style.css                    Placeholder; main styles are injected by JS
```

</details>

## License

This repository currently does not include an open-source license. Public visibility does not automatically grant redistribution, commercial use, or republishing rights. Please ask the author before using it for those purposes.
