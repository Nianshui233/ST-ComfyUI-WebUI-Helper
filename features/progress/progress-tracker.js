import {
    armImageFallback,
    clearImageFallbackTimer,
    createExecutionPromise,
    rejectExecution,
    settleExecution,
    waitForExecutionResult,
} from './progress-execution.js';
import {
    captureComfyUIPreview,
    waitForPreviewDataUrl,
} from './progress-preview.js';
import {
    createProgressUI,
    markProgressCancelling,
    removeProgressUI,
    updateApiTelemetryUI,
    updateProgressUI,
} from './progress-ui.js';

export function createProgressTracker({
    modes,
    makeRequest,
    makeCancelledError,
    blobToDataUrl,
    logger = console,
}) {
    return {
        ws: null,
        pollTimer: null,
        container: null,
        bar: null,
        text: null,
        activePromptId: null,
        activeClientId: null,
        lastPreviewDataUrl: null,
        executedImages: [],
        executionPromise: null,
        _execResolve: null,
        _execReject: null,
        cancelled: false,
        activeUrl: null,
        activeMode: null,

        createUI(anchorElement) {
            createProgressUI(this, anchorElement);
        },

        update(progress, statusText) {
            updateProgressUI(this, progress, statusText);
        },

        updateApiTelemetry(payload) {
            updateApiTelemetryUI(this, payload);
        },

        async capturePreview(payload) {
            try {
                const preview = await captureComfyUIPreview(payload, blobToDataUrl);
                if (preview) this.lastPreviewDataUrl = preview;
            } catch (error) {
                logger.warn('[AI Gen] 捕获 ComfyUI 预览图失败:', error);
            }
        },

        async waitForPreview(timeoutMs = 1200) {
            return waitForPreviewDataUrl(() => this.lastPreviewDataUrl, timeoutMs);
        },

        clearPreview() {
            this.lastPreviewDataUrl = null;
        },

        _settleExecution(payload) {
            settleExecution(this, payload);
        },

        _rejectExecution(error) {
            rejectExecution(this, error);
        },

        _armImageFallback() {
            armImageFallback(this);
        },

        startComfyUI(url, promptId, clientId) {
            if (this.ws) {
                try { this.ws.close(); } catch {}
                this.ws = null;
            }
            this.clearPreview();
            this.activePromptId = promptId;
            this.activeClientId = clientId;
            this.activeUrl = url;
            this.activeMode = modes.COMFYUI;
            this.executedImages = [];
            this._imageFallbackTimer = null;
            createExecutionPromise(this);
            try {
                const wsUrl = `${url.replace(/^http/, 'ws')}/ws?clientId=${encodeURIComponent(clientId)}`;
                const ws = new WebSocket(wsUrl);
                this.ws = ws;
                ws.binaryType = 'arraybuffer';
                ws.onmessage = (event) => {
                    if (this.ws !== ws) return;
                    try {
                        if (typeof event.data === 'string') {
                            const msg = JSON.parse(event.data);
                            const data = msg.data || {};
                            const mine = !data.prompt_id || data.prompt_id === this.activePromptId;

                            if (msg.type === 'progress') {
                                const { value, max } = data;
                                if (max) this.update(value / max, `${value}/${max} 步`);
                                return;
                            }
                            if (!mine) return;

                            if (msg.type === 'executed' && data.output?.images?.length) {
                                this.executedImages.push(...data.output.images);
                                this._armImageFallback();
                                return;
                            }
                            if (msg.type === 'executing' && data.node === null) {
                                this._settleExecution({ completed: true });
                                return;
                            }
                            if (msg.type === 'execution_success') {
                                this._settleExecution({ completed: true });
                                return;
                            }
                            if (msg.type === 'execution_error' || msg.type === 'execution_interrupted') {
                                if (this.cancelled) {
                                    this._rejectExecution(makeCancelledError());
                                } else {
                                    this._rejectExecution(new Error(`ComfyUI 执行${msg.type === 'execution_interrupted' ? '被中断' : '出错'}`));
                                }
                                return;
                            }
                            return;
                        }

                        this.capturePreview(event.data);
                    } catch {}
                };
                ws.onerror = () => { if (this.ws === ws) { this.ws = null; this._settleExecution({ wsFailed: true }); } };
                ws.onclose = () => { if (this.ws === ws) this._settleExecution({ wsFailed: true }); };
            } catch {}
        },

        async waitForExecution(timeoutMs) {
            return waitForExecutionResult(this, timeoutMs);
        },

        async cancel() {
            if (this.cancelled) return;
            this.cancelled = true;
            markProgressCancelling(this);
            const url = this.activeUrl;
            const mode = this.activeMode;
            if (url && mode !== modes.API) {
                const endpoint = mode === modes.WEBUI
                    ? `${url}/sdapi/v1/interrupt`
                    : `${url}/interrupt`;
                try {
                    await makeRequest({ method: 'POST', url: endpoint, timeout: 5000 });
                } catch (e) {
                    logger.warn('[AI Gen] 中断请求失败:', e);
                }
            }
            this._rejectExecution(makeCancelledError());
        },

        startWebUI(url) {
            this.activeUrl = url;
            this.activeMode = modes.WEBUI;
            this.pollTimer = setInterval(async () => {
                try {
                    const resp = await makeRequest({ method: 'GET', url: `${url}/sdapi/v1/progress`, timeout: 3000 });
                    const data = JSON.parse(resp.responseText);
                    this.update(data.progress, `${Math.round(data.progress * 100)}% (ETA: ${data.eta_relative?.toFixed(0) || '?'}s)`);
                } catch {}
            }, 1500);
        },

        startApiImage(url) {
            this.activeUrl = url;
            this.activeMode = modes.API;
            this.update(0.08, 'API 生图：准备请求');
        },

        stop() {
            if (this.ws) {
                try { this.ws.close(); } catch {}
                this.ws = null;
            }
            if (this.pollTimer) {
                clearInterval(this.pollTimer);
                this.pollTimer = null;
            }
            clearImageFallbackTimer(this);
            this._execResolve = null;
            this._execReject = null;
            this.activePromptId = null;
            this.activeClientId = null;
        },

        remove() {
            this.stop();
            removeProgressUI(this);
            this.clearPreview();
            this.cancelled = false;
        },
    };
}
