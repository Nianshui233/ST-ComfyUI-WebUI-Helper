function getFileExtension(item) {
    const fileName = String(item.fileName || '');
    const match = fileName.match(/\.([a-z0-9]+)$/i);
    if (match) return match[1].toLowerCase();
    if (item.mediaType === 'video') return item.mimeType?.split('/')[1] || 'mp4';
    return item.mimeType?.split('/')[1] || 'png';
}

export function createImageCacheViewer({
    imageCacheDB,
    blobUrlTracker,
    showToast,
    logger = console,
}) {
    const selectedIds = new Set();
    let allItems = [];
    let currentPage = 1;
    const pageSize = 24;

    function getFilters() {
        return {
            query: document.getElementById('cache-search')?.value?.trim().toLowerCase() || '',
            mediaType: document.getElementById('cache-media-type')?.value || '',
            mode: document.getElementById('cache-mode-filter')?.value || '',
        };
    }

    function filterItems(items) {
        const filter = getFilters();
        return items.filter(item => {
            if (filter.mediaType && (item.mediaType || 'image') !== filter.mediaType) return false;
            if (filter.mode && item.mode !== filter.mode) return false;
            if (filter.query && !`${item.prompt || ''} ${item.fileName || ''}`.toLowerCase().includes(filter.query)) return false;
            return true;
        });
    }

    async function updateStorageEstimate() {
        const element = document.getElementById('cache-storage-estimate');
        if (!element || !navigator.storage?.estimate) return;
        try {
            const { usage = 0, quota = 0 } = await navigator.storage.estimate();
            element.textContent = `浏览器站点存储 ${(usage / 1024 / 1024).toFixed(1)} / ${(quota / 1024 / 1024).toFixed(0)} MB`;
        } catch {
            element.textContent = '浏览器未提供站点容量估算';
        }
    }

    async function loadImageCache() {
        const cacheGrid = document.getElementById('cache-grid');
        const cacheStats = document.getElementById('cache-stats');
        if (!cacheGrid || !cacheStats) return;
        blobUrlTracker.revokeAll('cache-grid');
        try {
            allItems = (await imageCacheDB.getAllImages()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            for (const id of selectedIds) {
                if (!allItems.some(item => item.id === id)) selectedIds.delete(id);
            }
            renderCache();
            await updateStorageEstimate();
            attachCacheEventListeners();
        } catch (error) {
            logger.error('[AI Gen] 加载缓存列表失败:', error);
            cacheGrid.innerHTML = '<div class="cache-empty">加载失败，请刷新页面</div>';
            showToast('error', '缓存加载失败');
        }
    }

    function renderCache() {
        const cacheGrid = document.getElementById('cache-grid');
        const cacheStats = document.getElementById('cache-stats');
        if (!cacheGrid || !cacheStats) return;
        blobUrlTracker.revokeAll('cache-grid');
        const totalSize = allItems.reduce((sum, item) => sum + (item.blob?.size || 0), 0);
        const filtered = filterItems(allItems);
        const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
        currentPage = Math.min(currentPage, pageCount);
        const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
        const imageCount = allItems.filter(item => (item.mediaType || 'image') === 'image').length;
        const videoCount = allItems.length - imageCount;
        cacheStats.textContent = `${allItems.length} 个媒体（${imageCount} 图 / ${videoCount} 视频）· ${(totalSize / 1024 / 1024).toFixed(2)} MB · 已选 ${selectedIds.size}`;
        const pageLabel = document.getElementById('cache-page-label');
        if (pageLabel) pageLabel.textContent = `${currentPage} / ${pageCount}`;
        document.getElementById('cache-page-prev')?.toggleAttribute('disabled', currentPage <= 1);
        document.getElementById('cache-page-next')?.toggleAttribute('disabled', currentPage >= pageCount);
        cacheGrid.replaceChildren();
        if (!pageItems.length) {
            const empty = document.createElement('div');
            empty.className = 'cache-empty';
            empty.textContent = allItems.length ? '没有符合筛选条件的媒体' : '暂无缓存媒体';
            cacheGrid.appendChild(empty);
            return;
        }
        pageItems.forEach(item => cacheGrid.appendChild(createCacheItem(item)));
    }

    function createPreview(data) {
        const previewBlob = data.thumbnailBlob || data.blob;
        if (!previewBlob) return document.createElement('span');
        const url = blobUrlTracker.create(previewBlob, 'cache-grid');
        if ((data.mediaType || 'image') === 'video' && !data.thumbnailBlob) {
            const video = document.createElement('video');
            video.className = 'cache-item-image';
            video.src = url;
            video.muted = true;
            video.preload = 'metadata';
            video.playsInline = true;
            return video;
        }
        const image = document.createElement('img');
        image.className = 'cache-item-image';
        image.src = url;
        image.alt = data.mediaType === 'video' ? '视频缩略图' : '缓存图片';
        image.loading = 'lazy';
        return image;
    }

    function createCacheItem(data) {
        const item = document.createElement('article');
        item.className = 'cache-item';
        item.dataset.id = data.id;
        item.classList.toggle('is-selected', selectedIds.has(data.id));
        const preview = createPreview(data);
        preview.dataset.id = data.id;
        const select = document.createElement('input');
        select.type = 'checkbox';
        select.className = 'cache-item-select';
        select.checked = selectedIds.has(data.id);
        select.dataset.id = data.id;
        select.setAttribute('aria-label', '选择缓存媒体');
        const type = document.createElement('span');
        type.className = 'cache-item-type';
        type.textContent = (data.mediaType || 'image') === 'video' ? 'VIDEO' : 'IMAGE';
        const info = document.createElement('div');
        info.className = 'cache-item-info';
        const prompt = document.createElement('div');
        prompt.className = 'cache-item-prompt';
        prompt.textContent = data.prompt || '无提示词';
        prompt.title = data.prompt || '无提示词';
        const meta = document.createElement('div');
        meta.className = 'cache-item-meta';
        meta.textContent = `${data.mode || '未知'} · ${new Date(data.timestamp || 0).toLocaleString()} · ${((data.blob?.size || 0) / 1024 / 1024).toFixed(2)}MB`;
        const actions = document.createElement('div');
        actions.className = 'cache-item-actions';
        actions.append(
            createCacheButton('查看', 'cache-view-btn', data.id),
            createCacheButton('下载', 'cache-download-btn', data.id),
            createCacheButton('删除', 'cache-delete-btn error', data.id),
        );
        info.append(prompt, meta, actions);
        item.append(preview, select, type, info);
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
        cacheGrid.addEventListener('change', event => {
            const checkbox = event.target.closest('.cache-item-select');
            if (!checkbox) return;
            if (checkbox.checked) selectedIds.add(checkbox.dataset.id);
            else selectedIds.delete(checkbox.dataset.id);
            renderCache();
        });
        cacheGrid.addEventListener('click', async event => {
            const view = event.target.closest('.cache-view-btn, .cache-item-image');
            if (view) return showCachedMedia(view.dataset.id);
            const download = event.target.closest('.cache-download-btn');
            if (download) return downloadCachedMedia(download.dataset.id);
            const remove = event.target.closest('.cache-delete-btn');
            if (remove && confirm('确定删除这个缓存媒体吗？')) {
                await imageCacheDB.deleteImage(remove.dataset.id);
                selectedIds.delete(remove.dataset.id);
                await loadImageCache();
            }
        });
        ['cache-search', 'cache-media-type', 'cache-mode-filter'].forEach(id => {
            document.getElementById(id)?.addEventListener(id === 'cache-search' ? 'input' : 'change', () => {
                currentPage = 1;
                renderCache();
            });
        });
        document.getElementById('cache-page-prev')?.addEventListener('click', () => { currentPage -= 1; renderCache(); });
        document.getElementById('cache-page-next')?.addEventListener('click', () => { currentPage += 1; renderCache(); });
        document.getElementById('cache-delete-selected')?.addEventListener('click', async () => {
            if (!selectedIds.size || !confirm(`确定删除选中的 ${selectedIds.size} 个媒体吗？`)) return;
            await Promise.all(Array.from(selectedIds, id => imageCacheDB.deleteImage(id)));
            selectedIds.clear();
            await loadImageCache();
            showToast('success', '已删除选中的缓存媒体');
        });
        const modal = document.getElementById('cache-image-modal');
        const closeModal = () => {
            if (!modal) return;
            modal.style.display = 'none';
            modal.querySelector('.cache-modal-media')?.replaceChildren();
            blobUrlTracker.revokeAll('cache-modal');
        };
        modal?.querySelector('.cache-modal-close')?.addEventListener('click', closeModal);
        modal?.addEventListener('click', event => {
            if (event.target === modal) closeModal();
        });
    }

    async function showCachedMedia(id) {
        const cached = await imageCacheDB.getImage(id);
        if (!cached?.blob) return showToast('error', '媒体加载失败');
        const modal = document.getElementById('cache-image-modal');
        const body = modal?.querySelector('.cache-modal-media');
        if (!modal || !body) return;
        body.replaceChildren();
        const url = blobUrlTracker.create(cached.blob, 'cache-modal');
        const media = document.createElement((cached.mediaType || 'image') === 'video' ? 'video' : 'img');
        media.src = url;
        if (media.tagName === 'VIDEO') {
            media.controls = true;
            media.autoplay = true;
        } else media.alt = '查看缓存图片';
        body.appendChild(media);
        modal.style.display = 'flex';
    }

    async function downloadCachedMedia(id) {
        try {
            const cached = await imageCacheDB.getImage(id);
            if (!cached?.blob) return;
            const url = blobUrlTracker.create(cached.blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            const base = String(cached.prompt || 'media').replace(/[^a-zA-Z0-9\u4e00-\u9fa5\-_]/g, '_').slice(0, 60);
            anchor.download = cached.fileName || `${base}_${Date.now()}.${getFileExtension(cached)}`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            setTimeout(() => blobUrlTracker.revoke(url), 5000);
        } catch (error) {
            logger.error('[AI Gen] 下载缓存媒体失败:', error);
            showToast('error', '下载失败');
        }
    }

    return { loadImageCache };
}
