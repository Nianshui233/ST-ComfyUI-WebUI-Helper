function formatElapsed(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function truncateText(value, length = 240) {
    const text = String(value || '');
    return text.length > length ? `${text.slice(0, length)}...` : text;
}

export function createApiImageTelemetry({
    progressTracker,
    logger = console,
}) {
    let timer = null;
    let startedAt = 0;
    let softWarned = false;
    let context = null;

    function stop() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    function getElapsed() {
        return startedAt ? Date.now() - startedAt : 0;
    }

    function update(statusText, progress = 0.18) {
        if (!context) return;
        const elapsedText = formatElapsed(getElapsed());
        progressTracker.updateApiTelemetry?.({
            ...context,
            statusText,
            elapsedText,
        });
        progressTracker.update(progress, `${statusText} · ${elapsedText}`);
    }

    function start(nextContext) {
        stop();
        startedAt = Date.now();
        softWarned = false;
        context = nextContext;
        progressTracker.startApiImage?.(nextContext.url);
        progressTracker.updateApiTelemetry?.({
            ...context,
            statusText: '请求准备中',
            elapsedText: '0s',
        });
        timer = setInterval(() => {
            const elapsedMs = getElapsed();
            const waitingText = softWarned ? '中转站仍在等待返回' : '等待 API 返回';
            update(waitingText, 0.24);
            if (!softWarned && context.softTimeoutMs > 0 && elapsedMs >= context.softTimeoutMs) {
                softWarned = true;
                logger.warning('[AI Gen] API 生图等待时间较长', {
                    elapsedMs,
                    softTimeoutMs: context.softTimeoutMs,
                    provider: context.provider,
                    model: context.model,
                    keyName: context.keyName,
                    attempt: `${context.attemptIndex}/${context.totalAttempts}`,
                });
                update('等待较久：中转站可能仍在排队', 0.32);
            }
        }, 1000);
    }

    function markSent() {
        update('请求已发送', 0.18);
    }

    function markParsing() {
        update('响应已返回，正在解析图片', 0.86);
    }

    function markSuccess(imageCount) {
        stop();
        update(`完成：解析到 ${imageCount} 张图片`, 1);
        progressTracker.updateApiTelemetry?.({
            ...context,
            statusText: `完成：${imageCount} 张图片`,
            elapsedText: formatElapsed(getElapsed()),
        });
    }

    function markFailure(error) {
        stop();
        progressTracker.updateApiTelemetry?.({
            ...context,
            statusText: `失败：${truncateText(error?.message || error, 120)}`,
            elapsedText: formatElapsed(getElapsed()),
        });
    }

    function summarizeResponse(response) {
        const text = response?.responseText || '';
        const binaryBytes = response?.response?.byteLength || response?.response?.size || 0;
        return {
            status: response?.status,
            statusText: response?.statusText || '',
            responseType: binaryBytes ? 'binary' : 'text',
            responseBytes: binaryBytes,
            responseChars: text.length,
            preview: truncateText(text.replace(/\s+/g, ' '), 360),
        };
    }

    return {
        formatElapsed,
        getElapsed,
        markFailure,
        markParsing,
        markSent,
        markSuccess,
        start,
        stop,
        summarizeResponse,
        update,
    };
}
