import {
    STORAGE_KEY_AI_PROMPT_LAST_PROVIDER_PRESET,
    STORAGE_KEY_AI_PROMPT_PROVIDER_PRESETS,
} from '../core/runtime-config.js';

function getProviderLabel(provider) {
    return {
        sillytavern: 'SillyTavern',
        openai_compatible: 'OpenAI 兼容',
        anthropic: 'Anthropic',
    }[provider] || provider || '未知来源';
}

function getCurrentPreset(inputs) {
    return {
        provider: inputs.aiPromptProvider?.value || 'sillytavern',
        apiUrl: String(inputs.aiPromptApiUrl?.value || '').trim(),
        apiModel: String(inputs.aiPromptApiModel?.value || '').trim(),
        modelSelect: String(inputs.aiPromptApiModelSelect?.value || '').trim(),
        autoDetectModels: !!inputs.aiPromptAutoDetectModels?.checked,
        temperature: Number.parseFloat(inputs.aiPromptApiTemperature?.value) || 0,
        timeout: Number.parseInt(inputs.aiPromptApiTimeout?.value, 10) || 0,
        thinkingMode: inputs.aiPromptThinkingMode?.value || 'default',
        thinkingStrategy: inputs.aiPromptThinkingStrategy?.value || 'auto',
        thinkingEffort: inputs.aiPromptThinkingEffort?.value || 'medium',
        thinkingBudget: Number.parseInt(inputs.aiPromptThinkingBudget?.value, 10) || 2048,
        keyPresetName: String(inputs.aiPromptApiKeySelect?.value || '').trim(),
        timestamp: Date.now(),
    };
}

function applyValue(input, value) {
    if (!input) return;
    if (input.type === 'checkbox') {
        input.checked = !!value;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return;
    }
    input.value = value ?? '';
    input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
}

function summarizePreset(name, preset) {
    const provider = getProviderLabel(preset.provider);
    const model = preset.apiModel || preset.modelSelect || '未指定模型';
    const url = preset.apiUrl ? preset.apiUrl.replace(/^https?:\/\//, '') : '本地/默认';
    return `${name} · ${provider} · ${model} · ${url}`;
}

export function createAiPromptProviderPresetManager({
    inputs,
    getValue,
    setValue,
    saveSettings,
    updateProviderUI,
    scheduleModelDetection,
    showToast,
}) {
    const select = document.getElementById('comfyui-ai-prompt-provider-preset-select');
    const loadBtn = document.getElementById('comfyui-ai-prompt-provider-preset-load');
    const saveBtn = document.getElementById('comfyui-ai-prompt-provider-preset-save');
    const deleteBtn = document.getElementById('comfyui-ai-prompt-provider-preset-delete');

    if (!select || !loadBtn || !saveBtn || !deleteBtn) {
        return { loadPresets: async () => {} };
    }

    async function loadPresets(preferredValue = select.value) {
        const presets = await getValue(STORAGE_KEY_AI_PROMPT_PROVIDER_PRESETS, {});
        select.innerHTML = '<option value="">选择已保存的渠道...</option>';
        const names = Object.keys(presets).sort();
        names.forEach(name => {
            const preset = presets[name] || {};
            const option = document.createElement('option');
            option.value = name;
            option.textContent = summarizePreset(name, preset);
            select.appendChild(option);
        });
        const remembered = preferredValue || await getValue(STORAGE_KEY_AI_PROMPT_LAST_PROVIDER_PRESET, '');
        select.value = names.includes(remembered) ? remembered : '';
        await setValue(STORAGE_KEY_AI_PROMPT_LAST_PROVIDER_PRESET, select.value);
    }

    async function savePreset() {
        const preset = getCurrentPreset(inputs);
        const suggestedName = select.value || preset.apiUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '') || getProviderLabel(preset.provider);
        const name = prompt('给这个 LLM 渠道/厂商配置起个名字：', suggestedName);
        if (!name?.trim()) return;

        const presets = await getValue(STORAGE_KEY_AI_PROMPT_PROVIDER_PRESETS, {});
        presets[name.trim()] = preset;
        await setValue(STORAGE_KEY_AI_PROMPT_PROVIDER_PRESETS, presets);
        await loadPresets(name.trim());
        await setValue(STORAGE_KEY_AI_PROMPT_LAST_PROVIDER_PRESET, name.trim());
        showToast('success', `LLM 渠道 "${name.trim()}" 已保存`);
    }

    async function loadSelected() {
        if (!select.value) {
            showToast('warning', '请先选择一个 LLM 渠道预设');
            return;
        }

        await setValue(STORAGE_KEY_AI_PROMPT_LAST_PROVIDER_PRESET, select.value);
        const presets = await getValue(STORAGE_KEY_AI_PROMPT_PROVIDER_PRESETS, {});
        const preset = presets[select.value];
        if (!preset) {
            showToast('error', '选中的 LLM 渠道预设不存在');
            await loadPresets();
            return;
        }

        applyValue(inputs.aiPromptProvider, preset.provider || 'sillytavern');
        applyValue(inputs.aiPromptApiUrl, preset.apiUrl || '');
        applyValue(inputs.aiPromptApiModel, preset.apiModel || preset.modelSelect || '');
        if (inputs.aiPromptApiModelSelect && preset.modelSelect) {
            applyValue(inputs.aiPromptApiModelSelect, preset.modelSelect);
        }
        applyValue(inputs.aiPromptAutoDetectModels, preset.autoDetectModels ?? true);
        applyValue(inputs.aiPromptApiTemperature, preset.temperature ?? 0.4);
        applyValue(inputs.aiPromptApiTimeout, preset.timeout ?? 60000);
        applyValue(inputs.aiPromptThinkingMode, preset.thinkingMode || 'default');
        applyValue(inputs.aiPromptThinkingStrategy, preset.thinkingStrategy || 'auto');
        applyValue(inputs.aiPromptThinkingEffort, preset.thinkingEffort || 'medium');
        applyValue(inputs.aiPromptThinkingBudget, preset.thinkingBudget ?? 2048);
        if (inputs.aiPromptApiKeySelect && preset.keyPresetName) {
            inputs.aiPromptApiKeySelect.value = preset.keyPresetName;
        }

        updateProviderUI?.();
        await saveSettings(inputs);
        scheduleModelDetection?.();
        showToast('success', `已套用 LLM 渠道 "${select.value}"`);
    }

    async function deleteSelected() {
        if (!select.value) {
            showToast('warning', '请先选择一个 LLM 渠道预设');
            return;
        }
        const name = select.value;
        if (!confirm(`确定要删除 LLM 渠道预设 "${name}" 吗？`)) return;

        const presets = await getValue(STORAGE_KEY_AI_PROMPT_PROVIDER_PRESETS, {});
        delete presets[name];
        await setValue(STORAGE_KEY_AI_PROMPT_PROVIDER_PRESETS, presets);
        await setValue(STORAGE_KEY_AI_PROMPT_LAST_PROVIDER_PRESET, '');
        await loadPresets();
        showToast('success', `LLM 渠道 "${name}" 已删除`);
    }

    select.addEventListener('change', () => {
        setValue(STORAGE_KEY_AI_PROMPT_LAST_PROVIDER_PRESET, select.value || '');
    });

    loadBtn.addEventListener('click', loadSelected);
    saveBtn.addEventListener('click', savePreset);
    deleteBtn.addEventListener('click', deleteSelected);

    loadPresets();
    return { loadPresets };
}
