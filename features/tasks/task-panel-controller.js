function formatDuration(task) {
    const end = task.finishedAt || Date.now();
    return `${Math.max(0, (end - task.startedAt) / 1000).toFixed(1)}s`;
}

function getStatusLabel(status) {
    return {
        running: '运行中',
        success: '已完成',
        error: '失败',
        cancelled: '已取消',
    }[status] || status;
}

export function createTaskPanelController({ taskStore }) {
    let unsubscribe = null;

    function render(tasks) {
        const list = document.getElementById('comfyui-task-list');
        const summary = document.getElementById('comfyui-task-summary');
        if (!list || !summary) return;
        const running = tasks.filter(task => task.status === 'running').length;
        const failed = tasks.filter(task => task.status === 'error').length;
        summary.textContent = `${running} 个运行中 / ${failed} 个失败 / ${tasks.length} 个记录`;
        list.replaceChildren();
        if (!tasks.length) {
            const empty = document.createElement('div');
            empty.className = 'comfy-task-empty';
            empty.textContent = '暂无任务';
            list.appendChild(empty);
            return;
        }
        for (const task of tasks) {
            const row = document.createElement('article');
            row.className = `comfy-task-row is-${task.status}`;
            row.dataset.taskId = task.id;
            const progress = Math.round((task.progress || 0) * 100);
            row.innerHTML = `<div class="comfy-task-state" title="${getStatusLabel(task.status)}"><span></span></div>
                <div class="comfy-task-copy">
                    <div class="comfy-task-heading"><b></b><span></span></div>
                    <div class="comfy-task-detail"></div>
                    <div class="comfy-task-progress"><span style="width:${progress}%"></span></div>
                </div>
                <div class="comfy-task-actions"></div>`;
            row.querySelector('.comfy-task-heading b').textContent = task.label;
            row.querySelector('.comfy-task-heading span').textContent = `${getStatusLabel(task.status)} · ${formatDuration(task)}`;
            row.querySelector('.comfy-task-detail').textContent = task.detail || task.type;
            if (task.status === 'running') {
                const cancel = document.createElement('button');
                cancel.type = 'button';
                cancel.className = 'comfy-log-icon-button comfy-task-cancel';
                cancel.title = '取消任务';
                cancel.setAttribute('aria-label', '取消任务');
                cancel.innerHTML = '<i class="fa-solid fa-stop"></i>';
                row.querySelector('.comfy-task-actions').appendChild(cancel);
            }
            list.appendChild(row);
        }
    }

    function init() {
        if (unsubscribe) return;
        document.getElementById('comfyui-task-list')?.addEventListener('click', event => {
            const button = event.target.closest('.comfy-task-cancel');
            const id = button?.closest('.comfy-task-row')?.dataset.taskId;
            if (id) taskStore.cancel(id);
        });
        document.getElementById('comfyui-task-clear')?.addEventListener('click', () => taskStore.clearFinished());
        unsubscribe = taskStore.subscribe(render);
    }

    return { init };
}
