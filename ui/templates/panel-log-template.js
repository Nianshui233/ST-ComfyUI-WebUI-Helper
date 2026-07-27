export function getPanelLogTemplate() {
    return `<div id="tab-logs" class="tab-content">
                <header class="comfy-log-command-bar">
                    <div class="comfy-log-title">
                        <i class="fa-solid fa-terminal" aria-hidden="true"></i>
                        <h4>运行日志</h4>
                    </div>
                    <div class="comfy-log-filters">
                        <label class="comfy-log-level-field">
                            <span class="comfy-log-sr-only">日志级别</span>
                            <select id="comfyui-log-level" title="筛选日志级别" aria-label="筛选日志级别">
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
                        <label class="comfy-log-search-field">
                            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                            <span class="comfy-log-sr-only">搜索日志</span>
                            <input type="search" id="comfyui-log-search" placeholder="搜索日志" autocomplete="off" spellcheck="false" aria-label="搜索日志">
                        </label>
                    </div>
                    <div class="comfy-log-actions" role="toolbar" aria-label="日志工具">
                        <button type="button" id="comfyui-log-wrap" class="comfy-log-icon-button" aria-pressed="true" title="切换自动换行" aria-label="切换自动换行">
                            <i class="fa-solid fa-arrow-turn-down" aria-hidden="true"></i>
                        </button>
                        <button type="button" id="comfyui-log-follow" class="comfy-log-icon-button" aria-pressed="true" title="跟随最新日志" aria-label="跟随最新日志">
                            <i class="fa-solid fa-arrow-down" aria-hidden="true"></i>
                        </button>
                        <span class="comfy-log-action-divider" aria-hidden="true"></span>
                        <button type="button" id="comfyui-log-copy" class="comfy-log-icon-button" title="复制当前日志" aria-label="复制当前日志">
                            <i class="fa-solid fa-copy" aria-hidden="true"></i>
                        </button>
                        <button type="button" id="comfyui-log-export" class="comfy-log-icon-button" title="导出当前日志" aria-label="导出当前日志">
                            <i class="fa-solid fa-download" aria-hidden="true"></i>
                        </button>
                        <button type="button" id="comfyui-log-clear" class="comfy-log-icon-button comfy-log-clear-button" title="清空日志" aria-label="清空日志">
                            <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
                        </button>
                    </div>
                </header>

                <section class="comfy-log-console" aria-label="运行日志控制台">
                    <div class="comfy-log-viewport-shell">
                        <div id="comfyui-log-viewport" class="comfy-log-viewport" tabindex="0">
                            <div id="comfyui-log-empty" class="comfy-log-empty">
                                <i class="fa-solid fa-terminal" aria-hidden="true"></i>
                                <span id="comfyui-log-empty-message">暂无匹配日志</span>
                            </div>
                            <div id="comfyui-log-list" class="comfy-log-list" role="list" aria-label="日志记录"></div>
                        </div>
                        <button type="button" id="comfyui-log-new" class="comfy-log-new comfy-log-new-button" title="跳到最新日志" aria-label="跳到最新日志" hidden>
                            <i class="fa-solid fa-arrow-down" aria-hidden="true"></i>
                            <span id="comfyui-log-new-label">新日志</span>
                        </button>
                    </div>

                    <footer class="comfy-log-status-bar">
                        <div class="comfy-log-status-primary">
                            <span class="comfy-log-live-indicator" aria-hidden="true"></span>
                            <span id="comfyui-log-live-state" class="comfy-log-live-state" role="status" aria-live="polite" aria-atomic="true">LIVE</span>
                            <span id="comfyui-log-announcer" class="comfy-log-sr-only" role="status" aria-live="polite" aria-atomic="true"></span>
                            <span>总计 <b id="comfyui-log-total-count">0</b></span>
                            <span class="comfy-log-warning-stat">警告 <b id="comfyui-log-warning-count">0</b></span>
                            <span class="comfy-log-error-stat">错误 <b id="comfyui-log-error-count">0</b></span>
                        </div>
                        <div class="comfy-log-status-meta">
                            <span><i class="fa-solid fa-memory" aria-hidden="true"></i>仅存本页内存</span>
                            <span><i class="fa-solid fa-shield-halved" aria-hidden="true"></i>敏感字段脱敏</span>
                            <span><i class="fa-solid fa-arrow-turn-down" aria-hidden="true"></i><span id="comfyui-log-wrap-state">WRAP ON</span></span>
                        </div>
                    </footer>
                </section>
            </div>`;
}
