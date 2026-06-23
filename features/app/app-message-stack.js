import { createAiPromptController } from '../ai-prompt/ai-prompt-controller.js';
import { createChatScanSystem } from '../chat/chat-scan-system.js';
import { createMessageActionController } from '../chat/message-action-controller.js';

export function createMessageStack({
    getStoredValues,
    getValue,
    makeRequest,
    generateQuietPrompt,
    saveChatConditional,
    getContext,
    imageCacheDB,
    displayImage,
    setupGeneratedState,
    getStableMessageId,
    checkSendingStatus,
    streamingState,
    manualScan,
    helperActivation,
    saveSettings,
    showToast,
    logger = console,
}) {
    let messageActionController;

    const aiPromptController = createAiPromptController({
        getStoredValues,
        getValue,
        makeRequest,
        generateQuietPrompt,
        saveChatConditional,
        getContext,
        imageCacheDB,
        displayImage,
        setupGeneratedState,
        getStableMessageId,
        checkSendingStatus,
        isMessageStreaming: (...args) => messageActionController?.isMessageStreaming?.(...args) ?? false,
        isHelperEnabled: () => helperActivation?.isEnabled?.() ?? true,
        saveSettings,
        showToast,
        logger,
    });

    messageActionController = createMessageActionController({
        streamingState,
        getValue,
        getStableMessageId,
        checkSendingStatus,
        buildGenerateButtonGroup: (...args) => aiPromptController.buildGenerateButtonGroup(...args),
        setupGenerateButtonGroups: (...args) => aiPromptController.setupGenerateButtonGroups(...args),
        renderAiPromptControlsForMessage: (...args) => aiPromptController.renderAiPromptControlsForMessage(...args),
        isHelperEnabled: () => helperActivation?.isEnabled?.() ?? true,
        logger,
    });

    const chatScanSystem = createChatScanSystem({
        getValue,
        manualScan,
        streamingState,
        checkSendingStatus,
        getStableMessageId,
        isMessageBeingEdited: messageActionController.isMessageBeingEdited,
        markMessageAsStreamComplete: messageActionController.markMessageAsStreamComplete,
        processMessageForImageActions: messageActionController.processMessageForImageActions,
        processPendingMessages: messageActionController.processPendingMessages,
        logger,
    });

    return {
        aiPromptController,
        chatScanSystem,
        detectAiPromptModels: aiPromptController.detectAiPromptModels,
        messageActionController,
        onAiPromptActionClick: aiPromptController.onAiPromptActionClick,
        populateAiPromptModelSelect: aiPromptController.populateAiPromptModelSelect,
        testAiPromptOpenAICompatibleApi: aiPromptController.testAiPromptOpenAICompatibleApi,
    };
}
