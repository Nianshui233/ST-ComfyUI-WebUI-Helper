import {
    renderAiPromptEmptyPanel,
    renderAiPromptReadyPanel,
    setAiPromptPanelBusy,
} from './ai-prompt-panel-renderer.js';
import { simpleHash } from '../../lib/core/utils.js';

export function createAiPromptMessageRenderer({
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
    logger = console,
}) {
    async function renderAiPromptControlsForMessage(messageNode, { allowAuto = false, force = false } = {}) {
        const mesText = messageNode?.querySelector('.mes_text');
        if (!mesText) return;

        const existing = messageNode.querySelector('.comfy-ai-prompt-panel');
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
        } else {
            renderAiPromptEmptyPanel(panel);

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
            const autoPanel = messageNode.querySelector('.comfy-ai-prompt-panel');
            setAiPromptPanelBusy(autoPanel, '自动分析提示词中...');
            generateAiPromptForMessage(messageNode)
                .then(() => renderAiPromptControlsForMessage(messageNode, { allowAuto: false }))
                .then(() => {
                    if (settings.autoGenerateImage) {
                        messageNode.querySelector('.comfy-ai-prompt-panel .comfy-chat-generate-button')?.click();
                    }
                })
                .catch(error => {
                    logger.error('[AI Gen] 自动生成 AI 绘图提示词失败:', error);
                    showToast('warning', `AI绘图提示词生成失败: ${error.message || error}`);
                    setAiPromptPanelBusy(autoPanel, '分析失败', false);
                });
        }, 150);
    }

    return {
        renderAiPromptControlsForMessage,
    };
}
