export function createImageRenderer({
    imageCacheDB,
    blobUrlTracker,
    imageTooltip,
    getValue,
    logger = console,
}) {
    const pendingStoryboardRefresh = new WeakSet();

    function getOrCreateImageContainer(anchorElement) {
        const customSlotSelector = anchorElement?.dataset?.imageSlot;
        if (customSlotSelector) {
            const customRoot = anchorElement.closest('.comfy-storyboard-panel')
                || anchorElement.closest('.comfy-ai-prompt-panel')
                || anchorElement.parentElement;
            const customSlot = customRoot?.querySelector(customSlotSelector)
                || anchorElement.parentElement?.querySelector(customSlotSelector);
            if (customSlot) {
                let container = customSlot.querySelector('.comfy-image-container');
                if (!container) {
                    container = document.createElement('span');
                    container.className = 'comfy-image-container';
                    customSlot.appendChild(container);
                }
                return container;
            }
        }

        const aiPromptSlot = anchorElement.closest('.comfy-ai-prompt-panel')?.querySelector('.comfy-ai-prompt-image-slot');
        if (aiPromptSlot) {
            let container = aiPromptSlot.querySelector('.comfy-image-container');
            if (!container) {
                container = document.createElement('span');
                container.className = 'comfy-image-container';
                aiPromptSlot.appendChild(container);
            }
            return container;
        }

        let container = anchorElement.nextElementSibling;
        if (!container || !container.classList.contains('comfy-image-container')) {
            container = document.createElement('span');
            container.className = 'comfy-image-container';
            anchorElement.insertAdjacentElement('afterend', container);
        }
        return container;
    }

    function forceStoryboardLayoutRefresh(container) {
        const slot = container?.closest('.comfy-storyboard-image-slot');
        const panel = slot?.closest('.comfy-storyboard-panel');
        if (!slot || !panel) return;
        if (pendingStoryboardRefresh.has(panel)) return;
        pendingStoryboardRefresh.add(panel);

        const frame = typeof requestAnimationFrame === 'function'
            ? requestAnimationFrame
            : (callback) => setTimeout(callback, 0);
        const grid = panel.closest('.comfy-storyboard-panels');
        const chat = panel.closest('#chat') || document.querySelector('#chat');

        slot.classList.add('has-image');
        panel.classList.add('has-image');

        frame(() => {
            pendingStoryboardRefresh.delete(panel);
            grid?.dispatchEvent(new CustomEvent('comfy-storyboard-layout-refresh', { bubbles: true }));
            chat?.dispatchEvent(new CustomEvent('comfy-storyboard-layout-refresh', { bubbles: true }));
        });
    }

    function bindImageLayoutRefresh(img, container) {
        const refresh = () => forceStoryboardLayoutRefresh(container);
        img.addEventListener('load', refresh, { once: true });
        img.addEventListener('error', refresh, { once: true });
        if (typeof img.decode === 'function') {
            img.decode().then(refresh).catch(() => {});
        }
        refresh();
    }

    function bindTooltip(img) {
        img.addEventListener('mouseenter', (event) => {
            if (img._aiGenMeta) imageTooltip.scheduleShow(event, img._aiGenMeta);
        });
        img.addEventListener('mousemove', (event) => {
            if (img._aiGenMeta) imageTooltip.onMove(event, img._aiGenMeta);
        });
        img.addEventListener('mouseleave', () => imageTooltip.hide());
    }

    async function applyDisplaySize(img) {
        const displayWidth = await getValue('comfyui_display_width');
        const displayHeight = await getValue('comfyui_display_height');
        img.style.width = displayWidth > 0 ? 'auto' : '100%';
        img.style.maxWidth = displayWidth > 0 ? `${displayWidth}px` : '100%';
        img.style.maxHeight = displayHeight > 0 ? `${displayHeight}px` : 'none';
        img.style.height = 'auto';
    }

    function waitForImageReady(img, timeoutMs = 1800) {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        const decodePromise = typeof img.decode === 'function'
            ? img.decode().catch(() => {})
            : Promise.resolve();
        const loadPromise = new Promise(resolve => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
        });
        const timeoutPromise = new Promise(resolve => setTimeout(resolve, timeoutMs));
        return Promise.race([
            Promise.all([decodePromise, loadPromise]),
            timeoutPromise,
        ]);
    }

    async function displayImageGrid(anchorElement, images) {
        const container = getOrCreateImageContainer(anchorElement);

        const displayWidth = await getValue('comfyui_display_width');
        const imageElements = [];
        for (const { imageUrl, seed } of images) {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = 'Generated by AI';
            img.style.width = displayWidth > 0 ? 'auto' : '100%';
            img.style.maxWidth = displayWidth > 0 ? `${displayWidth}px` : '100%';
            img.style.height = 'auto';
            img.style.borderRadius = '4px';
            img.style.cursor = 'pointer';
            img._aiGenMeta = { seed };
            bindTooltip(img);
            img.addEventListener('click', () => window.open(imageUrl, '_blank'));
            imageElements.push(img);
        }

        await Promise.all(imageElements.map(img => waitForImageReady(img)));

        container.style.display = 'grid';
        container.style.gridTemplateColumns = `repeat(${Math.min(images.length, 2)}, 1fr)`;
        container.style.gap = '4px';
        container.replaceChildren(...imageElements);
        for (const img of imageElements) {
            bindImageLayoutRefresh(img, container);
        }
    }

    async function displayImage(anchorElement, imageDataOrId) {
        const container = getOrCreateImageContainer(anchorElement);

        const img = document.createElement('img');
        img.alt = 'Generated by AI';

        if (typeof imageDataOrId === 'string') {
            if (imageDataOrId.startsWith('http') ||
                imageDataOrId.startsWith('data:') ||
                imageDataOrId.startsWith('blob:')) {
                img.src = imageDataOrId;
            } else {
                try {
                    const cached = await imageCacheDB.getImage(imageDataOrId);
                    if (cached?.blob) {
                        const objectUrl = blobUrlTracker.create(cached.blob);
                        img.src = objectUrl;
                        img._aiGenMeta = { prompt: cached.prompt, ...cached.metadata };
                    } else {
                        throw new Error('缓存图片未找到');
                    }
                } catch (error) {
                    logger.error('[AI Gen] 加载缓存图片失败:', error);
                    img.alt = '图片加载失败';
                    img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><text x="10" y="20" fill="red">图片丢失</text></svg>';
                }
            }
        } else if (imageDataOrId?.url) {
            img.src = imageDataOrId.url;
        }

        bindTooltip(img);
        await applyDisplaySize(img);
        await waitForImageReady(img);
        container.style.display = '';
        container.style.gridTemplateColumns = '';
        container.replaceChildren(img);
        bindImageLayoutRefresh(img, container);
    }

    return {
        displayImage,
        displayImageGrid,
        applyDisplaySize,
    };
}
