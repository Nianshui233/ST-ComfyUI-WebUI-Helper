import {
    POLLING_TIMEOUT_MS,
} from '../core/runtime-config.js';
import {
    findImageUrlInHistory,
    pickImageUrlFromList,
    summarizeHistoryEntry,
} from './comfyui-results.js';
import {
    makeCancelledError,
    safeJsonParse,
} from '../../lib/core/utils.js';

export function getArrayLength(value) {
    return Array.isArray(value) ? value.length : 0;
}

export async function uploadImageToComfyUI(url, imageDataUrl, filename, makeRequest) {
    const resp = await fetch(imageDataUrl);
    const blob = await resp.blob();
    const formData = new FormData();
    formData.append('image', blob, filename || 'input.png');

    const result = await makeRequest({
        method: 'POST',
        url: `${url}/upload/image`,
        data: formData,
    });
    const parsed = safeJsonParse(result.responseText, null, 'upload/image');
    if (!parsed || typeof parsed !== 'object') {
        throw new Error('ComfyUI 上传图片返回了无效数据');
    }
    return parsed;
}

export function replacePlaceholdersInWorkflow(obj, params) {
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            replacePlaceholdersInWorkflow(obj[key], params);
        } else if (typeof obj[key] === 'string') {
            obj[key] = obj[key]
                .replace(/%model%/g, params.model || '')
                .replace(/%unet_model%/g, params.unet_model || '')
                .replace(/%prompt%/g, params.positive_prompt || '')
                .replace(/%positive_prompt%/g, params.positive_prompt || '')
                .replace(/%negative_prompt%/g, params.negative_prompt || '')
                .replace(/%seed%/g, String(params.seed))
                .replace(/%steps%/g, String(params.steps))
                .replace(/%cfg%/g, String(params.cfg))
                .replace(/%sampler%/g, params.sampler || '')
                .replace(/%scheduler%/g, params.scheduler || '')
                .replace(/%width%/g, String(params.width))
                .replace(/%height%/g, String(params.height))
                .replace(/%init_image%/g, params.init_image || '')
                .replace(/%denoise%/g, String(params.denoise ?? ''))
                .replace(/%denoising_strength%/g, String(params.denoise ?? ''));
        }
    }
}

export async function submitComfyUIPrompt({
    url,
    workflow,
    clientId,
    makeRequestWithRetry,
}) {
    const promptResponse = await makeRequestWithRetry({
        method: 'POST',
        url: `${url}/prompt`,
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ prompt: workflow, client_id: clientId }),
    }, 2);
    const promptResult = safeJsonParse(promptResponse.responseText, null, 'ComfyUI /prompt');
    const promptId = promptResult?.prompt_id;
    if (!promptId) throw new Error('ComfyUI 未返回 prompt ID');
    return promptId;
}

export async function waitForComfyUIImage({
    url,
    promptId,
    progressTracker,
    makeRequest,
    logger,
}) {
    let imageUrl = null;
    let finalHistory = null;
    const wsResult = await progressTracker.waitForExecution(POLLING_TIMEOUT_MS);
    if (wsResult?.images?.length) {
        imageUrl = pickImageUrlFromList(wsResult.images, url);
    }

    if (!imageUrl) {
        finalHistory = await pollForResult({
            url,
            promptId,
            progressTracker,
            makeRequest,
            logger,
        });
        imageUrl = findImageUrlInHistory(finalHistory, promptId, url);
    }

    if (!imageUrl) {
        imageUrl = await progressTracker.waitForPreview();
        if (imageUrl) {
            logger.warn('[AI Gen] /history 未返回图片，已回退到 WebSocket 预览图:', summarizeHistoryEntry(finalHistory, promptId));
        }
    }

    if (!imageUrl) {
        logger.warn('[AI Gen] ComfyUI history 摘要:', summarizeHistoryEntry(finalHistory, promptId));
        throw new Error('ComfyUI 已完成，但未返回可显示图片；/history 与预览流都没有拿到结果');
    }

    return imageUrl;
}

function pollForResult({
    url,
    promptId,
    progressTracker,
    makeRequest,
    logger,
}) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        let interval = 1000;
        const maxInterval = 5000;
        let pollCount = 0;
        let historySeenAt = 0;
        const imageGracePeriodMs = 3000;

        const poll = async () => {
            if (progressTracker.cancelled) {
                reject(makeCancelledError());
                return;
            }
            if (Date.now() - startTime > POLLING_TIMEOUT_MS) {
                reject(new Error('生成超时（可能是复杂工作流，请稍后在 ComfyUI 中查看）'));
                return;
            }

            try {
                const response = await makeRequest({
                    method: 'GET',
                    url: `${url}/history/${promptId}`,
                });
                const history = safeJsonParse(response.responseText, null, `ComfyUI /history/${promptId}`);
                if (!history || typeof history !== 'object') {
                    throw new Error('ComfyUI /history 返回了无效数据');
                }

                if (history[promptId]) {
                    historySeenAt = historySeenAt || Date.now();

                    const imageUrl = findImageUrlInHistory(history, promptId, url, { silent: true });
                    if (imageUrl) {
                        logger.log(`[AI Gen] 轮询成功 (${pollCount} 次，耗时 ${((Date.now() - startTime) / 1000).toFixed(1)}s)`);
                        resolve(history);
                        return;
                    }

                    const completed = history[promptId]?.status?.completed === true ||
                        history[promptId]?.completed === true ||
                        history[promptId]?.status_str === 'success';

                    if (completed && Date.now() - historySeenAt >= imageGracePeriodMs) {
                        resolve(history);
                        return;
                    }
                }

                pollCount++;
                interval = Math.min(interval * 1.15, maxInterval);
                setTimeout(poll, interval);
            } catch (error) {
                logger.error('[AI Gen] 轮询出错:', error);
                reject(error);
            }
        };

        poll();
    });
}
