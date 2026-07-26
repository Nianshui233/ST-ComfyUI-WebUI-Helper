import {
    applyAiPromptThinkingPayload,
    buildAiPromptRetryPrompt,
    buildAiPromptSystemPrompt,
    getAiPromptRequestTemperature,
} from './ai-prompt-thinking.js';
import { getAiPromptMaxTokens } from './ai-prompt-rules.js';
import {
    extractAiPromptReasoning,
    extractOpenAICompatibleText,
    summarizeAIEmptyResponse,
} from './ai-prompt-output.js';
import {
    createAiToolBudget,
    getOpenAIToolDefinitions,
    runAiToolLoop,
} from '../ai-tools/tool-loop.js';

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

function getOpenAICompatibleFinishReason(payload) {
    const choice = payload?.choices?.[0];
    return String(choice?.finish_reason || choice?.finishReason || payload?.finish_reason || '').trim();
}

function decodeOpenAICompatibleResponse(payload) {
    const choice = payload?.choices?.[0];
    const message = choice?.message || {};
    const finishReason = getOpenAICompatibleFinishReason(payload);
    const rawToolCalls = Array.isArray(message.tool_calls) ? message.tool_calls : [];

    if (finishReason === 'length') {
        throw new Error('AI 绘图 API 输出被截断（finish_reason=length）');
    }
    if (finishReason === 'content_filter') {
        throw new Error('AI 绘图 API 拒绝返回内容（finish_reason=content_filter）');
    }
    if (finishReason === 'insufficient_system_resource') {
        throw new Error('AI 绘图 API 推理资源不足（finish_reason=insufficient_system_resource）');
    }
    if (finishReason === 'tool_calls' && !rawToolCalls.length) {
        throw new Error('AI 绘图 API 返回 finish_reason=tool_calls，但没有提供 tool_calls');
    }

    return {
        text: extractOpenAICompatibleText(payload).trim(),
        reasoning: extractAiPromptReasoning(payload).trim(),
        toolCalls: rawToolCalls.map(call => ({
            id: call?.id,
            name: call?.function?.name,
            arguments: call?.function?.arguments,
        })),
        message,
    };
}

function appendOpenAICompatibleToolResults({ messages, decoded, results }) {
    const source = decoded.message || {};
    const assistantMessage = {
        role: 'assistant',
        content: source.content ?? null,
        tool_calls: source.tool_calls,
    };

    for (const field of ['reasoning_content', 'reasoning_details']) {
        if (Object.prototype.hasOwnProperty.call(source, field)) {
            assistantMessage[field] = source[field];
        }
    }

    messages.push(assistantMessage);
    for (const result of results) {
        messages.push({
            role: 'tool',
            tool_call_id: result.id,
            content: result.content,
        });
    }
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

    const retryPrompt = buildAiPromptRetryPrompt(settings.instruction, quietPrompt);

    const headers = { 'Content-Type': 'application/json' };
    if (settings.apiKey) {
        headers.Authorization = `Bearer ${settings.apiKey}`;
    }

    const tools = settings.webSearchEnabled && deps.webSearchTool
        ? [deps.webSearchTool]
        : [];
    const systemPrompt = buildAiPromptSystemPrompt(settings.instruction, {
        webSearchEnabled: tools.length > 0,
    });
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

    if (tools.length) {
        payload.tools = getOpenAIToolDefinitions(tools);
        payload.tool_choice = 'auto';
    }

    return runAiToolLoop({
        messages: payload.messages,
        tools,
        maxCalls: settings.webSearchMaxCalls,
        requestCompletion: async messages => {
            const response = await deps.makeRequest({
                method: 'POST',
                url,
                headers,
                data: JSON.stringify({ ...payload, messages }),
                timeout: settings.apiTimeout,
            });

            try {
                return JSON.parse(response.responseText || '{}');
            } catch {
                throw new Error('AI 绘图 API 返回了无效 JSON');
            }
        },
        decodeResponse: decodeOpenAICompatibleResponse,
        appendToolResults: appendOpenAICompatibleToolResults,
        toolContext: { settings },
        budget: deps.toolBudget,
        logger: deps.logger || console,
    });
}

export async function generateAiPromptWithOpenAICompatible(settings, quietPrompt, deps) {
    const requestDeps = deps.toolBudget
        ? deps
        : {
            ...deps,
            toolBudget: createAiToolBudget({ maxCalls: settings.webSearchMaxCalls }),
        };
    const first = await requestAiPromptOpenAICompatible(settings, quietPrompt, {}, requestDeps);
    if (first.text) {
        return {
            ...first,
            attempts: 1,
            toolCalls: requestDeps.toolBudget.usedCalls,
            toolRounds: requestDeps.toolBudget.usedRounds,
        };
    }

    const second = await requestAiPromptOpenAICompatible(settings, quietPrompt, { retry: true }, requestDeps);
    if (second.text) {
        return {
            ...second,
            reasoning: second.reasoning || first.reasoning,
            attempts: 2,
            toolCalls: requestDeps.toolBudget.usedCalls,
            toolRounds: requestDeps.toolBudget.usedRounds,
        };
    }

    throw new Error(`AI 绘图 API 没有返回可用文本（${summarizeAIEmptyResponse(second.parsed || first.parsed)}）`);
}
