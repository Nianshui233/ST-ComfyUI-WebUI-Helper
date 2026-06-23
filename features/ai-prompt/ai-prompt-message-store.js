import { DEFAULT_SETTINGS } from '../core/runtime-config.js';
import {
    escapeRegex,
    stripHtmlToText,
} from '../../lib/core/utils.js';

export const AI_PROMPT_EXTRA_KEY = 'st_comfyui_webui_helper';

export function createAiPromptMessageStore({
    getContext,
    getValue,
    saveChatConditional,
}) {
    function getMessageIndexFromNode(messageNode) {
        const nativeId = messageNode?.getAttribute('mesid') ?? messageNode?.dataset?.messageId;
        const index = Number.parseInt(nativeId, 10);
        return Number.isInteger(index) && index >= 0 ? index : -1;
    }

    function getChatMessageByNode(messageNode) {
        const index = getMessageIndexFromNode(messageNode);
        if (index < 0) return { index, message: null, context: null };

        const context = getContext();
        const message = Array.isArray(context?.chat) ? context.chat[index] : null;
        return { index, message, context };
    }

    function isAiPromptEligibleMessage(messageNode) {
        const { message } = getChatMessageByNode(messageNode);
        const isUser = messageNode?.getAttribute('is_user') === 'true' || message?.is_user === true;
        const isSystem = messageNode?.getAttribute('is_system') === 'true' || message?.is_system === true;
        const type = String(messageNode?.getAttribute('type') || message?.extra?.type || '').toLowerCase();
        return !!messageNode && !!message && !isUser && !isSystem && !type.includes('narrator') && !type.includes('assistant_note');
    }

    function ensureAiPromptExtra(message) {
        if (!message.extra || typeof message.extra !== 'object') {
            message.extra = {};
        }
        if (!message.extra[AI_PROMPT_EXTRA_KEY] || typeof message.extra[AI_PROMPT_EXTRA_KEY] !== 'object') {
            message.extra[AI_PROMPT_EXTRA_KEY] = {};
        }
        return message.extra[AI_PROMPT_EXTRA_KEY];
    }

    function getStoredAiPrompt(message) {
        const prompt = message?.extra?.[AI_PROMPT_EXTRA_KEY]?.ai_prompt;
        return typeof prompt === 'string' ? prompt.trim() : '';
    }

    async function saveAiPromptToMessage(messageNode, prompt, rawOutput = '') {
        const { index, message } = getChatMessageByNode(messageNode);
        if (!message) throw new Error('无法定位当前聊天消息');

        const extra = ensureAiPromptExtra(message);
        extra.ai_prompt = String(prompt || '').trim();
        extra.ai_prompt_raw = String(rawOutput || '').trim();
        extra.ai_prompt_updated_at = new Date().toISOString();

        await saveChatConditional();
        return { index, message, prompt: extra.ai_prompt };
    }

    async function clearAiPromptFromMessage(messageNode) {
        const { message } = getChatMessageByNode(messageNode);
        if (!message?.extra?.[AI_PROMPT_EXTRA_KEY]) return;
        delete message.extra[AI_PROMPT_EXTRA_KEY].ai_prompt;
        delete message.extra[AI_PROMPT_EXTRA_KEY].ai_prompt_raw;
        delete message.extra[AI_PROMPT_EXTRA_KEY].ai_prompt_updated_at;
        await saveChatConditional();
    }

    function stripConfiguredImageTags(text, startTag, endTag) {
        let result = String(text || '');
        const pairs = [
            ['[IMG_GEN]', '[/IMG_GEN]'],
            [startTag, endTag],
        ].filter(([start, end]) => start && end);

        for (const [start, end] of pairs) {
            const regex = new RegExp(`${escapeRegex(start)}[\\s\\S]*?${escapeRegex(end)}`, 'gi');
            result = result.replace(regex, ' ');
        }

        return result.replace(/\s+/g, ' ').trim();
    }

    async function getCleanMessageTextForAiPrompt(message, startTag, endTag) {
        const currentSwipe = Array.isArray(message?.swipes) && Number.isInteger(message?.swipe_id)
            ? message.swipes[message.swipe_id]
            : '';
        const raw = currentSwipe || message?.mes || '';
        return stripConfiguredImageTags(stripHtmlToText(raw), startTag, endTag);
    }

    async function buildAiPromptContext(targetIndex, contextLimit) {
        const context = getContext();
        const chat = Array.isArray(context?.chat) ? context.chat : [];
        const startTag = await getValue('comfyui_start_tag', DEFAULT_SETTINGS.startTag);
        const endTag = await getValue('comfyui_end_tag', DEFAULT_SETTINGS.endTag);
        const startIndex = Math.max(0, targetIndex - contextLimit + 1);
        const selected = [];

        for (let index = startIndex; index <= targetIndex && index < chat.length; index++) {
            const message = chat[index];
            if (!message || message.is_system) continue;

            const text = await getCleanMessageTextForAiPrompt(message, startTag, endTag);
            if (!text) continue;

            selected.push({
                index,
                role: message.is_user ? 'User' : 'Assistant',
                name: message.name || (message.is_user ? 'User' : 'Assistant'),
                text,
            });
        }

        return selected;
    }

    return {
        buildAiPromptContext,
        clearAiPromptFromMessage,
        getChatMessageByNode,
        getStoredAiPrompt,
        isAiPromptEligibleMessage,
        saveAiPromptToMessage,
    };
}
