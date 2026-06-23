import {
    getAiPromptEditorPrompt,
    setAiPromptPanelBusy,
    toggleAiPromptEditor,
    updateAiPromptProgress,
} from './ai-prompt-panel-renderer.js';

export function createAiPromptActionHandler({
    clearAiPromptFromMessage,
    generateAiPromptForMessage,
    getChatMessageByNode,
    getStoredAiPrompt,
    renderAiPromptControlsForMessage,
    saveAiPromptToMessage,
    saveCurrentSettings,
    onStoryboardActionClick,
    showToast,
    logger = console,
}) {
    async function onAiPromptActionClick(event) {
        if (await onStoryboardActionClick?.(event)) return;

        const button = event.target.closest('.comfy-ai-prompt-action');
        if (!button || button.disabled) return;

        const messageNode = button.closest('.mes');
        if (!messageNode) return;

        const action = button.dataset.action;
        const panel = button.closest('.comfy-ai-prompt-panel');

        try {
            if (action === 'toggle-edit') {
                toggleAiPromptEditor(panel);
                return;
            }

            if (action === 'generate' || action === 'rewrite' || action === 'quick') {
                await handleGenerateAction({ action, messageNode, panel });
                return;
            }

            if (action === 'save') {
                await handleSaveAction({ messageNode, panel });
                return;
            }

            if (action === 'copy') {
                await handleCopyAction({ messageNode, panel });
            }

            if (action === 'clear') {
                await clearAiPromptFromMessage(messageNode);
                await renderAiPromptControlsForMessage(messageNode, { allowAuto: false, force: true });
                showToast('success', '绘图提示词已清除');
            }
        } catch (error) {
            logger.error('[AI Gen] AI 绘图提示词操作失败:', error);
            showToast('error', error.message || String(error));
            if (action === 'generate' || action === 'rewrite' || action === 'quick') {
                setAiPromptPanelBusy(panel, '', false);
            }
        }
    }

    async function handleGenerateAction({ action, messageNode, panel }) {
        if (messageNode.dataset.aiPromptGenerating === 'true') return;
        messageNode.dataset.aiPromptGenerating = 'true';
        const isQuick = action === 'quick';
        const startedAt = Date.now();
        let lastProgressPayload = null;
        const reportProgress = (payload) => {
            lastProgressPayload = payload;
            const targetPanel = messageNode.querySelector('.comfy-ai-prompt-panel') || panel;
            updateAiPromptProgress(targetPanel, payload);
        };
        const progressTimer = setInterval(() => {
            if (!lastProgressPayload) return;
            reportProgress({
                ...lastProgressPayload,
                elapsedMs: Date.now() - startedAt,
            });
        }, 500);
        try {
            setAiPromptPanelBusy(panel, isQuick ? '分析提示词中...' : (action === 'rewrite' ? '重写提示词中...' : '分析提示词中...'));
            reportProgress({
                detail: '正在保存当前 AI/LLM 设置',
                elapsedMs: 0,
                phase: 'settings',
            });
            await saveCurrentSettings?.();
            await generateAiPromptForMessage(messageNode, { progress: reportProgress });
            delete messageNode.dataset.aiPromptGenerating;
            await renderAiPromptControlsForMessage(messageNode, { allowAuto: false, force: true });
            const freshPanel = messageNode.querySelector('.comfy-ai-prompt-panel');
            setAiPromptPanelBusy(freshPanel, '提示词已准备', false);
            updateAiPromptProgress(freshPanel, {
                detail: '绘图提示词已准备',
                elapsedMs: Date.now() - startedAt,
                phase: 'done',
            });
            if (isQuick) {
                const generatedButton = freshPanel?.querySelector('.comfy-chat-generate-button');
                if (!generatedButton) throw new Error('未找到图片生成按钮');
                generatedButton.click();
            }
            showToast('success', isQuick ? 'AI 绘图已开始' : 'AI 绘图提示词已生成');
        } catch (error) {
            reportProgress({
                detail: error.message || String(error),
                elapsedMs: Date.now() - startedAt,
                phase: 'error',
            });
            throw error;
        } finally {
            clearInterval(progressTimer);
            delete messageNode.dataset.aiPromptGenerating;
        }
    }

    async function handleSaveAction({ messageNode, panel }) {
        const prompt = getAiPromptEditorPrompt(panel);
        if (!prompt) {
            showToast('warning', '请先展开编辑并填写绘图提示词');
            return;
        }
        await saveAiPromptToMessage(messageNode, prompt, prompt);
        await renderAiPromptControlsForMessage(messageNode, { allowAuto: false, force: true });
        showToast('success', '绘图提示词已保存');
    }

    async function handleCopyAction({ messageNode, panel }) {
        const { message } = getChatMessageByNode(messageNode);
        const prompt = getAiPromptEditorPrompt(panel, getStoredAiPrompt(message));
        if (!prompt) {
            showToast('warning', '没有可复制的绘图提示词');
            return;
        }
        await navigator.clipboard.writeText(prompt);
        showToast('success', '绘图提示词已复制');
    }

    return {
        onAiPromptActionClick,
    };
}
