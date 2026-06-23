import { AI_PROMPT_EXTRA_KEY } from '../ai-prompt/ai-prompt-message-store.js';

export function createStoryboardStore({
    getChatMessageByNode,
    saveChatConditional,
}) {
    function ensureExtra(message) {
        if (!message.extra || typeof message.extra !== 'object') {
            message.extra = {};
        }
        if (!message.extra[AI_PROMPT_EXTRA_KEY] || typeof message.extra[AI_PROMPT_EXTRA_KEY] !== 'object') {
            message.extra[AI_PROMPT_EXTRA_KEY] = {};
        }
        return message.extra[AI_PROMPT_EXTRA_KEY];
    }

    function getStoryboard(message) {
        const storyboard = message?.extra?.[AI_PROMPT_EXTRA_KEY]?.storyboard;
        if (!storyboard || typeof storyboard !== 'object') return null;
        if (!Array.isArray(storyboard.panels)) return null;
        return storyboard;
    }

    async function saveStoryboardToMessage(messageNode, storyboard) {
        const { index, message } = getChatMessageByNode(messageNode);
        if (!message) throw new Error('无法定位当前聊天消息');

        const extra = ensureExtra(message);
        extra.storyboard = {
            ...storyboard,
            updated_at: new Date().toISOString(),
        };
        await saveChatConditional();
        return { index, message, storyboard: extra.storyboard };
    }

    async function updateStoryboardPanel(messageNode, panelId, patch) {
        const { message } = getChatMessageByNode(messageNode);
        const storyboard = getStoryboard(message);
        if (!storyboard) throw new Error('当前消息没有可更新的连环画分镜');

        storyboard.panels = storyboard.panels.map(panel => (
            panel.id === panelId
                ? { ...panel, ...patch, updated_at: new Date().toISOString() }
                : panel
        ));
        storyboard.updated_at = new Date().toISOString();
        await saveChatConditional();
        return storyboard;
    }

    async function deleteStoryboardPanel(messageNode, panelId) {
        const { message } = getChatMessageByNode(messageNode);
        const storyboard = getStoryboard(message);
        if (!storyboard) return null;

        storyboard.panels = storyboard.panels
            .filter(panel => panel.id !== panelId)
            .map((panel, index) => ({ ...panel, index: index + 1 }));
        storyboard.updated_at = new Date().toISOString();
        await saveChatConditional();
        return storyboard;
    }

    async function clearStoryboardFromMessage(messageNode) {
        const { message } = getChatMessageByNode(messageNode);
        if (!message?.extra?.[AI_PROMPT_EXTRA_KEY]?.storyboard) return;
        delete message.extra[AI_PROMPT_EXTRA_KEY].storyboard;
        await saveChatConditional();
    }

    return {
        clearStoryboardFromMessage,
        deleteStoryboardPanel,
        getStoryboard,
        saveStoryboardToMessage,
        updateStoryboardPanel,
    };
}
