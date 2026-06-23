import { createAiPromptActionHandler } from './ai-prompt-action-handler.js';
import { createAiPromptMessageStore } from './ai-prompt-message-store.js';
import { createAiPromptModelManager } from './ai-prompt-models.js';
import { createAiPromptGenerateButtons } from './ai-prompt-generate-buttons.js';
import { createAiPromptGenerator } from './ai-prompt-generator.js';
import { createAiPromptMessageRenderer } from './ai-prompt-message-renderer.js';
import { setAiPromptPanelBusy } from './ai-prompt-panel-renderer.js';
import { createAiPromptSettingsReader } from './ai-prompt-settings.js';
import { DEFAULT_SETTINGS } from '../core/runtime-config.js';

export function createAiPromptController({
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
    isMessageStreaming,
    showToast,
    logger = console,
}) {
    const { getAiPromptSettings } = createAiPromptSettingsReader({ getStoredValues });
    const messageStore = createAiPromptMessageStore({
        getContext,
        getValue,
        saveChatConditional,
    });
    const {
        buildAiPromptContext,
        clearAiPromptFromMessage,
        getChatMessageByNode,
        getStoredAiPrompt,
        isAiPromptEligibleMessage,
        saveAiPromptToMessage,
    } = messageStore;

    function getAiPromptServiceDeps() {
        return {
            makeRequest,
            defaults: DEFAULT_SETTINGS,
        };
    }
    const {
        detectAiPromptModels,
        populateAiPromptModelSelect,
        testAiPromptOpenAICompatibleApi,
    } = createAiPromptModelManager({
        getAiPromptSettings,
        getAiPromptServiceDeps,
        showToast,
    });

    const {
        generateAiPromptForMessage,
    } = createAiPromptGenerator({
        getAiPromptSettings,
        getAiPromptServiceDeps,
        generateQuietPrompt,
        buildAiPromptContext,
        getChatMessageByNode,
        isAiPromptEligibleMessage,
        saveAiPromptToMessage,
    });

    const {
        buildGenerateButtonGroup,
        setupGenerateButtonGroups,
    } = createAiPromptGenerateButtons({
        getValue,
        imageCacheDB,
        displayImage,
        setupGeneratedState,
        checkSendingStatus,
    });

    const { renderAiPromptControlsForMessage } = createAiPromptMessageRenderer({
        getAiPromptSettings,
        getChatMessageByNode,
        getStoredAiPrompt,
        getStableMessageId,
        isAiPromptEligibleMessage,
        isMessageStreaming,
        buildGenerateButtonGroup,
        setupGenerateButtonGroups,
        generateAiPromptForMessage,
        showToast,
        logger,
    });
    const { onAiPromptActionClick } = createAiPromptActionHandler({
        clearAiPromptFromMessage,
        generateAiPromptForMessage,
        getChatMessageByNode,
        getStoredAiPrompt,
        renderAiPromptControlsForMessage,
        saveAiPromptToMessage,
        showToast,
        logger,
    });

    return {
        buildGenerateButtonGroup,
        detectAiPromptModels,
        onAiPromptActionClick,
        populateAiPromptModelSelect,
        renderAiPromptControlsForMessage,
        setAiPromptPanelBusy,
        setupGenerateButtonGroups,
        testAiPromptOpenAICompatibleApi,
    };
}
