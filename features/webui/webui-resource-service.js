import { DEFAULT_SETTINGS } from '../core/runtime-config.js';
import {
    fetchAndPopulateSelect,
    parseJsonResponse,
    setDynamicSelectOptions,
} from '../resources/model-resource-utils.js';

export function createWebUIResourceService({
    getValue,
    setValue,
    makeRequest,
    makeRequestWithRetry,
    showToast,
    renderEmbeddingList,
    setAvailableLoras,
    setAvailableEmbeddings,
    logger = console,
}) {
    async function fetchAndPopulateWebUIModels(url, selectElement, silent = false) {
        selectElement.innerHTML = '<option>正在加载模型...</option>';
        selectElement.disabled = true;

        try {
            const response = await makeRequest({ method: 'GET', url: `${url}/sdapi/v1/sd-models` });
            const models = parseJsonResponse(response, [], 'WebUI 模型列表');
            if (!models || models.length === 0) throw new Error('未找到模型');

            selectElement.innerHTML = '';
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.model_name || model.title;
                option.textContent = model.model_name || model.title;
                selectElement.appendChild(option);
            });

            const savedModel = await getValue('webui_model');
            const modelValues = Array.from(selectElement.options).map(option => option.value);
            if (savedModel && modelValues.includes(savedModel)) {
                selectElement.value = savedModel;
            } else if (models.length > 0) {
                selectElement.value = models[0].model_name || models[0].title;
            }
            await setValue('webui_model', selectElement.value);

            if (!silent) showToast('success', 'WebUI 模型列表加载成功');
        } catch (error) {
            selectElement.innerHTML = '<option>加载失败</option>';
            logger.warn('[AI Gen] 加载 WebUI 模型失败:', error.message);
            if (!silent) showToast('error', `加载 WebUI 模型失败: ${error.message}`);
        } finally {
            selectElement.disabled = false;
        }
    }

    async function fetchAndPopulateWebUILoras(url, silent = false) {
        const loraSelect = document.getElementById('webui-lora-select');
        if (!loraSelect) return;

        await fetchAndPopulateSelect({
            selectElement: loraSelect,
            fetchItems: async () => {
                const response = await makeRequest({ method: 'GET', url: `${url}/sdapi/v1/loras` });
                const loras = parseJsonResponse(response, [], 'WebUI LoRA 列表');
                setAvailableLoras(loras);
                return loras;
            },
            getValue,
            showToast,
            logger,
            savedValueKey: '_webui_lora_dummy_',
            loadingText: '正在加载 LoRA...',
            emptyText: '未找到 LoRA 模型',
            successMsg: '已加载 WebUI LoRA 模型',
            silent,
            defaultFirst: '--- 请选择一个 LoRA ---',
        });
    }

    async function fetchAndPopulateWebUIEmbeddings(url, silent = false) {
        const embeddingList = document.getElementById('embedding-list');
        if (!embeddingList) return;

        embeddingList.innerHTML = '<div style="padding: 20px; text-align: center;">正在加载 Embedding...</div>';

        try {
            const response = await makeRequest({ method: 'GET', url: `${url}/sdapi/v1/embeddings` });
            const embeddings = parseJsonResponse(response, {}, 'WebUI Embedding 列表');
            const availableEmbeddings = Object.keys(embeddings.loaded || {}).map(name => ({ name }));
            setAvailableEmbeddings(availableEmbeddings);

            if (!availableEmbeddings || availableEmbeddings.length === 0) {
                embeddingList.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;">未找到 Embedding 模型</div>';
                return;
            }
            renderEmbeddingList();

            if (!silent) showToast('success', `已加载 ${availableEmbeddings.length} 个 Embedding 模型`);
        } catch (error) {
            embeddingList.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--vp-error-color);">加载失败: ${error.message}</div>`;
            logger.warn('[AI Gen] 加载 Embedding 失败:', error.message);
            if (!silent) showToast('error', `加载 Embedding 失败: ${error.message}`);
        }
    }

    async function fetchAndPopulateWebUISamplingOptions(url, silent = false) {
        const samplerSelect = document.getElementById('webui-sampler');
        const schedulerSelect = document.getElementById('webui-scheduler');
        const upscalerSelect = document.getElementById('webui-hires-upscaler');
        if (!samplerSelect || !schedulerSelect || !upscalerSelect) return;

        let updatedAny = false;

        try {
            const response = await makeRequestWithRetry({
                method: 'GET',
                url: `${url}/sdapi/v1/samplers`,
            }, 2);
            const samplerList = parseJsonResponse(response, [], 'WebUI 采样器列表');
            const savedSampler = await getValue('webui_sampler', DEFAULT_SETTINGS.webuiSampler);
            if (setDynamicSelectOptions(samplerSelect, Array.isArray(samplerList) ? samplerList : [], savedSampler)) {
                await setValue('webui_sampler', samplerSelect.value);
                updatedAny = true;
            }
        } catch (error) {
            logger.warn('[AI Gen] 动态加载 WebUI 采样器失败:', error.message);
        }

        try {
            const response = await makeRequestWithRetry({
                method: 'GET',
                url: `${url}/sdapi/v1/schedulers`,
            }, 2);
            const parsed = parseJsonResponse(response, {}, 'WebUI 调度器列表');
            const schedulerList = Array.isArray(parsed)
                ? parsed
                : (Array.isArray(parsed?.schedulers) ? parsed.schedulers : []);
            const savedScheduler = await getValue('webui_scheduler', DEFAULT_SETTINGS.webuiScheduler);
            if (setDynamicSelectOptions(schedulerSelect, schedulerList, savedScheduler)) {
                await setValue('webui_scheduler', schedulerSelect.value);
                updatedAny = true;
            }
        } catch (error) {
            logger.warn('[AI Gen] 动态加载 WebUI 调度器失败或端点不存在:', error.message);
        }

        try {
            const [upscalersResp, latentResp] = await Promise.allSettled([
                makeRequestWithRetry({ method: 'GET', url: `${url}/sdapi/v1/upscalers` }, 2),
                makeRequestWithRetry({ method: 'GET', url: `${url}/sdapi/v1/latent-upscale-modes` }, 2),
            ]);

            const upscalerList = [];
            if (upscalersResp.status === 'fulfilled') {
                const parsed = parseJsonResponse(upscalersResp.value, [], 'WebUI 高清修复算法列表');
                if (Array.isArray(parsed)) upscalerList.push(...parsed);
            }
            if (latentResp.status === 'fulfilled') {
                const parsed = parseJsonResponse(latentResp.value, [], 'WebUI latent upscale 列表');
                if (Array.isArray(parsed)) upscalerList.push(...parsed);
            }

            const savedUpscaler = await getValue('webui_hires_upscaler', DEFAULT_SETTINGS.hiresUpscaler);
            if (setDynamicSelectOptions(upscalerSelect, upscalerList, savedUpscaler)) {
                await setValue('webui_hires_upscaler', upscalerSelect.value);
                updatedAny = true;
            }
        } catch (error) {
            logger.warn('[AI Gen] 动态加载 WebUI 高清修复算法失败:', error.message);
        }

        if (!silent) {
            if (updatedAny) {
                showToast('success', 'WebUI 采样参数已动态更新');
            } else {
                showToast('warning', '未读取到 WebUI 动态采样参数，已保留本地选项');
            }
        }
    }

    return {
        fetchAndPopulateWebUIEmbeddings,
        fetchAndPopulateWebUILoras,
        fetchAndPopulateWebUIModels,
        fetchAndPopulateWebUISamplingOptions,
    };
}
