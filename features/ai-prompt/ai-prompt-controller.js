import { createAiPromptActionHandler } from './ai-prompt-action-handler.js';
import { createAiPromptMessageStore } from './ai-prompt-message-store.js';
import { createAiPromptModelManager } from './ai-prompt-models.js';
import { createAiPromptGenerateButtons } from './ai-prompt-generate-buttons.js';
import { createAiPromptMessageRenderer } from './ai-prompt-message-renderer.js';
import { createImagePromptEngine } from './image-prompt-engine.js';
import { createImagePromptProviderAdapter } from './image-prompt-provider-adapter.js';
import { setAiPromptPanelBusy } from './ai-prompt-panel-renderer.js';
import { createAiPromptSettingsReader } from './ai-prompt-settings.js';
import { DEFAULT_SETTINGS } from '../core/runtime-config.js';
import { createStoryboardActionHandler } from '../storyboard/storyboard-action-handler.js';
import { createStoryboardStore } from '../storyboard/storyboard-store.js';
import { createWebSearchToolAdapter } from '../ai-tools/web-search-tool-adapter.js';

export function createAiPromptController({
    getStoredValues,
    getValue,
    makeRequest,
    generateQuietPrompt,
    generateRaw,
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
    const webSearchTool = createWebSearchToolAdapter({ makeRequest });
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
            webSearchTool,
            logger,
        };
    }

    async function testAiPromptWebSearch(query) {
        const settings = await getAiPromptSettings();
        if (!['openai_compatible', 'anthropic'].includes(settings.provider)) {
            throw new Error('插件内网络搜索仅支持 OpenAI 兼容 API 或 Anthropic API');
        }
        const startedAt = Date.now();
        const result = await webSearchTool.search(settings, query);
        const elapsedMs = Date.now() - startedAt;
        logger.info('[AI Gen] 独立网络搜索测试完成', {
            provider: result.provider,
            queryLength: result.query.length,
            results: result.results.length,
            elapsedMs,
        });
        showToast('success', `搜索服务可用：${result.provider} 返回 ${result.results.length} 条结果 (${elapsedMs}ms)`);
        return result;
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

    const providerAdapter = createImagePromptProviderAdapter({
        generateQuietPrompt,
        generateRaw,
        getAiPromptServiceDeps,
    });
    const imagePromptEngine = createImagePromptEngine({
        getAiPromptSettings,
        buildAiPromptContext,
        getChatMessageByNode,
        isAiPromptEligibleMessage,
        saveAiPromptToMessage,
        saveStoryboardToMessage: storyboardStore.saveStoryboardToMessage,
        providerAdapter,
        logger,
    });
    const generateAiPromptForMessage = imagePromptEngine.generateSingle;
    const generateStoryboardForMessage = imagePromptEngine.generateStoryboard;

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
        generateStoryboardForMessage,
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
        testAiPromptWebSearch,
    };
}
