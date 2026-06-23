import { createImageCacheSaver } from './image-cache-saver.js';
import { createImageCacheViewer } from './image-cache-viewer.js';

export function createImageCacheController({
    imageCacheDB,
    blobUrlTracker,
    makeRequestWithRetry,
    getCurrentMode,
    showToast,
    logger = console,
}) {
    const { saveImageToCache } = createImageCacheSaver({
        imageCacheDB,
        makeRequestWithRetry,
        getCurrentMode,
        showToast,
        logger,
    });
    const { loadImageCache } = createImageCacheViewer({
        imageCacheDB,
        blobUrlTracker,
        showToast,
        logger,
    });

    async function deleteImageFromCache(imageId) {
        try {
            await imageCacheDB.deleteImage(imageId);
        } catch (error) {
            logger.error('[AI Gen] 删除缓存失败:', error);
            throw error;
        }
    }

    async function clearAllCache() {
        if (confirm('确定要清空所有缓存图片吗？此操作不可撤销。')) {
            try {
                await imageCacheDB.clearAll();
                await loadImageCache();
                showToast('success', '所有缓存已清空');
            } catch (error) {
                logger.error('[AI Gen] 清空缓存失败:', error);
                showToast('error', '清空失败');
            }
        }
    }

    return {
        saveImageToCache,
        loadImageCache,
        deleteImageFromCache,
        clearAllCache,
    };
}
