import {
    buildAiPromptRetryPrompt,
    buildAiPromptSystemPrompt,
    buildAnthropicThinkingConfig,
} from './ai-prompt-thinking.js';
import { getAiPromptMaxTokens } from './ai-prompt-rules.js';
import {
    extractAiPromptReasoning,
    extractAnthropicText,
    summarizeAIEmptyResponse,
} from './ai-prompt-output.js';
import {
    createAiToolBudget,
    getAnthropicToolDefinitions,
    runAiToolLoop,
} from '../ai-tools/tool-loop.js';

function getAnthropicMessagesUrl(baseUrl) {
    const trimmed = String(baseUrl || '').trim().replace(/\/+$/, '');
    if (!trimmed) return '';
    if (/\/v1\/messages$/i.test(trimmed)) return trimmed;
    return /\/v1$/i.test(trimmed) ? `${trimmed}/messages` : `${trimmed}/v1/messages`;
}

async function requestAiPromptAnthropic(settings, quietPrompt, { retry = false } = {}, deps) {
    const url = getAnthropicMessagesUrl(settings.apiUrl);
    if (!url) throw new Error('请先填写 Anthropic API Base URL');
    if (!settings.apiKey) throw new Error('请先填写 Anthropic API Key');
    if (!settings.apiModel) throw new Error('请先选择或填写 Anthropic 模型');

    const retryPrompt = buildAiPromptRetryPrompt(settings.instruction, quietPrompt);

    const initialMessages = [
        {
            role: 'user',
            content: retry ? retryPrompt : quietPrompt,
        },
    ];
    const tools = settings.webSearchEnabled && deps.webSearchTool
        ? [deps.webSearchTool]
        : [];
    const payload = {
        model: settings.apiModel,
        system: buildAiPromptSystemPrompt(settings.instruction, {
            webSearchEnabled: tools.length > 0,
        }),
        max_tokens: getAiPromptMaxTokens(settings, deps.defaults),
    };
    if (tools.length) {
        payload.tools = getAnthropicToolDefinitions(tools);
    }

    Object.assign(payload, buildAnthropicThinkingConfig(settings, deps.defaults));

    return runAiToolLoop({
        messages: initialMessages,
        tools,
        maxCalls: settings.webSearchMaxCalls,
        toolContext: { settings },
        requestCompletion: async messages => {
            const response = await deps.makeRequest({
                method: 'POST',
                url,
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': settings.apiKey,
                    'anthropic-version': '2023-06-01',
                },
                data: JSON.stringify({ ...payload, messages }),
                timeout: settings.apiTimeout,
            });

            try {
                return JSON.parse(response.responseText || '{}');
            } catch {
                throw new Error('Anthropic API 返回了无效 JSON');
            }
        },
        decodeResponse: parsed => {
            const stopReason = String(parsed?.stop_reason || '').trim();
            const content = Array.isArray(parsed?.content) ? parsed.content : [];
            const toolCalls = content
                .filter(block => block?.type === 'tool_use')
                .map(block => ({
                    id: block.id,
                    name: block.name,
                    arguments: block.input,
                }));

            if (stopReason === 'max_tokens') {
                throw new Error('Anthropic API 输出达到 max_tokens 上限，结果可能被截断；请提高响应长度后重试');
            }
            if (stopReason === 'pause_turn') {
                throw new Error('Anthropic API 返回 pause_turn；当前客户端工具流程无法安全续接服务端工具回合');
            }
            if (stopReason === 'tool_use' && !toolCalls.length) {
                throw new Error('Anthropic API 返回 tool_use，但响应中没有可执行的 tool_use 内容块');
            }
            if (toolCalls.length && stopReason && stopReason !== 'tool_use') {
                throw new Error(`Anthropic API 工具调用状态不一致：stop_reason=${stopReason}`);
            }

            return {
                text: extractAnthropicText(parsed).trim(),
                reasoning: extractAiPromptReasoning(parsed).trim(),
                toolCalls,
                assistantContent: content,
            };
        },
        appendToolResults: ({ messages, decoded, results }) => {
            messages.push({
                role: 'assistant',
                content: decoded.assistantContent,
            });
            messages.push({
                role: 'user',
                content: results.map(result => ({
                    type: 'tool_result',
                    tool_use_id: result.id,
                    content: result.content,
                    ...(result.isError ? { is_error: true } : {}),
                })),
            });
        },
        budget: deps.toolBudget,
        logger: deps.logger || console,
    });
}

export async function generateAiPromptWithAnthropic(settings, quietPrompt, deps) {
    const requestDeps = deps.toolBudget
        ? deps
        : {
            ...deps,
            toolBudget: createAiToolBudget({ maxCalls: settings.webSearchMaxCalls }),
        };
    const first = await requestAiPromptAnthropic(settings, quietPrompt, {}, requestDeps);
    if (first.text) {
        return {
            ...first,
            attempts: 1,
            toolCalls: requestDeps.toolBudget.usedCalls,
            toolRounds: requestDeps.toolBudget.usedRounds,
        };
    }

    const second = await requestAiPromptAnthropic(settings, quietPrompt, { retry: true }, requestDeps);
    if (second.text) {
        return {
            ...second,
            reasoning: second.reasoning || first.reasoning,
            toolCalls: requestDeps.toolBudget.usedCalls,
            toolRounds: requestDeps.toolBudget.usedRounds,
            attempts: 2,
        };
    }

    throw new Error(`Anthropic API 没有返回可用文本（${summarizeAIEmptyResponse(second.parsed || first.parsed)}）`);
}
