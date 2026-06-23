export function createProgressUI(tracker, anchorElement) {
    tracker.remove();
    tracker.container = document.createElement('div');
    tracker.container.className = 'comfy-progress-container';
    tracker.bar = document.createElement('div');
    tracker.bar.className = 'comfy-progress-bar';
    tracker.text = document.createElement('div');
    tracker.text.className = 'comfy-progress-text';
    tracker.container.appendChild(tracker.bar);
    tracker.cancelBtn = document.createElement('button');
    tracker.cancelBtn.type = 'button';
    tracker.cancelBtn.className = 'comfy-button error comfy-cancel-button';
    tracker.cancelBtn.textContent = '取消';
    tracker.cancelBtn.addEventListener('click', () => { tracker.cancel(); });
    anchorElement.insertAdjacentElement('afterend', tracker.cancelBtn);
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

export function removeProgressUI(tracker) {
    tracker.container?.remove();
    tracker.text?.remove();
    tracker.cancelBtn?.remove();
    tracker.container = null;
    tracker.bar = null;
    tracker.text = null;
    tracker.cancelBtn = null;
}
