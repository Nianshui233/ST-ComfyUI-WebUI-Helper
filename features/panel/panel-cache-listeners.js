import {
    DEFAULT_SETTINGS,
    STORAGE_KEY_IMAGES,
} from '../core/runtime-config.js';

export function createPanelCacheListeners({
    getValue,
    setValue,
    imageCacheDB,
    blobUrlTracker,
    loadImageCache,
    clearAllCache,
    showToast,
    logger = console,
}) {
    function resetGeneratedImageControls() {
        document.querySelectorAll('.comfy-image-container').forEach(el => el.remove());
        document.querySelectorAll('.comfy-button-group').forEach(group => {
            group.querySelector('.comfy-delete-button')?.remove();
            const genBtn = group.querySelector('.comfy-chat-generate-button');
            if (genBtn) {
                genBtn.textContent = '开始生成';
                genBtn.disabled = false;
                genBtn.className = 'comfy-button comfy-chat-generate-button';
            }
        });
    }

    async function exportCache() {
        try {
            const data = await imageCacheDB.exportCache();
            const blob = new Blob([data], { type: 'application/json' });
            const url = blobUrlTracker.create(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ai_gen_cache_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            blobUrlTracker.revoke(url);
            showToast('success', '缓存已导出');
        } catch (error) {
            logger.error('[AI Gen] 导出失败:', error);
            showToast('error', '导出失败');
        }
    }

    function importCache() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            try {
                const text = await file.text();
                const count = await imageCacheDB.importCache(text);
                await loadImageCache();
                showToast('success', `成功导入 ${count} 张图片`);
            } catch (error) {
                logger.error('[AI Gen] 导入失败:', error);
                showToast('error', '导入失败，文件格式可能不正确');
            }
        };
        input.click();
    }

    function initCacheListeners(buttons) {
        buttons.clearCache.addEventListener('click', async () => {
            if (confirm('您确定要删除所有已生成的图片缓存吗？')) {
                await setValue(STORAGE_KEY_IMAGES, {});
                resetGeneratedImageControls();
                showToast('success', '图片缓存已清空');
            }
        });

        buttons.applyDims.addEventListener('click', async () => {
            const displayWidth = await getValue('comfyui_display_width', DEFAULT_SETTINGS.displayWidth);
            const displayHeight = await getValue('comfyui_display_height', DEFAULT_SETTINGS.displayHeight);
            document.querySelectorAll('.comfy-image-container img').forEach(img => {
                img.style.width = displayWidth > 0 ? 'auto' : '100%';
                img.style.maxWidth = displayWidth > 0 ? `${displayWidth}px` : '100%';
                img.style.maxHeight = displayHeight > 0 ? `${displayHeight}px` : 'none';
                img.style.height = 'auto';
            });
            showToast('success', '显示尺寸已应用');
        });

        buttons.applyTags.addEventListener('click', () => showToast('success', '捕获标记已更新！'));
        buttons.applyGenParams.addEventListener('click', () => showToast('success', 'ComfyUI 生成参数已保存！'));
        buttons.webuiApplyGenParams.addEventListener('click', () => showToast('success', 'WebUI 生成参数已保存！'));
        buttons.cacheRefresh?.addEventListener('click', loadImageCache);
        buttons.cacheClearAll?.addEventListener('click', clearAllCache);
        document.getElementById('cache-export')?.addEventListener('click', exportCache);
        document.getElementById('cache-import')?.addEventListener('click', importCache);
    }

    return {
        initCacheListeners,
    };
}
