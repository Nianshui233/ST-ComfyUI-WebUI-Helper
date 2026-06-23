import { createComfyUILoraController } from '../comfyui/lora/comfyui-lora-controller.js';
import { getComfyUILoraTriggerPrompt } from '../comfyui/lora/comfyui-lora.js';
import { createDebugWorkflowTools } from '../workflow/debug-workflow-tools.js';
import { createModelResourceService } from '../resources/model-resource-service.js';
import { createPresetController } from '../settings/preset-controller.js';
import { createSettingsController } from '../settings/settings-controller.js';
import {
    PANEL_ID,
} from '../core/runtime-config.js';
import {
    buildWorkflowAnalysis,
    convertWorkflowToPlaceholders,
} from '../workflow/workflow-tools.js';
import { createWorkflowManager } from '../workflow/workflow-manager.js';
import {
    showWorkflowValidationResult as showWorkflowValidationToast,
    validateComfyWorkflow,
} from '../workflow/workflow-validation.js';
import { createPresetManager } from '../../ui/presets/preset-manager.js';
import { downloadJsonFile } from '../../lib/core/utils.js';

export function createResourceStack({
    getValue,
    setValue,
    getStoredValues,
    setStoredValues,
    makeRequest,
    makeRequestWithRetry,
    getCachedObjectInfo,
    blobUrlTracker,
    renderEmbeddingList,
    setAvailableEmbeddings,
    updateSelectedEmbeddingsDisplay,
    img2imgController,
    getPanelController,
    getAiPromptController,
    showToast,
    logger = console,
}) {
    function showWorkflowValidationResult(result) {
        showWorkflowValidationToast(result, showToast);
    }

    function createStoredPresetManager(config) {
        return createPresetManager(config, {
            getValue,
            setValue,
            showToast,
        });
    }

    const debugWorkflowTools = createDebugWorkflowTools({
        getValue,
        downloadJsonFile,
        showToast,
    });

    const comfyUILoraController = createComfyUILoraController({
        getValue,
        setValue,
        getCachedObjectInfo,
        copyTextToClipboard: debugWorkflowTools.copyTextToClipboard,
        showToast,
        logger,
    });

    const workflowManager = createWorkflowManager({
        getValue,
        setValue,
        blobUrlTracker,
        buildWorkflowAnalysis,
        convertWorkflowToPlaceholders,
        validateComfyWorkflow,
        showWorkflowValidationResult,
        getCurrentComfyUISelectedLoras: comfyUILoraController.getCurrentSelectedLoras,
        getComfyUILoraTriggerPrompt,
        showToast,
    });

    let settingsController;
    const presetController = createPresetController({
        createStoredPresetManager,
        getValue,
        setValue,
        saveSettings: (inputs) => settingsController.saveSettings(inputs),
        getCurrentComfyUISelectedLoras: comfyUILoraController.getCurrentSelectedLoras,
        applyComfyUILoraPreset: comfyUILoraController.applyPreset,
        showToast,
    });

    settingsController = createSettingsController({
        getStoredValues,
        setStoredValues,
        downloadJsonFile,
        getCurrentComfyUISelectedLoras: comfyUILoraController.getCurrentSelectedLoras,
        setComfyUISelectedLoras: comfyUILoraController.setSelectedLoras,
        syncImg2ImgEnabledState: () => img2imgController.syncEnabledFromInputs(),
        afterImport: async ({ inputs }) => {
            await getPanelController().loadCurrentMode();
            await settingsController.loadSettings(inputs);
            document.getElementById(PANEL_ID)?.updateAiPromptProviderUI?.();
            getAiPromptController()?.populateAiPromptModelSelect([], inputs.aiPromptApiModel?.value || '');
            document.getElementById(PANEL_ID)?.scheduleAiPromptModelDetection?.();
            await presetController.loadAllPresets();
            workflowManager.updateWorkflowList();
            comfyUILoraController.renderLoraList();
            comfyUILoraController.updateSelectedLorasDisplay();
            updateSelectedEmbeddingsDisplay();
        },
        showToast,
        logger,
    });

    const modelResourceService = createModelResourceService({
        getCachedObjectInfo,
        getValue,
        setValue,
        makeRequest,
        makeRequestWithRetry,
        showToast,
        renderEmbeddingList,
        setAvailableLoras: () => {},
        setAvailableEmbeddings,
        logger,
    });

    return {
        comfyUILoraController,
        debugWorkflowTools,
        modelResourceService,
        presetController,
        settingsController,
        showWorkflowValidationResult,
        validateComfyWorkflow,
        workflowManager,
    };
}
