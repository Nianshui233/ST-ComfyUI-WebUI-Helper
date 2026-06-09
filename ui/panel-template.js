export function getPanelHtml({ panelId, modes }) {
    return `<div id="${panelId}">
	<div class="panel-control-bar">
		<div class="panel-title-group">
			<span class="comfy-conn-status disconnected" id="comfy-conn-indicator" title="未连接"></span><b>酒馆图片生成器 v5.3</b>
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
				<button class="tab-button active" data-tab="general">基本设置</button>
				<button class="tab-button" data-tab="generation">生成参数</button>
				<button class="tab-button" data-tab="img2img">图生图</button>
				<button class="tab-button" data-tab="prompts">提示词预设</button>
				<button class="tab-button comfyui-settings" data-tab="workflows">工作流管理</button>
				<button class="tab-button webui-settings" data-tab="loras" style="display: none;">WebUI LoRA</button>
				<button class="tab-button comfyui-settings" data-tab="comfy-loras">ComfyUI LoRA</button>
				<button class="tab-button" data-tab="cache">图片缓存</button>
			</div>
			<div id="tab-general" class="tab-content active">
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
				<div class="comfy-auto-generate-container"><label class="comfy-auto-generate-label"><input id="comfyui-auto-generate" type="checkbox"><b>自动生图</b><span>- 仅对最新消息的"开始生成"有效</span></label></div>
				<div class="comfy-auto-generate-container"><label class="comfy-auto-generate-label"><input id="comfyui-enable-comparison" type="checkbox" checked><b>图片对比</b><span>- 重新生成时显示新旧图片对比滑块</span></label></div>
				<div class="comfy-auto-generate-container"><label class="comfy-auto-generate-label"><input id="comfyui-hide-buttons" type="checkbox"><b>隐藏按钮</b><span>- 生成后隐藏按钮，双击图片重新生成</span></label></div>
				<fieldset style="border: 1px solid var(--vp-border-color); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
					<legend style="color: var(--vp-accent-color); padding: 0 10px; font-weight: 600;">尺寸设置</legend>
					<div class="comfy-settings-grid" style="margin-bottom: 0;">
						<div><label for="comfyui-gen-width">生成宽度 (Width)</label><input id="comfyui-gen-width" type="number" placeholder="512" min="64" step="8"></div>
						<div><label for="comfyui-gen-height">生成高度 (Height)</label><input id="comfyui-gen-height" type="number" placeholder="768" min="64" step="8"></div>
						<div style="grid-column: 1 / -1;" class="comfy-size-presets">
							<label style="font-weight: 600; margin-bottom: 4px; display: block;">快捷预设</label>
							<div style="display: flex; flex-wrap: wrap; gap: 4px;">
								<button type="button" class="comfy-button comfy-size-preset-btn" data-w="512" data-h="512">512x512</button>
								<button type="button" class="comfy-button comfy-size-preset-btn" data-w="512" data-h="768">512x768</button>
								<button type="button" class="comfy-button comfy-size-preset-btn" data-w="768" data-h="512">768x512</button>
								<button type="button" class="comfy-button comfy-size-preset-btn" data-w="768" data-h="1024">768x1024</button>
								<button type="button" class="comfy-button comfy-size-preset-btn" data-w="1024" data-h="768">1024x768</button>
								<button type="button" class="comfy-button comfy-size-preset-btn" data-w="1024" data-h="1024">1024x1024</button>
								<button type="button" class="comfy-button comfy-size-preset-btn" data-w="768" data-h="1344">768x1344</button>
								<button type="button" class="comfy-button comfy-size-preset-btn" data-w="1344" data-h="768">1344x768</button>
							</div>
						</div>
						<div><label for="comfyui-display-width">显示宽度 (0=自动)</label><input id="comfyui-display-width" type="number" placeholder="400" min="0"></div>
						<div><label for="comfyui-display-height">显示高度 (0=自动)</label><input id="comfyui-display-height" type="number" placeholder="0" min="0"></div>
					</div>
					<button id="comfyui-apply-dims" class="comfy-button" style="width:100%; margin-top: 15px;">应用显示尺寸到所有图片</button>
				</fieldset>
				<fieldset style="border: 1px solid var(--vp-border-color); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
					<legend style="color: var(--vp-accent-color); padding: 0 10px; font-weight: 600;">内容捕获标记</legend>
					<div class="comfy-settings-grid">
						<div><label for="comfyui-start-tag">开始标记</label><input id="comfyui-start-tag" type="text"></div>
						<div><label for="comfyui-end-tag">结束标记</label><input id="comfyui-end-tag" type="text"></div>
					</div>
					<button id="comfyui-apply-tags" class="comfy-button" style="width:100%; margin-top: 15px;">应用标记</button>
					<button id="comfyui-scan-chat" class="comfy-button" style="width:100%; margin-top: 10px;">扫描当前聊天</button>
				</fieldset>
				<fieldset style="border: 1px solid var(--vp-border-color); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
					<legend style="color: var(--vp-accent-color); padding: 0 10px; font-weight: 600;">配置备份</legend>
					<div class="workflow-action-row" style="margin-bottom: 0;">
						<button id="settings-export-all" class="comfy-button">导出全部配置</button>
						<button id="settings-import-all" class="comfy-button warning">导入全部配置</button>
					</div>
				</fieldset>
				<button id="comfyui-clear-cache" class="comfy-button error" style="margin-top: 20px; width: 100%;">删除所有图片缓存</button>
			</div>
			<div id="tab-generation" class="tab-content">
				<!-- ComfyUI 高级设置 -->
				<div class="comfyui-settings">
					<fieldset class="comfyui-settings advanced-section advanced-generation-section" style="border: 1px solid var(--vp-border-color); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
						<legend style="color: var(--vp-accent-color); padding: 0 10px; font-weight: 600;">ComfyUI 生成参数</legend>
						<div class="comfy-settings-grid">
							<div><label for="comfyui-sampler">采样器</label><select id="comfyui-sampler">
									<option>euler</option>
									<option>euler_ancestral</option>
									<option>dpmpp_2m</option>
									<option>dpmpp_sde</option>
									<option>dpmpp_2s_ancestral</option>
									<option>dpmpp_2m_sde</option>
									<option>dpmpp_2m_sde_gpu</option>
									<option>dpmpp_3m_sde</option>
									<option>dpmpp_3m_sde_gpu</option>
									<option>uni_pc</option>
									<option>uni_pc_bh2</option>
									<option>lcm</option>
								</select></div>
							<div><label for="comfyui-scheduler">调度器</label><select id="comfyui-scheduler">
									<option>normal</option>
									<option>karras</option>
									<option>exponential</option>
                  <option>beta</option>
									<option>sgm_uniform</option>
									<option>simple</option>
									<option>ddim_uniform</option>
								</select></div>
							<div><label for="comfyui-steps">步数</label><input id="comfyui-steps" type="number" min="1" max="100" step="1"></div>
							<div><label for="comfyui-cfg">CFG</label><input id="comfyui-cfg" type="number" min="1.0" max="20.0" step="0.5"></div>
								<div style="grid-column: 1 / -1;"><label for="comfyui-seed">Seed (-1=随机)</label>
									<div class="comfy-input-group"><input id="comfyui-seed" type="number" value="-1" min="-1" step="1"><button type="button" id="comfyui-seed-random" class="comfy-button" title="设为随机">&#x1F3B2;</button><button type="button" id="comfyui-seed-lock" class="comfy-button" title="锁定/解锁 Seed">&#x1F513;</button></div>
								</div>
								<div><label for="comfyui-batch-size">批量数量 (1-4)</label><input id="comfyui-batch-size" type="number" value="1" min="1" max="4" step="1"></div>
							</div>
							<button id="comfyui-apply-gen-params" class="comfy-button" style="width:100%; margin-top: 15px;">应用生成参数</button>
						</fieldset>
						<fieldset class="comfyui-settings advanced-section advanced-img2img-section" style="border: 1px solid var(--vp-border-color); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
							<legend style="color: var(--vp-accent-color); padding: 0 10px; font-weight: 600;">图生图 (Img2Img)</legend>
							<label class="comfy-auto-generate-label"><input id="comfyui-img2img-enable" type="checkbox"><b>启用图生图</b></label>
							<div id="comfyui-img2img-area" style="display:none; margin-top:10px;">
								<div class="comfy-settings-grid">
									<div><label for="comfyui-img2img-denoising">重绘强度</label><input id="comfyui-img2img-denoising" type="number" min="0" max="1" step="0.05" value="0.75"></div>
								</div>
								<div id="comfyui-img2img-dropzone" style="border:2px dashed var(--vp-border-color); padding:20px; text-align:center; border-radius:8px; cursor:pointer; margin-top:10px;">
									点击或拖拽上传参考图片
									<input type="file" id="comfyui-img2img-file" accept="image/*" style="display:none;">
								</div>
								<div class="img2img-actions">
									<button type="button" id="comfyui-img2img-clear" class="comfy-button error">清除参考图</button>
								</div>
								<div id="comfyui-img2img-preview" style="margin-top:10px;"></div>
							</div>
						</fieldset>
					</div>
					<!-- WebUI 高级设置 -->
				<div class="webui-settings" style="display: none;">
					<fieldset class="webui-settings advanced-section advanced-generation-section" style="border: 1px solid var(--vp-border-color); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
						<legend style="color: var(--vp-accent-color); padding: 0 10px; font-weight: 600;">WebUI 生成参数</legend>
						<div class="comfy-settings-grid">
							<div><label for="webui-sampler">采样器</label><select id="webui-sampler">
									<option>Euler a</option>
									<option>Euler</option>
									<option>LMS</option>
									<option>Heun</option>
									<option>DPM2</option>
									<option>DPM2 a</option>
									<option>DPM++ 2S a</option>
									<option>DPM++ 2M</option>
									<option>DPM++ SDE</option>
									<option>DPM fast</option>
									<option>DPM adaptive</option>
									<option>LMS Karras</option>
									<option>DPM2 Karras</option>
									<option>DPM2 a Karras</option>
									<option>DPM++ 2S a Karras</option>
									<option>DPM++ 2M Karras</option>
									<option>DPM++ SDE Karras</option>
									<option>UniPC</option>
									<option>DDIM</option>
									<option>PLMS</option>
								</select></div>
							<div><label for="webui-scheduler">调度器</label><select id="webui-scheduler">
									<option>Automatic</option>
									<option>Uniform</option>
									<option>Karras</option>
									<option>Exponential</option>
									<option>Polyexponential</option>
									<option>SGM Uniform</option>
									<option>KL Optimal</option>
									<option>Align Your Steps</option>
									<option>Simple</option>
									<option>Normal</option>
									<option>DDIM</option>
									<option>Beta</option>
								</select></div>
							<div><label for="webui-steps">步数</label><input id="webui-steps" type="number" min="1" max="100" step="1" value="20"></div>
							<div><label for="webui-cfg">CFG Scale</label><input id="webui-cfg" type="number" min="1.0" max="20.0" step="0.5" value="7.0"></div>
							<div><label for="webui-denoising">降噪强度</label><input id="webui-denoising" type="number" min="0.0" max="1.0" step="0.05" value="0.7"></div>
								<div style="grid-column: 1 / -1;"><label for="webui-seed">Seed (-1=随机)</label>
									<div class="comfy-input-group"><input id="webui-seed" type="number" value="-1" min="-1" step="1"><button type="button" id="webui-seed-random" class="comfy-button" title="设为随机">&#x1F3B2;</button><button type="button" id="webui-seed-lock" class="comfy-button" title="锁定/解锁 Seed">&#x1F513;</button></div>
								</div>
								<div><label for="webui-batch-size">批量数量 (1-4)</label><input id="webui-batch-size" type="number" value="1" min="1" max="4" step="1"></div>
							</div>
							<div class="comfy-auto-generate-container">
							<label class="comfy-auto-generate-label">
								<input id="webui-enable-hires" type="checkbox">
								<b>启用高分辨率修复</b>
								<span>- 提升图片质量和细节</span>
							</label>
						</div>
						<div class="comfy-settings-grid" id="hires-settings" style="display: none;">
							<div><label for="webui-hires-upscaler">高清修复算法</label><select id="webui-hires-upscaler">
									<option>Latent</option>
									<option>Latent (antialiased)</option>
									<option>Latent (bicubic)</option>
									<option>Latent (bicubic antialiased)</option>
									<option>Latent (nearest)</option>
									<option>None</option>
									<option>Lanczos</option>
									<option>Nearest</option>
									<option>LDSR</option>
									<option>BSRGAN</option>
									<option>ESRGAN_4x</option>
									<option>R-ESRGAN 4x+</option>
									<option>R-ESRGAN 4x+ Anime6B</option>
									<option>ScuNET GAN</option>
									<option>ScuNET PSNR</option>
									<option>SwinIR 4x</option>
								</select></div>
							<div><label for="webui-hires-steps">高清修复步数</label><input id="webui-hires-steps" type="number" min="0" max="100" step="1" value="0"></div>
							<div><label for="webui-hires-upscale">放大倍数</label><input id="webui-hires-upscale" type="number" min="1.0" max="4.0" step="0.1" value="2.0"></div>
							<div><label for="webui-hires-denoising">高清修复重绘强度</label><input id="webui-hires-denoising" type="number" min="0.0" max="1.0" step="0.05" value="0.5"></div>
						</div>
						<button id="webui-apply-gen-params" class="comfy-button" style="width:100%; margin-top: 15px;">应用生成参数</button>
						</fieldset>
						<fieldset class="webui-settings advanced-section advanced-img2img-section" style="border: 1px solid var(--vp-border-color); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
							<legend style="color: var(--vp-accent-color); padding: 0 10px; font-weight: 600;">图生图 (Img2Img)</legend>
							<label class="comfy-auto-generate-label"><input id="webui-img2img-enable" type="checkbox"><b>启用图生图</b></label>
							<div id="webui-img2img-area" style="display:none; margin-top:10px;">
								<div class="comfy-settings-grid">
									<div><label for="webui-img2img-denoising">重绘强度</label><input id="webui-img2img-denoising" type="number" min="0" max="1" step="0.05" value="0.75"></div>
								</div>
								<div id="webui-img2img-dropzone" style="border:2px dashed var(--vp-border-color); padding:20px; text-align:center; border-radius:8px; cursor:pointer; margin-top:10px;">
									点击或拖拽上传参考图片
									<input type="file" id="webui-img2img-file" accept="image/*" style="display:none;">
								</div>
								<div class="img2img-actions">
									<button type="button" id="webui-img2img-clear" class="comfy-button error">清除参考图</button>
								</div>
								<div id="webui-img2img-preview" style="margin-top:10px;"></div>
							</div>
						</fieldset>
					</div>
				<fieldset class="advanced-section advanced-prompts-section" style="border: 1px solid var(--vp-border-color); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
					<legend style="color: var(--vp-accent-color); padding: 0 10px; font-weight: 600;">提示词预设管理</legend>
					<div class="comfy-settings-grid" style="grid-template-columns: 1fr auto auto auto;">
						<div>
							<label for="prompt-preset-select">选择预设</label>
							<select id="prompt-preset-select">
								<option value="">选择预设...</option>
							</select>
						</div>
						<div style="display: flex; align-items: end;">
							<button id="prompt-preset-load" class="comfy-button" title="加载选中的预设">加载</button>
						</div>
						<div style="display: flex; align-items: end;">
							<button id="prompt-preset-save" class="comfy-button" title="保存当前提示词为预设">保存</button>
						</div>
						<div style="display: flex; align-items: end;">
							<button id="prompt-preset-delete" class="comfy-button error" title="删除选中的预设">删除</button>
						</div>
					</div>
				</fieldset>
				<div class="comfy-prompt-area advanced-section advanced-prompts-section">
					<label for="comfyui-positive-prompt">固定正向提示词 (会自动加在生成内容的前面)</label>
					<textarea id="comfyui-positive-prompt" placeholder="例如: best quality, masterpiece..."></textarea>
				</div>
				<div class="comfy-prompt-area advanced-section advanced-prompts-section">
					<label for="comfyui-negative-prompt">固定负向提示词</label>
					<textarea id="comfyui-negative-prompt" placeholder="例如: worst quality, low quality, bad hands..."></textarea>
				</div>
			</div>
			<div id="tab-img2img" class="tab-content"></div>
			<div id="tab-prompts" class="tab-content"></div>
			<div id="tab-workflows" class="tab-content comfyui-settings">
				<div class="edit-mode-toolbar" id="edit-mode-toolbar">
					<div class="toolbar-title">编辑模式</div>
					<div class="workflow-action-row">
						<button id="workflow-save-edit" class="comfy-button success">保存修改</button>
						<button id="workflow-cancel-edit" class="comfy-button error">取消编辑</button>
					</div>
				</div>
				<div class="workflow-tools">
					<h4>工作流工具</h4>
					<div class="workflow-action-row">
						<button id="workflow-to-placeholders" class="comfy-button warning">转换为占位符</button>
						<button id="workflow-create-new" class="comfy-button">创建新工作流</button>
						<button id="workflow-save-current" class="comfy-button">保存当前工作流</button>
					</div>
					<div class="workflow-action-row">
						<button id="workflow-export-all" class="comfy-button">导出工作流</button>
						<button id="workflow-import" class="comfy-button">导入工作流</button>
						<button id="workflow-edit-mode" class="comfy-button warning">编辑模式</button>
					</div>
					<div class="workflow-action-row">
						<button id="workflow-format-json" class="comfy-button">格式化 JSON</button>
						<button id="workflow-copy-json" class="comfy-button">复制 JSON</button>
					</div>
				</div>
				<div class="workflow-selector-container">
					<div class="workflow-search-container">
						<input type="text" id="workflow-search" class="workflow-search-input" placeholder="搜索工作流...">
					</div>
					<div id="workflow-list">
						<!-- 工作流列表将在这里动态生成 -->
					</div>
				</div>
				<label for="comfyui-workflow">当前工作流 (JSON)</label>
				<p class="workflow-info">占位符: <b>%prompt%</b> (正向), <b>%negative_prompt%</b> (反向), <b>%width%</b>, <b>%height%</b>, <b>%model%</b>, <b>%unet_model%</b>, <b>%seed%</b>, <b>%steps%</b>, <b>%cfg%</b>, <b>%sampler%</b>, <b>%scheduler%</b>, <b>%init_image%</b>, <b>%denoise%</b></p>
				<div class="placeholder-toolbar">
					<button type="button" class="comfy-button workflow-placeholder-btn" data-placeholder="%prompt%">%prompt%</button>
					<button type="button" class="comfy-button workflow-placeholder-btn" data-placeholder="%negative_prompt%">%negative_prompt%</button>
					<button type="button" class="comfy-button workflow-placeholder-btn" data-placeholder="%width%">%width%</button>
					<button type="button" class="comfy-button workflow-placeholder-btn" data-placeholder="%height%">%height%</button>
					<button type="button" class="comfy-button workflow-placeholder-btn" data-placeholder="%seed%">%seed%</button>
					<button type="button" class="comfy-button workflow-placeholder-btn" data-placeholder="%steps%">%steps%</button>
					<button type="button" class="comfy-button workflow-placeholder-btn" data-placeholder="%cfg%">%cfg%</button>
					<button type="button" class="comfy-button workflow-placeholder-btn" data-placeholder="%sampler%">%sampler%</button>
					<button type="button" class="comfy-button workflow-placeholder-btn" data-placeholder="%scheduler%">%scheduler%</button>
					<button type="button" class="comfy-button workflow-placeholder-btn" data-placeholder="%model%">%model%</button>
					<button type="button" class="comfy-button workflow-placeholder-btn" data-placeholder="%unet_model%">%unet_model%</button>
					<button type="button" class="comfy-button workflow-placeholder-btn" data-placeholder="%init_image%">%init_image%</button>
					<button type="button" class="comfy-button workflow-placeholder-btn" data-placeholder="%denoise%">%denoise%</button>
				</div>
				<button id="workflow-validate-current" class="comfy-button" style="width:100%; margin-bottom: 10px;">校验当前工作流</button>
				<textarea id="comfyui-workflow" placeholder="在此处粘贴您的ComfyUI工作流JSON..."></textarea>
			</div>
			<div id="tab-loras" class="tab-content webui-settings" style="display: none;">
                <div class="lora-selector">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h4 style="margin: 0; color: var(--vp-accent-color);">LoRA 模型管理</h4>
                        <button id="webui-refresh-loras" class="comfy-button" title="刷新LoRA列表">
                            <i class="fa-solid fa-arrows-rotate"></i> 刷新 </button>
                    </div>
                    <div class="comfy-settings-grid" style="grid-template-columns: 1fr 120px auto; align-items: end; gap: 10px;">
                        <div>
                            <label for="webui-lora-select">选择 LoRA 模型</label>
                            <select id="webui-lora-select"></select>
                        </div>
                        <div>
                            <label for="webui-lora-weight-input">权重</label>
                            <input id="webui-lora-weight-input" type="number" value="1.0" step="0.1">
                        </div>
                        <div>
                            <button id="webui-lora-add-button" class="comfy-button" style="width: 100%;">添加至提示词</button>
                        </div>
                    </div>
                    <p style="font-size: 0.85em; color: #aaa; margin-top: 15px;">
                        点击“添加”按钮，会将LoRA以 &lt;lora:模型名:权重&gt; 的格式插入到“提示词预设”标签页下的“固定正向提示词”输入框中。
                    </p>
                </div>
				<div class="embedding-selector" style="margin-top: 30px; border-top: 1px solid var(--vp-border-color); padding-top: 20px;">
					<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
						<h4 style="margin: 0; color: var(--vp-accent-color);">Embedding 模型管理</h4>
						<button id="webui-refresh-embeddings" class="comfy-button" title="刷新Embedding列表">
							<i class="fa-solid fa-arrows-rotate"></i> 刷新 </button>
					</div>
					<div class="embedding-list" id="embedding-list">
						<!-- Embedding列表将在这里动态生成 -->
					</div>
					<div class="selected-embeddings" id="selected-embeddings">
						<h4>已选中的Embedding</h4>
						<div id="selected-embeddings-container">
							<!-- 已选中的Embedding标签将在这里显示 -->
						</div>
					</div>
				</div>
			</div>
            <div id="tab-comfy-loras" class="tab-content comfyui-settings">
                <div class="lora-selector">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h4 style="margin: 0; color: var(--vp-accent-color);">ComfyUI LoRA 模型管理</h4>
                        <button id="comfyui-refresh-loras-list" class="comfy-button" title="刷新LoRA列表">
                            <i class="fa-solid fa-arrows-rotate"></i> 刷新 </button>
                    </div>
                    <!-- ComfyUI LoRA预设管理 -->
                    <fieldset style="border: 1px solid var(--vp-border-color); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <legend style="color: var(--vp-accent-color); padding: 0 10px; font-weight: 600;">LoRA预设管理</legend>
                        <div class="comfy-settings-grid" style="grid-template-columns: minmax(160px, 1fr) 150px auto auto auto;">
                            <div>
                                <label for="comfyui-lora-preset-select">选择预设</label>
                                <select id="comfyui-lora-preset-select">
                                    <option value="">选择LoRA预设...</option>
                                </select>
                            </div>
                            <div>
                                <label for="comfyui-lora-preset-mode">加载方式</label>
                                <select id="comfyui-lora-preset-mode">
                                    <option value="replace">替换当前</option>
                                    <option value="merge">合并覆盖</option>
                                    <option value="append">追加保留</option>
                                </select>
                            </div>
                            <div style="display: flex; align-items: end;">
                                <button id="comfyui-lora-preset-load" class="comfy-button" title="加载选中的LoRA预设">加载</button>
                            </div>
                            <div style="display: flex; align-items: end;">
                                <button id="comfyui-lora-preset-save" class="comfy-button" title="保存当前LoRA配置为预设">保存</button>
                            </div>
                            <div style="display: flex; align-items: end;">
                                <button id="comfyui-lora-preset-delete" class="comfy-button error" title="删除选中的预设">删除</button>
                            </div>
                        </div>
                    </fieldset>
                    <div class="comfy-lora-toolbar">
                        <input type="text" id="comfyui-lora-search" placeholder="搜索 LoRA 名称或路径...">
                        <select id="comfyui-lora-folder-filter">
                            <option value="">全部目录</option>
                        </select>
                        <button type="button" id="comfyui-lora-clear-selection" class="comfy-button error">清空已选</button>
                    </div>
                    <div class="lora-list" id="comfyui-lora-list">
                        <!-- ComfyUI LoRA列表将在这里动态生成 -->
                    </div>
                    <div class="selected-loras" id="comfyui-selected-loras">
                        <h4>已选中的LoRA <span id="comfyui-selected-loras-count">0</span></h4>
                        <div id="comfyui-selected-loras-container">
                            <!-- 已选中的LoRA标签将在这里显示 -->
                        </div>
                    </div>
                </div>
            </div>
			<div id="tab-cache" class="tab-content">
				<div class="cache-toolbar">
					<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
						<h4 style="margin: 0; color: var(--vp-accent-color);">图片缓存管理</h4>
						<div>
                            <button id="cache-export" class="comfy-button">导出</button>
                            <button id="cache-import" class="comfy-button">导入</button>
							<button id="cache-refresh" class="comfy-button">刷新</button>
							<button id="cache-clear-all" class="comfy-button error">清空所有</button>
						</div>
					</div>
					<div class="cache-stats" id="cache-stats" style="margin-bottom: 15px; color: #aaa; font-size: 0.9em;">
						<!-- 统计信息将在这里显示 -->
					</div>
				</div>
				<div class="cache-grid" id="cache-grid">
					<!-- 缓存图片将在这里显示 -->
				</div>
			</div>
		</div>
	</div>
</div>
<!-- 保存工作流模态框 -->
<div id="workflow-save-modal" class="workflow-save-modal">
	<h3>保存工作流</h3>
	<label for="workflow-name-input">工作流名称</label>
	<input type="text" id="workflow-name-input" placeholder="输入工作流名称...">
	<div id="overwrite-warning" class="overwrite-warning" style="display: none;">  该名称的工作流已存在，保存将覆盖现有工作流 </div>
	<div class="modal-actions">
		<button id="workflow-save-cancel" class="comfy-button error">取消</button>
		<button id="workflow-save-confirm" class="comfy-button success">保存</button>
	</div>
</div>
<!-- 保存提示词预设模态框 -->
<div id="prompt-preset-save-modal" class="workflow-save-modal">
	<h3>保存提示词预设</h3>
	<label for="prompt-preset-name-input">预设名称</label>
	<input type="text" id="prompt-preset-name-input" placeholder="输入预设名称...">
	<div id="prompt-preset-overwrite-warning" class="overwrite-warning" style="display: none;">  该名称的预设已存在，保存将覆盖现有预设 </div>
	<div class="modal-actions">
		<button id="prompt-preset-save-cancel" class="comfy-button error">取消</button>
		<button id="prompt-preset-save-confirm" class="comfy-button success">保存</button>
	</div>
</div>
<!-- LoRA预设保存模态框 -->
<div id="lora-preset-save-modal" class="workflow-save-modal">
    <h3>保存LoRA预设</h3>
    <label for="lora-preset-name-input">预设名称</label>
    <input type="text" id="lora-preset-name-input" placeholder="输入LoRA预设名称...">
    <div id="lora-preset-overwrite-warning" class="overwrite-warning" style="display: none;">  该名称的预设已存在，保存将覆盖现有预设 </div>
    <div class="modal-actions">
        <button id="lora-preset-save-cancel" class="comfy-button error">取消</button>
        <button id="lora-preset-save-confirm" class="comfy-button success">保存</button>
    </div>
</div>
`;
}
