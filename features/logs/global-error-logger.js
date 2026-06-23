const PLUGIN_ERROR_PATTERNS = [
    /AI Gen/i,
    /comfyui/i,
    /webui/i,
    /LoRA/i,
    /绘图/,
    /生成/,
];

function getErrorText(error) {
    if (!error) return '';
    if (typeof error === 'string') return error;
    return [
        error.message,
        error.stack,
        error.reason?.message,
        error.reason?.stack,
    ].filter(Boolean).join('\n');
}

function isLikelyPluginError(eventOrReason) {
    const filename = eventOrReason?.filename || '';
    const text = getErrorText(eventOrReason?.error || eventOrReason?.reason || eventOrReason);
    const combined = `${filename}\n${text}`;
    if (!combined.trim()) return true;
    return PLUGIN_ERROR_PATTERNS.some(pattern => pattern.test(combined));
}

export function installGlobalErrorLogger({ logger = console } = {}) {
    const onError = (event) => {
        if (!isLikelyPluginError(event)) return;
        logger.error('[AI Gen] 未捕获运行错误:', event.error || event.message || event);
    };

    const onUnhandledRejection = (event) => {
        if (!isLikelyPluginError(event)) return;
        logger.error('[AI Gen] 未处理 Promise 拒绝:', event.reason || event);
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
        window.removeEventListener('error', onError);
        window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
}
