import {
    LOG_LEVEL_LABELS,
    entryMatchesLogFilter,
    formatTerminalTime,
    isLogViewportNearBottom,
    shouldAutoFollowLog,
} from './log-terminal.js';

function getElements() {
    return {
        clearButton: document.getElementById('comfyui-log-clear'),
        copyButton: document.getElementById('comfyui-log-copy'),
        empty: document.getElementById('comfyui-log-empty'),
        emptyMessage: document.getElementById('comfyui-log-empty-message'),
        errorCount: document.getElementById('comfyui-log-error-count'),
        exportButton: document.getElementById('comfyui-log-export'),
        filter: document.getElementById('comfyui-log-level'),
        followButton: document.getElementById('comfyui-log-follow'),
        list: document.getElementById('comfyui-log-list'),
        liveState: document.getElementById('comfyui-log-live-state'),
        liveAnnouncer: document.getElementById('comfyui-log-announcer'),
        newButton: document.getElementById('comfyui-log-new'),
        newButtonLabel: document.getElementById('comfyui-log-new-label'),
        search: document.getElementById('comfyui-log-search'),
        totalCount: document.getElementById('comfyui-log-total-count'),
        viewport: document.getElementById('comfyui-log-viewport'),
        warningCount: document.getElementById('comfyui-log-warning-count'),
        wrapButton: document.getElementById('comfyui-log-wrap'),
        wrapState: document.getElementById('comfyui-log-wrap-state'),
    };
}

function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function getDetailElementId(entryId) {
    const safeId = String(entryId).replace(/[^a-z0-9_-]/gi, '-');
    return `comfy-log-detail-${safeId}`;
}

function createDetailToggle(entry, expanded) {
    if (!entry.details) {
        return createElement('span', 'comfy-log-detail-spacer');
    }

    const button = createElement('button', 'comfy-log-detail-toggle');
    button.type = 'button';
    button.dataset.logId = String(entry.id);
    button.setAttribute('aria-controls', getDetailElementId(entry.id));
    button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    button.setAttribute('aria-label', expanded ? '折叠日志详情' : '展开日志详情');
    button.title = expanded ? '折叠详情' : '展开详情';

    const icon = createElement('i', `fa-solid ${expanded ? 'fa-chevron-down' : 'fa-chevron-right'}`);
    icon.setAttribute('aria-hidden', 'true');
    button.appendChild(icon);
    return button;
}

function createLogEntry(entry, expanded) {
    const row = createElement('div', `comfy-log-entry log-${entry.level || 'info'}`);
    row.dataset.logId = String(entry.id);
    row.setAttribute('role', 'listitem');
    row.classList.toggle('is-expanded', expanded);

    const searchableText = `${entry.source || ''} ${entry.message || ''} ${entry.details || ''}`;
    if (/AI 绘图提示词分析完成/.test(entry.message || '')) row.classList.add('log-ai-prompt');
    if (/API 生图|api-image/i.test(searchableText)) row.classList.add('log-api-image');

    row.appendChild(createDetailToggle(entry, expanded));

    const time = createElement('time', 'comfy-log-time', formatTerminalTime(entry.time));
    const date = new Date(entry.time);
    if (!Number.isNaN(date.getTime())) time.dateTime = date.toISOString();
    row.appendChild(time);

    const level = createElement(
        'span',
        'comfy-log-level',
        LOG_LEVEL_LABELS[entry.level] || String(entry.level || 'INFO').toUpperCase(),
    );
    row.appendChild(level);

    const sourceText = String(entry.source || 'runtime');
    const source = createElement('span', 'comfy-log-source', sourceText);
    source.title = sourceText;
    row.appendChild(source);

    row.appendChild(createElement('span', 'comfy-log-message', entry.message || '(empty log)'));

    if (entry.details) {
        const details = createElement('pre', 'comfy-log-details', entry.details);
        details.id = getDetailElementId(entry.id);
        details.hidden = !expanded;
        row.appendChild(details);
    }

    return row;
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
    let receivedInitialSnapshot = false;
    let followEnabled = true;
    let viewportPinnedToBottom = true;
    let wrapEnabled = true;
    let pendingNewCount = 0;
    let activationFrame = null;
    const detailState = new Map();
    const eventCleanups = [];

    function bind(element, eventName, handler) {
        if (!element) return;
        element.addEventListener(eventName, handler);
        eventCleanups.push(() => element.removeEventListener(eventName, handler));
    }

    function getFilter(elements = getElements()) {
        return {
            level: elements.filter?.value || '',
            query: elements.search?.value?.trim() || '',
        };
    }

    function getVisibleEntries(elements = getElements()) {
        const filter = getFilter(elements);
        return entries.filter(entry => entryMatchesLogFilter(entry, filter));
    }

    function isNearBottom(viewport) {
        return viewport ? isLogViewportNearBottom(viewport) : true;
    }

    function updateStats(elements) {
        const errorCount = entries.filter(entry => entry.level === 'error').length;
        const warningCount = entries.filter(entry => entry.level === 'warning').length;

        if (elements.totalCount) elements.totalCount.textContent = String(entries.length);
        if (elements.errorCount) elements.errorCount.textContent = String(errorCount);
        if (elements.warningCount) elements.warningCount.textContent = String(warningCount);
    }

    function updateFollowState(elements = getElements()) {
        const live = followEnabled && viewportPinnedToBottom;
        if (elements.liveState) {
            const nextState = live ? 'LIVE' : 'PAUSED';
            if (elements.liveState.textContent !== nextState) elements.liveState.textContent = nextState;
            elements.liveState.classList.toggle('is-live', live);
            elements.liveState.classList.toggle('is-paused', !live);
        }
        if (elements.followButton) {
            elements.followButton.setAttribute('aria-pressed', followEnabled ? 'true' : 'false');
            elements.followButton.classList.toggle('is-active', followEnabled);
            elements.followButton.title = followEnabled ? '暂停自动跟随' : '恢复自动跟随';
            elements.followButton.setAttribute('aria-label', elements.followButton.title);
        }
    }

    function updateNewLogButton(elements = getElements()) {
        if (!elements.newButton) return;
        const hasPendingLogs = pendingNewCount > 0;
        const label = hasPendingLogs ? `${pendingNewCount} 条新日志` : '';
        elements.newButton.hidden = !hasPendingLogs;
        elements.newButton.setAttribute('aria-label', hasPendingLogs ? `${label}，跳到最新日志` : '跳到最新日志');
        if (elements.newButtonLabel && elements.newButtonLabel.textContent !== label) {
            elements.newButtonLabel.textContent = label;
        }
        const announcement = hasPendingLogs ? `${label}待查看` : '';
        if (elements.liveAnnouncer && elements.liveAnnouncer.textContent !== announcement) {
            elements.liveAnnouncer.textContent = announcement;
        }
    }

    function updateWrapState(elements = getElements()) {
        elements.viewport?.classList.toggle('is-nowrap', !wrapEnabled);
        if (elements.wrapButton) {
            elements.wrapButton.setAttribute('aria-pressed', wrapEnabled ? 'true' : 'false');
            elements.wrapButton.classList.toggle('is-active', wrapEnabled);
            elements.wrapButton.title = wrapEnabled ? '关闭自动换行' : '开启自动换行';
            elements.wrapButton.setAttribute('aria-label', elements.wrapButton.title);
        }
        if (elements.wrapState) elements.wrapState.textContent = wrapEnabled ? 'WRAP ON' : 'WRAP OFF';
    }

    function scrollToBottom(elements = getElements()) {
        if (!elements.viewport) return;
        viewportPinnedToBottom = true;
        elements.viewport.scrollTop = elements.viewport.scrollHeight;
        pendingNewCount = 0;
        updateNewLogButton(elements);
        updateFollowState(elements);
    }

    function render({ follow = false, preserveScroll = true } = {}) {
        const elements = getElements();
        if (!elements.list) return;

        const previousScrollTop = elements.viewport?.scrollTop || 0;
        const visibleEntries = getVisibleEntries(elements);
        const fragment = document.createDocumentFragment();
        for (const entry of visibleEntries) {
            const entryId = String(entry.id);
            const expanded = detailState.has(entryId)
                ? detailState.get(entryId)
                : entry.level === 'error';
            fragment.appendChild(createLogEntry(entry, expanded));
        }
        elements.list.replaceChildren(fragment);

        updateStats(elements);
        if (elements.empty) {
            elements.empty.hidden = visibleEntries.length !== 0;
            const emptyMessage = entries.length
                ? '没有符合当前筛选条件的日志。'
                : '等待插件输出日志。';
            if (elements.emptyMessage) elements.emptyMessage.textContent = emptyMessage;
            else elements.empty.textContent = emptyMessage;
        }
        updateWrapState(elements);

        if (follow) {
            scrollToBottom(elements);
        } else if (preserveScroll && elements.viewport) {
            elements.viewport.scrollTop = previousScrollTop;
        }
        updateNewLogButton(elements);
        updateFollowState(elements);
    }

    function handleSnapshot(nextEntries) {
        const elements = getElements();
        const initialSnapshot = !receivedInitialSnapshot;
        const previousScrollTop = elements.viewport?.scrollTop || 0;
        const previousIds = new Set(entries.map(entry => String(entry.id)));
        const filter = getFilter(elements);
        const addedVisibleCount = initialSnapshot
            ? 0
            : nextEntries.filter(entry => (
                !previousIds.has(String(entry.id))
                && entryMatchesLogFilter(entry, filter)
            )).length;

        entries = nextEntries;
        receivedInitialSnapshot = true;

        const currentIds = new Set(entries.map(entry => String(entry.id)));
        for (const entryId of detailState.keys()) {
            if (!currentIds.has(entryId)) detailState.delete(entryId);
        }

        const shouldFollow = shouldAutoFollowLog({
            followEnabled,
            initialSnapshot,
            viewportPinnedToBottom,
        });
        if (!shouldFollow && addedVisibleCount > 0) pendingNewCount += addedVisibleCount;

        render({ follow: shouldFollow, preserveScroll: !shouldFollow });
        if (!shouldFollow && elements.viewport) elements.viewport.scrollTop = previousScrollTop;
    }

    function renderAfterFilterChange() {
        pendingNewCount = 0;
        render({ preserveScroll: false });
        const elements = getElements();
        if (elements.viewport) elements.viewport.scrollTop = 0;
        viewportPinnedToBottom = isNearBottom(elements.viewport);
        updateFollowState(elements);
    }

    function handleViewportScroll() {
        const elements = getElements();
        viewportPinnedToBottom = isNearBottom(elements.viewport);
        if (viewportPinnedToBottom) pendingNewCount = 0;
        updateNewLogButton(elements);
        updateFollowState(elements);
    }

    function handleDetailToggle(event) {
        const button = event.target?.closest?.('.comfy-log-detail-toggle');
        if (!button) return;
        const row = button.closest('.comfy-log-entry');
        const entryId = row?.dataset.logId;
        if (!entryId) return;

        const expanded = button.getAttribute('aria-expanded') !== 'true';
        detailState.set(entryId, expanded);
        button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        button.setAttribute('aria-label', expanded ? '折叠日志详情' : '展开日志详情');
        button.title = expanded ? '折叠详情' : '展开详情';
        button.querySelector('i')?.classList.toggle('fa-chevron-down', expanded);
        button.querySelector('i')?.classList.toggle('fa-chevron-right', !expanded);
        row.classList.toggle('is-expanded', expanded);

        const detailId = button.getAttribute('aria-controls');
        const details = detailId ? document.getElementById(detailId) : null;
        if (details) details.hidden = !expanded;
        updateFollowState();
    }

    async function copyVisibleLogs() {
        const visibleEntries = getVisibleEntries();
        if (!visibleEntries.length) {
            showToast('warning', '当前没有可复制的日志');
            return;
        }

        try {
            await copyText(logStore.formatEntriesForText(visibleEntries));
            showToast('success', `已复制 ${visibleEntries.length} 条日志`);
        } catch (error) {
            showToast('error', `复制日志失败：${error?.message || error}`);
        }
    }

    function exportVisibleLogs() {
        const visibleEntries = getVisibleEntries();
        if (!visibleEntries.length) {
            showToast('warning', '当前没有可导出的日志');
            return;
        }

        try {
            exportTextFile({
                text: logStore.formatEntriesForText(visibleEntries),
                blobUrlTracker,
            });
            showToast('success', `已导出 ${visibleEntries.length} 条日志`);
        } catch (error) {
            showToast('error', `导出日志失败：${error?.message || error}`);
        }
    }

    function clearLogs() {
        if (!entries.length) return;
        if (!confirm('确定清空当前内存日志吗？刷新页面也会清空这些日志。')) return;

        detailState.clear();
        pendingNewCount = 0;
        logStore.clear();
    }

    function toggleWrap() {
        wrapEnabled = !wrapEnabled;
        updateWrapState();
    }

    function toggleFollow() {
        followEnabled = !followEnabled;
        const elements = getElements();
        if (followEnabled) scrollToBottom(elements);
        else updateFollowState(elements);
    }

    function resumeFollow() {
        followEnabled = true;
        scrollToBottom();
    }

    function syncVisibleLogTab() {
        const tab = document.getElementById('tab-logs');
        if (!tab?.classList.contains('active')) return;

        if (activationFrame !== null && typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(activationFrame);
        }
        const schedule = typeof requestAnimationFrame === 'function'
            ? requestAnimationFrame
            : callback => setTimeout(callback, 0);
        activationFrame = schedule(() => {
            activationFrame = null;
            if (shouldAutoFollowLog({ followEnabled, viewportPinnedToBottom })) scrollToBottom();
            else updateFollowState();
        });
    }

    function bindEvents() {
        const elements = getElements();
        bind(elements.filter, 'change', renderAfterFilterChange);
        bind(elements.search, 'input', renderAfterFilterChange);
        bind(elements.wrapButton, 'click', toggleWrap);
        bind(elements.followButton, 'click', toggleFollow);
        bind(elements.copyButton, 'click', copyVisibleLogs);
        bind(elements.exportButton, 'click', exportVisibleLogs);
        bind(elements.clearButton, 'click', clearLogs);
        bind(elements.newButton, 'click', resumeFollow);
        bind(elements.viewport, 'scroll', handleViewportScroll);
        bind(elements.list, 'click', handleDetailToggle);

        const tab = document.getElementById('tab-logs');
        if (tab && typeof MutationObserver === 'function') {
            const observer = new MutationObserver(syncVisibleLogTab);
            observer.observe(tab, { attributes: true, attributeFilter: ['class'] });
            eventCleanups.push(() => observer.disconnect());
        }
        syncVisibleLogTab();
    }

    function init() {
        if (initialized) return;
        initialized = true;
        bindEvents();
        updateWrapState();
        unsubscribe = logStore.subscribe(handleSnapshot);
    }

    function destroy() {
        unsubscribe?.();
        unsubscribe = null;
        if (activationFrame !== null) {
            if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(activationFrame);
            else clearTimeout(activationFrame);
            activationFrame = null;
        }
        while (eventCleanups.length) eventCleanups.pop()();
        initialized = false;
        receivedInitialSnapshot = false;
    }

    return {
        destroy,
        init,
        render,
    };
}
