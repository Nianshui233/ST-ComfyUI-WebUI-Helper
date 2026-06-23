import {
    DEFAULT_SETTINGS,
    EXPORTABLE_STORAGE_KEYS,
} from '../core/runtime-config.js';
import {
    buildSettingsExportPayload,
    extractImportableSettings,
} from './settings-backup.js';

const SETTINGS_TO_LOAD = {
    helperEnabled: ['comfyui_helper_enabled', DEFAULT_SETTINGS.helperEnabled],
    url: ['comfyui_url', DEFAULT_SETTINGS.url],
    webuiUrl: ['webui_url', DEFAULT_SETTINGS.webuiUrl],
    apiImageProvider: ['comfyui_api_image_provider', DEFAULT_SETTINGS.apiImageProvider],
    apiImageUrl: ['comfyui_api_image_url', DEFAULT_SETTINGS.apiImageUrl],
    apiImageEndpoint: ['comfyui_api_image_endpoint', DEFAULT_SETTINGS.apiImageEndpoint],
    apiImageApiKey: ['comfyui_api_image_api_key', DEFAULT_SETTINGS.apiImageApiKey],
    apiImageModel: ['comfyui_api_image_model', DEFAULT_SETTINGS.apiImageModel],
    apiImageQuality: ['comfyui_api_image_quality', DEFAULT_SETTINGS.apiImageQuality],
    apiImageOutputFormat: ['comfyui_api_image_output_format', DEFAULT_SETTINGS.apiImageOutputFormat],
    apiImageSizeMode: ['comfyui_api_image_size_mode', DEFAULT_SETTINGS.apiImageSizeMode],
    apiImageBatchSize: ['comfyui_api_image_batch_size', DEFAULT_SETTINGS.apiImageBatchSize],
    apiImageTimeout: ['comfyui_api_image_timeout', DEFAULT_SETTINGS.apiImageTimeout],
    apiImageSoftTimeoutMs: ['comfyui_api_image_soft_timeout_ms', DEFAULT_SETTINGS.apiImageSoftTimeoutMs],
    apiImageUseSavedKeys: ['comfyui_api_image_use_saved_keys', DEFAULT_SETTINGS.apiImageUseSavedKeys],
    apiImageRetryOnFailure: ['comfyui_api_image_retry_on_failure', DEFAULT_SETTINGS.apiImageRetryOnFailure],
    apiImageMaxKeyAttempts: ['comfyui_api_image_max_key_attempts', DEFAULT_SETTINGS.apiImageMaxKeyAttempts],
    apiImageNegativePrompt: ['comfyui_api_image_negative_prompt', DEFAULT_SETTINGS.apiImageNegativePrompt],
    apiImageCustomHeaders: ['comfyui_api_image_custom_headers', DEFAULT_SETTINGS.apiImageCustomHeaders],
    apiImageCustomBody: ['comfyui_api_image_custom_body', DEFAULT_SETTINGS.apiImageCustomBody],
    apiImageResponsePath: ['comfyui_api_image_response_path', DEFAULT_SETTINGS.apiImageResponsePath],
    workflow: ['comfyui_workflow', DEFAULT_SETTINGS.workflow],
    startTag: ['comfyui_start_tag', DEFAULT_SETTINGS.startTag],
    endTag: ['comfyui_end_tag', DEFAULT_SETTINGS.endTag],
    genWidth: ['comfyui_gen_width', DEFAULT_SETTINGS.genWidth],
    genHeight: ['comfyui_gen_height', DEFAULT_SETTINGS.genHeight],
    displayWidth: ['comfyui_display_width', DEFAULT_SETTINGS.displayWidth],
    displayHeight: ['comfyui_display_height', DEFAULT_SETTINGS.displayHeight],
    autoGen: ['comfyui_auto_generate', DEFAULT_SETTINGS.autoGenerate],
    sampler: ['comfyui_sampler', DEFAULT_SETTINGS.sampler],
    scheduler: ['comfyui_scheduler', DEFAULT_SETTINGS.scheduler],
    steps: ['comfyui_steps', DEFAULT_SETTINGS.steps],
    cfg: ['comfyui_cfg', DEFAULT_SETTINGS.cfg],
    webuiSampler: ['webui_sampler', DEFAULT_SETTINGS.webuiSampler],
    webuiScheduler: ['webui_scheduler', DEFAULT_SETTINGS.webuiScheduler],
    webuiSteps: ['webui_steps', DEFAULT_SETTINGS.steps],
    webuiCfg: ['webui_cfg', DEFAULT_SETTINGS.cfg],
    webuiDenoising: ['webui_denoising', DEFAULT_SETTINGS.denoisingStrength],
    webuiEnableHires: ['webui_enable_hires', DEFAULT_SETTINGS.enableHires],
    webuiHiresUpscaler: ['webui_hires_upscaler', DEFAULT_SETTINGS.hiresUpscaler],
    webuiHiresSteps: ['webui_hires_steps', DEFAULT_SETTINGS.hiresSteps],
    webuiHiresUpscale: ['webui_hires_upscale', DEFAULT_SETTINGS.hiresUpscale],
    webuiHiresDenoising: ['webui_hires_denoising', DEFAULT_SETTINGS.hiresDenoising],
    comfyuiSeed: ['comfyui_seed', DEFAULT_SETTINGS.seed],
    webuiSeed: ['webui_seed', DEFAULT_SETTINGS.seed],
    comfyuiImg2ImgEnable: ['comfyui_img2img_enable', DEFAULT_SETTINGS.img2imgEnable],
    webuiImg2ImgEnable: ['webui_img2img_enable', DEFAULT_SETTINGS.img2imgEnable],
    comfyuiImg2ImgDenoising: ['comfyui_img2img_denoising', DEFAULT_SETTINGS.img2imgDenoising],
    webuiImg2ImgDenoising: ['webui_img2img_denoising', DEFAULT_SETTINGS.img2imgDenoising],
    positivePrompt: ['comfyui_positive_prompt', DEFAULT_SETTINGS.positivePrompt],
    negativePrompt: ['comfyui_negative_prompt', DEFAULT_SETTINGS.negativePrompt],
    enableComparison: ['comfyui_enable_comparison', DEFAULT_SETTINGS.enableComparison],
    hideButtons: ['comfyui_hide_buttons', DEFAULT_SETTINGS.hideButtons],
    loraAutoAppendTriggers: ['comfyui_lora_auto_append_triggers', DEFAULT_SETTINGS.loraAutoAppendTriggers],
    loraStrictInjection: ['comfyui_lora_strict_injection', DEFAULT_SETTINGS.loraStrictInjection],
    loraSaveDebugWorkflow: ['comfyui_lora_save_debug_workflow', DEFAULT_SETTINGS.loraSaveDebugWorkflow],
    loraInjectionMode: ['comfyui_lora_injection_mode', DEFAULT_SETTINGS.loraInjectionMode],
    aiPromptEnabled: ['comfyui_ai_prompt_enabled', DEFAULT_SETTINGS.aiPromptEnabled],
    aiPromptShowButtons: ['comfyui_ai_prompt_show_buttons', DEFAULT_SETTINGS.aiPromptShowButtons],
    aiPromptAuto: ['comfyui_ai_prompt_auto', DEFAULT_SETTINGS.aiPromptAuto],
    aiPromptAutoGenerateImage: ['comfyui_ai_prompt_auto_generate_image', DEFAULT_SETTINGS.aiPromptAutoGenerateImage],
    aiPromptContextMessages: ['comfyui_ai_prompt_context_messages', DEFAULT_SETTINGS.aiPromptContextMessages],
    aiPromptResponseLength: ['comfyui_ai_prompt_response_length', DEFAULT_SETTINGS.aiPromptResponseLength],
    aiPromptInstruction: ['comfyui_ai_prompt_instruction', DEFAULT_SETTINGS.aiPromptInstruction],
    aiPromptProvider: ['comfyui_ai_prompt_provider', DEFAULT_SETTINGS.aiPromptProvider],
    aiPromptApiUrl: ['comfyui_ai_prompt_api_url', DEFAULT_SETTINGS.aiPromptApiUrl],
    aiPromptApiKey: ['comfyui_ai_prompt_api_key', DEFAULT_SETTINGS.aiPromptApiKey],
    aiPromptApiModel: ['comfyui_ai_prompt_api_model', DEFAULT_SETTINGS.aiPromptApiModel],
    aiPromptAutoDetectModels: ['comfyui_ai_prompt_auto_detect_models', DEFAULT_SETTINGS.aiPromptAutoDetectModels],
    aiPromptApiTemperature: ['comfyui_ai_prompt_api_temperature', DEFAULT_SETTINGS.aiPromptApiTemperature],
    aiPromptApiTimeout: ['comfyui_ai_prompt_api_timeout', DEFAULT_SETTINGS.aiPromptApiTimeout],
    aiPromptThinkingMode: ['comfyui_ai_prompt_thinking_mode', DEFAULT_SETTINGS.aiPromptThinkingMode],
    aiPromptThinkingStrategy: ['comfyui_ai_prompt_thinking_strategy', DEFAULT_SETTINGS.aiPromptThinkingStrategy],
    aiPromptThinkingEffort: ['comfyui_ai_prompt_thinking_effort', DEFAULT_SETTINGS.aiPromptThinkingEffort],
    aiPromptThinkingBudget: ['comfyui_ai_prompt_thinking_budget', DEFAULT_SETTINGS.aiPromptThinkingBudget],
};

export function createSettingsController({
    getStoredValues,
    setStoredValues,
    downloadJsonFile,
    getCurrentComfyUISelectedLoras,
    setComfyUISelectedLoras,
    syncImg2ImgEnabledState,
    afterImport,
    showToast,
    logger = console,
}) {
    async function loadSettings(inputs) {
        const settingsEntries = Object.entries(SETTINGS_TO_LOAD);
        const storedValues = await getStoredValues(
            settingsEntries.map(([, [storageKey, defaultValue]]) => [storageKey, defaultValue])
        );

        for (const [inputKey, [storageKey]] of settingsEntries) {
            const value = storedValues[storageKey];
            if (inputs[inputKey]) {
                if (inputs[inputKey].dataset?.settingType === 'boolean-button') {
                    inputs[inputKey].setAttribute('aria-pressed', value ? 'true' : 'false');
                } else if (inputs[inputKey].type === 'checkbox') {
                    inputs[inputKey].checked = value;
                } else {
                    inputs[inputKey].value = value;
                }
            }
        }

        document.getElementById('hires-settings').style.display = inputs.webuiEnableHires.checked ? 'grid' : 'none';
        syncImg2ImgEnabledState?.();
    }

    async function saveSettings(inputs) {
        const settingsToSave = {};
        for (const key in inputs) {
            const input = inputs[key];
            if (!input?.id) continue;
            if (input === inputs.aiPromptApiModelSelect) continue;
            if (input === inputs.aiPromptApiKeySelect) continue;
            if (input === inputs.aiPromptProviderPresetSelect) continue;
            if (input === inputs.apiImageApiKeySelect) continue;

            let value;
            if (input.dataset?.settingType === 'boolean-button') {
                value = input.getAttribute('aria-pressed') === 'true';
            } else if (input.type === 'checkbox') {
                value = input.checked;
            } else if (input.type === 'number') {
                value = parseFloat(input.value) || 0;
            } else {
                value = input.value;
            }

            const storageKey = input.dataset?.storageKey || input.id.replace(/-/g, '_');
            settingsToSave[storageKey] = value;
        }

        if (inputs.modelSelect) settingsToSave.comfyui_model = inputs.modelSelect.value;
        if (inputs.unetSelect) settingsToSave.comfyui_unet_model = inputs.unetSelect.value;
        if (inputs.webuiModelSelect) settingsToSave.webui_model = inputs.webuiModelSelect.value;

        await setStoredValues(Object.entries(settingsToSave));
    }

    async function exportAllSettings() {
        const values = await getStoredValues(EXPORTABLE_STORAGE_KEYS.map(key => [key, undefined]));
        const settings = Object.fromEntries(
            Object.entries(values).filter(([, value]) => value !== undefined)
        );
        settings.comfyui_selected_loras = getCurrentComfyUISelectedLoras();

        downloadJsonFile(
            buildSettingsExportPayload(settings),
            `st_comfyui_webui_helper_settings_${new Date().toISOString().slice(0, 10)}.json`
        );

        showToast('success', '插件配置已导出');
    }

    async function importAllSettings(inputs) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            try {
                const imported = JSON.parse(await file.text());
                const { settings, entries } = extractImportableSettings(imported, EXPORTABLE_STORAGE_KEYS);

                await setStoredValues(entries);
                if (Array.isArray(settings.comfyui_selected_loras)) {
                    setComfyUISelectedLoras(settings.comfyui_selected_loras);
                }

                await afterImport?.({ inputs, settings, entries });
                showToast('success', `插件配置已导入 (${entries.length} 项)`);
            } catch (error) {
                logger.error('[AI Gen] 配置导入失败:', error);
                showToast('error', `配置导入失败: ${error.message}`);
            }
        };
        input.click();
    }

    function initSettingsBackupListeners(buttons, inputs) {
        buttons.exportSettings?.addEventListener('click', exportAllSettings);
        buttons.importSettings?.addEventListener('click', () => importAllSettings(inputs));
    }

    return {
        exportAllSettings,
        importAllSettings,
        initSettingsBackupListeners,
        loadSettings,
        saveSettings,
    };
}
