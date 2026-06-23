import { createAiPromptActionHandler } from './ai-prompt-action-handler.js';
import { createAiPromptMessageStore } from './ai-prompt-message-store.js';
import { createAiPromptModelManager } from './ai-prompt-models.js';
import { createAiPromptGenerateButtons } from './ai-prompt-generate-buttons.js';
import { createAiPromptGenerator } from './ai-prompt-generator.js';
import { createAiPromptMessageRenderer } from './ai-prompt-message-renderer.js';
import { setAiPromptPanelBusy } from './ai-prompt-panel-renderer.js';
import { createAiPromptSettingsReader } from './ai-prompt-settings.js';
import { DEFAULT_SETTINGS } from '../core/runtime-config.js';
import { createStoryboardActionHandler } from '../storyboard/storyboard-action-handler.js';
import { createStoryboardService } from '../storyboard/storyboard-service.js';
import { createStoryboardStore } from '../storyboard/storyboard-store.js';

export function createAiPromptController({
    getStoredValues,
    getValue,
    makeRequest,
    generateQuietPrompt,
    saveChatConditional,
    getContext,
    imageCacheDB,
    displayImage,
    generateFromGroup,
    setupGeneratedState,
    getStableMessageId,
    checkSendingStatus,
    isMessageStreaming,
    isHelperEnabled,
    saveSettings,
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
    const storyboardStore = createStoryboardStore({
        getChatMessageByNode,
        saveChatConditional,
    });

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
        logger,
    });
    const storyboardService = createStoryboardService({
        buildAiPromptContext,
        generateQuietPrompt,
        getAiPromptServiceDeps,
        getAiPromptSettings,
        getChatMessageByNode,
        isAiPromptEligibleMessage,
        saveStoryboardToMessage: storyboardStore.saveStoryboardToMessage,
        logger,
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

    let storyboardActionHandler;
    const { renderAiPromptControlsForMessage } = createAiPromptMessageRenderer({
        getAiPromptSettings,
        getChatMessageByNode,
        getStoredAiPrompt,
        getStableMessageId,
        isAiPromptEligibleMessage,
        isMessageStreaming,
        isHelperEnabled,
        buildGenerateButtonGroup,
        setupGenerateButtonGroups,
        generateAiPromptForMessage,
        renderStoryboardForPanel: (...args) => storyboardActionHandler?.renderStoryboardForPanel?.(...args),
        showToast,
        logger,
    });
    const { onAiPromptActionClick } = createAiPromptActionHandler({
        clearAiPromptFromMessage,
        generateAiPromptForMessage,
        getChatMessageByNode,
        getStoredAiPrompt,
        renderAiPromptControlsForMessage,
        saveCurrentSettings: saveSettings,
        saveAiPromptToMessage,
        onStoryboardActionClick: (...args) => storyboardActionHandler?.onStoryboardActionClick?.(...args),
        showToast,
        logger,
    });
    storyboardActionHandler = createStoryboardActionHandler({
        buildGenerateButtonGroup,
        clearStoryboardFromMessage: storyboardStore.clearStoryboardFromMessage,
        deleteStoryboardPanel: storyboardStore.deleteStoryboardPanel,
        generateStoryboardForMessage: storyboardService.generateStoryboardForMessage,
        getChatMessageByNode,
        getStableMessageId,
        getStoryboard: storyboardStore.getStoryboard,
        renderAiPromptControlsForMessage,
        saveCurrentSettings: saveSettings,
        generateFromGroup,
        setupGenerateButtonGroups,
        showToast,
        updateStoryboardPanel: storyboardStore.updateStoryboardPanel,
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
