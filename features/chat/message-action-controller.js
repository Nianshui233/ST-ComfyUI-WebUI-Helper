import { DEFAULT_SETTINGS } from '../core/runtime-config.js';
import { escapeRegex } from '../../lib/core/utils.js';

export function createMessageActionController({
    streamingState,
    getValue,
    getStableMessageId,
    checkSendingStatus,
    buildGenerateButtonGroup,
    setupGenerateButtonGroups,
    renderAiPromptControlsForMessage,
    logger = console,
}) {
    function isMessageBeingEdited(messageNode) {
        if (!messageNode) return false;

        const editableText = messageNode.querySelector('.mes_text[contenteditable="true"]');
        if (editableText) return true;

        return messageNode.classList.contains('editing') ||
            messageNode.classList.contains('mes_editing') ||
            messageNode.classList.contains('edit');
    }

    function isMessageStreaming(messageNode) {
        if (!messageNode) return false;

        const isLastMessage = messageNode.classList.contains('last_mes');
        const systemStatus = checkSendingStatus();
        if (isLastMessage && systemStatus.isStreaming) {
            return true;
        }

        const hasStreamingMarker =
            messageNode.classList.contains('streaming') ||
            messageNode.classList.contains('generating') ||
            messageNode.dataset.streaming === 'true';
        if (hasStreamingMarker) {
            return true;
        }

        const messageId = getStableMessageId(messageNode);
        const streamingInfo = streamingState.activeMessages.get(messageId);
        if (streamingInfo) {
            return Date.now() - streamingInfo.lastUpdate < 1000;
        }

        return false;
    }

    function markMessageAsStreaming(messageNode, detectedTags = []) {
        const messageId = getStableMessageId(messageNode);
        streamingState.activeMessages.set(messageId, {
            node: messageNode,
            detectedTags,
            lastUpdate: Date.now(),
            startTime: Date.now(),
        });
        messageNode.dataset.streaming = 'true';
        logger.log(`[AI Gen] 标记消息 ${messageId} 为流式中，检测到 ${detectedTags.length} 个标记`);
    }

    function markMessageAsStreamComplete(messageNode) {
        const messageId = getStableMessageId(messageNode);
        if (!streamingState.activeMessages.has(messageId)) return;

        const info = streamingState.activeMessages.get(messageId);
        const duration = Date.now() - info.startTime;
        logger.log(`[AI Gen] 消息 ${messageId} 流式完成，耗时 ${duration}ms`);

        streamingState.activeMessages.delete(messageId);
        delete messageNode.dataset.streaming;
        streamingState.pendingQueue.add(messageId);
    }

    async function detectTagsInMessage(messageNode) {
        const mesText = messageNode.querySelector('.mes_text');
        if (!mesText) return [];

        const startTag = await getValue('comfyui_start_tag', DEFAULT_SETTINGS.startTag);
        const endTag = await getValue('comfyui_end_tag', DEFAULT_SETTINGS.endTag);
        if (!startTag || !endTag) return [];

        const regex = new RegExp(escapeRegex(startTag) + '([\\s\\S]*?)' + escapeRegex(endTag), 'g');
        const detectedTags = [];
        let match;

        while ((match = regex.exec(mesText.innerHTML)) !== null) {
            const cleanPrompt = match[1].replace(/<[^>]*>/g, '').trim();
            if (cleanPrompt) {
                detectedTags.push({
                    fullMatch: match[0],
                    prompt: cleanPrompt,
                    startIndex: match.index,
                });
            }
        }

        return detectedTags;
    }

    async function processMessageForImageActions(messageNode, forceReplace = false) {
        if (!forceReplace && isMessageBeingEdited(messageNode)) return;

        const now = Date.now();
        const lastProcessTime = messageNode.dataset.lastProcessTime ? parseInt(messageNode.dataset.lastProcessTime, 10) : 0;
        if (!forceReplace && now - lastProcessTime < 100) return;

        messageNode.dataset.lastProcessTime = now.toString();

        const mesText = messageNode.querySelector('.mes_text');
        if (!mesText) return;

        const messageId = getStableMessageId(messageNode);
        const detectedTags = await detectTagsInMessage(messageNode);

        if (detectedTags.length === 0) {
            if (streamingState.activeMessages.has(messageId)) {
                markMessageAsStreamComplete(messageNode);
            }
            await renderAiPromptControlsForMessage(messageNode, { allowAuto: forceReplace || !isMessageStreaming(messageNode) });
            return;
        }

        const streaming = !forceReplace && isMessageStreaming(messageNode);
        if (streaming) {
            markMessageAsStreaming(messageNode, detectedTags);
            logger.log(`[AI Gen] 消息 ${messageId} 流式中，检测到 ${detectedTags.length} 个标记，等待完成...`);
            return;
        }

        logger.log(`[AI Gen] 消息 ${messageId} 开始替换标记为按钮`);

        const startTag = await getValue('comfyui_start_tag', DEFAULT_SETTINGS.startTag);
        const endTag = await getValue('comfyui_end_tag', DEFAULT_SETTINGS.endTag);
        const regex = new RegExp(escapeRegex(startTag) + '([\\s\\S]*?)' + escapeRegex(endTag), 'g');

        mesText.innerHTML = mesText.innerHTML.replace(regex, (_match, prompt) => {
            const cleanPrompt = prompt.replace(/<[^>]*>/g, '').trim();
            if (!cleanPrompt) return _match;
            return buildGenerateButtonGroup(cleanPrompt, messageId, 'tag');
        });

        await setupGenerateButtonGroups(mesText, { allowAutoGenerate: true });
        await renderAiPromptControlsForMessage(messageNode, { allowAuto: forceReplace || !isMessageStreaming(messageNode) });

        if (streamingState.activeMessages.has(messageId)) {
            markMessageAsStreamComplete(messageNode);
        }
        streamingState.pendingQueue.delete(messageId);
    }

    async function processPendingMessages() {
        if (streamingState.pendingQueue.size === 0) return;

        const messageIds = Array.from(streamingState.pendingQueue);
        logger.log(`[AI Gen] 处理 ${messageIds.length} 个待处理消息`);

        for (const messageId of messageIds) {
            const messageNode = document.querySelector(`[data-ai-gen-id="${messageId}"]`);
            if (messageNode) {
                await processMessageForImageActions(messageNode, true);
            } else {
                streamingState.pendingQueue.delete(messageId);
            }
        }
    }

    return {
        detectTagsInMessage,
        isMessageBeingEdited,
        isMessageStreaming,
        markMessageAsStreaming,
        markMessageAsStreamComplete,
        processMessageForImageActions,
        processPendingMessages,
    };
}
