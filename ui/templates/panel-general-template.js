export function getPanelGeneralTemplate({ panelId, modes }) {
    return `<div id="tab-general" class="tab-content active">
				<!-- ComfyUI 设置 -->
				<div class="comfyui-settings">
					<div class="comfy-settings-grid" style="grid-template-columns: 1fr;">
						<div><label for="comfyui-url">ComfyUI URL</label>
							<div class="comfy-input-group"><input id="comfyui-url" type="text" placeholder="http://127.0.0.1:8188"><button id="comfyui-test-conn" class="comfy-button">连接</button><button id="comfyui-disconnect" class="comfy-button error">断开</button></div>
						</div>
						<div><label for="comfyui-model-select">模型选择 (Checkpoint)</label>
							<div class="comfy-input-group"><select id="comfyui-model-select"></select><button id="comfyui-refresh-models" class="comfy-button" title="Refresh Models"><i class="fa-solid fa-arrows-rotate"></i></button></div>
						</div>
						<div><label for="comfyui-unet-select">UNet模型选择</label>
							<div class="comfy-input-group"><select id="comfyui-unet-select"></select><button id="comfyui-refresh-unets" class="comfy-button" title="Refresh UNet Models"><i class="fa-solid fa-arrows-rotate"></i></button></div>
						</div>
					</div>
				</div>
				<!-- WebUI 设置 -->
				<div class="webui-settings" style="display: none;">
					<div class="comfy-settings-grid" style="grid-template-columns: 1fr;">
						<div><label for="webui-url">WebUI URL</label>
							<div class="comfy-input-group"><input id="webui-url" type="text" placeholder="http://127.0.0.1:7860"><button id="webui-test-conn" class="comfy-button">连接</button><button id="webui-disconnect" class="comfy-button error">断开</button></div>
						</div>
						<div><label for="webui-model-select">模型选择</label>
							<div class="comfy-input-group"><select id="webui-model-select"></select><button id="webui-refresh-models" class="comfy-button" title="Refresh Models"><i class="fa-solid fa-arrows-rotate"></i></button></div>
						</div>
					</div>
				</div>
				<fieldset>
					<legend>基础功能</legend>
					<div class="comfy-auto-generate-container"><label class="comfy-auto-generate-label"><input id="comfyui-enable-comparison" type="checkbox" checked><b>图片对比</b><span>- 重新生成时显示新旧图片对比滑块</span></label></div>
					<div class="comfy-auto-generate-container"><label class="comfy-auto-generate-label"><input id="comfyui-hide-buttons" type="checkbox"><b>隐藏按钮</b><span>- 生成后隐藏按钮，双击图片重新生成</span></label></div>
					<div class="comfy-auto-generate-container"><label class="comfy-auto-generate-label"><input id="comfyui-storyboard-enabled" type="checkbox"><b>启用连环画模式</b><span>- 在消息下方显示分镜按钮，将当前剧情拆成多格提示词并逐格生图</span></label></div>
				</fieldset>
				<fieldset>
					<legend>尺寸设置</legend>
					<div class="comfy-settings-grid" style="margin-bottom: 0;">
						<div><label for="comfyui-display-width">显示宽度 (0=自动)</label><input id="comfyui-display-width" type="number" placeholder="400" min="0"></div>
						<div><label for="comfyui-display-height">显示高度 (0=自动)</label><input id="comfyui-display-height" type="number" placeholder="0" min="0"></div>
					</div>
					<button id="comfyui-apply-dims" class="comfy-button" style="width:100%; margin-top: 15px;">应用显示尺寸到所有图片</button>
				</fieldset>
				<fieldset>
					<legend>旧标记兼容</legend>
					<div class="comfy-settings-grid">
						<div><label for="comfyui-start-tag">开始标记</label><input id="comfyui-start-tag" type="text"></div>
						<div><label for="comfyui-end-tag">结束标记</label><input id="comfyui-end-tag" type="text"></div>
					</div>
					<label class="comfy-auto-generate-label" style="margin-top: 10px;"><input id="comfyui-auto-generate" type="checkbox"><b>旧标记自动生图</b><span>- 仅对标记生成按钮有效</span></label>
					<button id="comfyui-apply-tags" class="comfy-button" style="width:100%; margin-top: 15px;">应用标记</button>
					<button id="comfyui-scan-chat" class="comfy-button" style="width:100%; margin-top: 10px;">扫描当前聊天</button>
				</fieldset>
				<fieldset>
					<legend>配置备份</legend>
					<div class="workflow-action-row" style="margin-bottom: 0;">
						<button id="settings-export-all" class="comfy-button">导出全部配置</button>
						<button id="settings-import-all" class="comfy-button warning">导入全部配置</button>
					</div>
				</fieldset>
				<button id="comfyui-clear-cache" class="comfy-button error" style="margin-top: 20px; width: 100%;">删除所有图片缓存</button>
			</div>
`;
}
