import { createAiPromptProviderPresetManager } from '../ai-prompt/ai-prompt-provider-presets.js';

export function createAiPromptProviderUiController({
    panel,
    buttons,
    inputs,
    getValue,
    setValue,
    saveSettings,
    detectAiPromptModels,
    showToast,
    logger = console,
}) {
    let aiPromptModelDetectTimer = null;

    function scheduleAiPromptModelDetection() {
        clearTimeout(aiPromptModelDetectTimer);
        if (!['openai_compatible', 'anthropic'].includes(inputs.aiPromptProvider?.value)) return;
        if (!inputs.aiPromptAutoDetectModels?.checked) return;
        if (!String(inputs.aiPromptApiUrl?.value || '').trim()) return;
        aiPromptModelDetectTimer = setTimeout(() => {
            saveSettings(inputs)
                .then(() => detectAiPromptModels({ silent: true }))
                .catch(error => {
                    logger.warn('[AI Gen] 自动检测 AI/LLM 模型失败:', error.message || error);
                });
        }, 900);
    }

    function updateAiPromptProviderUI() {
        const useExternal = ['openai_compatible', 'anthropic'].includes(inputs.aiPromptProvider?.value);
        const thinkingEnabled = inputs.aiPromptThinkingMode?.value === 'enabled';
        [
            inputs.aiPromptApiUrl,
            inputs.aiPromptApiKey,
            inputs.aiPromptApiKeySelect,
            inputs.aiPromptProviderPresetSelect,
            inputs.aiPromptApiModel,
            inputs.aiPromptApiModelSelect,
            inputs.aiPromptAutoDetectModels,
            inputs.aiPromptApiTemperature,
            inputs.aiPromptApiTimeout,
            inputs.aiPromptThinkingMode,
            inputs.aiPromptThinkingStrategy,
            inputs.aiPromptThinkingEffort,
            inputs.aiPromptThinkingBudget,
            buttons.aiPromptDetectModels,
            buttons.aiPromptTestApi,
            buttons.aiPromptApiKeyLoad,
            buttons.aiPromptApiKeySave,
            buttons.aiPromptApiKeyDelete,
            buttons.aiPromptProviderPresetLoad,
            buttons.aiPromptProviderPresetSave,
            buttons.aiPromptProviderPresetDelete,
        ].forEach(input => {
            if (input) input.disabled = !useExternal;
        });
        [
            inputs.aiPromptThinkingStrategy,
            inputs.aiPromptThinkingEffort,
            inputs.aiPromptThinkingBudget,
        ].forEach(input => {
            if (input) input.disabled = !useExternal || !thinkingEnabled;
        });
        document.getElementById('comfyui-ai-prompt-api-settings')?.classList.toggle('is-disabled', !useExternal);
        document.getElementById('comfyui-ai-prompt-thinking-advanced')?.toggleAttribute('hidden', !thinkingEnabled);
    }

    function initAiPromptProviderUi() {
        panel.scheduleAiPromptModelDetection = scheduleAiPromptModelDetection;
        panel.updateAiPromptProviderUI = updateAiPromptProviderUI;

        inputs.aiPromptProvider?.addEventListener('change', () => {
            updateAiPromptProviderUI();
            scheduleAiPromptModelDetection();
        });
        inputs.aiPromptThinkingMode?.addEventListener('change', updateAiPromptProviderUI);
        inputs.aiPromptApiModelSelect?.addEventListener('change', () => {
            if (!inputs.aiPromptApiModelSelect.value || !inputs.aiPromptApiModel) return;
            inputs.aiPromptApiModel.value = inputs.aiPromptApiModelSelect.value;
            inputs.aiPromptApiModel.dispatchEvent(new Event('input', { bubbles: true }));
        });
        [inputs.aiPromptApiUrl, inputs.aiPromptApiKey, inputs.aiPromptAutoDetectModels].forEach(input => {
            input?.addEventListener(input?.type === 'checkbox' ? 'change' : 'input', scheduleAiPromptModelDetection);
        });

        createAiPromptProviderPresetManager({
            inputs,
            getValue,
            setValue,
            saveSettings,
            updateProviderUI: updateAiPromptProviderUI,
            scheduleModelDetection: scheduleAiPromptModelDetection,
            showToast,
        }).loadPresets();

        updateAiPromptProviderUI();
    }

    return {
        initAiPromptProviderUi,
        scheduleAiPromptModelDetection,
        updateAiPromptProviderUI,
    };
}
