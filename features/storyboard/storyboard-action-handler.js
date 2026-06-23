import {
    getStoryboardPromptFromPanel,
    renderStoryboardBlock,
    setStoryboardBusy,
    toggleStoryboardPanelPrompt,
} from './storyboard-renderer.js';

function copyText(text) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    return Promise.resolve();
}

function nextFrame() {
    return new Promise(resolve => {
        const frame = typeof requestAnimationFrame === 'function'
            ? requestAnimationFrame
            : (callback) => setTimeout(callback, 0);
        frame(() => frame(resolve));
    });
}

function escapeSelector(value) {
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(value);
    return String(value || '').replace(/["\\]/g, '\\$&');
}

export function createStoryboardActionHandler({
    buildGenerateButtonGroup,
    clearStoryboardFromMessage,
    deleteStoryboardPanel,
    generateStoryboardForMessage,
    getChatMessageByNode,
    getStableMessageId,
    getStoryboard,
    renderAiPromptControlsForMessage,
    saveCurrentSettings,
    generateFromGroup,
    setupGenerateButtonGroups,
    showToast,
    updateStoryboardPanel,
    logger = console,
}) {
    function getPanelContext(button) {
        const messageNode = button.closest('.mes');
        const panel = button.closest('.comfy-ai-prompt-panel');
        return { messageNode, panel };
    }

    async function rerenderStoryboard(messageNode) {
        await renderAiPromptControlsForMessage(messageNode, { allowAuto: false, force: true });
    }

    async function analyzeStoryboard({ messageNode, panel }) {
        if (messageNode.dataset.storyboardGenerating === 'true') return;
        messageNode.dataset.storyboardGenerating = 'true';
        setStoryboardBusy(panel, '分析分镜中...', true, { includeGenerate: true });
        try {
            await saveCurrentSettings?.();
            const storyboard = await generateStoryboardForMessage(messageNode);
            await rerenderStoryboard(messageNode);
            showToast('success', `连环画分镜已生成 (${storyboard.panels.length} 格)`);
        } finally {
            delete messageNode.dataset.storyboardGenerating;
            setStoryboardBusy(messageNode.querySelector('.comfy-ai-prompt-panel') || panel, '连环画', false);
        }
    }

    async function savePanelPrompt({ messageNode, panelNode }) {
        const prompt = getStoryboardPromptFromPanel(panelNode);
        if (!prompt) {
            showToast('warning', '本格提示词为空');
            return;
        }
        await updateStoryboardPanel(messageNode, panelNode.dataset.panelId, { prompt });
        await rerenderStoryboard(messageNode);
        showToast('success', '本格提示词已保存');
    }

    async function deletePanel({ messageNode, panelNode }) {
        await deleteStoryboardPanel(messageNode, panelNode.dataset.panelId);
        await rerenderStoryboard(messageNode);
        showToast('success', '已删除本格');
    }

    function getPanelGenerateGroup(panelNode) {
        return panelNode?.querySelector('.comfy-button-group[data-source="storyboard"]')
            || panelNode?.querySelector('.comfy-button-group');
    }

    function getStoryboardBlock(panel) {
        return panel?.querySelector('.comfy-storyboard-block');
    }

    function getStoryboardPanelById(panel, panelId) {
        return getStoryboardBlock(panel)?.querySelector(`.comfy-storyboard-panel[data-panel-id="${escapeSelector(panelId)}"]`)
            || panel?.querySelector(`.comfy-storyboard-panel[data-panel-id="${escapeSelector(panelId)}"]`);
    }

    function setPanelQueued(panelNode) {
        if (!panelNode) return;
        panelNode.dataset.generationStatus = 'queued';
        panelNode.classList.remove('is-generating', 'is-generated', 'is-error', 'is-cancelled', 'has-image');
        panelNode.classList.add('is-queued');
        panelNode.querySelector('.comfy-storyboard-image-slot')?.classList.remove('has-image');
        const status = panelNode.querySelector('.comfy-storyboard-status');
        if (status) status.textContent = '等待队列';
    }

    function updateMainStatus(panel, text) {
        const mainStatus = panel?.querySelector('.comfy-storyboard-status-main');
        if (mainStatus) mainStatus.textContent = text;
    }

    async function generateAll({ panel }) {
        const panelIds = Array.from(panel.querySelectorAll('.comfy-storyboard-panel'))
            .map(panelNode => panelNode.dataset.panelId)
            .filter(Boolean);
        if (!panelIds.length) {
            showToast('warning', '没有可生成的分镜');
            return;
        }
        setStoryboardBusy(panel, '顺序生成中...');
        try {
            panelIds.forEach(panelId => setPanelQueued(getStoryboardPanelById(panel, panelId)));

            for (const [index, panelId] of panelIds.entries()) {
                updateMainStatus(panel, `顺序生成中 (${index + 1}/${panelIds.length})`);
                await nextFrame();

                const currentPanelNode = getStoryboardPanelById(panel, panelId);
                if (!currentPanelNode) throw new Error(`第 ${index + 1} 格已不在页面中`);

                const group = getPanelGenerateGroup(currentPanelNode);
                if (!group) throw new Error(`第 ${index + 1} 格没有可用的生图按钮`);

                const result = await generateFromGroup(group, { force: true, ignoreCooldown: true });
                if (result.status !== 'success') {
                    throw new Error(`第 ${index + 1} 格生成中断${result.error ? `：${result.error}` : ''}`);
                }
                await nextFrame();
            }
            updateMainStatus(panel, '顺序生成完成');
            showToast('success', '连环画分镜已顺序生成完成');
        } finally {
            setStoryboardBusy(panel, '连环画', false);
        }
    }

    async function onStoryboardActionClick(event) {
        const button = event.target.closest('.comfy-storyboard-action, .comfy-storyboard-button');
        if (!button || button.disabled) return false;

        const action = button.dataset.action;
        const { messageNode, panel } = getPanelContext(button);
        if (!messageNode || !panel) return false;

        try {
            if (action === 'analyze-storyboard' || action === 'rewrite-storyboard') {
                await analyzeStoryboard({ messageNode, panel });
                return true;
            }
            if (action === 'toggle-storyboard') {
                panel.querySelector('.comfy-storyboard-block')?.toggleAttribute('hidden');
                return true;
            }
            if (action === 'toggle-panel-prompt') {
                toggleStoryboardPanelPrompt(button.closest('.comfy-storyboard-panel'));
                return true;
            }
            if (action === 'save-panel') {
                await savePanelPrompt({ messageNode, panelNode: button.closest('.comfy-storyboard-panel') });
                return true;
            }
            if (action === 'copy-panel') {
                const prompt = getStoryboardPromptFromPanel(button.closest('.comfy-storyboard-panel'));
                if (!prompt) return true;
                await copyText(prompt);
                showToast('success', '本格提示词已复制');
                return true;
            }
            if (action === 'delete-panel') {
                await deletePanel({ messageNode, panelNode: button.closest('.comfy-storyboard-panel') });
                return true;
            }
            if (action === 'clear-storyboard') {
                await clearStoryboardFromMessage(messageNode);
                await rerenderStoryboard(messageNode);
                showToast('success', '连环画分镜已清空');
                return true;
            }
            if (action === 'generate-all') {
                await generateAll({ panel });
                return true;
            }
        } catch (error) {
            logger.error('[AI Gen] 连环画操作失败:', error);
            showToast('error', error.message || String(error));
            setStoryboardBusy(panel, '连环画', false);
            return true;
        }

        return false;
    }

    function renderStoryboardForPanel({ messageNode, panel, settings }) {
        const { message } = getChatMessageByNode(messageNode);
        const storyboard = getStoryboard(message);
        if (!settings.storyboardEnabled) {
            panel.querySelectorAll('.comfy-storyboard-button').forEach(button => button.remove());
            panel.querySelector('.comfy-storyboard-block')?.remove();
            return;
        }

        const header = panel.querySelector('.comfy-ai-prompt-actions');
        if (header && !header.querySelector('[data-action="analyze-storyboard"]')) {
            header.insertAdjacentHTML('beforeend', `<button type="button" class="comfy-button comfy-storyboard-button" data-action="analyze-storyboard">连环画</button>`);
        }

        if (storyboard?.panels?.length) {
            renderStoryboardBlock({
                buildGenerateButtonGroup,
                messageId: getStableMessageId(messageNode),
                panel,
                storyboard,
            });
            setupGenerateButtonGroups(panel, { allowAutoGenerate: false });
        }
    }

    return {
        onStoryboardActionClick,
        renderStoryboardForPanel,
    };
}
