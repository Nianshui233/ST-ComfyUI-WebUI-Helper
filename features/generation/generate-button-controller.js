import {
    DEFAULT_SETTINGS,
    GENERATE_COOLDOWN,
    MODES,
} from '../core/runtime-config.js';

export function createGenerateButtonController({
    getStoredValues,
    getValue,
    getCurrentMode,
    isHelperEnabled,
    generateWithComfyUI,
    generateWithApiImage,
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
    const pendingStoryboardRefresh = new WeakSet();

    function getGeneratedImageContainer(group) {
        const customSlotSelector = group?.dataset?.imageSlot;
        if (customSlotSelector) {
            const customRoot = group.closest('.comfy-storyboard-panel')
                || group.closest('.comfy-ai-prompt-panel')
                || group.parentElement;
            const customSlot = customRoot?.querySelector(customSlotSelector)
                || group.parentElement?.querySelector(customSlotSelector);
            const customContainer = customSlot?.querySelector('.comfy-image-container');
            if (customSlot) return customContainer || null;
        }

        return group.closest('.comfy-ai-prompt-panel')?.querySelector('.comfy-ai-prompt-image-slot .comfy-image-container')
            || group.nextElementSibling;
    }

    function getModeLabel(mode) {
        return {
            [MODES.COMFYUI]: 'ComfyUI',
            [MODES.WEBUI]: 'WebUI',
            [MODES.API]: 'API 生图',
        }[mode] || mode;
    }

    async function generateByMode(mode, promptFromChat) {
        if (mode === MODES.COMFYUI) return generateWithComfyUI(promptFromChat);
        if (mode === MODES.WEBUI) return generateWithWebUI(promptFromChat);
        if (mode === MODES.API) return generateWithApiImage(promptFromChat);
        throw new Error(`未知生成模式: ${mode}`);
    }

    async function getGenerationMetadata(mode, primaryImage, startedAt, resultMetadata = {}) {
        if (mode === MODES.API) {
            const settings = await getStoredValues([
                ['comfyui_gen_width', DEFAULT_SETTINGS.genWidth],
                ['comfyui_gen_height', DEFAULT_SETTINGS.genHeight],
                ['comfyui_api_image_provider', DEFAULT_SETTINGS.apiImageProvider],
                ['comfyui_api_image_model', DEFAULT_SETTINGS.apiImageModel],
                ['comfyui_api_image_quality', DEFAULT_SETTINGS.apiImageQuality],
                ['comfyui_api_image_output_format', DEFAULT_SETTINGS.apiImageOutputFormat],
                ['comfyui_api_image_size_mode', DEFAULT_SETTINGS.apiImageSizeMode],
            ]);
            return {
                width: settings.comfyui_gen_width,
                height: settings.comfyui_gen_height,
                provider: settings.comfyui_api_image_provider,
                model: resultMetadata.model || settings.comfyui_api_image_model,
                quality: resultMetadata.quality || settings.comfyui_api_image_quality,
                outputFormat: resultMetadata.outputFormat || settings.comfyui_api_image_output_format,
                sizeMode: settings.comfyui_api_image_size_mode,
                seed: primaryImage.seed,
                generationTime: Date.now() - startedAt,
                ...resultMetadata,
            };
        }

        const metadataSettings = mode === MODES.COMFYUI
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

        return {
            width: metadataSettings.comfyui_gen_width,
            height: metadataSettings.comfyui_gen_height,
            model: mode === MODES.COMFYUI ? metadataSettings.comfyui_model : metadataSettings.webui_model,
            steps: mode === MODES.COMFYUI ? metadataSettings.comfyui_steps : metadataSettings.webui_steps,
            cfg: mode === MODES.COMFYUI ? metadataSettings.comfyui_cfg : metadataSettings.webui_cfg,
            sampler: mode === MODES.COMFYUI ? metadataSettings.comfyui_sampler : metadataSettings.webui_sampler,
            seed: primaryImage.seed,
            generationTime: Date.now() - startedAt,
        };
    }

    function clearComparisonUI(group) {
        const imageContainer = getGeneratedImageContainer(group);
        const roots = [
            imageContainer?.parentElement,
            group.parentElement,
        ].filter(Boolean);
        for (const root of roots) {
            root.querySelector('.comfy-compare-container')?.remove();
            root.querySelector('.comfy-compare-actions')?.remove();
        }
    }

    function setImageUpdating(group, updating) {
        const imageContainer = getGeneratedImageContainer(group);
        if (!imageContainer?.classList?.contains('comfy-image-container')) return false;

        const hasImage = !!imageContainer.querySelector('img');
        const slot = imageContainer.closest('.comfy-storyboard-image-slot, .comfy-ai-prompt-image-slot');
        const storyboardPanel = imageContainer.closest('.comfy-storyboard-panel');

        imageContainer.classList.toggle('comfy-image-container-updating', updating && hasImage);
        imageContainer.toggleAttribute('aria-busy', updating && hasImage);
        slot?.classList.toggle('is-updating-image', updating && hasImage);

        if (updating && hasImage) {
            const height = imageContainer.getBoundingClientRect?.().height || 0;
            if (height > 0) imageContainer.style.minHeight = `${Math.ceil(height)}px`;
            slot?.classList.add('has-image');
            storyboardPanel?.classList.add('has-image');
        } else {
            imageContainer.style.minHeight = '';
        }

        return hasImage;
    }

    function refreshStoryboardPanelLayout(panel) {
        if (!panel) return;
        const slot = panel.querySelector('.comfy-storyboard-image-slot');
        if (slot?.querySelector('img')) {
            slot.classList.add('has-image');
            panel.classList.add('has-image');
        }
        if (pendingStoryboardRefresh.has(panel)) return;
        pendingStoryboardRefresh.add(panel);

        const frame = typeof requestAnimationFrame === 'function'
            ? requestAnimationFrame
            : (callback) => setTimeout(callback, 0);
        frame(() => {
            pendingStoryboardRefresh.delete(panel);
            panel.closest('.comfy-storyboard-panels')?.dispatchEvent(new CustomEvent('comfy-storyboard-layout-refresh', { bubbles: true }));
            panel.closest('#chat')?.dispatchEvent(new CustomEvent('comfy-storyboard-layout-refresh', { bubbles: true }));
        });
    }

    function dispatchStoryboardGenerationFinished(panel, detail = {}) {
        if (!panel) return;
        panel.dataset.generationStatus = detail.status || '';
        panel.dispatchEvent(new CustomEvent('comfy-storyboard-generation-finished', {
            bubbles: true,
            detail,
        }));
    }

    async function generateFromButton(button, { force = false, ignoreCooldown = false } = {}) {
        if (!button) return { status: 'error', error: '没有找到生图按钮' };
        if (!isHelperEnabled?.()) {
            showToast('warning', '绘图插件已暂停，请先打开插件总开关');
            return { status: 'error', error: '绘图插件已暂停' };
        }

        const group = button.closest('.comfy-button-group');
        if (!group) return { status: 'error', error: '没有找到生图按钮组' };
        const promptFromChat = button.dataset.prompt;
        const generationId = group.dataset.generationId;
        const aiPanel = group.closest('.comfy-ai-prompt-panel');
        const source = group.dataset.source || 'tag';
        const isStoryboard = source === 'storyboard';
        const storyboardPanel = isStoryboard ? group.closest('.comfy-storyboard-panel') : null;
        const initialLabel = source === 'ai_prompt' ? '生成图片' : (isStoryboard ? '生图' : '开始生成');
        let storyboardGenerationStatus = 'idle';
        let storyboardGenerationError = '';
        let generationResult = { status: 'idle', generationId };

        if (button.dataset.processing === 'true') return { status: 'busy', error: '当前格正在生成中', generationId };
        if (button.disabled && !force) return { status: 'disabled', error: '生图按钮不可用', generationId };

        const isFirstGeneration = ['开始生成', '生成图片', '生图'].includes(button.textContent);

        const lastClick = generateThrottle.get(generationId);
        if (!ignoreCooldown && lastClick && Date.now() - lastClick < GENERATE_COOLDOWN) {
            const remaining = Math.ceil((GENERATE_COOLDOWN - (Date.now() - lastClick)) / 1000);
            showToast('warning', `请稍后再试 (${remaining}秒冷却中)`);
            return { status: 'cooldown', error: `冷却中，还需 ${remaining} 秒`, generationId };
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
        const hasExistingImage = setImageUpdating(group, true);
        if (isStoryboard && storyboardPanel) {
            storyboardPanel.classList.remove('is-queued', 'is-generated', 'is-error', 'is-cancelled');
            storyboardPanel.classList.add('is-generating');
            if (!hasExistingImage) {
                storyboardPanel.classList.remove('has-image');
                storyboardPanel.querySelector('.comfy-storyboard-image-slot')?.classList.remove('has-image');
            }
            const status = storyboardPanel.querySelector('.comfy-storyboard-status');
            if (status) status.textContent = '生成中...';
            storyboardPanel.querySelectorAll('.comfy-storyboard-action').forEach(actionButton => {
                actionButton.disabled = true;
            });
        } else {
            setAiPromptPanelBusy(aiPanel, '图片生成中...');
        }

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

        clearComparisonUI(group);
        const oldContainer = getGeneratedImageContainer(group);
        if (oldContainer?.classList.contains('comfy-image-container') && !oldContainer.querySelector('img')) oldContainer.remove();

        progressTracker.createUI(group);

        try {
            const startTime = Date.now();
            const currentMode = getCurrentMode();
            progressTracker.update(0.04, `${getModeLabel(currentMode)}：准备请求`);
            const result = await generateByMode(currentMode, promptFromChat);

            const { images } = result;
            const primaryImage = images[0];

            if (currentMode !== MODES.API) {
                updateSeedDisplay(primaryImage.seed);
            }

            const metadata = await getGenerationMetadata(currentMode, primaryImage, startTime, result.metadata);

            await saveImageToCache(generationId, primaryImage.imageUrl, promptFromChat, metadata);

            if (images.length > 1) {
                await displayImageGrid(group, images);
            } else {
                await displayImage(group, generationId);
            }
            setImageUpdating(group, false);
            if (isStoryboard) refreshStoryboardPanelLayout(storyboardPanel);

            if (comparisonEnabled && comparisonMode.oldImageSrc) {
                const newImg = getGeneratedImageContainer(group)?.querySelector('img');
                if (newImg?.src) comparisonMode.show(group, newImg.src);
            }

            button.className = isStoryboard
                ? 'comfy-button comfy-chat-generate-button'
                : 'comfy-button comfy-chat-generate-button success';
            button.textContent = isStoryboard ? '重新生成' : '成功';
            button.disabled = isStoryboard ? false : button.disabled;
            if (isStoryboard && storyboardPanel) {
                storyboardPanel.classList.remove('is-queued', 'is-error', 'is-cancelled');
                storyboardPanel.classList.add('is-generated');
                const status = storyboardPanel.querySelector('.comfy-storyboard-status');
                if (status) status.textContent = '已生成';
                storyboardGenerationStatus = 'success';
            } else if (aiPanel) {
                setAiPromptPanelBusy(aiPanel, '图片已生成', false, { includeGenerate: false });
            }
            generationResult = { status: 'success', generationId };
            if (isStoryboard) {
                refreshStoryboardPanelLayout(storyboardPanel);
            } else {
                setTimeout(() => setupGeneratedState(button, generationId), 2000);
            }

        } catch (error) {
            if (error?.cancelled) {
                showToast('info', '已取消生成');
                group.classList.remove('comfy-buttons-hidden');
                button.disabled = false;
                button.className = 'comfy-button comfy-chat-generate-button';
                button.textContent = isFirstGeneration ? initialLabel : '重新生成';
                if (isStoryboard && storyboardPanel) {
                    storyboardPanel.classList.remove('is-queued', 'is-generated', 'is-error');
                    storyboardPanel.classList.add('is-cancelled');
                    const status = storyboardPanel.querySelector('.comfy-storyboard-status');
                    if (status) status.textContent = '已取消';
                    storyboardGenerationStatus = 'cancelled';
                    storyboardGenerationError = '已取消';
                }
                generationResult = { status: 'cancelled', error: '已取消', generationId };
                if (!isStoryboard) setAiPromptPanelBusy(aiPanel, '', false);
            } else {
                logger.error('生成图片失败:', error);
                showToast('error', error.message || String(error));
                button.className = 'comfy-button comfy-chat-generate-button error';
                button.textContent = '失败';
                if (isStoryboard && storyboardPanel) {
                    storyboardPanel.classList.remove('is-queued', 'is-generated', 'is-cancelled');
                    storyboardPanel.classList.add('is-error');
                    const status = storyboardPanel.querySelector('.comfy-storyboard-status');
                    if (status) status.textContent = '失败';
                    storyboardGenerationStatus = 'error';
                    storyboardGenerationError = error.message || String(error);
                } else if (aiPanel) {
                    setAiPromptPanelBusy(aiPanel, '生成失败', false);
                }
                generationResult = { status: 'error', error: error.message || String(error), generationId };
                setTimeout(() => {
                    button.textContent = '重新生成';
                    button.disabled = false;
                    button.className = 'comfy-button comfy-chat-generate-button';
                }, 3000);
            }
        } finally {
            delete button.dataset.processing;
            progressTracker.remove();
            setImageUpdating(group, false);
            if (isStoryboard && storyboardPanel) {
                storyboardPanel.classList.remove('is-generating');
                storyboardPanel.querySelectorAll('.comfy-storyboard-action').forEach(actionButton => {
                    actionButton.disabled = false;
                });
                dispatchStoryboardGenerationFinished(storyboardPanel, {
                    status: storyboardGenerationStatus,
                    error: storyboardGenerationError,
                    generationId,
                });
            }
        }
        return generationResult;
    }

    async function generateFromGroup(group, options = {}) {
        const button = group?.querySelector('.comfy-chat-generate-button');
        return generateFromButton(button, options);
    }

    async function onGenerateButtonClick(event) {
        const button = event.target.closest('.comfy-chat-generate-button');
        return generateFromButton(button);
    }

    async function setupGeneratedState(btn, id) {
        delete btn.dataset.processing;
        btn.textContent = '重新生成';
        btn.disabled = false;
        btn.className = 'comfy-button comfy-chat-generate-button';

        const group = btn.closest('.comfy-button-group');
        const isStoryboard = group?.dataset?.source === 'storyboard';
        const newBtn = isStoryboard ? btn : btn.cloneNode(true);
        if (!isStoryboard) {
            delete newBtn.dataset.processing;
            btn.parentNode.replaceChild(newBtn, btn);
        }

        if (isStoryboard) {
            const storyboardPanel = group.closest('.comfy-storyboard-panel');
            storyboardPanel?.classList.remove('is-queued', 'is-generating', 'is-error', 'is-cancelled');
            storyboardPanel?.classList.add('is-generated');
            const status = storyboardPanel?.querySelector('.comfy-storyboard-status');
            if (status) status.textContent = '已生成';
        }

        if (!isStoryboard && !group.querySelector('.comfy-delete-button')) {
            const delBtn = document.createElement('button');
            delBtn.textContent = '删除';
            delBtn.className = 'comfy-button error comfy-delete-button';
            delBtn.addEventListener('click', async () => {
                await deleteImageFromCache(id);
                group.classList.remove('comfy-buttons-hidden');
                getGeneratedImageContainer(group)?.remove();
                newBtn.textContent = group.dataset.source === 'ai_prompt' ? '生成图片' : (group.dataset.source === 'storyboard' ? '生图' : '开始生成');
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
        generateFromGroup,
        onGenerateButtonClick,
        setupGeneratedState,
    };
}
