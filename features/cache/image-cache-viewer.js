export function createImageCacheViewer({
    imageCacheDB,
    blobUrlTracker,
    showToast,
    logger = console,
}) {
    async function loadImageCache() {
        const cacheGrid = document.getElementById('cache-grid');
        const cacheStats = document.getElementById('cache-stats');
        if (!cacheGrid || !cacheStats) return;

        blobUrlTracker.revokeAll('cache-grid');

        try {
            const images = await imageCacheDB.getAllImages();
            const totalSize = images.reduce((sum, image) => sum + (image.blob?.size || 0), 0);
            const info = {
                count: images.length,
                sizeMB: (totalSize / 1024 / 1024).toFixed(2),
            };

            cacheStats.textContent = `共 ${info.count} 张缓存图片 (${info.sizeMB} MB)`;
            cacheGrid.innerHTML = '';

            if (info.count === 0) {
                cacheGrid.innerHTML = '<div class="cache-empty">暂无缓存图片</div>';
                return;
            }

            images
                .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
                .forEach((data) => {
                    cacheGrid.appendChild(createCacheItem(data));
                });

            attachCacheEventListeners();
        } catch (error) {
            logger.error('[AI Gen] 加载缓存列表失败:', error);
            cacheGrid.innerHTML = '<div class="cache-empty" style="color: var(--vp-error-color);">加载失败，请刷新页面</div>';
            showToast('error', '缓存加载失败');
        }
    }

    function createCacheItem(data) {
        const item = document.createElement('div');
        item.className = 'cache-item';

        const img = document.createElement('img');
        img.className = 'cache-item-image';
        if (data.blob) {
            img.src = blobUrlTracker.create(data.blob, 'cache-grid');
        }
        img.alt = '缓存图片';
        img.dataset.id = data.id;

        const infoDiv = document.createElement('div');
        infoDiv.className = 'cache-item-info';

        const promptDiv = document.createElement('div');
        promptDiv.className = 'cache-item-prompt';
        promptDiv.textContent = data.prompt || '无提示词';
        promptDiv.title = data.prompt || '无提示词';

        const sizeInfo = data.blob ? ` • ${(data.blob.size / 1024 / 1024).toFixed(2)}MB` : '';
        const metaDiv = document.createElement('div');
        metaDiv.className = 'cache-item-meta';
        metaDiv.textContent = `${data.mode || '未知'} • ${new Date(data.timestamp || 0).toLocaleString()}${sizeInfo}`;

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'cache-item-actions';

        const viewBtn = createCacheButton('查看', 'cache-view-btn', data.id);
        const downloadBtn = createCacheButton('下载', 'cache-download-btn', data.id);
        downloadBtn.dataset.prompt = data.prompt || 'image';
        const deleteBtn = createCacheButton('删除', 'cache-delete-btn error', data.id);

        actionsDiv.append(viewBtn, downloadBtn, deleteBtn);
        infoDiv.append(promptDiv, metaDiv, actionsDiv);
        item.append(img, infoDiv);
        return item;
    }

    function createCacheButton(text, className, id) {
        const button = document.createElement('button');
        button.className = `comfy-button ${className}`;
        button.textContent = text;
        button.dataset.id = id;
        return button;
    }

    function attachCacheEventListeners() {
        const cacheGrid = document.getElementById('cache-grid');
        if (!cacheGrid || cacheGrid.dataset.listenerAttached === 'true') return;

        cacheGrid.dataset.listenerAttached = 'true';
        cacheGrid.addEventListener('click', async (event) => {
            const viewTrigger = event.target.closest('.cache-view-btn, .cache-item-image');
            if (viewTrigger && cacheGrid.contains(viewTrigger)) {
                const id = viewTrigger.dataset.id;
                if (!id) return;

                try {
                    const cached = await imageCacheDB.getImage(id);
                    if (cached?.blob) {
                        showImageModal(blobUrlTracker.create(cached.blob));
                    }
                } catch {
                    showToast('error', '图片加载失败');
                }
                return;
            }

            const downloadTrigger = event.target.closest('.cache-download-btn');
            if (downloadTrigger && cacheGrid.contains(downloadTrigger)) {
                await downloadCachedImage(downloadTrigger.dataset.id, downloadTrigger.dataset.prompt || 'image');
                return;
            }

            const deleteTrigger = event.target.closest('.cache-delete-btn');
            if (deleteTrigger && cacheGrid.contains(deleteTrigger)) {
                const id = deleteTrigger.dataset.id;
                if (!id || !confirm('确定要删除这张图片吗？')) return;

                try {
                    await imageCacheDB.deleteImage(id);
                    await loadImageCache();
                    showToast('success', '图片已删除');
                } catch {
                    showToast('error', '删除失败');
                }
            }
        });
    }

    async function downloadCachedImage(id, prompt) {
        if (!id) return;

        try {
            const cached = await imageCacheDB.getImage(id);
            if (cached?.blob) {
                const url = blobUrlTracker.create(cached.blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${prompt.replace(/[^a-zA-Z0-9\u4e00-\u9fa5\-_]/g, '_')}_${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                setTimeout(() => blobUrlTracker.revoke(url), 5000);
                showToast('success', '下载已开始');
            }
        } catch (error) {
            logger.error('[AI Gen] 下载失败:', error);
            showToast('error', '下载失败');
        }
    }

    function showImageModal(imageUrl) {
        let modal = document.getElementById('cache-image-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'cache-image-modal';
            modal.className = 'cache-image-modal';
            modal.innerHTML = `<span class="cache-modal-close">×</span><img src="" alt="查看图片">`;
            document.body.appendChild(modal);
            modal.querySelector('.cache-modal-close').addEventListener('click', () => {
                modal.style.display = 'none';
            });
            modal.addEventListener('click', (event) => {
                if (event.target === modal) modal.style.display = 'none';
            });
        }
        modal.querySelector('img').src = imageUrl;
        modal.style.display = 'flex';
    }

    return {
        loadImageCache,
    };
}
