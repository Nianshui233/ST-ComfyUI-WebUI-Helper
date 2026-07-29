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
    htmlToText = stripHtmlToText,
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

    function getAiPromptState(message) {
        const extra = message?.extra?.[AI_PROMPT_EXTRA_KEY] || {};
        const versions = Array.isArray(extra.ai_prompt_versions) ? extra.ai_prompt_versions : [];
        return {
            prompt: getStoredAiPrompt(message),
            locked: extra.ai_prompt_locked === true,
            versions: versions.filter(item => item && typeof item.prompt === 'string').slice(-20),
        };
    }

    async function saveAiPromptToMessage(messageNode, prompt, rawOutput = '', metadata = {}) {
        const { index, message } = getChatMessageByNode(messageNode);
        if (!message) throw new Error('无法定位当前聊天消息');

        const extra = ensureAiPromptExtra(message);
        if (extra.ai_prompt_locked === true && metadata.source === 'generated' && metadata.force !== true) {
            throw new Error('当前绘图提示词已锁定，请先解锁再重写');
        }
        extra.ai_prompt = String(prompt || '').trim();
        extra.ai_prompt_raw = String(rawOutput || '').trim();
        extra.ai_prompt_updated_at = new Date().toISOString();
        if (metadata.generationProfile) {
            extra.ai_prompt_generation_profile = String(metadata.generationProfile);
        }
        const versions = Array.isArray(extra.ai_prompt_versions) ? extra.ai_prompt_versions : [];
        const latest = versions.at(-1);
        if (extra.ai_prompt && latest?.prompt !== extra.ai_prompt) {
            versions.push({
                id: `prompt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                prompt: extra.ai_prompt,
                source: metadata.source || 'manual',
                createdAt: extra.ai_prompt_updated_at,
                generationProfile: metadata.generationProfile || '',
            });
        }
        extra.ai_prompt_versions = versions.slice(-20);

        await saveChatConditional();
        return { index, message, prompt: extra.ai_prompt };
    }

    async function clearAiPromptFromMessage(messageNode) {
        const { message } = getChatMessageByNode(messageNode);
        if (!message?.extra?.[AI_PROMPT_EXTRA_KEY]) return;
        delete message.extra[AI_PROMPT_EXTRA_KEY].ai_prompt;
        delete message.extra[AI_PROMPT_EXTRA_KEY].ai_prompt_raw;
        delete message.extra[AI_PROMPT_EXTRA_KEY].ai_prompt_updated_at;
        delete message.extra[AI_PROMPT_EXTRA_KEY].ai_prompt_generation_profile;
        delete message.extra[AI_PROMPT_EXTRA_KEY].ai_prompt_versions;
        delete message.extra[AI_PROMPT_EXTRA_KEY].ai_prompt_locked;
        await saveChatConditional();
    }

    async function toggleAiPromptLock(messageNode) {
        const { message } = getChatMessageByNode(messageNode);
        if (!message) throw new Error('无法定位当前聊天消息');
        const extra = ensureAiPromptExtra(message);
        extra.ai_prompt_locked = extra.ai_prompt_locked !== true;
        await saveChatConditional();
        return extra.ai_prompt_locked;
    }

    async function restoreAiPromptVersion(messageNode, versionId) {
        const { message } = getChatMessageByNode(messageNode);
        const state = getAiPromptState(message);
        const version = state.versions.find(item => item.id === versionId);
        if (!version) throw new Error('所选提示词版本不存在');
        return saveAiPromptToMessage(messageNode, version.prompt, version.prompt, {
            force: true,
            source: 'restore',
            generationProfile: version.generationProfile,
        });
    }

    function stripConfiguredImageTags(text, startTag, endTag) {
        let result = String(text || '');
        const pairs = [
            ['[IMG_GEN]', '[/IMG_GEN]'],
            [startTag, endTag],
        ].filter(([start, end]) => start && end);

        for (const [start, end] of pairs) {
            const regex = new RegExp(`${escapeRegex(start)}[\\s\\S]*?${escapeRegex(end)}`, 'gi');
            result = result.replace(regex, '\n');
        }

        return result
            .replace(/\r\n?/g, '\n')
            .split('\n')
            .map(line => line.replace(/[ \t]+$/g, ''))
            .join('\n')
            .replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, '\n\n')
            .trim();
    }

    async function getCleanMessageTextForAiPrompt(message, startTag, endTag) {
        const currentSwipe = Array.isArray(message?.swipes) && Number.isInteger(message?.swipe_id)
            ? message.swipes[message.swipe_id]
            : '';
        const raw = currentSwipe || message?.mes || '';
        return stripConfiguredImageTags(htmlToText(raw), startTag, endTag);
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
        getAiPromptState,
        getStoredAiPrompt,
        isAiPromptEligibleMessage,
        saveAiPromptToMessage,
        restoreAiPromptVersion,
        toggleAiPromptLock,
    };
}
