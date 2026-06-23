import { createChatScanCore } from './chat-scan-core.js';
import { createChatScanObserver } from './chat-scan-observer.js';

export function createChatScanSystem({
    getValue,
    manualScan,
    streamingState,
    checkSendingStatus,
    getStableMessageId,
    isMessageBeingEdited,
    markMessageAsStreamComplete,
    processMessageForImageActions,
    processPendingMessages,
    logger = console,
}) {
    let scanScheduler = null;

    const ScanSystem = createChatScanCore({
        getValue,
        streamingState,
        checkSendingStatus,
        isMessageBeingEdited,
        processMessageForImageActions,
        processPendingMessages,
        logger,
    });

    const chatObserverFactory = createChatScanObserver({
        scanSystem: ScanSystem,
        manualScan,
        streamingState,
        checkSendingStatus,
        getStableMessageId,
        markMessageAsStreamComplete,
        processMessageForImageActions,
        processPendingMessages,
        logger,
    });

    function startContinuousScan(mainChat) {
        stopContinuousScan();

        let lastInterval = ScanSystem.getCurrentInterval();

        const scheduleScan = () => {
            if (!manualScan.isEnabled()) {
                scanScheduler = setTimeout(scheduleScan, lastInterval);
                return;
            }

            const currentInterval = ScanSystem.getCurrentInterval();

            if (currentInterval !== lastInterval) {
                logger.log(`[AI Gen Scan] 扫描间隔调整: ${lastInterval}ms -> ${currentInterval}ms`);
                lastInterval = currentInterval;
                stopContinuousScan();
                startContinuousScan(mainChat);
                return;
            }

            ScanSystem.incrementalScan(mainChat).catch(err => {
                logger.error('[AI Gen Scan] 扫描失败:', err);
            });

            scanScheduler = setTimeout(scheduleScan, currentInterval);
        };

        scheduleScan();

        logger.log(`[AI Gen Scan] 持续扫描已启动，初始间隔: ${lastInterval}ms`);
    }

    function stopContinuousScan() {
        if (scanScheduler) {
            clearTimeout(scanScheduler);
            scanScheduler = null;
        }
    }

    function attach(mainChat) {
        const chatObserver = chatObserverFactory.createObserver();

        chatObserver.observe(mainChat, {
            childList: true,
            subtree: true,
            characterData: true,
            characterDataOldValue: false,
            attributes: true,
            attributeFilter: ['contenteditable', 'class'],
        });

        manualScan.setControls({
            scanNow: async () => {
                ScanSystem.state.processedMessages = new WeakSet();
                await ScanSystem.incrementalScan(mainChat);
            },
            start: () => startContinuousScan(mainChat),
            stop: stopContinuousScan,
        });

        document.addEventListener('visibilitychange', async () => {
            if (!document.hidden) {
                if (!manualScan.isEnabled()) return;
                logger.log('[AI Gen] 页面重新可见，执行强制扫描');
                ScanSystem.state.processedMessages = new WeakSet();
                await ScanSystem.incrementalScan(mainChat);
            }
        });

        window._AI_Gen_ScanSystem = ScanSystem;
        return ScanSystem;
    }

    return {
        attach,
        scanSystem: ScanSystem,
        startContinuousScan,
        stopContinuousScan,
    };
}
