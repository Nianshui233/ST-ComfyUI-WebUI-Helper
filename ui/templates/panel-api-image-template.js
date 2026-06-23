export function getPanelApiImageTemplate() {
    return `<div id="tab-api-image" class="tab-content">
				<fieldset class="api-settings">
					<legend>API 生图通道</legend>
					<div class="api-image-hero">
						<div>
							<strong>提示词块直连 API 生图</strong>
							<span>沿用当前链路：LLM 分析聊天内容生成绘图提示词块，生成按钮把这个提示词直接发送给闭源生图 API。</span>
						</div>
						<span class="api-image-pill">当前模式选择 API 后生效</span>
					</div>
					<div class="comfy-settings-grid">
						<div>
							<label for="comfyui-api-image-provider">服务商 / 接口类型</label>
							<select id="comfyui-api-image-provider">
								<option value="openai_images">OpenAI Images (/v1/images/generations)</option>
								<option value="gemini">Google Gemini Image</option>
								<option value="stability_core">Stability AI Core</option>
								<option value="novelai">NovelAI Image</option>
								<option value="openai_compatible_images">OpenAI 兼容 Images</option>
								<option value="custom_json">自定义 JSON API</option>
							</select>
						</div>
						<div>
							<label for="comfyui-api-image-model">模型选择</label>
							<input id="comfyui-api-image-model" type="text" placeholder="gpt-image-1 / gemini-2.5-flash-image-preview / nai-diffusion-3">
						</div>
					</div>
					<div class="comfy-settings-grid">
						<div>
							<label for="comfyui-api-image-url">API Base URL</label>
							<input id="comfyui-api-image-url" type="text" placeholder="https://api.openai.com/v1">
						</div>
						<div>
							<label for="comfyui-api-image-endpoint">自定义 Endpoint</label>
							<input id="comfyui-api-image-endpoint" type="text" placeholder="留空使用服务商默认路径">
						</div>
					</div>
					<div class="comfy-settings-grid">
						<div>
							<label for="comfyui-api-image-api-key">API Key</label>
							<input id="comfyui-api-image-api-key" type="password" autocomplete="off" placeholder="sk-... / AIza...">
						</div>
						<div>
							<label for="comfyui-api-image-api-key-select">API Key 列表</label>
							<div class="comfy-input-group">
								<select id="comfyui-api-image-api-key-select"><option value="">选择已保存的 Key...</option></select>
							</div>
						</div>
					</div>
					<div class="workflow-action-row api-image-key-actions">
						<button type="button" id="comfyui-api-image-api-key-load" class="comfy-button"><i class="fa-solid fa-arrow-down"></i>套用 Key</button>
						<button type="button" id="comfyui-api-image-api-key-save" class="comfy-button"><i class="fa-solid fa-floppy-disk"></i>保存 Key</button>
						<button type="button" id="comfyui-api-image-api-key-delete" class="comfy-button error"><i class="fa-solid fa-trash"></i>删除 Key</button>
					</div>
					<div class="comfy-hint">Key 只保存在本地浏览器存储，列表支持自定义名称；导出插件配置时不会带出明文 Key。</div>
				</fieldset>
				<fieldset class="api-settings">
					<legend>生成参数</legend>
					<div class="comfy-settings-grid">
						<div>
							<label for="comfyui-api-image-size-mode">尺寸策略</label>
							<select id="comfyui-api-image-size-mode">
								<option value="auto">自动 / 服务商默认</option>
								<option value="panel">使用生成参数里的宽高</option>
								<option value="square">方图 1024x1024</option>
								<option value="portrait">竖图 1024x1536</option>
								<option value="landscape">横图 1536x1024</option>
							</select>
						</div>
						<div>
							<label for="comfyui-api-image-batch-size">批量数量</label>
							<input id="comfyui-api-image-batch-size" type="number" min="1" step="1" value="1">
						</div>
						<div>
							<label for="comfyui-api-image-quality">质量 / 风格档位</label>
							<select id="comfyui-api-image-quality">
								<option value="auto">auto</option>
								<option value="standard">standard</option>
								<option value="hd">hd</option>
								<option value="low">low</option>
								<option value="medium">medium</option>
								<option value="high">high</option>
							</select>
						</div>
						<div>
							<label for="comfyui-api-image-output-format">输出格式</label>
							<select id="comfyui-api-image-output-format">
								<option value="png">png</option>
								<option value="jpeg">jpeg</option>
								<option value="webp">webp</option>
							</select>
						</div>
						<div>
							<label for="comfyui-api-image-timeout">API 超时(ms)</label>
							<input id="comfyui-api-image-timeout" type="number" min="1" step="1000" value="300000">
						</div>
					</div>
					<div class="comfy-prompt-area api-negative-prompt-area">
						<label for="comfyui-api-image-negative-prompt">API 专用负面提示词</label>
						<textarea id="comfyui-api-image-negative-prompt" placeholder="支持负面提示词的接口会使用；OpenAI Images 会自动忽略。"></textarea>
					</div>
					<div class="comfy-hint">提示词主体始终来自聊天消息下方的“绘画提示词”块；这里的参数只决定 API 请求如何包装它。</div>
				</fieldset>
				<fieldset class="api-settings">
					<legend>运行状态与可靠性</legend>
					<div class="api-image-reliability-grid">
						<label class="comfy-auto-generate-label"><input id="comfyui-api-image-use-saved-keys" type="checkbox" checked><b>使用 Key 列表轮询</b><span>- 当前 Key 失败时可从已保存 Key 里继续尝试</span></label>
						<label class="comfy-auto-generate-label"><input id="comfyui-api-image-retry-on-failure" type="checkbox" checked><b>失败自动切换</b><span>- 限流、上游错误、超时等失败后尝试下一个 Key</span></label>
					</div>
					<div class="comfy-settings-grid">
						<div>
							<label for="comfyui-api-image-soft-timeout-ms">软提醒时间(ms)</label>
							<input id="comfyui-api-image-soft-timeout-ms" type="number" min="0" step="1000" value="60000">
						</div>
						<div>
							<label for="comfyui-api-image-max-key-attempts">最大 Key 尝试数 (0=全部)</label>
							<input id="comfyui-api-image-max-key-attempts" type="number" min="0" step="1" value="0">
						</div>
					</div>
					<div class="comfy-hint">软提醒只提示“仍在等待”，不会中断请求；真正超时仍由上方 API 超时控制。生成中的实时状态会显示在聊天按钮下方，完整摘要会进入运行日志。</div>
				</fieldset>
				<fieldset class="api-settings api-custom-json-section">
					<legend id="comfyui-api-image-custom-title">自定义 JSON API</legend>
					<div class="comfy-settings-grid">
						<div>
							<label for="comfyui-api-image-response-path" id="comfyui-api-image-response-path-label">响应图片字段路径</label>
							<input id="comfyui-api-image-response-path" type="text" placeholder="例如 data.0.b64_json / images.0.url / output.0">
						</div>
						<div>
							<label for="comfyui-api-image-custom-headers">额外请求头 JSON</label>
							<textarea id="comfyui-api-image-custom-headers" placeholder='{"x-provider":"value"}'></textarea>
						</div>
					</div>
					<div class="comfy-prompt-area">
						<label for="comfyui-api-image-custom-body" id="comfyui-api-image-custom-body-label">请求体模板 JSON</label>
						<textarea id="comfyui-api-image-custom-body" class="api-image-code-textarea" spellcheck="false"></textarea>
					</div>
					<div class="comfy-hint" id="comfyui-api-image-custom-hint">
						可用占位符：<code>%prompt_json%</code>、<code>%negative_prompt_json%</code>、<code>%model_json%</code>、<code>%width%</code>、<code>%height%</code>、<code>%batch_size%</code>、<code>%quality_json%</code>、<code>%output_format_json%</code>。
					</div>
				</fieldset>
				<fieldset class="api-settings">
					<legend>连接测试</legend>
					<div class="workflow-action-row">
						<button type="button" id="comfyui-api-image-test" class="comfy-button"><i class="fa-solid fa-plug-circle-check"></i>测试 API 生图</button>
					</div>
					<div class="comfy-hint">测试会发送一条极短提示词并检查是否能解析到图片，不会写入聊天记录。</div>
				</fieldset>
			</div>
`;
}
