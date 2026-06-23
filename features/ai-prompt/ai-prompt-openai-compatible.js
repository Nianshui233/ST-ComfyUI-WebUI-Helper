import {
    applyAiPromptThinkingPayload,
    buildAiPromptRetryPrompt,
    buildAiPromptSystemPrompt,
    getAiPromptRequestTemperature,
} from './ai-prompt-thinking.js';
import { getAiPromptMaxTokens } from './ai-prompt-rules.js';
import {
    extractOpenAICompatibleText,
    summarizeAIEmptyResponse,
} from './ai-prompt-output.js';

function getOpenAICompatibleChatUrl(baseUrl) {
    const trimmed = String(baseUrl || '').trim().replace(/\/+$/, '');
    if (!trimmed) return '';
    return /\/chat\/completions$/i.test(trimmed) ? trimmed : `${trimmed}/chat/completions`;
}

function getOpenAICompatibleModelsUrl(baseUrl) {
    const trimmed = String(baseUrl || '').trim().replace(/\/+$/, '');
    if (!trimmed) return '';
    if (/\/chat\/completions$/i.test(trimmed)) {
        return trimmed.replace(/\/chat\/completions$/i, '/models');
    }
    return /\/models$/i.test(trimmed) ? trimmed : `${trimmed}/models`;
}

function extractOpenAICompatibleModels(payload) {
    const source = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.models)
            ? payload.models
            : Array.isArray(payload)
                ? payload
                : [];

    return source
        .map(item => typeof item === 'string' ? item : (item?.id || item?.name || item?.model))
        .map(name => String(name || '').trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
}

export async function fetchOpenAICompatibleModels({ apiUrl, apiKey, apiTimeout }, { makeRequest, defaults }) {
    const url = getOpenAICompatibleModelsUrl(apiUrl);
    if (!url) throw new Error('请先填写 AI/LLM API Base URL');

    const headers = {};
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    const response = await makeRequest({
        method: 'GET',
        url,
        headers,
        timeout: apiTimeout || defaults.aiPromptApiTimeout,
    });

    let parsed;
    try {
        parsed = JSON.parse(response.responseText || '{}');
    } catch {
        throw new Error('模型列表接口返回了无效 JSON');
    }

    const models = extractOpenAICompatibleModels(parsed);
    if (!models.length) throw new Error('未检测到可用模型');
    return models;
}

async function requestAiPromptOpenAICompatible(settings, quietPrompt, { retry = false } = {}, deps) {
    const url = getOpenAICompatibleChatUrl(settings.apiUrl);
    if (!url) throw new Error('请先填写 AI/LLM API Base URL');
    if (!settings.apiModel) throw new Error('请先选择或填写 AI/LLM 模型');

    const systemPrompt = buildAiPromptSystemPrompt(settings.instruction);
    const retryPrompt = buildAiPromptRetryPrompt(settings.instruction, quietPrompt);

    const headers = { 'Content-Type': 'application/json' };
    if (settings.apiKey) {
        headers.Authorization = `Bearer ${settings.apiKey}`;
    }

    const payload = {
        model: settings.apiModel,
        messages: [
            { role: 'system', content: systemPrompt },
            {
                role: 'user',
                content: retry ? retryPrompt : quietPrompt,
            },
        ],
        max_tokens: getAiPromptMaxTokens(settings, deps.defaults),
    };
    const temperature = getAiPromptRequestTemperature(settings, deps.defaults);
    if (temperature !== undefined) payload.temperature = temperature;
    applyAiPromptThinkingPayload(payload, settings, deps.defaults);

    const response = await deps.makeRequest({
        method: 'POST',
        url,
        headers,
        data: JSON.stringify(payload),
        timeout: settings.apiTimeout,
    });

    let parsed;
    try {
        parsed = JSON.parse(response.responseText || '{}');
    } catch {
        throw new Error('AI 绘图 API 返回了无效 JSON');
    }

    const text = extractOpenAICompatibleText(parsed).trim();
    return { text, parsed };
}

export async function generateAiPromptWithOpenAICompatible(settings, quietPrompt, deps) {
    const first = await requestAiPromptOpenAICompatible(settings, quietPrompt, {}, deps);
    if (first.text) return first.text;

    const second = await requestAiPromptOpenAICompatible(settings, quietPrompt, { retry: true }, deps);
    if (second.text) return second.text;

    throw new Error(`AI 绘图 API 没有返回可用文本（${summarizeAIEmptyResponse(second.parsed || first.parsed)}）`);
}
