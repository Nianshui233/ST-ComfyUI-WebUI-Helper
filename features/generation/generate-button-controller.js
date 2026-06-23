import {
    DEFAULT_SETTINGS,
    GENERATE_COOLDOWN,
    MODES,
} from '../core/runtime-config.js';

export function createGenerateButtonController({
    getStoredValues,
    getValue,
    getCurrentMode,
    generateWithComfyUI,
    generateWithWebUI,
    updateSeedDisplay,
    saveImageToCache,
    deleteImageFromCache,
    displayImage,
    displayImageGrid,
    comparisonMode,
    progressTracker,
    setAiPromptPanelBusy,
    showToast,
    logger = console,
}) {
    const generateThrottle = new Map();

    function getGeneratedImageContainer(group) {
        return group.closest('.comfy-ai-prompt-panel')?.querySelector('.comfy-ai-prompt-image-slot .comfy-image-container')
            || group.nextElementSibling;
    }

    async function onGenerateButtonClick(event) {
        const button = event.target.closest('.comfy-chat-generate-button');
        const group = button.closest('.comfy-button-group');
        const promptFromChat = button.dataset.prompt;
        const generationId = group.dataset.generationId;
        const aiPanel = group.closest('.comfy-ai-prompt-panel');
        const source = group.dataset.source || 'tag';
        const initialLabel = source === 'ai_prompt' ? '生成图片' : '开始生成';

        if (button.disabled || button.dataset.processing === 'true') return;

        const isFirstGeneration = button.textContent === '开始生成' || button.textContent === '生成图片';

        const lastClick = generateThrottle.get(generationId);
        if (lastClick && Date.now() - lastClick < GENERATE_COOLDOWN) {
            const remaining = Math.ceil((GENERATE_COOLDOWN - (Date.now() - lastClick)) / 1000);
            showToast('warning', `请稍后再试 (${remaining}秒冷却中)`);
            return;
        }
        generateThrottle.set(generationId, Date.now());
        if (generateThrottle.size > 50) {
            const now = Date.now();
            for (const [key, time] of generateThrottle) {
                if (now - time > 60000) generateThrottle.delete(key);
            }
        }

        button.dataset.processing = 'true';
        button.textContent = '生成中...';
        button.disabled = true;
        button.className = 'comfy-button comfy-chat-generate-button testing';
        setAiPromptPanelBusy(aiPanel, '图片生成中...');

        const {
            comfyui_hide_buttons: hideButtonsMode,
            comfyui_enable_comparison: comparisonEnabled,
        } = await getStoredValues([
            ['comfyui_hide_buttons', DEFAULT_SETTINGS.hideButtons],
            ['comfyui_enable_comparison', DEFAULT_SETTINGS.enableComparison],
        ]);
        if (hideButtonsMode && !isFirstGeneration) {
            group.classList.add('comfy-buttons-hidden');
        }

        if (comparisonEnabled) comparisonMode.captureOldImage(group);

        const oldCompare = group.parentElement?.querySelector('.comfy-compare-container');
        if (oldCompare) oldCompare.remove();
        const oldActions = group.parentElement?.querySelector('.comfy-compare-actions');
        if (oldActions) oldActions.remove();
        const oldContainer = getGeneratedImageContainer(group);
        if (oldContainer?.classList.contains('comfy-image-container')) oldContainer.remove();

        progressTracker.createUI(group);

        try {
            const startTime = Date.now();
            const currentMode = getCurrentMode();
            const result = currentMode === MODES.COMFYUI
                ? await generateWithComfyUI(promptFromChat)
                : await generateWithWebUI(promptFromChat);

            const { images } = result;
            const primaryImage = images[0];

            updateSeedDisplay(primaryImage.seed);

            const metadataSettings = currentMode === MODES.COMFYUI
                ? await getStoredValues([
                    ['comfyui_gen_width', DEFAULT_SETTINGS.genWidth],
                    ['comfyui_gen_height', DEFAULT_SETTINGS.genHeight],
                    ['comfyui_model', ''],
                    ['comfyui_steps', DEFAULT_SETTINGS.steps],
                    ['comfyui_cfg', DEFAULT_SETTINGS.cfg],
                    ['comfyui_sampler', DEFAULT_SETTINGS.sampler],
                ])
                : await getStoredValues([
                    ['comfyui_gen_width', DEFAULT_SETTINGS.genWidth],
                    ['comfyui_gen_height', DEFAULT_SETTINGS.genHeight],
                    ['webui_model', ''],
                    ['webui_steps', DEFAULT_SETTINGS.steps],
                    ['webui_cfg', DEFAULT_SETTINGS.cfg],
                    ['webui_sampler', DEFAULT_SETTINGS.webuiSampler],
                ]);

            const metadata = {
                width: metadataSettings.comfyui_gen_width,
                height: metadataSettings.comfyui_gen_height,
                model: currentMode === MODES.COMFYUI ? metadataSettings.comfyui_model : metadataSettings.webui_model,
                steps: currentMode === MODES.COMFYUI ? metadataSettings.comfyui_steps : metadataSettings.webui_steps,
                cfg: currentMode === MODES.COMFYUI ? metadataSettings.comfyui_cfg : metadataSettings.webui_cfg,
                sampler: currentMode === MODES.COMFYUI ? metadataSettings.comfyui_sampler : metadataSettings.webui_sampler,
                seed: primaryImage.seed,
                generationTime: Date.now() - startTime,
            };

            await saveImageToCache(generationId, primaryImage.imageUrl, promptFromChat, metadata);

            if (images.length > 1) {
                await displayImageGrid(group, images);
            } else {
                await displayImage(group, generationId);
            }

            if (comparisonEnabled && comparisonMode.oldImageSrc) {
                const newImg = getGeneratedImageContainer(group)?.querySelector('img');
                if (newImg?.src) comparisonMode.show(group, newImg.src);
            }

            button.className = 'comfy-button comfy-chat-generate-button success';
            button.textContent = '成功';
            if (aiPanel) {
                setAiPromptPanelBusy(aiPanel, '图片已生成', false, { includeGenerate: false });
            }
            setTimeout(() => setupGeneratedState(button, generationId), 2000);

        } catch (error) {
            if (error?.cancelled) {
                showToast('info', '已取消生成');
                group.classList.remove('comfy-buttons-hidden');
                button.disabled = false;
                button.className = 'comfy-button comfy-chat-generate-button';
                button.textContent = isFirstGeneration ? initialLabel : '重新生成';
                setAiPromptPanelBusy(aiPanel, '', false);
            } else {
                logger.error('生成图片失败:', error);
                showToast('error', error.message || String(error));
                button.className = 'comfy-button comfy-chat-generate-button error';
                button.textContent = '失败';
                if (aiPanel) {
                    setAiPromptPanelBusy(aiPanel, '生成失败', false);
                }
                setTimeout(() => {
                    button.textContent = '重新生成';
                    button.disabled = false;
                    button.className = 'comfy-button comfy-chat-generate-button';
                }, 3000);
            }
        } finally {
            delete button.dataset.processing;
            progressTracker.remove();
        }
    }

    async function setupGeneratedState(btn, id) {
        btn.textContent = '重新生成';
        btn.disabled = false;
        btn.className = 'comfy-button comfy-chat-generate-button';

        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        const group = newBtn.closest('.comfy-button-group');

        if (!group.querySelector('.comfy-delete-button')) {
            const delBtn = document.createElement('button');
            delBtn.textContent = '删除';
            delBtn.className = 'comfy-button error comfy-delete-button';
            delBtn.addEventListener('click', async () => {
                await deleteImageFromCache(id);
                group.classList.remove('comfy-buttons-hidden');
                getGeneratedImageContainer(group)?.remove();
                newBtn.textContent = '开始生成';
                delBtn.remove();
            });
            newBtn.insertAdjacentElement('afterend', delBtn);
        }

        const hideButtons = await getValue('comfyui_hide_buttons', DEFAULT_SETTINGS.hideButtons);
        if (hideButtons) {
            group.classList.add('comfy-buttons-hidden');
            const imgContainer = getGeneratedImageContainer(group);
            if (imgContainer?.classList.contains('comfy-image-container')) {
                imgContainer.querySelectorAll('img').forEach(img => {
                    if (img.dataset.dblClickBound) return;
                    img.dataset.dblClickBound = 'true';
                    img.style.cursor = 'pointer';
                    img.addEventListener('dblclick', () => {
                        img.classList.add('comfy-shake');
                        img.addEventListener('animationend', () => img.classList.remove('comfy-shake'), { once: true });
                        const genBtn = group.querySelector('.comfy-chat-generate-button');
                        if (genBtn) {
                            group.classList.remove('comfy-buttons-hidden');
                            genBtn.click();
                        }
                    });
                });
            }
        } else {
            group.classList.remove('comfy-buttons-hidden');
        }
    }

    return {
        onGenerateButtonClick,
        setupGeneratedState,
    };
}
