export function createImageCacheSaver({
    imageCacheDB,
    makeRequestWithRetry,
    getCurrentMode,
    showToast,
    logger = console,
}) {
    async function saveImageToCache(generationId, imageUrl, prompt, metadata = {}) {
        try {
            let blob;

            if (imageUrl.startsWith('data:')) {
                const response = await fetch(imageUrl);
                blob = await response.blob();
            } else {
                const response = await makeRequestWithRetry({
                    method: 'GET',
                    url: imageUrl,
                    responseType: 'blob',
                    timeout: 60000,
                }, 3);

                blob = response.response instanceof Blob
                    ? response.response
                    : new Blob([response.response]);
            }

            await imageCacheDB.saveImage(generationId, blob, {
                prompt,
                mode: getCurrentMode(),
                metadata,
                timestamp: Date.now(),
            });

            const deletedCount = await imageCacheDB.pruneOldImages(200 * 1024 * 1024, 200);
            if (deletedCount > 0) {
                logger.log(`[AI Gen] 自动清理旧缓存 ${deletedCount} 张`);
            }
        } catch (error) {
            logger.error('[AI Gen] 保存图片失败:', {
                generationId,
                imageUrl,
                mode: getCurrentMode(),
                error,
            });

            if (error?.name === 'QuotaExceededError') {
                showToast('error', '浏览器存储空间不足，无法缓存图片，请在“图片缓存”中清理一些图片');
            } else {
                showToast('error', `图片保存失败: ${error.message || error}`);
            }
            throw error;
        }
    }

    return {
        saveImageToCache,
    };
}
