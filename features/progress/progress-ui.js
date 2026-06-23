function getCustomProgressHost(anchorElement) {
    const selector = anchorElement?.dataset?.progressSlot;
    if (!selector) return null;
    const root = anchorElement.closest('.comfy-storyboard-panel')
        || anchorElement.closest('.comfy-ai-prompt-panel')
        || anchorElement.parentElement;
    return root?.querySelector(selector)
        || anchorElement.parentElement?.querySelector(selector)
        || null;
}

export function createProgressUI(tracker, anchorElement) {
    tracker.remove();
    tracker.container = document.createElement('div');
    tracker.container.className = 'comfy-progress-container';
    tracker.bar = document.createElement('div');
    tracker.bar.className = 'comfy-progress-bar';
    tracker.text = document.createElement('div');
    tracker.text.className = 'comfy-progress-text';
    tracker.apiTelemetry = document.createElement('div');
    tracker.apiTelemetry.className = 'comfy-api-telemetry';
    tracker.apiTelemetry.hidden = true;
    tracker.container.appendChild(tracker.bar);
    tracker.cancelBtn = document.createElement('button');
    tracker.cancelBtn.type = 'button';
    tracker.cancelBtn.className = 'comfy-button error comfy-cancel-button';
    tracker.cancelBtn.textContent = '取消';
    tracker.cancelBtn.addEventListener('click', () => { tracker.cancel(); });
    const customHost = getCustomProgressHost(anchorElement);
    if (customHost) {
        customHost.innerHTML = '';
        customHost.append(tracker.container, tracker.text, tracker.apiTelemetry, tracker.cancelBtn);
        return;
    }
    anchorElement.insertAdjacentElement('afterend', tracker.cancelBtn);
    anchorElement.insertAdjacentElement('afterend', tracker.apiTelemetry);
    anchorElement.insertAdjacentElement('afterend', tracker.text);
    anchorElement.insertAdjacentElement('afterend', tracker.container);
}

export function updateProgressUI(tracker, progress, statusText) {
    if (tracker.bar) tracker.bar.style.width = `${Math.min(progress * 100, 100)}%`;
    if (tracker.text) tracker.text.textContent = statusText || `${Math.round(progress * 100)}%`;
}

export function markProgressCancelling(tracker) {
    if (tracker.cancelBtn) {
        tracker.cancelBtn.disabled = true;
        tracker.cancelBtn.textContent = '取消中...';
    }
    updateProgressUI(tracker, tracker.bar ? (parseFloat(tracker.bar.style.width) || 0) / 100 : 0, '正在取消...');
}

export function updateApiTelemetryUI(tracker, payload = {}) {
    if (!tracker.apiTelemetry) return;
    tracker.apiTelemetry.hidden = false;
    tracker.apiTelemetry.innerHTML = `
        <div class="comfy-api-telemetry-head">
            <b>${payload.statusText || 'API 生图运行中'}</b>
            <span>${payload.elapsedText || '0s'}</span>
        </div>
        <div class="comfy-api-telemetry-grid">
            <span><em>服务商</em>${payload.provider || '-'}</span>
            <span><em>模型</em>${payload.model || '-'}</span>
            <span><em>Key</em>${payload.keyName || '当前输入'}</span>
            <span><em>尝试</em>${payload.attemptIndex || 1}/${payload.totalAttempts || 1}</span>
            <span><em>尺寸</em>${payload.size || '-'}</span>
            <span><em>提示词</em>${payload.promptLength ?? 0} 字符</span>
        </div>
    `;
}

export function removeProgressUI(tracker) {
    tracker.container?.remove();
    tracker.text?.remove();
    tracker.cancelBtn?.remove();
    tracker.apiTelemetry?.remove();
    tracker.container = null;
    tracker.bar = null;
    tracker.text = null;
    tracker.cancelBtn = null;
    tracker.apiTelemetry = null;
}
