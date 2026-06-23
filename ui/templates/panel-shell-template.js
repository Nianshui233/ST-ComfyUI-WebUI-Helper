export function getPanelShellTemplate({ panelId, modes }) {
    return `<div id="${panelId}">
	<div class="panel-control-bar">
		<div class="panel-title-group">
			<span class="comfy-conn-status disconnected" id="comfy-conn-indicator" title="未连接"></span>
			<div class="panel-title-copy">
				<b>酒馆绘图工作台</b>
				<span>ComfyUI / WebUI / AI Prompt Studio</span>
			</div>
		</div>
		<button type="button" class="floating_panel_close" title="关闭面板"><i class="fa-fw fa-solid fa-circle-xmark"></i></button>
	</div>
	<div class="comfyui-panel-content">
		<!-- 模式切换器 -->
		<div class="mode-switch-container">
			<div class="mode-switch">
				<button class="mode-switch-option active comfyui" data-mode="${modes.COMFYUI}">ComfyUI</button>
				<button class="mode-switch-option" data-mode="${modes.WEBUI}">WebUI</button>
			</div>
			<div class="mode-status">当前模式: ComfyUI</div>
		</div>
		<div class="tab-container">
			<div class="tab-buttons">
				<button class="tab-button active" data-tab="general"><i class="fa-solid fa-sliders"></i><span>基本设置</span></button>
				<button class="tab-button" data-tab="generation"><i class="fa-solid fa-wand-magic-sparkles"></i><span>生成参数</span></button>
				<button class="tab-button" data-tab="img2img"><i class="fa-solid fa-image"></i><span>图生图</span></button>
				<button class="tab-button" data-tab="prompts"><i class="fa-solid fa-align-left"></i><span>提示词</span></button>
				<button class="tab-button" data-tab="ai-prompt"><i class="fa-solid fa-brain"></i><span>AI/LLM管理</span></button>
				<button class="tab-button comfyui-settings" data-tab="workflows"><i class="fa-solid fa-diagram-project"></i><span>工作流管理</span></button>
				<button class="tab-button webui-settings" data-tab="loras" style="display: none;"><i class="fa-solid fa-layer-group"></i><span>WebUI LoRA</span></button>
				<button class="tab-button comfyui-settings" data-tab="comfy-loras"><i class="fa-solid fa-layer-group"></i><span>ComfyUI LoRA</span></button>
				<button class="tab-button" data-tab="cache"><i class="fa-solid fa-box-archive"></i><span>图片缓存</span></button>
			</div>
`;
}
