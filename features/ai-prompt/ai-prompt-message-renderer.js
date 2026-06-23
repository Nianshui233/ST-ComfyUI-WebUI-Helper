import {
    renderAiPromptEmptyPanel,
    renderAiPromptReadyPanel,
    setAiPromptPanelBusy,
    updateAiPromptProgress,
} from './ai-prompt-panel-renderer.js';
import { simpleHash } from '../../lib/core/utils.js';

export function createAiPromptMessageRenderer({
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
    renderStoryboardForPanel,
    showToast,
    logger = console,
}) {
    async function renderStoryboardIfNeeded(messageNode, panel, settings) {
        renderStoryboardForPanel?.({
            messageNode,
            panel,
            settings,
        });
        await setupGenerateButtonGroups(panel, { allowAutoGenerate: false });
    }

    async function renderAiPromptControlsForMessage(messageNode, { allowAuto = false, force = false } = {}) {
        const mesText = messageNode?.querySelector('.mes_text');
        if (!mesText) return;

        const existing = messageNode.querySelector('.comfy-ai-prompt-panel');
        if (!isHelperEnabled?.()) {
            return;
        }

        if (messageNode.dataset.aiPromptGenerating === 'true') {
            if (existing) return;
        }
        const settings = await getAiPromptSettings();

        if (!settings.enabled || !settings.showButtons || !isAiPromptEligibleMessage(messageNode)) {
            existing?.remove();
            return;
        }

        const { index, message, context } = getChatMessageByNode(messageNode);
        if (!message || !context) return;

        const prompt = getStoredAiPrompt(message);
        const messageId = getStableMessageId(messageNode);
        const panel = existing || document.createElement('div');
        panel.className = 'comfy-ai-prompt-panel';
        panel.dataset.messageIndex = String(index);
        panel.dataset.readyText = prompt ? '提示词已准备' : '等待分析';

        const activeTextarea = panel.querySelector?.('.comfy-ai-prompt-drawer:not([hidden]) .comfy-ai-prompt-textarea, .comfy-ai-prompt-editor:not([hidden]) .comfy-ai-prompt-textarea');
        const isEditingAiPrompt = activeTextarea && document.activeElement === activeTextarea;
        const promptHash = prompt ? simpleHash(prompt) : '';
        if (
            !force &&
            existing &&
            prompt &&
            activeTextarea &&
            (isEditingAiPrompt || activeTextarea.value !== prompt)
        ) {
            return;
        }
        if (!force && existing && prompt && panel.dataset.promptHash === promptHash) {
            await setupGenerateButtonGroups(panel, { allowAutoGenerate: false });
            await renderStoryboardIfNeeded(messageNode, panel, settings);
            return;
        }

        if (!existing) {
            mesText.insertAdjacentElement('afterend', panel);
        }

        if (prompt) {
            renderAiPromptReadyPanel({
                panel,
                prompt,
                promptHash,
                messageId,
                buildGenerateButtonGroup,
            });
            await setupGenerateButtonGroups(panel, { allowAutoGenerate: false });
            await renderStoryboardIfNeeded(messageNode, panel, settings);
        } else {
            renderAiPromptEmptyPanel(panel);
            await renderStoryboardIfNeeded(messageNode, panel, settings);

            const isLatestMessage = index === context.chat.length - 1;
            const shouldAutoGenerate = settings.auto && allowAuto && isLatestMessage && !messageNode.dataset.aiPromptAutoTriggered && !isMessageStreaming(messageNode);
            if (shouldAutoGenerate) {
                triggerAutoAiPromptGeneration(messageNode, settings);
            }
        }
    }

    function triggerAutoAiPromptGeneration(messageNode, settings) {
        messageNode.dataset.aiPromptAutoTriggered = 'true';
        setTimeout(() => {
            if (messageNode.dataset.aiPromptGenerating === 'true') return;
            messageNode.dataset.aiPromptGenerating = 'true';
            const autoPanel = messageNode.querySelector('.comfy-ai-prompt-panel');
            setAiPromptPanelBusy(autoPanel, '自动分析提示词中...');
            const startedAt = Date.now();
            let lastProgressPayload = null;
            const reportProgress = (payload) => {
                lastProgressPayload = payload;
                updateAiPromptProgress(
                    messageNode.querySelector('.comfy-ai-prompt-panel') || autoPanel,
                    payload,
                );
            };
            reportProgress({
                detail: '自动分析：正在整理请求',
                elapsedMs: 0,
                phase: 'settings',
            });
            const progressTimer = setInterval(() => {
                if (!lastProgressPayload) return;
                reportProgress({
                    ...lastProgressPayload,
                    elapsedMs: Date.now() - startedAt,
                });
            }, 500);
            generateAiPromptForMessage(messageNode, { progress: reportProgress })
                .then(() => {
                    delete messageNode.dataset.aiPromptGenerating;
                    return renderAiPromptControlsForMessage(messageNode, { allowAuto: false, force: true });
                })
                .then(() => {
                    reportProgress({
                        detail: '绘图提示词已准备',
                        elapsedMs: Date.now() - startedAt,
                        phase: 'done',
                    });
                    if (settings.autoGenerateImage) {
                        messageNode.querySelector('.comfy-ai-prompt-panel .comfy-chat-generate-button')?.click();
                    }
                })
                .catch(error => {
                    logger.error('[AI Gen] 自动生成 AI 绘图提示词失败:', error);
                    showToast('warning', `AI绘图提示词生成失败: ${error.message || error}`);
                    setAiPromptPanelBusy(autoPanel, '分析失败', false);
                    reportProgress({
                        detail: error.message || String(error),
                        elapsedMs: Date.now() - startedAt,
                        phase: 'error',
                    });
                })
                .finally(() => {
                    clearInterval(progressTimer);
                    delete messageNode.dataset.aiPromptGenerating;
                });
        }, 150);
    }

    return {
        renderAiPromptControlsForMessage,
    };
}
