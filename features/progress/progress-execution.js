export function createExecutionPromise(tracker) {
    tracker.executionPromise = new Promise((resolve, reject) => {
        tracker._execResolve = resolve;
        tracker._execReject = reject;
    });
    tracker.executionPromise.catch(() => {});
}

export function clearImageFallbackTimer(tracker) {
    if (tracker._imageFallbackTimer) {
        clearTimeout(tracker._imageFallbackTimer);
        tracker._imageFallbackTimer = null;
    }
}

export function settleExecution(tracker, payload) {
    clearImageFallbackTimer(tracker);
    if (tracker._execResolve) {
        const resolve = tracker._execResolve;
        tracker._execResolve = null;
        tracker._execReject = null;
        resolve(payload);
    }
}

export function rejectExecution(tracker, error) {
    clearImageFallbackTimer(tracker);
    if (tracker._execReject) {
        const reject = tracker._execReject;
        tracker._execResolve = null;
        tracker._execReject = null;
        reject(error);
    }
}

export function armImageFallback(tracker) {
    if (tracker._imageFallbackTimer) return;
    tracker._imageFallbackTimer = setTimeout(() => {
        tracker._imageFallbackTimer = null;
        if (tracker.executedImages.length) settleExecution(tracker, { completed: true });
    }, 3000);
}

export async function waitForExecutionResult(tracker, timeoutMs) {
    if (!tracker.ws || !tracker.executionPromise) return null;
    let timer = null;
    const timeout = new Promise(resolve => {
        timer = setTimeout(() => resolve('__WS_TIMEOUT__'), timeoutMs);
    });
    try {
        const result = await Promise.race([tracker.executionPromise, timeout]);
        if (result === '__WS_TIMEOUT__' || result?.wsFailed) return null;
        return { images: tracker.executedImages.slice(), completed: true };
    } finally {
        if (timer) clearTimeout(timer);
    }
}
