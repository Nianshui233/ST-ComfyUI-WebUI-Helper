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
		<div class="panel-header-actions">
			<button type="button" id="comfyui-helper-toggle" class="helper-master-toggle is-on" aria-pressed="true" title="开启或暂停聊天区绘图插件">
				<span class="helper-toggle-track"><span class="helper-toggle-knob"></span></span>
				<span class="helper-toggle-copy">
					<b>插件已启用</b>
					<small>聊天区绘图控件开启</small>
				</span>
			</button>
			<div class="theme-switcher" id="comfyui-theme-switcher">
				<input id="comfyui-ui-theme" type="hidden" value="nocturne">
				<button type="button" id="comfyui-theme-toggle" class="theme-toggle-button" aria-haspopup="true" aria-expanded="false" title="切换界面主题">
					<i class="fa-solid fa-palette"></i>
					<span id="comfyui-theme-current">夜间</span>
				</button>
				<div id="comfyui-theme-menu" class="theme-menu" hidden>
					<button type="button" data-theme="nocturne"><span style="--theme-dot:#66d7c7"></span><b>夜间</b><small>冷调暗色</small></button>
					<button type="button" data-theme="daybreak"><span style="--theme-dot:#3978d9"></span><b>日间</b><small>清爽亮色</small></button>
					<button type="button" data-theme="glacier"><span style="--theme-dot:#79c8ff"></span><b>冰川</b><small>蓝白玻璃</small></button>
					<button type="button" data-theme="sakura"><span style="--theme-dot:#e86f9d"></span><b>樱雨</b><small>柔粉暖灰</small></button>
					<button type="button" data-theme="forest"><span style="--theme-dot:#7bbf72"></span><b>森林</b><small>苔绿木调</small></button>
					<button type="button" data-theme="amber"><span style="--theme-dot:#f2a341"></span><b>琥珀</b><small>暖金深棕</small></button>
					<button type="button" data-theme="terminal"><span style="--theme-dot:#7dff9a"></span><b>终端</b><small>高对比黑绿</small></button>
					<button type="button" data-theme="wine"><span style="--theme-dot:#d97a8a"></span><b>酒红</b><small>暗红灰紫</small></button>
				</div>
			</div>
			<button type="button" class="floating_panel_close" title="关闭面板"><i class="fa-fw fa-solid fa-circle-xmark"></i></button>
		</div>
	</div>
	<div class="comfyui-panel-content">
		<!-- 模式切换器 -->
		<div class="mode-switch-container">
			<div class="mode-switch">
				<button class="mode-switch-option active comfyui" data-mode="${modes.COMFYUI}">ComfyUI</button>
				<button class="mode-switch-option" data-mode="${modes.WEBUI}">WebUI</button>
				<button class="mode-switch-option api" data-mode="${modes.API}">API</button>
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
				<button class="tab-button api-settings" data-tab="api-image"><i class="fa-solid fa-cloud-arrow-up"></i><span>API 生图</span></button>
				<button class="tab-button" data-tab="cache"><i class="fa-solid fa-box-archive"></i><span>图片缓存</span></button>
				<button class="tab-button" data-tab="logs"><i class="fa-solid fa-clipboard-list"></i><span>运行日志</span></button>
			</div>
`;
}
