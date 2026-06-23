import { createGenerateButtonController } from '../generation/generate-button-controller.js';
import { createGenerationService } from '../generation/generation-service.js';
import { createImageCacheController } from '../cache/image-cache-controller.js';
import {
    DEFAULT_SETTINGS,
    MODES,
} from '../core/runtime-config.js';
import { normalizeNumber } from '../../lib/core/utils.js';
import { createComparisonMode } from '../../ui/images/comparison-mode.js';
import { createImageRenderer } from '../../ui/images/image-renderer.js';
import { createImageTooltip } from '../../ui/images/image-tooltip.js';

export function createGenerationStack({
    imageCacheDB,
    blobUrlTracker,
    getValue,
    getStoredValues,
    setValue,
    makeRequest,
    makeRequestWithRetry,
    getCachedObjectInfo,
    getCurrentMode,
    getPanelController,
    getAiPromptController,
    getEnabledComfyUISelectedLoras,
    getImg2ImgState,
    generateEmbeddingPromptString,
    progressTracker,
    showToast,
    logger = console,
}) {
    const imageTooltip = createImageTooltip();
    const comparisonMode = createComparisonMode();

    const generationService = createGenerationService({
        validateSettings: () => getPanelController().validateSettings(),
        getStoredValues,
        getCachedObjectInfo,
        getEnabledComfyUISelectedLoras,
        getSeedForGeneration: () => getPanelController().getSeedForGeneration(),
        getImg2ImgState,
        getComfyBatchSize: () => document.getElementById('comfyui-batch-size')?.value || '1',
        getWebuiBatchSize: () => document.getElementById('webui-batch-size')?.value || '1',
        getComfyImg2ImgDenoise: () => normalizeNumber(
            document.getElementById('comfyui-img2img-denoising')?.value,
            DEFAULT_SETTINGS.img2imgDenoising,
        ),
        getWebuiImg2ImgDenoise: () => normalizeNumber(
            document.getElementById('webui-img2img-denoising')?.value,
            DEFAULT_SETTINGS.img2imgDenoising,
        ),
        generateEmbeddingPromptString,
        progressTracker,
        setValue,
        showToast,
        makeRequest,
        makeRequestWithRetry,
        logger,
    });

    async function generateWithComfyUI(promptFromChat) {
        return generationService.generateWithComfyUI(promptFromChat);
    }

    async function generateWithWebUI(promptFromChat) {
        return generationService.generateWithWebUI(promptFromChat);
    }

    const imageRenderer = createImageRenderer({
        imageCacheDB,
        blobUrlTracker,
        imageTooltip,
        getValue,
        logger,
    });
    const imageCacheController = createImageCacheController({
        imageCacheDB,
        blobUrlTracker,
        makeRequestWithRetry,
        getCurrentMode,
        showToast,
        logger,
    });

    const {
        displayImage,
        displayImageGrid,
    } = imageRenderer;
    const {
        clearAllCache,
        deleteImageFromCache,
        loadImageCache,
        saveImageToCache,
    } = imageCacheController;

    const generateButtonController = createGenerateButtonController({
        getStoredValues,
        getValue,
        getCurrentMode,
        generateWithComfyUI,
        generateWithWebUI,
        updateSeedDisplay: (seed) => getPanelController().updateSeedDisplay(seed),
        saveImageToCache,
        deleteImageFromCache,
        displayImage,
        displayImageGrid,
        comparisonMode,
        progressTracker,
        setAiPromptPanelBusy: (...args) => getAiPromptController()?.setAiPromptPanelBusy?.(...args),
        showToast,
        logger,
    });

    return {
        clearAllCache,
        comparisonMode,
        deleteImageFromCache,
        displayImage,
        displayImageGrid,
        generateButtonController,
        generateWithComfyUI,
        generateWithWebUI,
        imageCacheController,
        imageRenderer,
        imageTooltip,
        loadImageCache,
        onGenerateButtonClick: generateButtonController.onGenerateButtonClick,
        saveImageToCache,
    };
}
