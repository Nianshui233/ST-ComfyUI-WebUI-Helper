const TERMINAL_STATES = new Set(['success', 'error', 'cancelled']);

function createTaskId(type = 'task') {
    return `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function cloneTask(task) {
    if (!task) return null;
    const { cancel, ...snapshot } = task;
    return { ...snapshot };
}

export function createTaskStore({ maxTasks = 100, logger = console } = {}) {
    const tasks = new Map();
    const listeners = new Set();

    function snapshot() {
        return Array.from(tasks.values())
            .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
            .map(cloneTask);
    }

    function emit() {
        const next = snapshot();
        for (const listener of listeners) listener(next);
    }

    function prune() {
        if (tasks.size <= maxTasks) return;
        const removable = Array.from(tasks.values())
            .filter(task => TERMINAL_STATES.has(task.status))
            .sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0));
        while (tasks.size > maxTasks && removable.length) {
            tasks.delete(removable.shift().id);
        }
    }

    function start({ type = 'task', label = '任务', detail = '', meta = {}, cancel } = {}) {
        const now = Date.now();
        const task = {
            id: createTaskId(type),
            type,
            label,
            detail,
            meta,
            status: 'running',
            progress: 0,
            createdAt: now,
            startedAt: now,
            updatedAt: now,
            finishedAt: null,
            cancel: typeof cancel === 'function' ? cancel : null,
        };
        tasks.set(task.id, task);
        prune();
        emit();
        return task.id;
    }

    function update(id, patch = {}) {
        const task = tasks.get(id);
        if (!task || TERMINAL_STATES.has(task.status)) return cloneTask(task);
        if (patch.progress !== undefined) {
            patch.progress = Math.max(0, Math.min(1, Number(patch.progress) || 0));
        }
        Object.assign(task, patch, { updatedAt: Date.now() });
        emit();
        return cloneTask(task);
    }

    function finish(id, status, detail = '') {
        const task = tasks.get(id);
        if (!task || TERMINAL_STATES.has(task.status)) return cloneTask(task);
        const now = Date.now();
        Object.assign(task, {
            status,
            detail: detail || task.detail,
            progress: status === 'success' ? 1 : task.progress,
            updatedAt: now,
            finishedAt: now,
            cancel: null,
        });
        prune();
        emit();
        return cloneTask(task);
    }

    async function cancel(id) {
        const task = tasks.get(id);
        if (!task || task.status !== 'running') return false;
        try {
            await task.cancel?.();
        } catch (error) {
            logger.warn('[AI Gen] 取消任务回调失败', { id, error });
        }
        finish(id, 'cancelled', '已取消');
        return true;
    }

    function clearFinished() {
        for (const [id, task] of tasks) {
            if (TERMINAL_STATES.has(task.status)) tasks.delete(id);
        }
        emit();
    }

    function subscribe(listener) {
        listeners.add(listener);
        listener(snapshot());
        return () => listeners.delete(listener);
    }

    return {
        cancel,
        clearFinished,
        error: (id, detail) => finish(id, 'error', detail),
        get: id => cloneTask(tasks.get(id)),
        list: snapshot,
        start,
        subscribe,
        success: (id, detail) => finish(id, 'success', detail),
        update,
    };
}
