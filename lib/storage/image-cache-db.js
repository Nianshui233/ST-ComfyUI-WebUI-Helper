import { safeJsonParse } from '../core/utils.js';

export class ImageCacheDB {
    constructor() {
        this.dbName = 'AIGenerator_ImageCache';
        this.storeName = 'images';
        this.tagStoreName = 'danbooru_tags';
        this.version = 3;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('[AI Gen DB] 打开失败:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                let objectStore;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    objectStore = db.createObjectStore(this.storeName, { keyPath: 'id' });
                } else {
                    objectStore = event.target.transaction.objectStore(this.storeName);
                }
                if (!objectStore.indexNames.contains('timestamp')) {
                    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                if (!objectStore.indexNames.contains('mode')) {
                    objectStore.createIndex('mode', 'mode', { unique: false });
                }
                if (!objectStore.indexNames.contains('mediaType')) {
                    objectStore.createIndex('mediaType', 'mediaType', { unique: false });
                }

                if (!db.objectStoreNames.contains(this.tagStoreName)) {
                    const tagStore = db.createObjectStore(this.tagStoreName, { keyPath: 'tag' });
                    tagStore.createIndex('normalized', 'normalized', { unique: false });
                    tagStore.createIndex('count', 'count', { unique: false });
                    tagStore.createIndex('category', 'category', { unique: false });
                }
            };
        });
    }

    async saveImage(id, imageBlob, metadata) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            const data = {
                id,
                blob: imageBlob,
                thumbnailBlob: metadata.thumbnailBlob || null,
                prompt: metadata.prompt || '',
                mode: metadata.mode || 'unknown',
                mediaType: metadata.mediaType || (imageBlob?.type?.startsWith('video/') ? 'video' : 'image'),
                mimeType: metadata.mimeType || imageBlob?.type || '',
                fileName: metadata.fileName || '',
                metadata: metadata.metadata || {},
                timestamp: metadata.timestamp || Date.now(),
            };

            const request = store.put(data);
            request.onsuccess = () => resolve();
            request.onerror = () => {
                console.error(`[AI Gen DB] 保存失败 [${id}]:`, request.error);
                reject(request.error);
            };
        });
    }

    async getImage(id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllImages() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteImage(id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clearAll() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getStorageInfo() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([this.storeName], 'readonly');
            const store = tx.objectStore(this.storeName);
            let count = 0;
            let totalSize = 0;
            const req = store.openCursor();

            req.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    count++;
                    if (cursor.value.blob) totalSize += cursor.value.blob.size;
                    cursor.continue();
                    return;
                }

                resolve({ count, totalSize, sizeMB: (totalSize / 1024 / 1024).toFixed(2) });
            };
            req.onerror = () => reject(req.error);
        });
    }

    async pruneOldImages(maxSize = 200 * 1024 * 1024, maxCount = 200) {
        if (!this.db) await this.init();

        const images = await this.getAllImages();
        images.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        let currentSize = 0;
        for (const img of images) {
            if (img.blob) currentSize += img.blob.size;
        }

        const toDelete = [];
        let index = 0;

        while ((currentSize > maxSize || images.length - toDelete.length > maxCount) && index < images.length) {
            const img = images[index];
            toDelete.push(img.id);
            if (img.blob) currentSize -= img.blob.size;
            index++;
        }

        for (const id of toDelete) {
            await this.deleteImage(id);
        }

        return toDelete.length;
    }

    async exportCache() {
        const images = await this.getAllImages();
        const exportData = [];

        for (const img of images) {
            if (!img.blob) continue;

            const base64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(img.blob);
            });

            exportData.push({
                id: img.id,
                prompt: img.prompt,
                mode: img.mode,
                mediaType: img.mediaType || 'image',
                mimeType: img.mimeType || img.blob.type || '',
                fileName: img.fileName || '',
                metadata: img.metadata,
                timestamp: img.timestamp,
                imageData: base64,
            });
        }

        return JSON.stringify(exportData);
    }

    async importCache(jsonData) {
        const data = safeJsonParse(jsonData, null, 'cache import');
        if (!Array.isArray(data)) {
            throw new Error('导入数据格式无效');
        }

        let successCount = 0;
        for (const item of data) {
            try {
                if (!item.imageData || !item.imageData.startsWith('data:')) {
                    console.warn(`[AI Gen DB] 跳过非法数据: ${item.id}`);
                    continue;
                }

                const response = await fetch(item.imageData);
                const blob = await response.blob();

                await this.saveImage(item.id, blob, {
                    prompt: item.prompt,
                    mode: item.mode,
                    mediaType: item.mediaType,
                    mimeType: item.mimeType,
                    fileName: item.fileName,
                    metadata: item.metadata,
                    timestamp: item.timestamp,
                });

                successCount++;
            } catch (error) {
                console.error(`[AI Gen DB] 导入失败 [${item.id}]:`, error);
            }
        }

        return successCount;
    }

    async replaceTags(tags) {
        if (!this.db) await this.init();
        const normalized = Array.isArray(tags) ? tags : [];
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.tagStoreName], 'readwrite');
            const store = transaction.objectStore(this.tagStoreName);
            store.clear();
            for (const item of normalized) {
                const tag = String(item?.tag || '').trim();
                if (!tag) continue;
                store.put({
                    tag,
                    normalized: tag.toLowerCase(),
                    category: String(item.category ?? ''),
                    count: Math.max(0, Number(item.count) || 0),
                    aliases: Array.isArray(item.aliases) ? item.aliases.map(String).slice(0, 12) : [],
                });
            }
            transaction.oncomplete = () => resolve(normalized.length);
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error || new Error('词库导入已中止'));
        });
    }

    async searchTags(query, limit = 40) {
        if (!this.db) await this.init();
        const term = String(query || '').trim().toLowerCase();
        const max = Math.min(100, Math.max(1, Number(limit) || 40));
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.tagStoreName], 'readonly');
            const store = transaction.objectStore(this.tagStoreName);
            const results = [];
            const request = term
                ? store.index('normalized').openCursor(IDBKeyRange.bound(term, `${term}\uffff`))
                : store.index('count').openCursor(null, 'prev');
            request.onsuccess = event => {
                const cursor = event.target.result;
                if (!cursor || results.length >= max) {
                    resolve(results);
                    return;
                }
                results.push(cursor.value);
                cursor.continue();
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getTagCount() {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.tagStoreName], 'readonly');
            const request = transaction.objectStore(this.tagStoreName).count();
            request.onsuccess = () => resolve(request.result || 0);
            request.onerror = () => reject(request.error);
        });
    }

    async clearTags() {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.tagStoreName], 'readwrite');
            const request = transaction.objectStore(this.tagStoreName).clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}
