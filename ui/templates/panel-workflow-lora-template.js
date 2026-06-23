export function getPanelWorkflowLoraTemplate({ panelId, modes }) {
    return `<div id="tab-workflows" class="tab-content comfyui-settings">
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
						<button id="workflow-minify-json" class="comfy-button">压缩 JSON</button>
						<button id="workflow-analyze-json" class="comfy-button">分析工作流</button>
					</div>
					<div id="workflow-analysis-result" class="workflow-analysis-result" style="display: none;"></div>
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
                    <fieldset>
                        <legend>LoRA预设管理</legend>
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
                    <div class="lora-bulk-panel">
                        <div>
                            <label for="comfyui-lora-bulk-model">模型强度</label>
                            <input id="comfyui-lora-bulk-model" type="number" value="1.0" min="0" max="2" step="0.05">
                        </div>
                        <div>
                            <label for="comfyui-lora-bulk-clip">CLIP强度</label>
                            <input id="comfyui-lora-bulk-clip" type="number" value="1.0" min="0" max="2" step="0.05">
                        </div>
                        <button type="button" id="comfyui-lora-bulk-apply" class="comfy-button">应用到已选</button>
                        <button type="button" id="comfyui-lora-select-filtered" class="comfy-button">选择当前过滤</button>
                        <button type="button" id="comfyui-lora-toggle-filtered" class="comfy-button">反选当前过滤</button>
                    </div>
                    <div class="lora-action-row">
                        <button type="button" id="comfyui-lora-enable-all" class="comfy-button success">全部启用</button>
                        <button type="button" id="comfyui-lora-disable-all" class="comfy-button warning">全部禁用</button>
                        <button type="button" id="comfyui-lora-copy-selection" class="comfy-button">复制配置</button>
                        <button type="button" id="comfyui-lora-export-selection" class="comfy-button">导出配置</button>
                        <button type="button" id="comfyui-lora-import-selection" class="comfy-button">导入配置</button>
                    </div>
                    <div class="lora-options-row">
                        <label><input id="comfyui-lora-auto-append-triggers" type="checkbox" checked> 自动追加触发词</label>
                        <label><input id="comfyui-lora-strict-injection" type="checkbox" checked> 严格注入自检</label>
                        <label><input id="comfyui-lora-save-debug-workflow" type="checkbox" checked> 保存最终工作流</label>
                        <label for="comfyui-lora-injection-mode">注入方式</label>
                        <select id="comfyui-lora-injection-mode" title="MODEL-only更稳定；MODEL+CLIP适合明确需要文本编码器权重的LoRA">
                            <option value="model_only">仅 MODEL</option>
                            <option value="model_clip">MODEL + CLIP</option>
                            <option value="auto">自动</option>
                        </select>
                        <button type="button" id="comfyui-lora-copy-last-workflow" class="comfy-button">复制最终工作流</button>
                        <button type="button" id="comfyui-lora-export-last-workflow" class="comfy-button">导出最终工作流</button>
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
`;
}
