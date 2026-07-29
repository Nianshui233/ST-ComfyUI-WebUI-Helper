import { DEFAULT_SETTINGS } from '../core/runtime-config.js';

async function createThumbnailBlob(blob, mediaType) {
    if (mediaType === 'video' || !blob?.type?.startsWith('image/') || typeof createImageBitmap !== 'function') return null;
    let bitmap;
    try {
        bitmap = await createImageBitmap(blob);
        const scale = Math.min(1, 360 / Math.max(bitmap.width, bitmap.height));
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
        return await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.78));
    } catch {
        return null;
    } finally {
        bitmap?.close?.();
    }
}

export function createImageCacheSaver({
    imageCacheDB,
    makeRequestWithRetry,
    getCurrentMode,
    getStoredValues,
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

            const mediaType = metadata.mediaType || (blob.type.startsWith('video/') ? 'video' : 'image');
            const thumbnailBlob = await createThumbnailBlob(blob, mediaType);
            await imageCacheDB.saveImage(generationId, blob, {
                prompt,
                mode: getCurrentMode(),
                metadata,
                mediaType,
                mimeType: blob.type,
                fileName: metadata.fileName || '',
                thumbnailBlob,
                timestamp: Date.now(),
            });

            const limits = await getStoredValues?.([
                ['comfyui_cache_max_size_mb', DEFAULT_SETTINGS.cacheMaxSizeMB],
                ['comfyui_cache_max_count', DEFAULT_SETTINGS.cacheMaxCount],
            ]) || {};
            const maxSize = Math.max(25, Number(limits.comfyui_cache_max_size_mb) || DEFAULT_SETTINGS.cacheMaxSizeMB) * 1024 * 1024;
            const maxCount = Math.max(20, Number(limits.comfyui_cache_max_count) || DEFAULT_SETTINGS.cacheMaxCount);
            const deletedCount = await imageCacheDB.pruneOldImages(maxSize, maxCount);
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
