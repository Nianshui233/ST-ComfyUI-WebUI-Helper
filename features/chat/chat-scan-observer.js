export function createChatScanObserver({
    scanSystem,
    manualScan,
    streamingState,
    checkSendingStatus,
    getStableMessageId,
    markMessageAsStreamComplete,
    processMessageForImageActions,
    processPendingMessages,
    logger = console,
}) {
    let observerDebounceTimer = null;
    let contentStabilityTimer = null;

    function checkContentStability() {
        clearTimeout(contentStabilityTimer);

        contentStabilityTimer = setTimeout(async () => {
            const systemStatus = checkSendingStatus();

            if (!systemStatus.isSending) {
                logger.log('[AI Gen] 系统停止发送，处理流式消息');

                for (const [, info] of streamingState.activeMessages) {
                    markMessageAsStreamComplete(info.node);
                }

                await processPendingMessages();
            } else {
                const now = Date.now();
                for (const [messageId, info] of streamingState.activeMessages) {
                    const timeSinceStart = now - info.startTime;
                    const timeSinceUpdate = now - info.lastUpdate;

                    if (timeSinceUpdate > streamingState.config.stabilityDelay ||
                        timeSinceStart > streamingState.config.maxWaitTime) {
                        logger.log(`[AI Gen] 消息 ${messageId} 内容稳定，开始替换`);
                        await processMessageForImageActions(info.node, true);
                    }
                }
            }
        }, streamingState.config.stabilityDelay);
    }

    function processAddedNodes(mutation) {
        if (mutation.type !== 'childList' || mutation.addedNodes.length === 0) return false;

        mutation.addedNodes.forEach(node => {
            if (!manualScan.isEnabled()) return;
            if (node.nodeType === 1) {
                if (node.matches('.mes')) {
                    processMessageForImageActions(node);
                }
                node.querySelectorAll('.mes').forEach(msg => {
                    processMessageForImageActions(msg);
                });
            }
        });

        return true;
    }

    function processChangedMessage(mutation) {
        if (mutation.type !== 'characterData' && mutation.type !== 'childList') return false;
        if (!manualScan.isEnabled()) return false;

        let targetNode = mutation.target;
        while (targetNode && !targetNode.classList?.contains('mes')) {
            targetNode = targetNode.parentElement;
        }

        if (!targetNode?.classList?.contains('mes')) return false;

        const messageId = getStableMessageId(targetNode);
        const streamingInfo = streamingState.activeMessages.get(messageId);

        if (streamingInfo) {
            streamingInfo.lastUpdate = Date.now();
        }

        scanSystem.state.processedMessages.delete(targetNode);

        const now = Date.now();
        const lastDirtyTs = parseInt(targetNode.dataset.aiGenDirtyTs || '0', 10);
        if (now - lastDirtyTs > 120) {
            targetNode.dataset.aiGenDirtyTs = String(now);
            processMessageForImageActions(targetNode, false);
        }

        return true;
    }

    function processEditStateChange(mutation) {
        if (mutation.type !== 'attributes' || mutation.attributeName !== 'contenteditable') return false;
        if (!manualScan.isEnabled()) return false;

        const target = mutation.target;
        if (!target?.classList?.contains('mes_text')) return false;

        const messageNode = target.closest('.mes');
        const isEditable = target.getAttribute('contenteditable') === 'true';

        if (messageNode && !isEditable) {
            const messageId = getStableMessageId(messageNode);
            streamingState.activeMessages.delete(messageId);
            delete messageNode.dataset.streaming;

            scanSystem.state.processedMessages.delete(messageNode);

            setTimeout(() => {
                processMessageForImageActions(messageNode, true);
            }, 80);
        }

        return false;
    }

    function createObserver() {
        return new MutationObserver((mutations) => {
            clearTimeout(observerDebounceTimer);

            observerDebounceTimer = setTimeout(async () => {
                let hasNewContent = false;

                for (const mutation of mutations) {
                    if (processAddedNodes(mutation)) {
                        hasNewContent = true;
                    }

                    if (processChangedMessage(mutation)) {
                        hasNewContent = true;
                    }

                    processEditStateChange(mutation);
                }

                if (hasNewContent) {
                    checkContentStability();
                }

            }, scanSystem.config.throttleDelay);
        });
    }

    function disconnectTimers() {
        clearTimeout(observerDebounceTimer);
        clearTimeout(contentStabilityTimer);
        observerDebounceTimer = null;
        contentStabilityTimer = null;
    }

    return {
        checkContentStability,
        createObserver,
        disconnectTimers,
    };
}
