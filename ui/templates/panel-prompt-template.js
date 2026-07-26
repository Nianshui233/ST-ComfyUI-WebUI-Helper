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
						<div><label for="comfyui-ai-prompt-response-length">首轮输出容量(tokens)</label><input id="comfyui-ai-prompt-response-length" type="number" min="4096" step="512" value="4096"></div>
						<div>
							<label for="comfyui-ai-prompt-generation-profile">生成档案</label>
							<select id="comfyui-ai-prompt-generation-profile">
								<option value="auto">跟随绘图规则声明</option>
								<option value="natural_plain">自然语言 / Plain text</option>
								<option value="illustrious_a1111">Danbooru / Illustrious / A1111</option>
							</select>
						</div>
					</div>
					<div class="comfy-hint">该数值是单图和分镜第一次请求的传输上限，不是提示词目标长度，也不会限制 tag、服饰或细节数量；明确截断时会自动翻倍并完整重试一次。生成档案决定最终提示词的解析方式，并随绘图分析规则预设保存。</div>
				</fieldset>
				<fieldset>
					<legend>LLM 来源</legend>
					<div class="ai-provider-block">
						<div class="ai-provider-block-title"><i class="fa-solid fa-route"></i><span>来源与模型</span></div>
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
					</div>
					<div id="comfyui-ai-prompt-api-settings">
						<div class="ai-provider-block">
							<div class="ai-provider-block-title"><i class="fa-solid fa-bookmark"></i><span>渠道预设</span></div>
							<div class="comfy-settings-grid comfy-ai-provider-preset-grid">
								<div>
									<label for="comfyui-ai-prompt-provider-preset-select">LLM 渠道/厂商预设</label>
									<select id="comfyui-ai-prompt-provider-preset-select"><option value="">选择已保存的渠道...</option></select>
								</div>
								<div class="comfy-inline-actions">
									<button id="comfyui-ai-prompt-provider-preset-load" class="comfy-button" title="套用选中的来源、URL、模型和思考参数">套用渠道</button>
									<button id="comfyui-ai-prompt-provider-preset-save" class="comfy-button" title="保存当前来源、URL、模型和思考参数">保存渠道</button>
									<button id="comfyui-ai-prompt-provider-preset-delete" class="comfy-button error" title="删除选中的渠道预设">删除渠道</button>
								</div>
							</div>
							<div class="comfy-hint">渠道预设保存 LLM 来源、Base URL、模型、温度、超时、思考与搜索参数；LLM 和搜索 API Key 都不会写入渠道预设。</div>
						</div>
						<div class="ai-provider-block">
							<div class="ai-provider-block-title"><i class="fa-solid fa-plug"></i><span>连接与密钥</span></div>
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
						</div>
						<div class="ai-provider-block">
							<div class="ai-provider-block-title"><i class="fa-solid fa-sliders"></i><span>请求参数</span></div>
							<div class="comfy-settings-grid">
								<div><label for="comfyui-ai-prompt-api-model">手动模型名</label><input id="comfyui-ai-prompt-api-model" type="text" placeholder="例如 gpt-4.1-mini / qwen2.5-vl / local-model"></div>
								<label class="comfy-auto-generate-label"><input id="comfyui-ai-prompt-auto-detect-models" type="checkbox" checked><b>自动检测模型列表</b><span>- URL / Key / 渠道变化后自动拉取 /models</span></label>
							</div>
							<div class="comfy-settings-grid">
								<div><label for="comfyui-ai-prompt-api-temperature">Temperature</label><input id="comfyui-ai-prompt-api-temperature" type="number" min="0" max="2" step="0.05" value="0.4"></div>
								<div><label for="comfyui-ai-prompt-api-timeout">API 超时(ms)</label><input id="comfyui-ai-prompt-api-timeout" type="number" min="1" step="1000" value="60000"></div>
							</div>
						</div>
						<div class="ai-provider-block ai-thinking-block">
							<div class="ai-provider-block-title"><i class="fa-solid fa-brain"></i><span>思考模式</span></div>
							<div class="comfy-settings-grid ai-thinking-mode-row">
								<div>
									<label for="comfyui-ai-prompt-thinking-mode">思考模式</label>
									<select id="comfyui-ai-prompt-thinking-mode">
										<option value="default">关闭/默认</option>
										<option value="enabled">开启</option>
										<option value="disabled">强制关闭</option>
									</select>
								</div>
							</div>
							<div class="ai-thinking-advanced" id="comfyui-ai-prompt-thinking-advanced">
								<div class="comfy-settings-grid">
									<div>
										<label for="comfyui-ai-prompt-thinking-strategy">思考参数策略</label>
										<select id="comfyui-ai-prompt-thinking-strategy">
											<option value="auto">自动识别渠道</option>
											<option value="openai">OpenAI</option>
											<option value="anthropic">Anthropic</option>
											<option value="deepseek">DeepSeek</option>
										</select>
									</div>
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
								</div>
								<div class="comfy-settings-grid">
									<div><label for="comfyui-ai-prompt-thinking-budget">思考预算 tokens</label><input id="comfyui-ai-prompt-thinking-budget" type="number" min="1024" max="32000" step="512" value="2048"></div>
								</div>
								<div class="comfy-hint">开启后会按 OpenAI / Anthropic / DeepSeek 的常见 API 形态注入字段。</div>
							</div>
						</div>
						<div class="ai-provider-block" id="comfyui-ai-prompt-web-search-settings">
							<div class="ai-provider-block-title"><i class="fa-solid fa-globe"></i><span>网络搜索工具</span></div>
							<label class="comfy-auto-generate-label"><input id="comfyui-ai-prompt-web-search-enabled" type="checkbox"><b>允许模型搜索网络</b><span>- 查询词会发给搜索服务，敏感聊天勿开启</span></label>
							<div class="comfy-settings-grid ai-web-search-fields">
								<div>
									<label for="comfyui-ai-prompt-web-search-provider">搜索服务</label>
									<select id="comfyui-ai-prompt-web-search-provider">
										<option value="tavily">Tavily Search API</option>
										<option value="searxng">SearXNG（自建）</option>
									</select>
								</div>
								<div><label for="comfyui-ai-prompt-web-search-api-url">SearXNG Search URL</label><input id="comfyui-ai-prompt-web-search-api-url" type="text" placeholder="https://search.example.com/search"></div>
							</div>
							<div class="comfy-settings-grid ai-web-search-fields">
								<div><label for="comfyui-ai-prompt-web-search-api-key">Tavily API Key</label><input id="comfyui-ai-prompt-web-search-api-key" type="password" autocomplete="off" placeholder="tvly-..."></div>
								<div><label for="comfyui-ai-prompt-web-search-timeout">搜索超时(ms)</label><input id="comfyui-ai-prompt-web-search-timeout" type="number" min="1000" max="120000" step="1000" value="20000"></div>
							</div>
							<div class="comfy-settings-grid ai-web-search-fields">
								<div><label for="comfyui-ai-prompt-web-search-max-results">单次结果数</label><input id="comfyui-ai-prompt-web-search-max-results" type="number" min="1" max="10" step="1" value="5"></div>
								<div><label for="comfyui-ai-prompt-web-search-max-calls">单次分析工具调用额度</label><input id="comfyui-ai-prompt-web-search-max-calls" type="number" min="1" max="8" step="1" value="3"></div>
							</div>
							<button id="comfyui-ai-prompt-web-search-test" class="comfy-button" type="button"><i class="fa-solid fa-magnifying-glass"></i><span>测试搜索</span></button>
							<div class="comfy-hint">Tavily 使用固定官方端点；SearXNG 需要实例开启 JSON 输出。“测试搜索”只验证搜索服务，不验证所选 LLM 的工具调用能力。搜索逻辑和工具回合均由本插件执行，不依赖其他 SillyTavern 扩展。搜索 Key 保存在浏览器本地且不会随配置导出。</div>
						</div>
						<div class="comfy-hint ai-provider-endpoint-hint">OpenAI 兼容模式会请求 <code>/chat/completions</code>，模型列表检测会请求 <code>/models</code>；Anthropic API 走 <code>/v1/messages</code>。</div>
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
