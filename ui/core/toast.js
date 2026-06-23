export function createToastNotifier({ logger = console, logStore = null } = {}) {
    let activeToastCount = 0;

    return function showToast(type, message) {
        logStore?.add?.(type, [message], 'toast');

        if (typeof toastr !== 'undefined') {
            toastr[type](message);
            return;
        }

        if (!logStore) {
            logger.log(`[AI Gen Toast]: ${type.toUpperCase()} - ${message}`);
        }
        const toastId = `toast-${Date.now()}`;
        const toastColors = {
            success: 'var(--vp-success-color, #73d48f)',
            info: 'var(--vp-accent-color, #66d7c7)',
            warning: 'var(--vp-warning-color, #e9b44c)',
            error: 'var(--vp-error-color, #ff6f61)',
        };

        const toast = document.createElement('div');
        toast.id = toastId;
        toast.style.cssText = `
            position: fixed;
            top: ${20 + activeToastCount * 64}px;
            right: 20px;
            max-width: 360px;
            padding: 13px 16px 13px 15px;
            color: var(--vp-text-color, #f3efe6);
            font-family: var(--vp-font, system-ui, sans-serif);
            font-size: 13px;
            line-height: 1.45;
            border: 1px solid var(--vp-border-strong, rgba(244, 235, 214, 0.22));
            border-left: 3px solid ${toastColors[type] || toastColors.info};
            border-radius: var(--vp-radius-md, 8px);
            background: var(--vp-panel-color-strong, rgba(32, 36, 42, 0.985));
            box-shadow: 0 10px 28px rgba(0, 0, 0, 0.42);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            z-index: 10005;
            opacity: 0;
            transform: translateX(110%);
            transition: opacity 0.3s ease, transform 0.3s var(--vp-ease, cubic-bezier(0.2, 0.7, 0.3, 1));
        `;
        toast.textContent = message;

        document.body.appendChild(toast);
        activeToastCount++;

        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            activeToastCount--;
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    };
}
