export function getPanelLogTemplate() {
    return `<div id="tab-logs" class="tab-content">
                <div class="comfy-log-header">
                    <div>
                        <h4>运行日志</h4>
                        <p>这里集中显示插件运行提示、连接状态、AI/LLM 调用提示、ComfyUI/WebUI 错误、生成状态和缓存操作结果。</p>
                    </div>
                    <div class="comfy-log-stats">
                        <span><b id="comfyui-log-total-count">0</b> 总计</span>
                        <span class="warning"><b id="comfyui-log-warning-count">0</b> 警告</span>
                        <span class="error"><b id="comfyui-log-error-count">0</b> 错误</span>
                    </div>
                </div>
                <div class="comfy-log-notes">
                    <div><i class="fa-solid fa-circle-info"></i><span>日志保存在当前页面内存中，刷新 SillyTavern 页面后会清空。</span></div>
                    <div><i class="fa-solid fa-shield-halved"></i><span>API Key、Token、Authorization 等敏感字段会尽量脱敏；复制或导出前仍建议快速检查。</span></div>
                    <div><i class="fa-solid fa-triangle-exclamation"></i><span>如果遇到偶发失败，先过滤“错误/警告”，再复制日志发给调试会更清楚。</span></div>
                </div>
                <div class="comfy-log-toolbar">
                    <label>
                        <span>级别</span>
                        <select id="comfyui-log-level">
                            <option value="normal">常规日志</option>
                            <option value="api-image">API 生图</option>
                            <option value="">全部级别（含调试）</option>
                            <option value="error">错误</option>
                            <option value="warning">警告</option>
                            <option value="success">成功</option>
                            <option value="info">信息</option>
                            <option value="debug">调试</option>
                        </select>
                    </label>
                    <label class="comfy-log-search-wrap">
                        <span>搜索</span>
                        <input type="text" id="comfyui-log-search" placeholder="搜索消息、来源或错误关键词...">
                    </label>
                    <div class="comfy-log-actions">
                        <button type="button" id="comfyui-log-copy" class="comfy-button"><i class="fa-solid fa-copy"></i>复制</button>
                        <button type="button" id="comfyui-log-export" class="comfy-button"><i class="fa-solid fa-download"></i>导出</button>
                        <button type="button" id="comfyui-log-clear" class="comfy-button error"><i class="fa-solid fa-trash"></i>清空</button>
                    </div>
                </div>
                <div class="comfy-log-list-wrap">
                    <div id="comfyui-log-empty" class="comfy-log-empty">暂无匹配日志。运行连接测试、生成图片或调用 AI/LLM 后会自动出现记录。</div>
                    <div id="comfyui-log-list" class="comfy-log-list"></div>
                </div>
            </div>`;
}
