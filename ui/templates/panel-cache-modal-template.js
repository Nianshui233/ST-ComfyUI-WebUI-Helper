export function getPanelCacheModalTemplate({ panelId, modes }) {
    return `<div id="tab-cache" class="tab-content">
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
<!-- 保存绘图分析规则预设模态框 -->
<div id="ai-prompt-rule-preset-save-modal" class="workflow-save-modal">
	<h3>保存绘图分析规则</h3>
	<label for="ai-prompt-rule-preset-name-input">规则预设名称</label>
	<input type="text" id="ai-prompt-rule-preset-name-input" placeholder="例如 FLUX 自然语言 / Danbooru 标签...">
	<div id="ai-prompt-rule-preset-overwrite-warning" class="overwrite-warning" style="display: none;">  该名称的规则预设已存在，保存将覆盖现有预设</div>
	<div class="modal-actions">
		<button id="ai-prompt-rule-preset-save-cancel" class="comfy-button error">取消</button>
		<button id="ai-prompt-rule-preset-save-confirm" class="comfy-button success">保存</button>
	</div>
</div>
<!-- 保存 AI/LLM API Key 模态框 -->
<div id="ai-prompt-api-key-save-modal" class="workflow-save-modal">
	<h3>保存 API Key</h3>
	<label for="ai-prompt-api-key-name-input">Key 名称</label>
	<input type="text" id="ai-prompt-api-key-name-input" placeholder="例如 OpenAI 主号 / 本地代理 / 备用渠道...">
	<div id="ai-prompt-api-key-overwrite-warning" class="overwrite-warning" style="display: none;">  该名称的 API Key 已存在，保存将覆盖现有 Key</div>
	<div class="modal-actions">
		<button id="ai-prompt-api-key-save-cancel" class="comfy-button error">取消</button>
		<button id="ai-prompt-api-key-save-confirm" class="comfy-button success">保存</button>
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
