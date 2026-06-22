# ST-ComfyUI-WebUI-Helper

[English README](README.en.md)

面向 SillyTavern 的第三方生图插件，用于把聊天内容、AI 分析出的绘图提示词、ComfyUI 或 Stable Diffusion WebUI 串起来。插件重点是 RP 场景：它可以从当前聊天上下文中独立调用 LLM 分析画面，再把生成出的提示词送到后端生图，而不需要让主 RP 模型在正文里额外输出绘图块。

本仓库应作为 SillyTavern 第三方扩展目录使用：

```text
SillyTavern/public/scripts/extensions/third-party/ST-ComfyUI-WebUI-Helper
```

## 主要功能

- 支持 ComfyUI 和 Stable Diffusion WebUI 两种后端模式。
- 默认手动连接，未使用时不会持续轮询 ComfyUI/WebUI。
- AI 优先的 RP 生图流程：助手消息下方会出现 `AI生图` / `AI提示词` 操作，可分析最近聊天、缓存可编辑提示词、默认隐藏提示词内容，并把结果发送到当前生图后端。
- `AI/LLM管理` 支持使用 SillyTavern 当前 LLM，也支持 OpenAI-compatible API 和原生 Anthropic API 作为独立绘图分析模型。
- 支持 OpenAI-compatible `/models` 自动/手动模型检测；Anthropic 原生 API 可手动填写模型。
- 支持外部 LLM 思考模式配置，可按 OpenAI、Anthropic、DeepSeek 风格注入不同的推理参数。
- 支持绘图分析规则预设，适合保存 Danbooru 标签规则、FLUX/自然语言规则等多套提示词模板。
- 支持本地 API Key 列表，可自命名、多密钥保存和快速套用；API Key 不会随插件配置导出。
- 聊天消息里的生图按钮会显示分析中、生成中、成功、失败等状态，并在长任务中防止重复点击。
- 支持助手回复稳定后自动分析提示词，或自动分析并直接生图。
- 保留旧式 `[开始生成]... [结束生成]` 标记扫描作为兼容路径。
- 支持 ComfyUI API-format 工作流校验。
- 支持插件设置完整导出/导入。
- 支持工作流 JSON 格式化、压缩、复制、占位符插入和基础分析。
- 支持提示词预设、绘图规则预设、LoRA 预设、图片缓存、img2img 等管理界面。
- ComfyUI LoRA 支持批量选择、过滤选择、权重批量应用、启用/禁用、排序、复制/导出/导入选择。
- ComfyUI LoRA 注入会追踪采样器实际 MODEL 路径，默认使用稳定的 MODEL-only 注入，也可切换 MODEL+CLIP，并支持触发词、严格检查和最终工作流调试导出。
- 支持通过 SillyTavern `/proxy` 解决跨域请求。
- 支持可选直连模式，绕过 SillyTavern 代理以减少后端日志噪声；需要 ComfyUI/WebUI 开启 CORS。
- ComfyUI 结果获取优先使用 WebSocket 完成事件，并带有 HTTP history 轮询和预览帧兜底。
- 支持生成中的取消/中断按钮。

## 安装

把仓库克隆到 SillyTavern 的第三方扩展目录：

```bash
cd SillyTavern/public/scripts/extensions/third-party
git clone <your-private-repo-url> ST-ComfyUI-WebUI-Helper
```

然后重启 SillyTavern，在扩展面板中启用本插件。

## 使用提示

- 如果主要使用 RP 场景生图，建议优先使用 `AI/LLM管理` 里的独立绘图分析功能，而不是要求主 RP 模型在正文末尾输出绘图提示词。
- 如果使用 Danbooru 标签规则，建议把响应长度调高；插件会自动给 Danbooru 规则分配更高输出预算，减少 `finish_reason=length` 截断。
- 如果外部 LLM 的思考模式导致接口报错，可先把“思考模式”设为“关闭/默认”，确认普通请求可用后再按渠道选择 OpenAI、Anthropic 或 DeepSeek 策略。
- ComfyUI 工作流里建议使用 `%prompt%`、`%negative_prompt%`、`%width%`、`%height%`、`%seed%`、`%steps%`、`%cfg%`、`%sampler%`、`%scheduler%` 等占位符。
- API Key 列表保存在本地浏览器/脚本存储中，不会进入设置导出文件。

## 本地检查

本项目不需要构建步骤。语法检查：

```bash
npm run check
```

也可以分别运行：

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

## 目录结构

```text
features/
  connection-session.js      连接状态与手动会话检查
  manual-scan.js             手动扫描控制
  workflow-validation.js     ComfyUI 工作流校验
lib/
  tampermonkey-compat.js     用户脚本兼容辅助
ui/
  panel-template.js          面板 HTML 模板
  panel-styles.js            面板样式
  panel-elements.js          面板 DOM 查询
  panel-position.js          面板拖拽与位置保存
index.js                     插件入口与主要生图逻辑
manifest.json                SillyTavern 扩展清单
style.css                    占位样式文件，主要样式由 JS 注入
```

## 备注

- 除非 SillyTavern 改变扩展加载方式，否则请保留 `manifest.json` 作为扩展入口。
- 如果仓库地址变化，可以同步更新 `manifest.json` 的 `homePage`。
- 本项目默认作为私有/内部插件使用，除非你显式添加公开许可证。
