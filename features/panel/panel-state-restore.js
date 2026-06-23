import {
    MODES,
    STORAGE_KEY_PANEL_ACTIVE_TAB,
} from '../core/runtime-config.js';

const TABS_BY_MODE = {
    [MODES.COMFYUI]: ['general', 'generation', 'img2img', 'prompts', 'ai-prompt', 'workflows', 'comfy-loras', 'cache', 'logs'],
    [MODES.WEBUI]: ['general', 'generation', 'img2img', 'prompts', 'ai-prompt', 'loras', 'cache', 'logs'],
    [MODES.API]: ['api-image', 'ai-prompt', 'prompts', 'cache', 'logs'],
};

export function isPanelTabVisibleForMode(tabId, mode) {
    return TABS_BY_MODE[mode]?.includes(tabId) || false;
}

export function getFallbackPanelTab(mode) {
    return mode === MODES.API ? 'api-image' : 'general';
}

export function selectPanelTab(tabId) {
    const button = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
    if (!button || button.style.display === 'none') return false;
    button.click();
    return true;
}

export function createPanelStateRestoreController({
    getValue,
    setValue,
    getCurrentMode,
    inputs,
    connectionMonitor,
    fetchAndPopulateModels,
    fetchAndPopulateUNetModels,
    fetchAndPopulateWebUIModels,
    fetchAndPopulateWebUILoras,
    fetchAndPopulateWebUIEmbeddings,
    fetchAndPopulateComfyUISamplingOptions,
    fetchAndPopulateWebUISamplingOptions,
    fetchAndPopulateComfyUILoras,
    logger = console,
}) {
    let restoredResources = false;

    async function saveActiveTab(tabId) {
        if (!tabId) return;
        await setValue(STORAGE_KEY_PANEL_ACTIVE_TAB, tabId);
    }

    async function restoreActiveTab() {
        const mode = getCurrentMode();
        const savedTab = await getValue(STORAGE_KEY_PANEL_ACTIVE_TAB, getFallbackPanelTab(mode));
        const tabId = isPanelTabVisibleForMode(savedTab, mode) ? savedTab : getFallbackPanelTab(mode);
        if (!selectPanelTab(tabId)) selectPanelTab(getFallbackPanelTab(mode));
    }

    async function restoreComfyUIResources() {
        const url = String(inputs.url?.value || '').trim();
        if (!url) return;
        await Promise.allSettled([
            fetchAndPopulateModels(url, inputs.modelSelect, true),
            fetchAndPopulateUNetModels(url, inputs.unetSelect, true),
            fetchAndPopulateComfyUILoras(url, true),
            fetchAndPopulateComfyUISamplingOptions(url, true),
        ]);
    }

    async function restoreWebUIResources() {
        const url = String(inputs.webuiUrl?.value || '').trim();
        if (!url) return;
        await Promise.allSettled([
            fetchAndPopulateWebUIModels(url, inputs.webuiModelSelect, true),
            fetchAndPopulateWebUILoras(url, true),
            fetchAndPopulateWebUIEmbeddings(url, true),
            fetchAndPopulateWebUISamplingOptions(url, true),
        ]);
    }

    async function restoreResources() {
        if (restoredResources) return;
        restoredResources = true;
        const mode = getCurrentMode();

        try {
            if (mode === MODES.COMFYUI) {
                await restoreComfyUIResources();
            } else if (mode === MODES.WEBUI) {
                await restoreWebUIResources();
            }
            await connectionMonitor?.check?.();
        } catch (error) {
            logger.warn('[AI Gen] panel resource restore failed:', error);
        }
    }

    async function restoreOnOpen() {
        await restoreActiveTab();
        restoreResources();
    }

    function resetResourceRestore() {
        restoredResources = false;
    }

    return {
        resetResourceRestore,
        restoreActiveTab,
        restoreOnOpen,
        restoreResources,
        saveActiveTab,
    };
}
