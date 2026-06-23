import { createComfyUIResourceService } from '../comfyui/comfyui-resource-service.js';
import { createWebUIResourceService } from '../webui/webui-resource-service.js';

export function createModelResourceService({
    getCachedObjectInfo,
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
    const comfyUIResources = createComfyUIResourceService({
        getCachedObjectInfo,
        getValue,
        setValue,
        showToast,
        logger,
    });

    const webUIResources = createWebUIResourceService({
        getValue,
        setValue,
        makeRequest,
        makeRequestWithRetry,
        showToast,
        renderEmbeddingList,
        setAvailableLoras,
        setAvailableEmbeddings,
        logger,
    });

    return {
        fetchAndPopulateModels: comfyUIResources.fetchAndPopulateModels,
        fetchAndPopulateUNetModels: comfyUIResources.fetchAndPopulateUNetModels,
        fetchAndPopulateWebUIModels: webUIResources.fetchAndPopulateWebUIModels,
        fetchAndPopulateWebUILoras: webUIResources.fetchAndPopulateWebUILoras,
        fetchAndPopulateWebUIEmbeddings: webUIResources.fetchAndPopulateWebUIEmbeddings,
        fetchAndPopulateComfyUISamplingOptions: comfyUIResources.fetchAndPopulateComfyUISamplingOptions,
        fetchAndPopulateWebUISamplingOptions: webUIResources.fetchAndPopulateWebUISamplingOptions,
    };
}
