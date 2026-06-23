import { DEFAULT_SETTINGS } from '../core/runtime-config.js';
import {
    escapeHTML,
    simpleHash,
} from '../../lib/core/utils.js';

export function createAiPromptGenerateButtons({
    getValue,
    imageCacheDB,
    displayImage,
    setupGeneratedState,
    checkSendingStatus,
}) {
    function buildGenerateButtonGroup(prompt, messageId, source = 'tag') {
        const cleanPrompt = String(prompt || '').trim();
        const encodedPrompt = escapeHTML(cleanPrompt);
        const generationId = simpleHash(`${source}_${cleanPrompt}_${messageId}`);
        const label = source === 'ai_prompt' ? '生成图片' : '开始生成';
        return `<span class="comfy-button-group" data-generation-id="${generationId}" data-processed-tag="${source === 'tag'}" data-source="${escapeHTML(source)}"><button type="button" class="comfy-button comfy-chat-generate-button" data-prompt="${encodedPrompt}">${label}</button></span>`;
    }

    async function setupGenerateButtonGroup(group, { allowAutoGenerate = false } = {}) {
        if (!group || group.dataset.listenerAttached) return;
        group.dataset.listenerAttached = 'true';

        const id = group.dataset.generationId;
        const btn = group.querySelector('.comfy-chat-generate-button');
        if (!id || !btn) return;

        const cached = await imageCacheDB.getImage(id);
        if (cached) {
            await displayImage(group, id);
            await setupGeneratedState(btn, id);
            return;
        }

        const autoGen = allowAutoGenerate
            ? await getValue('comfyui_auto_generate', DEFAULT_SETTINGS.autoGenerate)
            : false;
        const systemStatus = checkSendingStatus();
        if (autoGen && !systemStatus.isSending && !btn.dataset.autoTriggered) {
            btn.dataset.autoTriggered = 'true';
            setTimeout(() => btn.click(), 300);
        }
    }

    async function setupGenerateButtonGroups(container, options = {}) {
        const buttonGroups = container.querySelectorAll('.comfy-button-group');
        for (const group of buttonGroups) {
            await setupGenerateButtonGroup(group, options);
        }
    }

    return {
        buildGenerateButtonGroup,
        setupGenerateButtonGroups,
    };
}
