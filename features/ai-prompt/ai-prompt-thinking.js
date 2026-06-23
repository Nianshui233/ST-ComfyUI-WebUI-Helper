import {
    getAiPromptMaxTokens,
    looksLikeDanbooruRule,
} from './ai-prompt-rules.js';

export function resolveAiPromptThinkingStrategy(settings, defaults) {
    const configured = String(settings.thinkingStrategy || defaults.aiPromptThinkingStrategy).trim();
    if (configured !== 'auto') return configured;

    const apiUrl = String(settings.apiUrl || '').toLowerCase();
    const model = String(settings.apiModel || '').toLowerCase();
    if (apiUrl.includes('deepseek') || model.includes('deepseek')) return 'deepseek';
    if (apiUrl.includes('api.openai.com')) return 'openai';
    if (!model.includes('chat-latest') && /(^|[^a-z0-9])(o1|o3|o4)(?:[^a-z0-9]|$)/.test(model)) return 'openai';
    if (!model.includes('chat-latest') && /^gpt-5(?:[.\-_]|$)/.test(model)) return 'openai';
    return '';
}

function normalizeOpenAIThinkingEffort(settings, mode, defaults) {
    const effort = settings.thinkingEffort;
    const model = String(settings.apiModel || '').toLowerCase();
    if (mode === 'disabled') return model.startsWith('gpt-5.1') ? 'none' : 'minimal';
    if (model.includes('gpt-5-pro')) return 'high';
    if (model.startsWith('gpt-5.1') && effort === 'minimal') return 'low';
    if ((effort === 'max' || effort === 'xhigh') && supportsOpenAIXHighReasoning(model)) return 'xhigh';
    if (effort === 'max' || effort === 'xhigh') return 'high';
    return ['minimal', 'low', 'medium', 'high'].includes(effort) ? effort : defaults.aiPromptThinkingEffort;
}

function supportsOpenAIXHighReasoning(model) {
    const source = String(model || '').toLowerCase();
    return source.includes('codex-max') || /^gpt-5\.[2-9]/.test(source) || /^gpt-[6-9]/.test(source);
}

function normalizeAnthropicThinkingEffort(effort, defaults) {
    if (effort === 'max') return 'max';
    if (effort === 'minimal') return 'low';
    return ['low', 'medium', 'high', 'xhigh'].includes(effort) ? effort : defaults.aiPromptThinkingEffort;
}

function normalizeDeepSeekThinkingEffort(effort) {
    return ['xhigh', 'max'].includes(effort) ? 'max' : 'high';
}

function shouldUseAnthropicManualThinkingBudget(model) {
    const source = String(model || '').toLowerCase();
    if (!source) return false;
    if (source.includes('4-6') || source.includes('4.6') || source.includes('4-7') || source.includes('4.7') || source.includes('4-8') || source.includes('4.8')) return false;
    if (source.includes('fable') || source.includes('mythos')) return false;
    return source.includes('claude-3') ||
        source.includes('3-7') ||
        source.includes('3.7') ||
        source.includes('4-5') ||
        source.includes('4.5') ||
        /claude-(?:opus|sonnet|haiku)-4(?:[-.]|$)/.test(source);
}

export function buildAnthropicThinkingConfig(settings, defaults) {
    const mode = String(settings.thinkingMode || defaults.aiPromptThinkingMode);
    if (mode === 'disabled') return { thinking: { type: 'disabled' } };
    if (mode !== 'enabled') return {};

    if (shouldUseAnthropicManualThinkingBudget(settings.apiModel)) {
        const maxTokens = getAiPromptMaxTokens(settings, defaults);
        const budgetTokens = Math.min(maxTokens - 1, Math.min(32000, Math.max(1024, parseInt(settings.thinkingBudget, 10) || defaults.aiPromptThinkingBudget)));
        return {
            thinking: {
                type: 'enabled',
                budget_tokens: budgetTokens,
            },
        };
    }

    return {
        thinking: { type: 'adaptive' },
        output_config: { effort: normalizeAnthropicThinkingEffort(settings.thinkingEffort, defaults) },
    };
}

export function applyAiPromptThinkingPayload(payload, settings, defaults) {
    const mode = String(settings.thinkingMode || defaults.aiPromptThinkingMode);
    if (mode === 'default') return payload;

    const strategy = resolveAiPromptThinkingStrategy(settings, defaults);
    if (!strategy) return payload;

    if (strategy === 'openai') {
        payload.reasoning_effort = normalizeOpenAIThinkingEffort(settings, mode, defaults);
        payload.max_completion_tokens = payload.max_tokens;
        delete payload.max_tokens;
        return payload;
    }

    if (strategy === 'deepseek') {
        payload.thinking = { type: mode === 'enabled' ? 'enabled' : 'disabled' };
        if (mode === 'enabled') {
            payload.reasoning_effort = normalizeDeepSeekThinkingEffort(settings.thinkingEffort);
        }
        return payload;
    }

    if (strategy === 'anthropic') {
        Object.assign(payload, buildAnthropicThinkingConfig(settings, defaults));
        return payload;
    }

    return payload;
}

export function getAiPromptRequestTemperature(settings, defaults) {
    const strategy = resolveAiPromptThinkingStrategy(settings, defaults);
    if (strategy === 'anthropic') return undefined;
    if (settings.thinkingMode !== 'enabled') return settings.apiTemperature;
    if (strategy === 'openai' || strategy === 'deepseek') return undefined;
    return settings.apiTemperature;
}

export function buildAiPromptSystemPrompt(instruction) {
    const isDanbooruRule = looksLikeDanbooruRule(instruction);
    return isDanbooruRule
        ? 'You format final Danbooru tags exactly according to the user rules. Return only the final tag block. Do not explain, refuse, summarize, or convert it to prose.'
        : 'You are an image-prompt formatter. Return only the final prompt text. Do not explain, refuse, summarize, or add markdown.';
}

export function buildAiPromptRetryPrompt(instruction, quietPrompt) {
    const isDanbooruRule = looksLikeDanbooruRule(instruction);
    return isDanbooruRule
        ? `${quietPrompt}\n\n上一次返回没有可用文本。请严格只返回最终 Danbooru 标签块；如果规则要求 [IMG_GEN]，只返回完整 [IMG_GEN] 块。不要解释，不要改写成自然语言。`
        : `${quietPrompt}\n\n上一次返回没有可用文本。请严格只返回最终绘图提示词；如果规则要求 [IMG_GEN]，只返回完整 [IMG_GEN] 块，不要解释。`;
}
