import {
    PANEL_ID,
    STORAGE_KEY_AI_PROMPT_RULE_PRESETS,
    STORAGE_KEY_COMFYUI_LORA_PRESETS,
    STORAGE_KEY_PROMPT_PRESETS,
} from '../core/runtime-config.js';
import { createAiPromptApiKeyManager } from '../ai-prompt/ai-api-key-manager.js';

function getPromptPresetDataFromInputs() {
    return {
        positive: document.getElementById('comfyui-positive-prompt')?.value || '',
        negative: document.getElementById('comfyui-negative-prompt')?.value || '',
    };
}

function isPromptPresetEmpty(data) {
    return !String(data?.positive || '').trim() && !String(data?.negative || '').trim();
}

function normalizePromptPresetData(data) {
    return {
        positive: String(data?.positive || ''),
        negative: String(data?.negative || ''),
    };
}

function promptPresetDataEquals(a, b) {
    const left = normalizePromptPresetData(a);
    const right = normalizePromptPresetData(b);
    return left.positive === right.positive && left.negative === right.negative;
}

function getAiPromptRulePresetDataFromInputs() {
    return {
        instruction: document.getElementById('comfyui-ai-prompt-instruction')?.value || '',
    };
}

function normalizeAiPromptRulePresetData(data) {
    return {
        instruction: String(data?.instruction || ''),
    };
}

function isAiPromptRulePresetEmpty(data) {
    return !String(data?.instruction || '').trim();
}

function aiPromptRulePresetDataEquals(a, b) {
    return normalizeAiPromptRulePresetData(a).instruction === normalizeAiPromptRulePresetData(b).instruction;
}

export function createPresetController({
    createStoredPresetManager,
    getValue,
    setValue,
    saveSettings,
    getCurrentComfyUISelectedLoras,
    applyComfyUILoraPreset,
    showToast,
}) {
    const managers = {};

    function initPresetManagers(inputs = {}) {
        managers.prompts = createStoredPresetManager({
            storageKey: STORAGE_KEY_PROMPT_PRESETS,
            selectElementId: 'prompt-preset-select',
            loadButtonId: 'prompt-preset-load',
            saveButtonId: 'prompt-preset-save',
            deleteButtonId: 'prompt-preset-delete',
            modalId: 'prompt-preset-save-modal',
            nameInputId: 'prompt-preset-name-input',
            overwriteWarningId: 'prompt-preset-overwrite-warning',
            saveConfirmButtonId: 'prompt-preset-save-confirm',
            saveCancelButtonId: 'prompt-preset-save-cancel',
            presetType: '提示词',
            getCurrentData: getPromptPresetDataFromInputs,
            canSave: () => !isPromptPresetEmpty(getPromptPresetDataFromInputs()),
            shouldConfirmLoad: (preset) => {
                const current = getPromptPresetDataFromInputs();
                if (isPromptPresetEmpty(current)) return false;
                return !promptPresetDataEquals(current, preset);
            },
            applyPreset: async (preset) => {
                const positivePrompt = document.getElementById('comfyui-positive-prompt');
                const negativePrompt = document.getElementById('comfyui-negative-prompt');
                positivePrompt.value = preset.positive || '';
                negativePrompt.value = preset.negative || '';
                positivePrompt.dispatchEvent(new Event('input', { bubbles: true }));
                negativePrompt.dispatchEvent(new Event('input', { bubbles: true }));
                await saveSettings({
                    positivePrompt,
                    negativePrompt,
                });
            },
        });

        managers.aiPromptRules = createStoredPresetManager({
            storageKey: STORAGE_KEY_AI_PROMPT_RULE_PRESETS,
            selectElementId: 'comfyui-ai-prompt-rule-preset-select',
            loadButtonId: 'comfyui-ai-prompt-rule-preset-load',
            saveButtonId: 'comfyui-ai-prompt-rule-preset-save',
            deleteButtonId: 'comfyui-ai-prompt-rule-preset-delete',
            modalId: 'ai-prompt-rule-preset-save-modal',
            nameInputId: 'ai-prompt-rule-preset-name-input',
            overwriteWarningId: 'ai-prompt-rule-preset-overwrite-warning',
            saveConfirmButtonId: 'ai-prompt-rule-preset-save-confirm',
            saveCancelButtonId: 'ai-prompt-rule-preset-save-cancel',
            presetType: '绘图分析规则',
            getCurrentData: getAiPromptRulePresetDataFromInputs,
            canSave: () => !isAiPromptRulePresetEmpty(getAiPromptRulePresetDataFromInputs()),
            shouldConfirmLoad: (preset) => {
                const current = getAiPromptRulePresetDataFromInputs();
                if (isAiPromptRulePresetEmpty(current)) return false;
                return !aiPromptRulePresetDataEquals(current, preset);
            },
            applyPreset: async (preset) => {
                const aiPromptInstruction = document.getElementById('comfyui-ai-prompt-instruction');
                if (!aiPromptInstruction) return;
                aiPromptInstruction.value = String(preset?.instruction || '');
                aiPromptInstruction.dispatchEvent(new Event('input', { bubbles: true }));
                await saveSettings({ aiPromptInstruction });
            },
        });

        managers.aiPromptApiKeys = createAiPromptApiKeyManager({
            inputs,
            getValue,
            setValue,
            saveSettings,
            scheduleModelDetection: () => document.getElementById(PANEL_ID)?.scheduleAiPromptModelDetection?.(),
            showToast,
        });

        managers.comfyLoras = createStoredPresetManager({
            storageKey: STORAGE_KEY_COMFYUI_LORA_PRESETS,
            selectElementId: 'comfyui-lora-preset-select',
            loadButtonId: 'comfyui-lora-preset-load',
            saveButtonId: 'comfyui-lora-preset-save',
            deleteButtonId: 'comfyui-lora-preset-delete',
            modalId: 'lora-preset-save-modal',
            nameInputId: 'lora-preset-name-input',
            overwriteWarningId: 'lora-preset-overwrite-warning',
            saveConfirmButtonId: 'lora-preset-save-confirm',
            saveCancelButtonId: 'lora-preset-save-cancel',
            presetType: 'ComfyUI LoRA',
            getCurrentData: () => ({ loras: getCurrentComfyUISelectedLoras() }),
            canSave: () => getCurrentComfyUISelectedLoras().length > 0,
            applyPreset: async (preset) => {
                if (preset && preset.loras) {
                    const mode = document.getElementById('comfyui-lora-preset-mode')?.value || 'replace';
                    applyComfyUILoraPreset(preset.loras, mode);
                }
            },
        });
    }

    function getPresetManagers() {
        return managers;
    }

    async function loadAllPresets() {
        await Promise.all(Object.values(managers).map(manager => manager?.loadPresets?.()));
    }

    return {
        getPresetManagers,
        initPresetManagers,
        loadAllPresets,
    };
}
