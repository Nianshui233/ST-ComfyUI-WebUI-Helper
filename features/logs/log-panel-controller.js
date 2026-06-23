import { escapeHTML } from '../../lib/core/utils.js';

const LEVEL_LABELS = {
    info: '信息',
    success: '成功',
    warning: '警告',
    error: '错误',
    debug: '调试',
};

function getElements() {
    return {
        clearButton: document.getElementById('comfyui-log-clear'),
        copyButton: document.getElementById('comfyui-log-copy'),
        empty: document.getElementById('comfyui-log-empty'),
        errorCount: document.getElementById('comfyui-log-error-count'),
        exportButton: document.getElementById('comfyui-log-export'),
        filter: document.getElementById('comfyui-log-level'),
        list: document.getElementById('comfyui-log-list'),
        search: document.getElementById('comfyui-log-search'),
        totalCount: document.getElementById('comfyui-log-total-count'),
        warningCount: document.getElementById('comfyui-log-warning-count'),
    };
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

function entryMatches(entry, { level, query }) {
    if (level === 'normal' && entry.level === 'debug') return false;
    if (level === 'api-image') {
        return /API 生图|api-image/i.test(`${entry.source} ${entry.message} ${entry.details}`);
    }
    if (level && level !== 'normal' && entry.level !== level) return false;
    if (!query) return true;

    const haystack = `${entry.level} ${entry.source} ${entry.message} ${entry.details}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
}

function buildEntryHtml(entry) {
    const detailsHtml = entry.details
        ? `<pre class="comfy-log-details">${escapeHTML(entry.details)}</pre>`
        : '';
    const isAiPrompt = /AI 绘图提示词分析完成/.test(entry.message);
    const isApiImage = /API 生图|api-image/i.test(`${entry.source} ${entry.message} ${entry.details}`);
    const entryClass = `comfy-log-entry log-${entry.level}${isAiPrompt ? ' log-ai-prompt' : ''}${isApiImage ? ' log-api-image' : ''}`;

    return `<article class="${entryClass}">
        <div class="comfy-log-entry-head">
            <span class="comfy-log-level">${LEVEL_LABELS[entry.level] || entry.level}</span>
            <time>${formatTime(entry.time)}</time>
            <span class="comfy-log-source">${escapeHTML(entry.source)}</span>
        </div>
        <div class="comfy-log-message">${escapeHTML(entry.message)}</div>
        ${detailsHtml}
    </article>`;
}

function copyText(text) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    return Promise.resolve();
}

function exportTextFile({ text, blobUrlTracker }) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = blobUrlTracker.create(blob, 'logs');
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_gen_logs_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    blobUrlTracker.revoke(url);
}

export function createLogPanelController({
    blobUrlTracker,
    logStore,
    showToast,
}) {
    let initialized = false;
    let unsubscribe = null;
    let entries = [];
    let lastRenderedHtml = '';
    let lastEmptyVisible = null;

    function getVisibleEntries(elements = getElements()) {
        return entries.filter(entry => entryMatches(entry, {
            level: elements.filter?.value || '',
            query: elements.search?.value?.trim() || '',
        }));
    }

    function updateStats(elements) {
        const errorCount = entries.filter(entry => entry.level === 'error').length;
        const warningCount = entries.filter(entry => entry.level === 'warning').length;

        if (elements.totalCount) elements.totalCount.textContent = String(entries.length);
        if (elements.errorCount) elements.errorCount.textContent = String(errorCount);
        if (elements.warningCount) elements.warningCount.textContent = String(warningCount);
    }

    function render() {
        const elements = getElements();
        if (!elements.list) return;

        updateStats(elements);

        const visibleEntries = getVisibleEntries(elements);
        const nextHtml = visibleEntries.map(buildEntryHtml).join('');
        if (nextHtml !== lastRenderedHtml) {
            const scrollContainer = elements.list.closest('.tab-content');
            const previousScrollTop = scrollContainer?.scrollTop || 0;
            elements.list.innerHTML = nextHtml;
            lastRenderedHtml = nextHtml;
            if (scrollContainer) scrollContainer.scrollTop = previousScrollTop;
        }
        if (elements.empty) {
            const shouldShowEmpty = visibleEntries.length === 0;
            if (shouldShowEmpty !== lastEmptyVisible) {
                elements.empty.style.display = shouldShowEmpty ? 'block' : 'none';
                lastEmptyVisible = shouldShowEmpty;
            }
        }
    }

    async function copyVisibleLogs() {
        const elements = getElements();
        const visibleEntries = getVisibleEntries(elements);
        if (!visibleEntries.length) {
            showToast('warning', '当前没有可复制的日志');
            return;
        }

        await copyText(logStore.formatEntriesForText(visibleEntries));
        showToast('success', `已复制 ${visibleEntries.length} 条日志`);
    }

    function exportVisibleLogs() {
        const elements = getElements();
        const visibleEntries = getVisibleEntries(elements);
        if (!visibleEntries.length) {
            showToast('warning', '当前没有可导出的日志');
            return;
        }

        exportTextFile({
            text: logStore.formatEntriesForText(visibleEntries),
            blobUrlTracker,
        });
        showToast('success', `已导出 ${visibleEntries.length} 条日志`);
    }

    function clearLogs() {
        if (!entries.length) {
            showToast('info', '日志已经是空的');
            return;
        }
        if (!confirm('确定清空当前内存日志吗？刷新页面也会清空这些日志。')) return;

        lastRenderedHtml = '';
        lastEmptyVisible = null;
        logStore.clear();
        logStore.info('日志页已清空历史记录');
    }

    function bindEvents() {
        const elements = getElements();
        elements.filter?.addEventListener('change', render);
        elements.search?.addEventListener('input', render);
        elements.copyButton?.addEventListener('click', copyVisibleLogs);
        elements.exportButton?.addEventListener('click', exportVisibleLogs);
        elements.clearButton?.addEventListener('click', clearLogs);
    }

    function init() {
        if (initialized) return;
        initialized = true;
        bindEvents();
        unsubscribe = logStore.subscribe(nextEntries => {
            entries = nextEntries;
            render();
        });
        logStore.info('日志页已就绪。这里会汇总插件运行提示、API 调用提示、连接状态、生成状态和错误。');
    }

    function destroy() {
        unsubscribe?.();
        unsubscribe = null;
        initialized = false;
    }

    return {
        destroy,
        init,
        render,
    };
}
