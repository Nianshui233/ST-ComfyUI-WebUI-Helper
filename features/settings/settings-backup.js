export const SETTINGS_EXPORT_VERSION = 1;

export function createExportableStorageKeys(storageKeys) {
    return [
        storageKeys.mode,
        storageKeys.helperEnabled,
        storageKeys.workflows,
        storageKeys.promptPresets,
        storageKeys.aiPromptRulePresets,
        storageKeys.aiPromptProviderPresets,
        storageKeys.comfyLoraPresets,
        'comfyui_url',
        'webui_url',
        'comfyui_api_image_provider',
        'comfyui_api_image_url',
        'comfyui_api_image_endpoint',
        'comfyui_api_image_model',
        'comfyui_api_image_quality',
        'comfyui_api_image_output_format',
        'comfyui_api_image_size_mode',
        'comfyui_api_image_batch_size',
        'comfyui_api_image_timeout',
        'comfyui_api_image_soft_timeout_ms',
        'comfyui_api_image_use_saved_keys',
        'comfyui_api_image_retry_on_failure',
        'comfyui_api_image_max_key_attempts',
        'comfyui_api_image_negative_prompt',
        'comfyui_api_image_custom_headers',
        'comfyui_api_image_custom_body',
        'comfyui_api_image_response_path',
        'comfyui_workflow',
        'comfyui_start_tag',
        'comfyui_end_tag',
        'comfyui_gen_width',
        'comfyui_gen_height',
        'comfyui_display_width',
        'comfyui_display_height',
        'comfyui_auto_generate',
        'comfyui_model',
        'comfyui_unet_model',
        'webui_model',
        'comfyui_sampler',
        'comfyui_scheduler',
        'comfyui_steps',
        'comfyui_cfg',
        'webui_sampler',
        'webui_scheduler',
        'webui_steps',
        'webui_cfg',
        'webui_denoising',
        'webui_enable_hires',
        'webui_hires_upscaler',
        'webui_hires_steps',
        'webui_hires_upscale',
        'webui_hires_denoising',
        'comfyui_seed',
        'webui_seed',
        'comfyui_img2img_enable',
        'webui_img2img_enable',
        'comfyui_img2img_denoising',
        'webui_img2img_denoising',
        'comfyui_positive_prompt',
        'comfyui_negative_prompt',
        'comfyui_enable_comparison',
        'comfyui_hide_buttons',
        'selected_embeddings',
        'comfyui_selected_loras',
        'comfyui_lora_auto_append_triggers',
        'comfyui_lora_strict_injection',
        'comfyui_lora_save_debug_workflow',
        'comfyui_lora_injection_mode',
        'comfyui_ai_prompt_enabled',
        'comfyui_ai_prompt_show_buttons',
        'comfyui_ai_prompt_auto',
        'comfyui_ai_prompt_auto_generate_image',
        'comfyui_ai_prompt_context_messages',
        'comfyui_ai_prompt_response_length',
        'comfyui_ai_prompt_instruction',
        'comfyui_ai_prompt_provider',
        'comfyui_ai_prompt_api_url',
        'comfyui_ai_prompt_api_model',
        'comfyui_ai_prompt_auto_detect_models',
        'comfyui_ai_prompt_api_temperature',
        'comfyui_ai_prompt_api_timeout',
        'comfyui_ai_prompt_thinking_mode',
        'comfyui_ai_prompt_thinking_strategy',
        'comfyui_ai_prompt_thinking_effort',
        'comfyui_ai_prompt_thinking_budget',
        'comfyui_storyboard_enabled',
        'comfyui_panel_position',
    ];
}

export function buildSettingsExportPayload(values) {
    const settings = { ...values };
    delete settings.comfyui_ai_prompt_api_key;
    delete settings.comfyui_ai_prompt_api_keys;
    delete settings.comfyui_api_image_api_key;
    delete settings.comfyui_api_image_api_keys;

    return {
        type: 'ST-ComfyUI-WebUI-Helper settings',
        version: SETTINGS_EXPORT_VERSION,
        exportedAt: new Date().toISOString(),
        settings,
    };
}

export function extractImportableSettings(imported, exportableKeys) {
    const settings = imported?.settings && typeof imported.settings === 'object'
        ? imported.settings
        : imported;

    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
        throw new Error('配置文件格式无效');
    }

    const allowedKeys = new Set(exportableKeys);
    const entries = Object.entries(settings).filter(([key]) => allowedKeys.has(key));
    if (entries.length === 0) {
        throw new Error('没有可导入的配置项');
    }

    return { settings, entries };
}
