import { createAppRuntime } from './app-runtime.js';
import { createGenerationStack } from './app-generation-stack.js';
import { createMessageStack } from './app-message-stack.js';
import { createResourceStack } from './app-resource-stack.js';
import { createExtensionLifecycle } from './extension-lifecycle.js';
import { InputValidators } from '../core/input-validators.js';
import { createPanelController } from '../panel/panel-controller.js';
import {
    BUTTON_ID,
    MODES,
    PANEL_ID,
} from '../core/runtime-config.js';
import { BlobURLTracker } from '../../lib/browser/blob-url-tracker.js';
import { getPanelInputs, getPanelButtons } from '../../ui/panel/panel-elements.js';
import { getPanelHtml } from '../../ui/panel/panel-template.js';
import { getPanelStyles } from '../../ui/panel/panel-styles.js';
import { DeviceDetector } from '../../ui/core/device-detector.js';

export function createComfyWebuiHelperApp({
    addStyle,
    getValue,
    setValue,
    request,
    generateQuietPrompt,
    saveChatConditional,
    getContext,
}) {
    let currentMode = MODES.COMFYUI;
    let panelController;
    let aiPromptController;

    const runtime = createAppRuntime({
        getValue,
        setValue,
        request,
        getCurrentMode: () => currentMode,
        logger: console,
    });
    const {
        connectionMonitor,
        embeddingController,
        getCachedObjectInfo,
        getStoredValues,
        imageCacheDB,
        img2imgController,
        makeRequest,
        makeRequestWithRetry,
        manualScan,
        messageRuntime,
        progressTracker,
        setStoredValues,
        showToast,
    } = runtime;
    const {
        checkSendingStatus,
        getStableMessageId,
        logRuntimeConfig,
        streamingState,
    } = messageRuntime;
    const {
        generateEmbeddingPromptString,
        renderEmbeddingList,
        setAvailableEmbeddings,
        updateSelectedEmbeddingsDisplay,
    } = embeddingController;

    function getImg2ImgState(modeOrPrefix = currentMode) {
        return img2imgController.getState(modeOrPrefix === MODES.WEBUI ? 'webui' : modeOrPrefix);
    }

    const resourceStack = createResourceStack({
        getValue,
        setValue,
        getStoredValues,
        setStoredValues,
        makeRequest,
        makeRequestWithRetry,
        getCachedObjectInfo,
        blobUrlTracker: BlobURLTracker,
        renderEmbeddingList,
        setAvailableEmbeddings,
        updateSelectedEmbeddingsDisplay,
        img2imgController,
        getPanelController: () => panelController,
        getAiPromptController: () => aiPromptController,
        showToast,
        logger: console,
    });
    const {
        comfyUILoraController,
        debugWorkflowTools,
        modelResourceService,
        presetController,
        settingsController,
        showWorkflowValidationResult,
        validateComfyWorkflow,
        workflowManager,
    } = resourceStack;

    const generationStack = createGenerationStack({
        imageCacheDB,
        blobUrlTracker: BlobURLTracker,
        getValue,
        getStoredValues,
        setValue,
        makeRequest,
        makeRequestWithRetry,
        getCachedObjectInfo,
        getCurrentMode: () => panelController?.getCurrentMode?.() ?? currentMode,
        getPanelController: () => panelController,
        getAiPromptController: () => aiPromptController,
        getEnabledComfyUISelectedLoras: comfyUILoraController.getEnabledSelectedLoras,
        getImg2ImgState,
        generateEmbeddingPromptString,
        progressTracker,
        showToast,
        logger: console,
    });

    const messageStack = createMessageStack({
        getStoredValues,
        getValue,
        makeRequest,
        generateQuietPrompt,
        saveChatConditional,
        getContext,
        imageCacheDB,
        displayImage: generationStack.displayImage,
        setupGeneratedState: (...args) => generationStack.generateButtonController.setupGeneratedState(...args),
        getStableMessageId,
        checkSendingStatus,
        streamingState,
        manualScan,
        showToast,
        logger: console,
    });
    aiPromptController = messageStack.aiPromptController;

    panelController = createPanelController({
        getValue,
        setValue,
        makeRequest,
        imageCacheDB,
        blobUrlTracker: BlobURLTracker,
        deviceDetector: DeviceDetector,
        getPanelHtml,
        getPanelInputs,
        getPanelButtons,
        inputValidators: InputValidators,
        connectionMonitor,
        manualScan,
        img2imgController,
        loadSettings: settingsController.loadSettings,
        saveSettings: settingsController.saveSettings,
        initSettingsBackupListeners: settingsController.initSettingsBackupListeners,
        initPresetManagers: presetController.initPresetManagers,
        detectAiPromptModels: messageStack.detectAiPromptModels,
        populateAiPromptModelSelect: messageStack.populateAiPromptModelSelect,
        testAiPromptOpenAICompatibleApi: messageStack.testAiPromptOpenAICompatibleApi,
        fetchAndPopulateModels: modelResourceService.fetchAndPopulateModels,
        fetchAndPopulateUNetModels: modelResourceService.fetchAndPopulateUNetModels,
        fetchAndPopulateWebUIModels: modelResourceService.fetchAndPopulateWebUIModels,
        fetchAndPopulateWebUILoras: modelResourceService.fetchAndPopulateWebUILoras,
        fetchAndPopulateWebUIEmbeddings: modelResourceService.fetchAndPopulateWebUIEmbeddings,
        fetchAndPopulateComfyUISamplingOptions: modelResourceService.fetchAndPopulateComfyUISamplingOptions,
        fetchAndPopulateWebUISamplingOptions: modelResourceService.fetchAndPopulateWebUISamplingOptions,
        fetchAndPopulateComfyUILoras: comfyUILoraController.fetchAndPopulateLoras,
        renderComfyUILoraList: comfyUILoraController.renderLoraList,
        clearComfyUILoraSelection: comfyUILoraController.clearSelection,
        applyComfyUILoraBulkWeights: comfyUILoraController.applyBulkWeights,
        selectFilteredComfyUILoras: comfyUILoraController.selectFilteredLoras,
        setAllComfyUILorasEnabled: comfyUILoraController.setAllEnabled,
        copyComfyUILoraSelection: comfyUILoraController.copySelection,
        exportComfyUILoraSelection: comfyUILoraController.exportSelection,
        importComfyUILoraSelection: comfyUILoraController.importSelection,
        copyLastSubmittedComfyUIWorkflow: debugWorkflowTools.copyLastSubmittedComfyUIWorkflow,
        exportLastSubmittedComfyUIWorkflow: debugWorkflowTools.exportLastSubmittedComfyUIWorkflow,
        updateComfyUISelectedLorasDisplay: comfyUILoraController.updateSelectedLorasDisplay,
        syncComfyUILoraSelectionStorage: comfyUILoraController.syncSelectionStorage,
        updateSelectedEmbeddingsDisplay,
        loadImageCache: generationStack.loadImageCache,
        clearAllCache: generationStack.clearAllCache,
        updateWorkflowList: workflowManager.updateWorkflowList,
        filterWorkflows: workflowManager.filterWorkflows,
        toggleEditMode: workflowManager.toggleEditMode,
        saveEditedWorkflow: workflowManager.saveEditedWorkflow,
        cancelEditMode: workflowManager.cancelEditMode,
        formatCurrentWorkflow: workflowManager.formatCurrentWorkflow,
        copyCurrentWorkflow: workflowManager.copyCurrentWorkflow,
        minifyCurrentWorkflow: workflowManager.minifyCurrentWorkflow,
        analyzeCurrentWorkflow: workflowManager.analyzeCurrentWorkflow,
        insertWorkflowPlaceholder: workflowManager.insertWorkflowPlaceholder,
        convertCurrentWorkflowToPlaceholders: workflowManager.convertCurrentWorkflowToPlaceholders,
        validateCurrentWorkflow: workflowManager.validateCurrentWorkflow,
        showWorkflowSaveModal: workflowManager.showWorkflowSaveModal,
        exportAllWorkflows: workflowManager.exportAllWorkflows,
        importAllWorkflows: workflowManager.importAllWorkflows,
        validateComfyWorkflow,
        showWorkflowValidationResult,
        onModeChanged: (mode) => {
            currentMode = mode;
        },
        showToast,
        logger: console,
    });

    addStyle(getPanelStyles({ panelId: PANEL_ID, buttonId: BUTTON_ID }));

    const lifecycle = createExtensionLifecycle({
        buttonId: BUTTON_ID,
        panelId: PANEL_ID,
        modes: MODES,
        imageCacheDB,
        panelController,
        connectionMonitor,
        imageTooltip: generationStack.imageTooltip,
        chatScanSystem: messageStack.chatScanSystem,
        manualScan,
        streamingState,
        onGenerateButtonClick: generationStack.onGenerateButtonClick,
        onAiPromptActionClick: messageStack.onAiPromptActionClick,
        generateWithComfyUI: generationStack.generateWithComfyUI,
        generateWithWebUI: generationStack.generateWithWebUI,
        logRuntimeConfig,
        showToast,
        logger: console,
    });

    return {
        init: () => lifecycle.init(),
        lifecycle,
    };
}
