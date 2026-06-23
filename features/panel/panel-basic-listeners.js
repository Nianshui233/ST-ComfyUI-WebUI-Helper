export function initAutosaveListeners({
    buttons,
    inputs,
    saveSettings,
    setValue,
}) {
    let saveDebounceTimer = null;
    const dynamicModelSelects = new Map([
        [inputs.modelSelect, 'comfyui_model'],
        [inputs.unetSelect, 'comfyui_unet_model'],
        [inputs.webuiModelSelect, 'webui_model'],
    ]);

    dynamicModelSelects.forEach((storageKey, input) => {
        input?.addEventListener('change', () => {
            setValue?.(storageKey, input.value || '');
        });
    });

    Object.values(inputs).forEach(input => {
        if (!input?.addEventListener) return;
        if (input === inputs.aiPromptApiModelSelect) return;
        if (input === inputs.aiPromptApiKeySelect) return;
        if (input === inputs.aiPromptProviderPresetSelect) return;
        if (input === inputs.apiImageApiKeySelect) return;
        if (dynamicModelSelects.has(input)) return;
        const eventType = (input.tagName === 'SELECT' || input.type === 'checkbox') ? 'change' : 'input';
        input.addEventListener(eventType, () => {
            if (input === inputs.url) buttons.test.className = 'comfy-button';
            else if (input === inputs.webuiUrl) buttons.webuiTest.className = 'comfy-button';
            clearTimeout(saveDebounceTimer);
            saveDebounceTimer = setTimeout(() => saveSettings(inputs), 500);
        });
    });
}

export function initSizePresetListeners({
    panel,
    showToast,
}) {
    panel.querySelectorAll('.comfy-size-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('comfyui-gen-width').value = btn.dataset.w;
            document.getElementById('comfyui-gen-height').value = btn.dataset.h;
            document.getElementById('comfyui-gen-width').dispatchEvent(new Event('input', { bubbles: true }));
            document.getElementById('comfyui-gen-height').dispatchEvent(new Event('input', { bubbles: true }));
            showToast('success', `尺寸已设为 ${btn.dataset.w}x${btn.dataset.h}`);
        });
    });
}

export function initSeedListeners() {
    ['comfyui', 'webui'].forEach(prefix => {
        const input = document.getElementById(`${prefix}-seed`);
        input?.addEventListener('input', () => {
            delete input.dataset.autoSeed;
        });

        document.getElementById(`${prefix}-seed-random`)?.addEventListener('click', () => {
            input.value = -1;
            delete input.dataset.locked;
            delete input.dataset.autoSeed;
            document.getElementById(`${prefix}-seed-lock`).innerHTML = '&#x1F513;';
        });
        document.getElementById(`${prefix}-seed-lock`)?.addEventListener('click', () => {
            const lockBtn = document.getElementById(`${prefix}-seed-lock`);
            if (input.dataset.locked) {
                delete input.dataset.locked;
                lockBtn.innerHTML = '&#x1F513;';
            } else {
                input.dataset.locked = 'true';
                lockBtn.innerHTML = '&#x1F512;';
            }
        });
    });
}
