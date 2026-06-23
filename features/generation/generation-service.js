import {
    DEFAULT_SETTINGS,
    MODES,
    STORAGE_KEY_LAST_COMFYUI_WORKFLOW,
    STORAGE_KEY_LAST_LORA_REPORT,
} from '../core/runtime-config.js';
import {
    clampBatchSize,
    createWebUIGenerationService,
} from '../webui/webui-generation-service.js';
import { validateComfyWorkflow } from '../workflow/workflow-validation.js';
import {
    getComfyUILoraTriggerPrompt,
    intelligentLoraInjection,
} from '../comfyui/lora/comfyui-lora.js';
import {
    getArrayLength,
    replacePlaceholdersInWorkflow,
    submitComfyUIPrompt,
    uploadImageToComfyUI,
    waitForComfyUIImage,
} from '../comfyui/comfyui-generation-helpers.js';
import {
    createClientId,
    safeJsonParse,
} from '../../lib/core/utils.js';
import {
    logFinalPrompts,
    smartMergePrompts,
} from '../../lib/prompt/sd-prompt.js';

export function createGenerationService({
    validateSettings,
    getStoredValues,
    getCachedObjectInfo,
    getEnabledComfyUISelectedLoras,
    getSeedForGeneration,
    getImg2ImgState,
    getComfyBatchSize,
    getWebuiBatchSize,
    getComfyImg2ImgDenoise,
    getWebuiImg2ImgDenoise,
    generateEmbeddingPromptString,
    progressTracker,
    setValue,
    showToast,
    makeRequest,
    makeRequestWithRetry,
    logger = console,
}) {
    const webuiGenerationService = createWebUIGenerationService({
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
        logger,
    });

    async function generateWithComfyUI(promptFromChat) {
        if (!validateSettings()) {
            throw new Error('设置校验失败，请检查输入');
        }

        const comfySettings = await getStoredValues([
            ['comfyui_url', ''],
            ['comfyui_workflow', ''],
            ['comfyui_positive_prompt', ''],
            ['comfyui_negative_prompt', ''],
            ['comfyui_model', ''],
            ['comfyui_unet_model', ''],
            ['comfyui_steps', DEFAULT_SETTINGS.steps],
            ['comfyui_cfg', DEFAULT_SETTINGS.cfg],
            ['comfyui_sampler', DEFAULT_SETTINGS.sampler],
            ['comfyui_scheduler', DEFAULT_SETTINGS.scheduler],
            ['comfyui_gen_width', DEFAULT_SETTINGS.genWidth],
            ['comfyui_gen_height', DEFAULT_SETTINGS.genHeight],
            ['comfyui_lora_auto_append_triggers', DEFAULT_SETTINGS.loraAutoAppendTriggers],
            ['comfyui_lora_strict_injection', DEFAULT_SETTINGS.loraStrictInjection],
            ['comfyui_lora_save_debug_workflow', DEFAULT_SETTINGS.loraSaveDebugWorkflow],
            ['comfyui_lora_injection_mode', DEFAULT_SETTINGS.loraInjectionMode],
        ]);
        const url = comfySettings.comfyui_url.trim();
        const workflowString = comfySettings.comfyui_workflow;
        if (!url || !workflowString) throw new Error('ComfyUI URL 或工作流未配置');

        const workflowValidation = validateComfyWorkflow(workflowString);
        if (!workflowValidation.ok) {
            throw new Error(`工作流校验失败：${workflowValidation.errors.join('；')}`);
        }

        let objectInfo;
        try {
            objectInfo = await getCachedObjectInfo(url);
        } catch (error) {
            throw new Error(`无法从 ComfyUI 获取节点元数据：${error.message}`);
        }

        const enabledLoras = getEnabledComfyUISelectedLoras();
        const loraTriggerPrompt = comfySettings.comfyui_lora_auto_append_triggers
            ? getComfyUILoraTriggerPrompt(enabledLoras)
            : '';

        const finalPositivePrompt = smartMergePrompts(
            comfySettings.comfyui_positive_prompt,
            loraTriggerPrompt,
            promptFromChat,
        );
        const finalNegativePrompt = smartMergePrompts(comfySettings.comfyui_negative_prompt);

        if (loraTriggerPrompt) {
            logger.log('[AI Gen] 已追加 LoRA 触发词:', loraTriggerPrompt);
        }
        logFinalPrompts(finalPositivePrompt, finalNegativePrompt, 'ComfyUI');

        const params = {
            model: comfySettings.comfyui_model,
            unet_model: comfySettings.comfyui_unet_model || '',
            positive_prompt: finalPositivePrompt,
            negative_prompt: finalNegativePrompt,
            seed: getSeedForGeneration(),
            steps: comfySettings.comfyui_steps,
            cfg: comfySettings.comfyui_cfg,
            sampler: comfySettings.comfyui_sampler,
            scheduler: comfySettings.comfyui_scheduler,
            width: comfySettings.comfyui_gen_width,
            height: comfySettings.comfyui_gen_height,
            denoise: getComfyImg2ImgDenoise(),
        };
        const img2imgState = getImg2ImgState(MODES.COMFYUI);
        if (!params.model) throw new Error('ComfyUI Checkpoint 模型未选择');
        if (img2imgState.enabled && !img2imgState.imageData) {
            throw new Error('已启用 ComfyUI 图生图，但还没有上传参考图片');
        }

        if (img2imgState.enabled && img2imgState.imageData) {
            const uploadResult = await uploadImageToComfyUI(url, img2imgState.imageData, img2imgState.fileName, makeRequest);
            params.init_image = uploadResult.name;
        }

        const batchSize = clampBatchSize(getComfyBatchSize());
        const results = [];
        const workflowTemplate = safeJsonParse(workflowString, null, 'ComfyUI workflow');
        if (!workflowTemplate || typeof workflowTemplate !== 'object') {
            throw new Error('ComfyUI 工作流 JSON 无效');
        }

        for (let i = 0; i < batchSize; i++) {
            const batchParams = { ...params };
            if (i > 0) batchParams.seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
            const clientId = createClientId();

            progressTracker.startComfyUI(url, null, clientId);

            const workflow = JSON.parse(JSON.stringify(workflowTemplate));
            replacePlaceholdersInWorkflow(workflow, batchParams);

            const loraReport = intelligentLoraInjection(workflow, enabledLoras, objectInfo, {
                injectionMode: comfySettings.comfyui_lora_injection_mode,
            });
            await setValue(STORAGE_KEY_LAST_LORA_REPORT, loraReport);
            if (!loraReport.ok) {
                const message = `智能 LoRA 注入失败：${(loraReport.errors || []).join('；')}`;
                if (comfySettings.comfyui_lora_strict_injection) throw new Error(message);
                showToast('warning', `${message}；已按非严格模式继续`);
            } else if (enabledLoras.length > 0) {
                const summary = `${loraReport.strategy} / ${loraReport.effectiveInjectionMode || loraReport.injectionMode} / ${getArrayLength(loraReport.insertedNodeIds)} 节点 / ${getArrayLength(loraReport.samplerTargets)} 采样器`;
                logger.log(`[AI Gen] LoRA 注入自检通过: ${summary}`, loraReport);
                if (getArrayLength(loraReport.warnings) > 0) {
                    showToast('warning', `LoRA 注入完成，但有提示：${loraReport.warnings.join('；')}`);
                }
            }

            if (comfySettings.comfyui_lora_save_debug_workflow) {
                await setValue(STORAGE_KEY_LAST_COMFYUI_WORKFLOW, {
                    savedAt: new Date().toISOString(),
                    workflow,
                    params: batchParams,
                    loraReport,
                    loraTriggerPrompt,
                });
            }

            const promptId = await submitComfyUIPrompt({
                url,
                workflow,
                clientId,
                makeRequestWithRetry,
            });
            progressTracker.activePromptId = promptId;

            const imageUrl = await waitForComfyUIImage({
                url,
                promptId,
                progressTracker,
                makeRequest,
                logger,
            });
            results.push({ imageUrl, seed: batchParams.seed });
        }

        return { images: results };
    }

    async function generateWithWebUI(promptFromChat) {
        return webuiGenerationService.generateWithWebUI(promptFromChat);
    }

    return {
        generateWithComfyUI,
        generateWithWebUI,
    };
}
