export function createMessageRuntime({ logger = console } = {}) {
    const streamingState = {
        activeMessages: new Map(),
        pendingQueue: new Set(),
        config: {
            stabilityDelay: 800,
            maxWaitTime: 30000,
            checkInterval: 300,
        },
    };

    function getStableMessageId(messageNode) {
        const nativeId = messageNode.dataset.messageId ||
            messageNode.getAttribute('mesid') ||
            messageNode.querySelector('[data-message-id]')?.dataset.messageId;

        if (nativeId) {
            return `native_${nativeId}`;
        }

        if (messageNode.dataset.aiGenId) {
            return messageNode.dataset.aiGenId;
        }

        const newId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        messageNode.dataset.aiGenId = newId;

        return newId;
    }

    function isElementVisible(element) {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        return element.offsetParent !== null || style.position === 'fixed';
    }

    function checkSendingStatus() {
        const sendButton = document.getElementById('send_but');
        const stopButton = document.getElementById('mes_stop');

        const isSendButtonVisible = isElementVisible(sendButton);
        const isSendButtonHidden = !isSendButtonVisible;
        const isStopButtonVisible = isElementVisible(stopButton);

        const isSending = isStopButtonVisible;

        const lastMessage = document.querySelector('.mes.last_mes');
        const hasStreamingClass = !!(lastMessage && (
            lastMessage.classList.contains('streaming') ||
            lastMessage.classList.contains('generating') ||
            lastMessage.dataset.streaming === 'true'
        ));

        const isStreaming = isSending || hasStreamingClass;

        let confidence = 0;
        if (isStopButtonVisible) confidence += 0.7;
        if (hasStreamingClass) confidence += 0.3;
        if (isStopButtonVisible && isSendButtonHidden) confidence += 0.1;

        return {
            isSending,
            isStreaming,
            confidence: Math.min(confidence, 1.0),
            details: {
                sendButtonVisible: isSendButtonVisible,
                sendButtonHidden: isSendButtonHidden,
                stopButtonVisible: isStopButtonVisible,
                hasStreamingClass,
            },
        };
    }

    function logRuntimeConfig() {
        logger.log(
            `[AI Gen] 配置: 稳定延迟=${streamingState.config.stabilityDelay}ms, 检查间隔=${streamingState.config.checkInterval}ms`,
        );
    }

    return {
        checkSendingStatus,
        getStableMessageId,
        logRuntimeConfig,
        streamingState,
    };
}
