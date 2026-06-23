import {
    getComfyUILoraFolder,
    getComfyUILoraLoaders,
} from './comfyui-lora.js';
import { createComfyUILoraActions } from './comfyui-lora-actions.js';
import { createComfyUILoraListRenderer } from './comfyui-lora-list-renderer.js';
import { createComfyUILoraSelectionStore } from './comfyui-lora-selection-store.js';
import { createComfyUISelectedLoraRenderer } from './comfyui-selected-lora-renderer.js';

export function createComfyUILoraController({
    getValue,
    setValue,
    getCachedObjectInfo,
    copyTextToClipboard,
    showToast,
    logger = console,
}) {
    let availableComfyUILoras = [];
    let loraListRenderer;
    let selectedLoraRenderer;
    let loraActions;

    const { manager, syncSelectionStorage } = createComfyUILoraSelectionStore({
        getValue,
        setValue,
        logger,
    });

    function getCurrentSelectedLoras() {
        return manager.getAll();
    }

    function getEnabledSelectedLoras() {
        return getCurrentSelectedLoras().filter(lora => lora.enabled !== false);
    }

    function setSelectedLoras(items) {
        manager.setAll(items);
    }

    function addSelectedLora(name, modelWeight, clipWeight = modelWeight) {
        manager.add(name, modelWeight, clipWeight);
    }

    function removeSelectedLora(name) {
        manager.remove(name);
    }

    function updateSelectedLoraWeight(name, modelWeight, clipWeight = modelWeight) {
        manager.updateWeight(name, modelWeight, clipWeight);
    }

    function setSelectedLoraEnabled(name, enabled) {
        manager.setEnabled(name, enabled);
    }

    function updateSelectedLoraTriggers(name, triggerWords, autoAppendTriggers) {
        manager.updateTriggers(name, triggerWords, autoAppendTriggers);
    }

    function getAvailableLoras() {
        return availableComfyUILoras;
    }

    function renderLoraList() {
        loraListRenderer?.renderLoraList();
    }

    function updateSelectedLorasDisplay() {
        selectedLoraRenderer?.updateSelectedLorasDisplay();
    }

    function refreshUI() {
        renderLoraList();
        updateSelectedLorasDisplay();
    }

    function moveSelectedLora(name, direction) {
        loraActions?.moveSelectedLora(name, direction);
    }

    loraListRenderer = createComfyUILoraListRenderer({
        getAvailableLoras,
        getCurrentSelectedLoras,
        addSelectedLora,
        removeSelectedLora,
        updateSelectedLoraWeight,
        updateSelectedLorasDisplay,
    });

    selectedLoraRenderer = createComfyUISelectedLoraRenderer({
        getCurrentSelectedLoras,
        setSelectedLoraEnabled,
        updateSelectedLoraWeight,
        updateSelectedLoraTriggers,
        removeSelectedLora,
        moveSelectedLora,
        renderLoraList,
    });

    loraActions = createComfyUILoraActions({
        manager,
        getCurrentSelectedLoras,
        getFilteredLoras: loraListRenderer.getFilteredLoras,
        refreshUI,
        copyTextToClipboard,
        showToast,
    });

    async function fetchAndPopulateLoras(url, silent = false) {
        const loraListContainer = document.getElementById('comfyui-lora-list');
        if (loraListContainer) {
            loraListContainer.innerHTML = '<div style="padding: 20px; text-align: center;">正在加载ComfyUI LoRA...</div>';
        }

        try {
            const data = await getCachedObjectInfo(url);
            const loraLoader = getComfyUILoraLoaders(data)
                .find(loader => Array.isArray(loader.nodeInfo?.input?.required?.[loader.inputs.loraName]?.[0]));
            const loras = loraLoader?.nodeInfo?.input?.required?.[loraLoader.inputs.loraName]?.[0];

            if (!loras || loras.length === 0) {
                if (loraListContainer) {
                    loraListContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;">未找到LoRA模型</div>';
                }
                return;
            }

            availableComfyUILoras = loras
                .map(name => ({ name }))
                .sort((a, b) => {
                    const folderCompare = getComfyUILoraFolder(a.name).localeCompare(getComfyUILoraFolder(b.name));
                    return folderCompare || a.name.localeCompare(b.name);
                });
            renderLoraList();

            if (!silent) {
                showToast('success', `已加载 ${loras.length} 个ComfyUI LoRA模型`);
            }
        } catch (e) {
            if (loraListContainer) {
                loraListContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--vp-error-color);">加载失败: ${e.message}</div>`;
            }
            logger.warn('[AI Gen] 加载ComfyUI LoRA列表失败:', e.message);

            if (!silent) {
                showToast('error', `加载ComfyUI LoRA列表失败: ${e.message}`);
            }
        }
    }

    return {
        applyBulkWeights: loraActions.applyBulkWeights,
        applyPreset: loraActions.applyPreset,
        clearSelection: loraActions.clearSelection,
        copySelection: loraActions.copySelection,
        exportSelection: loraActions.exportSelection,
        fetchAndPopulateLoras,
        getCurrentSelectedLoras,
        getEnabledSelectedLoras,
        importSelection: loraActions.importSelection,
        refreshUI,
        renderLoraList,
        selectFilteredLoras: loraActions.selectFilteredLoras,
        setAllEnabled: loraActions.setAllEnabled,
        setSelectedLoras,
        syncSelectionStorage,
        updateSelectedLorasDisplay,
    };
}
