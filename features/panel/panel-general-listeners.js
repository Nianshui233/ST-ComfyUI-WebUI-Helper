import { createAiPromptProviderUiController } from './panel-ai-prompt-provider-ui.js';
import {
    initAutosaveListeners,
    initSeedListeners,
    initSizePresetListeners,
} from './panel-basic-listeners.js';
import { moveModeSections } from './panel-mode-sections.js';
import { initPanelTabListeners } from './panel-tabs.js';

export function createPanelGeneralListeners({
    getValue,
    setValue,
    saveSettings,
    detectAiPromptModels,
    switchMode,
    moveAdvancedSectionsToTab,
    img2imgController,
    updateSelectedEmbeddingsDisplay,
    updateComfyUISelectedLorasDisplay,
    loadImageCache,
    updateWorkflowList,
    deviceDetector,
    showToast,
    logger = console,
}) {
    function initGeneralListeners(panel, buttons, inputs) {
        buttons.close.addEventListener('click', () => {
            panel.style.display = 'none';
        });

        document.querySelectorAll('.mode-switch-option').forEach(btn => {
            btn.addEventListener('click', () => switchMode(btn.dataset.mode));
        });

        inputs.webuiEnableHires.addEventListener('change', () => {
            document.getElementById('hires-settings').style.display = inputs.webuiEnableHires.checked ? 'grid' : 'none';
        });

        createAiPromptProviderUiController({
            panel,
            buttons,
            inputs,
            getValue,
            setValue,
            saveSettings,
            detectAiPromptModels,
            showToast,
            logger,
        }).initAiPromptProviderUi();
        initAutosaveListeners({ buttons, inputs, saveSettings });
        initSizePresetListeners({ panel, showToast });
        initSeedListeners();
        img2imgController.initListeners();
    }

    function initTabListeners() {
        initPanelTabListeners({
            moveAdvancedSectionsToTab,
            updateSelectedEmbeddingsDisplay,
            updateComfyUISelectedLorasDisplay,
            loadImageCache,
            updateWorkflowList,
            deviceDetector,
        });
    }

    return {
        initGeneralListeners,
        initTabListeners,
        moveModeSections,
    };
}
