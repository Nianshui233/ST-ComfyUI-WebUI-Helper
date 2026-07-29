export function getPanelCacheModalTemplate({ panelId, modes }) {
    return `<div id="tab-cache" class="tab-content">
				<div class="cache-toolbar">
					<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
						<h4 style="margin: 0; color: var(--vp-accent-color);">媒体缓存管理</h4>
						<div>
                            <button id="cache-export" class="comfy-button">导出</button>
                            <button id="cache-import" class="comfy-button">导入</button>
							<button id="cache-refresh" class="comfy-button">刷新</button>
							<button id="cache-clear-all" class="comfy-button error">清空所有</button>
						</div>
					</div>
					<div class="cache-stats" id="cache-stats" style="margin-bottom: 4px; color: var(--vp-text-muted); font-size: 0.9em;">
						<!-- 统计信息将在这里显示 -->
					</div>
					<div id="cache-storage-estimate" class="cache-storage-estimate">正在读取浏览器站点容量...</div>
					<div class="cache-governance-row">
						<input id="cache-search" type="search" placeholder="搜索提示词或文件名" aria-label="搜索缓存媒体">
						<select id="cache-media-type" aria-label="媒体类型"><option value="">全部媒体</option><option value="image">图片</option><option value="video">视频</option></select>
						<select id="cache-mode-filter" aria-label="生成模式"><option value="">全部模式</option><option value="comfyui">ComfyUI</option><option value="webui">WebUI</option><option value="api">API</option></select>
					</div>
					<div class="cache-governance-row cache-limit-row">
						<label>容量上限 MB<input id="comfyui-cache-max-size-mb" type="number" min="25" max="4096" step="25" value="200"></label>
						<label>数量上限<input id="comfyui-cache-max-count" type="number" min="20" max="2000" step="20" value="200"></label>
						<button id="cache-delete-selected" class="comfy-button error">删除所选</button>
					</div>
				</div>
				<div class="cache-grid" id="cache-grid">
					<!-- 缓存图片将在这里显示 -->
				</div>
				<div class="cache-pagination"><button id="cache-page-prev" class="comfy-log-icon-button" title="上一页" aria-label="上一页"><i class="fa-solid fa-chevron-left"></i></button><span id="cache-page-label">1 / 1</span><button id="cache-page-next" class="comfy-log-icon-button" title="下一页" aria-label="下一页"><i class="fa-solid fa-chevron-right"></i></button></div>
			</div>
		</div>
	</div>
</div>
<div id="cache-image-modal" class="cache-image-modal" role="dialog" aria-modal="true" aria-label="媒体预览">
	<button type="button" class="cache-modal-close" title="关闭预览" aria-label="关闭预览"><i class="fa-solid fa-xmark"></i></button>
	<div class="cache-modal-media"></div>
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
