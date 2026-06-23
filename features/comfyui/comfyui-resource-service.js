import { DEFAULT_SETTINGS } from '../core/runtime-config.js';
import {
    fetchAndPopulateSelect,
    findComfyOptionList,
    setDynamicSelectOptions,
} from '../resources/model-resource-utils.js';

export function createComfyUIResourceService({
    getCachedObjectInfo,
    getValue,
    showToast,
    logger = console,
}) {
    async function fetchAndPopulateModels(url, selectElement, silent = false) {
        await fetchAndPopulateSelect({
            selectElement,
            fetchItems: async () => {
                const data = await getCachedObjectInfo(url);
                const models = data?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0];
                if (!models || models.length === 0) throw new Error('未找到模型');
                return models;
            },
            getValue,
            showToast,
            logger,
            savedValueKey: 'comfyui_model',
            loadingText: '正在加载模型...',
            emptyText: '未找到模型',
            successMsg: 'ComfyUI Checkpoint 模型列表加载成功',
            silent,
        });
    }

    async function fetchAndPopulateUNetModels(url, selectElement, silent = false) {
        await fetchAndPopulateSelect({
            selectElement,
            fetchItems: async () => {
                const data = await getCachedObjectInfo(url);
                const possibleNodeTypes = ['UNETLoader', 'UnetLoader', 'DiffusionModelLoader', 'UNetLoader'];
                for (const nodeType of possibleNodeTypes) {
                    if (data[nodeType]?.input?.required?.unet_name?.[0]) {
                        return data[nodeType].input.required.unet_name[0];
                    }
                }
                return null;
            },
            getValue,
            showToast,
            logger,
            savedValueKey: 'comfyui_unet_model',
            loadingText: '正在加载 UNet 模型...',
            emptyText: '无 UNet 模型可用',
            successMsg: 'ComfyUI UNet 模型列表加载成功',
            silent,
            defaultFirst: '选择 UNet 模型...',
        });
    }

    async function fetchAndPopulateComfyUISamplingOptions(url, silent = false) {
        const samplerSelect = document.getElementById('comfyui-sampler');
        const schedulerSelect = document.getElementById('comfyui-scheduler');
        if (!samplerSelect || !schedulerSelect) return;

        try {
            const objectInfo = await getCachedObjectInfo(url);
            const samplerList = findComfyOptionList(
                objectInfo,
                ['KSampler', 'KSamplerAdvanced', 'SamplerCustom', 'KSamplerSelect'],
                ['sampler_name', 'sampler'],
            );
            const schedulerList = findComfyOptionList(
                objectInfo,
                ['KSampler', 'KSamplerAdvanced', 'SamplerCustom', 'KSamplerSelect'],
                ['scheduler'],
            );

            const savedSampler = await getValue('comfyui_sampler', DEFAULT_SETTINGS.sampler);
            const savedScheduler = await getValue('comfyui_scheduler', DEFAULT_SETTINGS.scheduler);
            const samplerUpdated = setDynamicSelectOptions(samplerSelect, samplerList, savedSampler);
            const schedulerUpdated = setDynamicSelectOptions(schedulerSelect, schedulerList, savedScheduler);

            if (!silent) {
                if (samplerUpdated || schedulerUpdated) {
                    showToast('success', 'ComfyUI 采样器 / 调度器已动态更新');
                } else {
                    showToast('warning', '未从 ComfyUI 读取到采样器 / 调度器，已保留本地选项');
                }
            }
        } catch (error) {
            logger.warn('[AI Gen] 动态加载 ComfyUI 采样参数失败:', error.message);
            if (!silent) {
                showToast('warning', `ComfyUI 采样参数动态加载失败，已保留本地选项: ${error.message}`);
            }
        }
    }

    return {
        fetchAndPopulateComfyUISamplingOptions,
        fetchAndPopulateModels,
        fetchAndPopulateUNetModels,
    };
}
