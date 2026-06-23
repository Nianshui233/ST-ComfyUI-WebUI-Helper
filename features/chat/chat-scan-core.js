import { DEFAULT_SETTINGS } from '../core/runtime-config.js';

export function createChatScanCore({
    getValue,
    streamingState,
    checkSendingStatus,
    isMessageBeingEdited,
    processMessageForImageActions,
    processPendingMessages,
    logger = console,
}) {
    return {
        state: {
            isScanning: false,
            lastScanTime: 0,
            processedMessages: new WeakSet(),
            scanCount: 0,
            missedCount: 0,
        },

        config: {
            idleInterval: 3000,
            activeInterval: 800,
            streamingInterval: 300,
            batchSize: 10,
            throttleDelay: 50,
        },

        getCurrentInterval() {
            const systemStatus = checkSendingStatus();

            if (systemStatus.isStreaming) {
                return this.config.streamingInterval;
            } else if (streamingState.activeMessages.size > 0 || streamingState.pendingQueue.size > 0) {
                return this.config.activeInterval;
            } else {
                return this.config.idleInterval;
            }
        },

        async incrementalScan(mainChat) {
            if (this.state.isScanning) return;
            this.state.isScanning = true;

            try {
                const allMessages = Array.from(mainChat.querySelectorAll('.mes'));
                const unprocessedMessages = allMessages.filter(msg => !this.state.processedMessages.has(msg));

                if (unprocessedMessages.length > 0) {
                    logger.log(`[AI Gen Scan] 发现 ${unprocessedMessages.length} 条未处理消息`);

                    for (let i = 0; i < unprocessedMessages.length; i += this.config.batchSize) {
                        const batch = unprocessedMessages.slice(i, i + this.config.batchSize);

                        await Promise.all(batch.map(async (msg) => {
                            try {
                                await processMessageForImageActions(msg);
                                this.state.processedMessages.add(msg);
                            } catch (e) {
                                logger.error('[AI Gen Scan] 处理消息失败:', e);
                            }
                        }));

                        if (i + this.config.batchSize < unprocessedMessages.length) {
                            await new Promise(resolve => setTimeout(resolve, 10));
                        }
                    }

                    this.state.scanCount++;
                }

                await this.checkMissedTags(allMessages);

                const systemStatus = checkSendingStatus();
                if (!systemStatus.isSending && streamingState.activeMessages.size > 0) {
                    for (const [, info] of streamingState.activeMessages) {
                        await processMessageForImageActions(info.node, true);
                    }
                }
                if (streamingState.pendingQueue.size > 0) {
                    await processPendingMessages();
                }

            } finally {
                this.state.isScanning = false;
                this.state.lastScanTime = Date.now();
            }
        },

        async checkMissedTags(messages) {
            const startTag = await getValue('comfyui_start_tag', DEFAULT_SETTINGS.startTag);
            const endTag = await getValue('comfyui_end_tag', DEFAULT_SETTINGS.endTag);

            const missedMessages = messages.filter(msg => {
                const mesText = msg.querySelector('.mes_text');
                if (!mesText) return false;

                const hasTag = mesText.textContent.includes(startTag) && mesText.textContent.includes(endTag);
                const hasButton = mesText.querySelector('.comfy-button-group[data-source="tag"], .comfy-button-group[data-processed-tag="true"]');

                return hasTag && !hasButton && !isMessageBeingEdited(msg);
            });

            if (missedMessages.length > 0) {
                logger.warn(`[AI Gen Scan] 发现 ${missedMessages.length} 条遗漏标记，正在补救`);
                this.state.missedCount += missedMessages.length;

                for (const msg of missedMessages) {
                    await processMessageForImageActions(msg, true);
                    this.state.processedMessages.add(msg);
                }
            }
        },

        cleanup() {
        },
    };
}
