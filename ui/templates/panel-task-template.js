export function getPanelTaskTemplate() {
    return `<div id="tab-tasks" class="tab-content">
                <header class="comfy-task-toolbar">
                    <div><h4>全局任务中心</h4><span id="comfyui-task-summary">0 个运行中 / 0 个失败 / 0 个记录</span></div>
                    <button type="button" id="comfyui-task-clear" class="comfy-log-icon-button" title="清理已结束任务" aria-label="清理已结束任务"><i class="fa-solid fa-broom"></i></button>
                </header>
                <div id="comfyui-task-list" class="comfy-task-list"></div>
            </div>`;
}
