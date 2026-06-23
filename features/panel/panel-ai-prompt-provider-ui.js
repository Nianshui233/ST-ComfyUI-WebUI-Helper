export function createAiPromptProviderUiController({
    panel,
    buttons,
    inputs,
    saveSettings,
    detectAiPromptModels,
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
        [
            inputs.aiPromptApiUrl,
            inputs.aiPromptApiKey,
            inputs.aiPromptApiKeySelect,
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
        ].forEach(input => {
            if (input) input.disabled = !useExternal;
        });
        document.getElementById('comfyui-ai-prompt-api-settings')?.classList.toggle('is-disabled', !useExternal);
    }

    function initAiPromptProviderUi() {
        panel.scheduleAiPromptModelDetection = scheduleAiPromptModelDetection;
        panel.updateAiPromptProviderUI = updateAiPromptProviderUI;

        inputs.aiPromptProvider?.addEventListener('change', () => {
            updateAiPromptProviderUI();
            scheduleAiPromptModelDetection();
        });
        inputs.aiPromptApiModelSelect?.addEventListener('change', () => {
            if (!inputs.aiPromptApiModelSelect.value || !inputs.aiPromptApiModel) return;
            inputs.aiPromptApiModel.value = inputs.aiPromptApiModelSelect.value;
            inputs.aiPromptApiModel.dispatchEvent(new Event('input', { bubbles: true }));
        });
        [inputs.aiPromptApiUrl, inputs.aiPromptApiKey, inputs.aiPromptAutoDetectModels].forEach(input => {
            input?.addEventListener(input?.type === 'checkbox' ? 'change' : 'input', scheduleAiPromptModelDetection);
        });

        updateAiPromptProviderUI();
    }

    return {
        initAiPromptProviderUi,
        scheduleAiPromptModelDetection,
        updateAiPromptProviderUI,
    };
}
