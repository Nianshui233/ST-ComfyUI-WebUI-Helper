export function getPanelGenerationTemplate({ panelId, modes }) {
    return `<div id="tab-generation" class="tab-content">
				<!-- ComfyUI 高级设置 -->
				<div class="comfyui-settings">
					<fieldset class="comfyui-settings advanced-section advanced-generation-section">
						<legend>ComfyUI 生成参数</legend>
						<div class="comfy-settings-grid">
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
						<fieldset class="comfyui-settings advanced-section advanced-img2img-section">
							<legend>图生图 (Img2Img)</legend>
							<label class="comfy-auto-generate-label"><input id="comfyui-img2img-enable" type="checkbox"><b>启用图生图</b></label>
							<div id="comfyui-img2img-area" style="display:none; margin-top:10px;">
								<div class="comfy-settings-grid">
									<div><label for="comfyui-img2img-denoising">重绘强度</label><input id="comfyui-img2img-denoising" type="number" min="0" max="1" step="0.05" value="0.75"></div>
								</div>
								<div id="comfyui-img2img-dropzone" class="comfy-dropzone">
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
					<fieldset class="webui-settings advanced-section advanced-generation-section">
						<legend>WebUI 生成参数</legend>
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
						<fieldset class="webui-settings advanced-section advanced-img2img-section">
							<legend>图生图 (Img2Img)</legend>
							<label class="comfy-auto-generate-label"><input id="webui-img2img-enable" type="checkbox"><b>启用图生图</b></label>
							<div id="webui-img2img-area" style="display:none; margin-top:10px;">
								<div class="comfy-settings-grid">
									<div><label for="webui-img2img-denoising">重绘强度</label><input id="webui-img2img-denoising" type="number" min="0" max="1" step="0.05" value="0.75"></div>
								</div>
								<div id="webui-img2img-dropzone" class="comfy-dropzone">
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
				<fieldset class="advanced-section advanced-prompts-section">
					<legend>提示词预设管理</legend>
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
`;
}
