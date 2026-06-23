import { createConnectionMonitor } from '../core/connection-session.js';
import { createEmbeddingController } from '../resources/embedding-controller.js';
import { createHelperActivationController } from '../core/helper-activation.js';
import { createImg2ImgController } from '../generation/img2img-controller.js';
import { createManualScanController } from '../chat/manual-scan.js';
import { createMessageRuntime } from '../chat/message-runtime.js';
import { createObjectInfoCache } from '../core/object-info-cache.js';
import { createProgressTracker } from '../progress/progress-tracker.js';
import { MODES } from '../core/runtime-config.js';
import { ImageCacheDB } from '../../lib/storage/image-cache-db.js';
import {
    blobToDataUrl,
    createStorageAccessors,
    makeCancelledError,
    safeJsonParse,
} from '../../lib/core/utils.js';
import { createHttpClient } from '../../lib/http/http-client.js';
import { createToastNotifier } from '../../ui/core/toast.js';
import { createLogStore } from '../logs/log-service.js';

export function createAppRuntime({
    getValue,
    setValue,
    request,
    getCurrentMode,
    logger = console,
}) {
    const imageCacheDB = new ImageCacheDB();
    const logStore = createLogStore({ logger });
    const appLogger = logStore.createLogger(logger);
    const { getStoredValues, setStoredValues } = createStorageAccessors(getValue, setValue);
    const { makeRequest, makeRequestWithRetry } = createHttpClient({
        request,
        logger: appLogger,
    });

    const showToast = createToastNotifier({ logger: appLogger, logStore });
    const getCachedObjectInfo = createObjectInfoCache({ makeRequest, safeJsonParse });
    const manualScan = createManualScanController();
    const messageRuntime = createMessageRuntime({ logger: appLogger });
    const helperActivation = createHelperActivationController({
        getValue,
        setValue,
        manualScan,
        showToast,
        logger: appLogger,
    });

    const connectionMonitor = createConnectionMonitor({
        getCurrentMode,
        modes: MODES,
        getValue,
        makeRequest,
    });

    const progressTracker = createProgressTracker({
        modes: MODES,
        makeRequest,
        makeCancelledError,
        blobToDataUrl,
        logger: appLogger,
    });

    const embeddingController = createEmbeddingController({ safeJsonParse });
    const img2imgController = createImg2ImgController({ showToast });

    return {
        connectionMonitor,
        embeddingController,
        getCachedObjectInfo,
        getStoredValues,
        helperActivation,
        imageCacheDB,
        img2imgController,
        logger: appLogger,
        logStore,
        makeRequest,
        makeRequestWithRetry,
        manualScan,
        messageRuntime,
        progressTracker,
        setStoredValues,
        showToast,
    };
}
