import {
    DEFAULT_SETTINGS,
} from '../core/runtime-config.js';
import {
    buildApiImageRequest,
    normalizeApiImageSettings,
    parseApiImageResponsePayload,
} from './api-image-providers.js';
import {
    applyApiImageKeyCandidate,
    buildApiImageKeyCandidates,
} from './api-image-key-rotation.js';
import { createApiImageTelemetry } from './api-image-telemetry.js';

const API_IMAGE_SETTINGS_TO_LOAD = [
    ['comfyui_api_image_provider', DEFAULT_SETTINGS.apiImageProvider],
    ['comfyui_api_image_url', DEFAULT_SETTINGS.apiImageUrl],
    ['comfyui_api_image_endpoint', DEFAULT_SETTINGS.apiImageEndpoint],
    ['comfyui_api_image_api_key', DEFAULT_SETTINGS.apiImageApiKey],
    ['comfyui_api_image_model', DEFAULT_SETTINGS.apiImageModel],
    ['comfyui_api_image_quality', DEFAULT_SETTINGS.apiImageQuality],
    ['comfyui_api_image_output_format', DEFAULT_SETTINGS.apiImageOutputFormat],
    ['comfyui_api_image_size_mode', DEFAULT_SETTINGS.apiImageSizeMode],
    ['comfyui_api_image_batch_size', DEFAULT_SETTINGS.apiImageBatchSize],
    ['comfyui_api_image_timeout', DEFAULT_SETTINGS.apiImageTimeout],
    ['comfyui_api_image_soft_timeout_ms', DEFAULT_SETTINGS.apiImageSoftTimeoutMs],
    ['comfyui_api_image_use_saved_keys', DEFAULT_SETTINGS.apiImageUseSavedKeys],
    ['comfyui_api_image_retry_on_failure', DEFAULT_SETTINGS.apiImageRetryOnFailure],
    ['comfyui_api_image_max_key_attempts', DEFAULT_SETTINGS.apiImageMaxKeyAttempts],
    ['comfyui_api_image_negative_prompt', DEFAULT_SETTINGS.apiImageNegativePrompt],
    ['comfyui_api_image_custom_headers', DEFAULT_SETTINGS.apiImageCustomHeaders],
    ['comfyui_api_image_custom_body', DEFAULT_SETTINGS.apiImageCustomBody],
    ['comfyui_api_image_response_path', DEFAULT_SETTINGS.apiImageResponsePath],
    ['comfyui_gen_width', DEFAULT_SETTINGS.genWidth],
    ['comfyui_gen_height', DEFAULT_SETTINGS.genHeight],
];

export function createApiImageGenerationService({
    validateSettings,
    getValue,
    getStoredValues,
    getSeedForGeneration,
    progressTracker,
    makeRequestWithRetry,
    showToast,
    logger = console,
}) {
    const telemetry = createApiImageTelemetry({ progressTracker, logger });

    async function loadApiImageSettings() {
        const rawSettings = await getStoredValues(API_IMAGE_SETTINGS_TO_LOAD);
        return {
            settings: normalizeApiImageSettings(rawSettings),
            width: rawSettings.comfyui_gen_width,
            height: rawSettings.comfyui_gen_height,
        };
    }

    async function generateWithApiImage(promptFromChat) {
        if (!validateSettings()) {
            throw new Error('设置校验失败，请检查输入');
        }
        const prompt = String(promptFromChat || '').trim();
        if (!prompt) {
            throw new Error('API 生图没有可用绘画提示词');
        }

        const { settings, width, height } = await loadApiImageSettings();
        const candidates = await buildApiImageKeyCandidates({ getValue, settings });
        const totalAttempts = settings.retryOnFailure ? candidates.length : Math.min(1, candidates.length);
        let lastError = null;
        let imageUrls = [];
        let finalSettings = settings;
        let finalRequest = null;
        let finalAttempt = 0;

        for (let index = 0; index < totalAttempts; index++) {
            const candidate = candidates[index];
            const attemptSettings = applyApiImageKeyCandidate(settings, candidate);
            const request = buildApiImageRequest(attemptSettings, prompt, { width, height });
            finalRequest = request;
            finalSettings = attemptSettings;
            finalAttempt = index + 1;

            telemetry.start({
                attemptIndex: index + 1,
                totalAttempts,
                keyName: attemptSettings.activeKeyName,
                model: attemptSettings.model,
                provider: attemptSettings.provider,
                promptLength: prompt.length,
                size: request.requestSummary.size,
                softTimeoutMs: attemptSettings.softTimeoutMs,
                url: request.url,
            });
            logger.log('[AI Gen] API 生图请求摘要', {
                ...request.requestSummary,
                attempt: `${index + 1}/${totalAttempts}`,
                keyName: attemptSettings.activeKeyName,
                keySource: attemptSettings.activeKeySource,
            });
            showToast('info', `API 生图请求已发送：${attemptSettings.provider} (${index + 1}/${totalAttempts})`);
            telemetry.markSent();

            try {
                const response = await makeRequestWithRetry({
                    method: request.method,
                    url: request.url,
                    headers: request.headers,
                    data: request.data,
                    responseType: request.responseType,
                    timeout: request.timeout,
                }, 1);
                if (progressTracker.cancelled) {
                    const error = new Error('生成已取消');
                    error.cancelled = true;
                    throw error;
                }
                telemetry.markParsing();
                logger.log('[AI Gen] API 生图响应摘要', telemetry.summarizeResponse(response));

                imageUrls = await parseApiImageResponsePayload(response, attemptSettings);
                telemetry.markSuccess(imageUrls.length);
                break;
            } catch (error) {
                telemetry.markFailure(error);
                lastError = error;
                logger.error('[AI Gen] API 生图尝试失败', {
                    attempt: `${index + 1}/${totalAttempts}`,
                    keyName: attemptSettings.activeKeyName,
                    provider: attemptSettings.provider,
                    model: attemptSettings.model,
                    error,
                });
                if (error?.cancelled || index >= totalAttempts - 1) throw error;
                showToast('warning', `API 生图失败，切换下一个 Key 重试 (${index + 2}/${totalAttempts})`);
            }
        }

        if (imageUrls.length === 0) {
            throw lastError || new Error('API 生图没有返回可用图片');
        }

        const seed = getSeedForGeneration?.() ?? Date.now();
        return {
            images: imageUrls.map((imageUrl, index) => ({
                imageUrl,
                seed: seed + index,
            })),
            metadata: {
                provider: finalSettings.provider,
                model: finalSettings.model,
                quality: finalSettings.quality,
                outputFormat: finalSettings.outputFormat,
                size: finalRequest?.requestSummary?.size,
                keyName: finalSettings.activeKeyName,
                attempts: finalAttempt,
                generationApi: 'api-image',
            },
        };
    }

    async function testApiImageGeneration() {
        const result = await generateWithApiImage('A simple centered test image of a small glass sphere on a clean neutral background.');
        return result.images?.[0]?.imageUrl || '';
    }

    return {
        generateWithApiImage,
        testApiImageGeneration,
    };
}
