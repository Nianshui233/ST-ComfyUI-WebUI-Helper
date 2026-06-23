import {
    DEFAULT_SETTINGS,
    MODES,
} from '../core/runtime-config.js';
import {
    makeCancelledError,
    safeJsonParse,
} from '../../lib/core/utils.js';
import {
    logFinalPrompts,
    smartMergePrompts,
} from '../../lib/prompt/sd-prompt.js';

export function clampBatchSize(value) {
    return Math.min(4, Math.max(1, Number.parseInt(value, 10) || 1));
}

export function createWebUIGenerationService({
    validateSettings,
    getStoredValues,
    getSeedForGeneration,
    getImg2ImgState,
    getWebuiBatchSize,
    getWebuiImg2ImgDenoise,
    generateEmbeddingPromptString,
    progressTracker,
    showToast,
    makeRequest,
    makeRequestWithRetry,
    logger = console,
}) {
    async function switchWebUIModelIfNeeded(url, selectedModel) {
        try {
            const opts = safeJsonParse((await makeRequest({ method: 'GET', url: `${url}/sdapi/v1/options` })).responseText, {}, 'WebUI /options');
            if (opts.sd_model_checkpoint !== selectedModel) {
                showToast('info', `正在切换 WebUI 模型到 ${selectedModel}`);
                await makeRequest({
                    method: 'POST',
                    url: `${url}/sdapi/v1/options`,
                    headers: { 'Content-Type': 'application/json' },
                    data: JSON.stringify({ sd_model_checkpoint: selectedModel }),
                });
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (error) {
            logger.warn('模型切换检查失败，将使用当前模型。', error);
        }
    }

    async function generateWithWebUI(promptFromChat) {
        if (!validateSettings()) {
            throw new Error('设置校验失败，请检查输入');
        }

        const webuiSettings = await getStoredValues([
            ['webui_url', ''],
            ['webui_model', ''],
            ['comfyui_positive_prompt', ''],
            ['comfyui_negative_prompt', ''],
            ['webui_steps', DEFAULT_SETTINGS.steps],
            ['webui_cfg', DEFAULT_SETTINGS.cfg],
            ['comfyui_gen_width', DEFAULT_SETTINGS.genWidth],
            ['comfyui_gen_height', DEFAULT_SETTINGS.genHeight],
            ['webui_sampler', DEFAULT_SETTINGS.webuiSampler],
            ['webui_scheduler', DEFAULT_SETTINGS.webuiScheduler],
            ['webui_enable_hires', false],
            ['webui_hires_upscaler', DEFAULT_SETTINGS.hiresUpscaler],
            ['webui_hires_steps', DEFAULT_SETTINGS.hiresSteps],
            ['webui_hires_upscale', DEFAULT_SETTINGS.hiresUpscale],
            ['webui_hires_denoising', DEFAULT_SETTINGS.hiresDenoising],
        ]);
        const url = webuiSettings.webui_url.trim();
        if (!url) throw new Error('WebUI URL 未配置');

        const selectedModel = webuiSettings.webui_model;
        if (!selectedModel) throw new Error('WebUI 模型未选择');

        await switchWebUIModelIfNeeded(url, selectedModel);

        const finalPositivePrompt = smartMergePrompts(
            webuiSettings.comfyui_positive_prompt,
            generateEmbeddingPromptString(true),
            promptFromChat,
        );
        const finalNegativePrompt = smartMergePrompts(
            webuiSettings.comfyui_negative_prompt,
            generateEmbeddingPromptString(false),
        );

        logFinalPrompts(finalPositivePrompt, finalNegativePrompt, 'WebUI');

        const params = {
            prompt: finalPositivePrompt,
            negative_prompt: finalNegativePrompt,
            steps: webuiSettings.webui_steps,
            cfg_scale: webuiSettings.webui_cfg,
            width: webuiSettings.comfyui_gen_width,
            height: webuiSettings.comfyui_gen_height,
            sampler_name: webuiSettings.webui_sampler,
            scheduler: webuiSettings.webui_scheduler,
            seed: getSeedForGeneration(),
            n_iter: clampBatchSize(getWebuiBatchSize()),
            batch_size: 1,
            enable_hr: webuiSettings.webui_enable_hires,
        };
        const webuiImg2ImgState = getImg2ImgState(MODES.WEBUI);
        if (params.enable_hr) {
            Object.assign(params, {
                hr_upscaler: webuiSettings.webui_hires_upscaler,
                hr_second_pass_steps: webuiSettings.webui_hires_steps,
                hr_scale: webuiSettings.webui_hires_upscale,
                denoising_strength: webuiSettings.webui_hires_denoising,
            });
        }

        let apiEndpoint = `${url}/sdapi/v1/txt2img`;
        if (webuiImg2ImgState.enabled && webuiImg2ImgState.imageData) {
            apiEndpoint = `${url}/sdapi/v1/img2img`;
            params.init_images = [webuiImg2ImgState.imageData.split(',')[1]];
            params.denoising_strength = getWebuiImg2ImgDenoise();
        } else if (webuiImg2ImgState.enabled) {
            throw new Error('已启用 WebUI 图生图，但还没有上传参考图片');
        }

        showToast('info', 'WebUI 正在生成图片...');
        progressTracker.startWebUI(url);

        const response = await makeRequestWithRetry({
            method: 'POST',
            url: apiEndpoint,
            headers: { 'Content-Type': 'application/json' },
            data: JSON.stringify(params),
        }, 2);
        if (progressTracker.cancelled) throw makeCancelledError();

        const result = safeJsonParse(response.responseText, null, 'WebUI generation');
        if (!result || typeof result !== 'object') {
            throw new Error('WebUI 返回了无效生成结果');
        }
        const images = result.images;
        if (!images || images.length === 0) throw new Error('WebUI 未返回图片');

        let baseSeed = params.seed;
        try {
            const info = typeof result.info === 'string' ? JSON.parse(result.info) : result.info;
            if (info?.seed != null) baseSeed = info.seed;
        } catch {
            // Keep request seed as fallback.
        }

        return {
            images: images.map((img, index) => ({
                imageUrl: `data:image/png;base64,${img}`,
                seed: baseSeed + index,
            })),
        };
    }

    return {
        generateWithWebUI,
    };
}
