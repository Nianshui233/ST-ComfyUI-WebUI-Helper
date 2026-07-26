import {
    DEFAULT_AI_PROMPT_INSTRUCTION,
    DEFAULT_SETTINGS,
} from '../core/runtime-config.js';
import { normalizeAiPromptOutputCapacity } from './ai-prompt-rules.js';

function normalizeAiPromptProvider(provider) {
    return ['openai_compatible', 'anthropic'].includes(provider) ? provider : 'sillytavern';
}

export function createAiPromptSettingsReader({ getStoredValues }) {
    async function getAiPromptSettings() {
        const stored = await getStoredValues([
            ['comfyui_ai_prompt_enabled', DEFAULT_SETTINGS.aiPromptEnabled],
            ['comfyui_ai_prompt_show_buttons', DEFAULT_SETTINGS.aiPromptShowButtons],
            ['comfyui_ai_prompt_auto', DEFAULT_SETTINGS.aiPromptAuto],
            ['comfyui_ai_prompt_auto_generate_image', DEFAULT_SETTINGS.aiPromptAutoGenerateImage],
            ['comfyui_ai_prompt_context_messages', DEFAULT_SETTINGS.aiPromptContextMessages],
            ['comfyui_ai_prompt_response_length', DEFAULT_SETTINGS.aiPromptResponseLength],
            ['comfyui_ai_prompt_generation_profile', DEFAULT_SETTINGS.aiPromptGenerationProfile],
            ['comfyui_ai_prompt_instruction', DEFAULT_SETTINGS.aiPromptInstruction],
            ['comfyui_ai_prompt_provider', DEFAULT_SETTINGS.aiPromptProvider],
            ['comfyui_ai_prompt_api_url', DEFAULT_SETTINGS.aiPromptApiUrl],
            ['comfyui_ai_prompt_api_key', DEFAULT_SETTINGS.aiPromptApiKey],
            ['comfyui_ai_prompt_api_model', DEFAULT_SETTINGS.aiPromptApiModel],
            ['comfyui_ai_prompt_api_temperature', DEFAULT_SETTINGS.aiPromptApiTemperature],
            ['comfyui_ai_prompt_api_timeout', DEFAULT_SETTINGS.aiPromptApiTimeout],
            ['comfyui_ai_prompt_thinking_mode', DEFAULT_SETTINGS.aiPromptThinkingMode],
            ['comfyui_ai_prompt_thinking_strategy', DEFAULT_SETTINGS.aiPromptThinkingStrategy],
            ['comfyui_ai_prompt_thinking_effort', DEFAULT_SETTINGS.aiPromptThinkingEffort],
            ['comfyui_ai_prompt_thinking_budget', DEFAULT_SETTINGS.aiPromptThinkingBudget],
            ['comfyui_ai_prompt_web_search_enabled', DEFAULT_SETTINGS.aiPromptWebSearchEnabled],
            ['comfyui_ai_prompt_web_search_provider', DEFAULT_SETTINGS.aiPromptWebSearchProvider],
            ['comfyui_ai_prompt_web_search_api_url', DEFAULT_SETTINGS.aiPromptWebSearchApiUrl],
            ['comfyui_ai_prompt_web_search_api_key', DEFAULT_SETTINGS.aiPromptWebSearchApiKey],
            ['comfyui_ai_prompt_web_search_max_results', DEFAULT_SETTINGS.aiPromptWebSearchMaxResults],
            ['comfyui_ai_prompt_web_search_max_calls', DEFAULT_SETTINGS.aiPromptWebSearchMaxCalls],
            ['comfyui_ai_prompt_web_search_timeout', DEFAULT_SETTINGS.aiPromptWebSearchTimeout],
            ['comfyui_storyboard_enabled', DEFAULT_SETTINGS.storyboardEnabled],
        ]);

        const provider = String(stored.comfyui_ai_prompt_provider || DEFAULT_SETTINGS.aiPromptProvider).trim();
        const thinkingMode = String(stored.comfyui_ai_prompt_thinking_mode || DEFAULT_SETTINGS.aiPromptThinkingMode).trim();
        const thinkingStrategy = String(stored.comfyui_ai_prompt_thinking_strategy || DEFAULT_SETTINGS.aiPromptThinkingStrategy).trim();
        const thinkingEffort = String(stored.comfyui_ai_prompt_thinking_effort || DEFAULT_SETTINGS.aiPromptThinkingEffort).trim();
        const webSearchProvider = String(stored.comfyui_ai_prompt_web_search_provider || DEFAULT_SETTINGS.aiPromptWebSearchProvider).trim();
        const generationProfile = String(stored.comfyui_ai_prompt_generation_profile || DEFAULT_SETTINGS.aiPromptGenerationProfile).trim();
        const outputTokenCapacity = normalizeAiPromptOutputCapacity(
            stored.comfyui_ai_prompt_response_length,
            DEFAULT_SETTINGS,
        );

        return {
            enabled: !!stored.comfyui_ai_prompt_enabled,
            showButtons: !!stored.comfyui_ai_prompt_show_buttons,
            auto: !!stored.comfyui_ai_prompt_auto || !!stored.comfyui_ai_prompt_auto_generate_image,
            autoGenerateImage: !!stored.comfyui_ai_prompt_auto_generate_image,
            contextMessages: Math.min(20, Math.max(1, parseInt(stored.comfyui_ai_prompt_context_messages, 10) || DEFAULT_SETTINGS.aiPromptContextMessages)),
            responseLength: outputTokenCapacity,
            outputTokenCapacity,
            generationProfile: ['auto', 'natural_plain', 'illustrious_a1111'].includes(generationProfile)
                ? generationProfile
                : DEFAULT_SETTINGS.aiPromptGenerationProfile,
            instruction: String(stored.comfyui_ai_prompt_instruction || DEFAULT_AI_PROMPT_INSTRUCTION).trim() || DEFAULT_AI_PROMPT_INSTRUCTION,
            provider: normalizeAiPromptProvider(provider),
            apiUrl: String(stored.comfyui_ai_prompt_api_url || '').trim(),
            apiKey: String(stored.comfyui_ai_prompt_api_key || '').trim(),
            apiModel: String(stored.comfyui_ai_prompt_api_model || '').trim(),
            apiTemperature: Math.min(2, Math.max(0, Number.isFinite(Number.parseFloat(stored.comfyui_ai_prompt_api_temperature)) ? Number.parseFloat(stored.comfyui_ai_prompt_api_temperature) : DEFAULT_SETTINGS.aiPromptApiTemperature)),
            apiTimeout: Math.max(1, parseInt(stored.comfyui_ai_prompt_api_timeout, 10) || DEFAULT_SETTINGS.aiPromptApiTimeout),
            thinkingMode: ['enabled', 'disabled', 'default'].includes(thinkingMode) ? thinkingMode : DEFAULT_SETTINGS.aiPromptThinkingMode,
            thinkingStrategy: ['auto', 'openai', 'anthropic', 'deepseek'].includes(thinkingStrategy) ? thinkingStrategy : DEFAULT_SETTINGS.aiPromptThinkingStrategy,
            thinkingEffort: ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'].includes(thinkingEffort) ? thinkingEffort : DEFAULT_SETTINGS.aiPromptThinkingEffort,
            thinkingBudget: Math.min(32000, Math.max(1024, parseInt(stored.comfyui_ai_prompt_thinking_budget, 10) || DEFAULT_SETTINGS.aiPromptThinkingBudget)),
            webSearchEnabled: !!stored.comfyui_ai_prompt_web_search_enabled,
            webSearchProvider: ['tavily', 'searxng'].includes(webSearchProvider) ? webSearchProvider : DEFAULT_SETTINGS.aiPromptWebSearchProvider,
            webSearchApiUrl: String(stored.comfyui_ai_prompt_web_search_api_url || '').trim(),
            webSearchApiKey: String(stored.comfyui_ai_prompt_web_search_api_key || '').trim(),
            webSearchMaxResults: Math.min(10, Math.max(1, parseInt(stored.comfyui_ai_prompt_web_search_max_results, 10) || DEFAULT_SETTINGS.aiPromptWebSearchMaxResults)),
            webSearchMaxCalls: Math.min(8, Math.max(1, parseInt(stored.comfyui_ai_prompt_web_search_max_calls, 10) || DEFAULT_SETTINGS.aiPromptWebSearchMaxCalls)),
            webSearchTimeout: Math.min(120000, Math.max(1000, parseInt(stored.comfyui_ai_prompt_web_search_timeout, 10) || DEFAULT_SETTINGS.aiPromptWebSearchTimeout)),
            storyboardEnabled: !!stored.comfyui_storyboard_enabled,
        };
    }

    return {
        getAiPromptSettings,
    };
}
