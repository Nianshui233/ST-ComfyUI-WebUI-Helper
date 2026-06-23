import {
    DEFAULT_SETTINGS,
    MODES,
    PANEL_ID,
    STORAGE_KEY_MODE,
} from '../core/runtime-config.js';
import { createPanelListenerStack } from './panel-listener-stack.js';
import {
    moveAdvancedSectionsToPanelTab,
    updatePanelModeUI,
} from './panel-mode-ui.js';
import {
    getPanelSeedForGeneration,
    updatePanelSeedDisplay,
} from './panel-seed.js';
import { validatePanelSettings } from './panel-settings-validation.js';

export function createPanelController({
    getValue,
    setValue,
    makeRequest,
    imageCacheDB,
    blobUrlTracker,
    deviceDetector,
    getPanelHtml,
    getPanelInputs,
    getPanelButtons,
    inputValidators,
    connectionMonitor,
    helperActivation,
    manualScan,
    img2imgController,
    loadSettings,
    saveSettings,
    initSettingsBackupListeners,
    initPresetManagers,
    initLogPanel,
    detectAiPromptModels,
    populateAiPromptModelSelect,
    testAiPromptOpenAICompatibleApi,
    testApiImageGeneration,
    fetchAndPopulateModels,
    fetchAndPopulateUNetModels,
    fetchAndPopulateWebUIModels,
    fetchAndPopulateWebUILoras,
    fetchAndPopulateWebUIEmbeddings,
    fetchAndPopulateComfyUISamplingOptions,
    fetchAndPopulateWebUISamplingOptions,
    fetchAndPopulateComfyUILoras,
    renderComfyUILoraList,
    clearComfyUILoraSelection,
    applyComfyUILoraBulkWeights,
    selectFilteredComfyUILoras,
    setAllComfyUILorasEnabled,
    copyComfyUILoraSelection,
    exportComfyUILoraSelection,
    importComfyUILoraSelection,
    copyLastSubmittedComfyUIWorkflow,
    exportLastSubmittedComfyUIWorkflow,
    updateComfyUISelectedLorasDisplay,
    syncComfyUILoraSelectionStorage,
    updateSelectedEmbeddingsDisplay,
    loadImageCache,
    clearAllCache,
    updateWorkflowList,
    filterWorkflows,
    toggleEditMode,
    saveEditedWorkflow,
    cancelEditMode,
    formatCurrentWorkflow,
    copyCurrentWorkflow,
    minifyCurrentWorkflow,
    analyzeCurrentWorkflow,
    insertWorkflowPlaceholder,
    convertCurrentWorkflowToPlaceholders,
    validateCurrentWorkflow,
    showWorkflowSaveModal,
    exportAllWorkflows,
    importAllWorkflows,
    validateComfyWorkflow,
    showWorkflowValidationResult,
    onModeChanged,
    showToast,
    logger = console,
}) {
    let currentMode = MODES.COMFYUI;
    let apiImagePanelController = null;

    function moveAdvancedSectionsToTab(tabId) {
        moveAdvancedSectionsToPanelTab(tabId, currentMode);
    }

    const {
        initApiListeners,
        initApiImageListeners,
        initCacheListeners,
        initGeneralListeners,
        initTabListeners,
        initWorkflowListeners,
        moveModeSections,
    } = createPanelListenerStack({
        makeRequest,
        connectionMonitor,
        manualScan,
        saveSettings,
        detectAiPromptModels,
        testAiPromptOpenAICompatibleApi,
        testApiImageGeneration,
        fetchAndPopulateModels,
        fetchAndPopulateUNetModels,
        fetchAndPopulateWebUIModels,
        fetchAndPopulateWebUILoras,
        fetchAndPopulateWebUIEmbeddings,
        fetchAndPopulateComfyUISamplingOptions,
        fetchAndPopulateWebUISamplingOptions,
        fetchAndPopulateComfyUILoras,
        renderComfyUILoraList,
        clearComfyUILoraSelection,
        applyComfyUILoraBulkWeights,
        selectFilteredComfyUILoras,
        setAllComfyUILorasEnabled,
        copyComfyUILoraSelection,
        exportComfyUILoraSelection,
        importComfyUILoraSelection,
        copyLastSubmittedComfyUIWorkflow,
        exportLastSubmittedComfyUIWorkflow,
        getValue,
        setValue,
        imageCacheDB,
        blobUrlTracker,
        loadImageCache,
        clearAllCache,
        filterWorkflows,
        toggleEditMode,
        saveEditedWorkflow,
        cancelEditMode,
        formatCurrentWorkflow,
        copyCurrentWorkflow,
        minifyCurrentWorkflow,
        analyzeCurrentWorkflow,
        insertWorkflowPlaceholder,
        convertCurrentWorkflowToPlaceholders,
        validateCurrentWorkflow,
        showWorkflowSaveModal,
        exportAllWorkflows,
        importAllWorkflows,
        validateComfyWorkflow,
        showWorkflowValidationResult,
        switchMode,
        moveAdvancedSectionsToTab,
        img2imgController,
        updateSelectedEmbeddingsDisplay,
        updateComfyUISelectedLorasDisplay,
        loadImageCache,
        updateWorkflowList,
        deviceDetector,
        showToast,
        logger,
    });

    async function loadCurrentMode() {
        currentMode = await getValue(STORAGE_KEY_MODE, DEFAULT_SETTINGS.mode);
        onModeChanged?.(currentMode);
        updateModeUI();
    }

    function getCurrentMode() {
        return currentMode;
    }

    function getModeLabel(mode) {
        return {
            [MODES.COMFYUI]: 'ComfyUI',
            [MODES.WEBUI]: 'WebUI',
            [MODES.API]: 'API 生图',
        }[mode] || mode;
    }

    async function switchMode(mode) {
        currentMode = mode;
        await setValue(STORAGE_KEY_MODE, mode);
        updateModeUI();
        onModeChanged?.(mode);
        showToast('success', `已切换到 ${getModeLabel(mode)} 模式`);
        connectionMonitor.setStatus('disconnected', '未连接');
    }

    function updateModeUI() {
        updatePanelModeUI({
            currentMode,
            moveModeSections,
            moveAdvancedSectionsToTab,
        });
    }

    function validateSettings() {
        return validatePanelSettings({ inputValidators, showToast });
    }

    function createPanel() {
        if (document.getElementById(PANEL_ID)) return;

        const panelHTML = getPanelHtml({ panelId: PANEL_ID, modes: MODES });

        document.body.insertAdjacentHTML('beforeend', panelHTML);
        initPanelLogic();
    }

    async function initPanelLogic() {
        const panel = document.getElementById(PANEL_ID);

        const inputs = getPanelInputs();
        const buttons = getPanelButtons(panel);

        const deviceType = deviceDetector.getDeviceType();
        panel.classList.add(`device-${deviceType}`);

        initGeneralListeners(panel, buttons, inputs);
        helperActivation?.bindToggle?.(buttons.helperToggle);
        initTabListeners();
        initWorkflowListeners(buttons, inputs);
        initApiListeners(buttons, inputs);
        apiImagePanelController = initApiImageListeners(buttons, inputs);
        initPresetManagers(inputs);
        initCacheListeners(buttons);
        initSettingsBackupListeners(buttons, inputs);
        initLogPanel?.();

        await loadCurrentMode();
        await loadSettings(inputs);
        helperActivation?.setToggleVisual?.(helperActivation.isEnabled?.() ?? true);
        apiImagePanelController?.applyProviderDefaults?.();
        panel.updateAiPromptProviderUI?.();
        populateAiPromptModelSelect([], inputs.aiPromptApiModel?.value || '');
        panel.scheduleAiPromptModelDetection?.();
        await syncComfyUILoraSelectionStorage();
        moveAdvancedSectionsToTab('generation');
        updateComfyUISelectedLorasDisplay();
    }

    function getSeedForGeneration() {
        return getPanelSeedForGeneration(currentMode);
    }

    function updateSeedDisplay(seed) {
        updatePanelSeedDisplay(currentMode, seed);
    }

    return {
        createPanel,
        getCurrentMode,
        getSeedForGeneration,
        loadCurrentMode,
        switchMode,
        updateModeUI,
        updateSeedDisplay,
        validateSettings,
    };
}
