export function getPanelPromptTemplate({ panelId, modes }) {
    return `<div id="tab-img2img" class="tab-content"></div>
			<div id="tab-prompts" class="tab-content"></div>
			<div id="tab-ai-prompt" class="tab-content">
				<fieldset>
					<legend>AI 绘图主流程</legend>
					<div class="comfy-ai-prompt-options">
						<label class="comfy-auto-generate-label"><input id="comfyui-ai-prompt-enabled" type="checkbox" checked><b>启用 AI 绘图</b><span>- 分析聊天画面并生成绘图提示词</span></label>
						<label class="comfy-auto-generate-label"><input id="comfyui-ai-prompt-show-buttons" type="checkbox" checked><b>显示消息按钮</b><span>- 在助手消息下方显示 AI 生图操作</span></label>
						<label class="comfy-auto-generate-label"><input id="comfyui-ai-prompt-auto" type="checkbox"><b>自动分析提示词</b><span>- 助手回复稳定后自动调用一次 LLM</span></label>
						<label class="comfy-auto-generate-label"><input id="comfyui-ai-prompt-auto-generate-image" type="checkbox"><b>自动分析并生图</b><span>- 自动提示词完成后直接发送到当前后端</span></label>
					</div>
					<div class="comfy-settings-grid">
						<div><label for="comfyui-ai-prompt-context-messages">上下文条数</label><input id="comfyui-ai-prompt-context-messages" type="number" min="1" max="20" step="1" value="6"></div>
						<div><label for="comfyui-ai-prompt-response-length">响应长度</label><input id="comfyui-ai-prompt-response-length" type="number" min="1" step="10" value="350"></div>
					</div>
					<div class="comfy-hint">响应长度由当前数值决定；Danbooru 标签块、FLUX 自然语言等格式完全按下方绘图分析规则执行。</div>
				</fieldset>
				<fieldset>
					<legend>LLM 来源</legend>
					<div class="comfy-settings-grid">
						<div>
							<label for="comfyui-ai-prompt-provider">提示词分析模型</label>
							<select id="comfyui-ai-prompt-provider">
								<option value="sillytavern">SillyTavern 当前 LLM（默认）</option>
								<option value="openai_compatible">OpenAI 兼容 API</option>
								<option value="anthropic">Anthropic API</option>
							</select>
						</div>
						<div>
							<label for="comfyui-ai-prompt-api-model-select">模型选择</label>
							<div class="comfy-input-group">
								<select id="comfyui-ai-prompt-api-model-select"><option value="">自动/手动检测后选择模型...</option></select>
								<button id="comfyui-ai-prompt-detect-models" class="comfy-button" title="检测模型列表"><i class="fa-solid fa-arrows-rotate"></i></button>
							</div>
						</div>
					</div>
					<div id="comfyui-ai-prompt-api-settings">
						<div class="comfy-settings-grid">
							<div><label for="comfyui-ai-prompt-api-url">API Base URL</label><input id="comfyui-ai-prompt-api-url" type="text" placeholder="http://127.0.0.1:1234/v1"></div>
							<div><label for="comfyui-ai-prompt-api-key">API Key</label><input id="comfyui-ai-prompt-api-key" type="password" autocomplete="off" placeholder="本地服务可留空"></div>
						</div>
						<div class="comfy-settings-grid comfy-ai-key-list-grid">
							<div>
								<label for="comfyui-ai-prompt-api-key-select">API Key 列表</label>
								<select id="comfyui-ai-prompt-api-key-select"><option value="">选择已保存的 Key...</option></select>
							</div>
							<div class="comfy-inline-actions">
								<button id="comfyui-ai-prompt-api-key-load" class="comfy-button" title="把选中的 Key 填入当前 API Key">套用</button>
								<button id="comfyui-ai-prompt-api-key-save" class="comfy-button" title="把当前 API Key 保存到列表">保存</button>
								<button id="comfyui-ai-prompt-api-key-delete" class="comfy-button error" title="删除选中的 Key">删除</button>
							</div>
						</div>
						<div class="comfy-hint">API Key 以自定义名称保存到本地列表，列表只显示名称与遮罩尾号；出于安全考虑不会随插件配置导出。</div>
						<div class="comfy-settings-grid">
							<div><label for="comfyui-ai-prompt-api-model">手动模型名</label><input id="comfyui-ai-prompt-api-model" type="text" placeholder="例如 gpt-4.1-mini / qwen2.5-vl / local-model"></div>
							<label class="comfy-auto-generate-label"><input id="comfyui-ai-prompt-auto-detect-models" type="checkbox" checked><b>自动检测模型列表</b><span>- URL / Key / 渠道变化后自动拉取 /models</span></label>
						</div>
						<div class="comfy-settings-grid">
							<div><label for="comfyui-ai-prompt-api-temperature">Temperature</label><input id="comfyui-ai-prompt-api-temperature" type="number" min="0" max="2" step="0.05" value="0.4"></div>
							<div><label for="comfyui-ai-prompt-api-timeout">API 超时(ms)</label><input id="comfyui-ai-prompt-api-timeout" type="number" min="1" step="1000" value="60000"></div>
						</div>
						<div class="comfy-settings-grid">
							<div>
								<label for="comfyui-ai-prompt-thinking-mode">思考模式</label>
								<select id="comfyui-ai-prompt-thinking-mode">
									<option value="default">关闭/默认</option>
									<option value="enabled">开启</option>
									<option value="disabled">强制关闭</option>
								</select>
							</div>
							<div>
								<label for="comfyui-ai-prompt-thinking-strategy">思考参数策略</label>
								<select id="comfyui-ai-prompt-thinking-strategy">
									<option value="auto">自动识别渠道</option>
									<option value="openai">OpenAI</option>
									<option value="anthropic">Anthropic</option>
									<option value="deepseek">DeepSeek</option>
								</select>
							</div>
						</div>
						<div class="comfy-settings-grid">
							<div>
								<label for="comfyui-ai-prompt-thinking-effort">推理强度</label>
								<select id="comfyui-ai-prompt-thinking-effort">
									<option value="minimal">minimal</option>
									<option value="low">low</option>
									<option value="medium">medium</option>
									<option value="high">high</option>
									<option value="xhigh">xhigh</option>
									<option value="max">max</option>
								</select>
							</div>
							<div><label for="comfyui-ai-prompt-thinking-budget">思考预算 tokens</label><input id="comfyui-ai-prompt-thinking-budget" type="number" min="1024" max="32000" step="512" value="2048"></div>
						</div>
						<div class="comfy-hint">默认不额外发送思考参数；开启后会按 OpenAI / Anthropic / DeepSeek 的常见 API 形态注入字段。OpenAI 兼容 API 仍走 <code>/chat/completions</code>，Anthropic API 走 <code>/v1/messages</code>。</div>
						<div class="comfy-hint">OpenAI 兼容模式会请求 <code>/chat/completions</code>；模型列表检测会请求 <code>/models</code>。Base URL 可填 <code>http://127.0.0.1:1234/v1</code>、<code>https://api.openai.com/v1</code> 或 <code>https://api.deepseek.com</code>；Anthropic 可填 <code>https://api.anthropic.com</code> 或 <code>https://api.anthropic.com/v1</code>。</div>
						<button id="comfyui-ai-prompt-test-api" class="comfy-button" style="width:100%; margin-top: 10px;">测试 AI 接口</button>
					</div>
				</fieldset>
				<fieldset>
					<legend>绘图分析规则预设</legend>
					<div class="comfy-settings-grid comfy-ai-rule-preset-grid">
						<div>
							<label for="comfyui-ai-prompt-rule-preset-select">选择规则预设</label>
							<select id="comfyui-ai-prompt-rule-preset-select"><option value="">选择规则预设...</option></select>
						</div>
						<div class="comfy-inline-actions">
							<button id="comfyui-ai-prompt-rule-preset-load" class="comfy-button" title="加载选中的绘图分析规则">加载</button>
							<button id="comfyui-ai-prompt-rule-preset-save" class="comfy-button" title="保存当前绘图分析规则">保存</button>
							<button id="comfyui-ai-prompt-rule-preset-delete" class="comfy-button error" title="删除选中的绘图分析规则">删除</button>
						</div>
					</div>
					<div class="comfy-hint">适合分别保存 Danbooru 标签规则、FLUX 自然语言规则，切换模型类型时直接加载对应规则。</div>
				</fieldset>
				<div class="comfy-prompt-area">
					<label for="comfyui-ai-prompt-instruction">绘图分析规则</label>
					<textarea id="comfyui-ai-prompt-instruction" class="comfy-ai-prompt-instruction" placeholder="留空时使用插件内置规则"></textarea>
				</div>
			</div>
`;
}
