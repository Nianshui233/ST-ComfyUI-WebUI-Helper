import {
    buildAiPromptRetryPrompt,
    buildAiPromptSystemPrompt,
    buildAnthropicThinkingConfig,
} from './ai-prompt-thinking.js';
import { getAiPromptMaxTokens } from './ai-prompt-rules.js';
import {
    extractAnthropicText,
    summarizeAIEmptyResponse,
} from './ai-prompt-output.js';

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

    const systemPrompt = buildAiPromptSystemPrompt(settings.instruction);
    const retryPrompt = buildAiPromptRetryPrompt(settings.instruction, quietPrompt);

    const payload = {
        model: settings.apiModel,
        system: systemPrompt,
        messages: [
            {
                role: 'user',
                content: retry ? retryPrompt : quietPrompt,
            },
        ],
        max_tokens: getAiPromptMaxTokens(settings, deps.defaults),
    };

    Object.assign(payload, buildAnthropicThinkingConfig(settings, deps.defaults));

    const response = await deps.makeRequest({
        method: 'POST',
        url,
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': settings.apiKey,
            'anthropic-version': '2023-06-01',
        },
        data: JSON.stringify(payload),
        timeout: settings.apiTimeout,
    });

    let parsed;
    try {
        parsed = JSON.parse(response.responseText || '{}');
    } catch {
        throw new Error('Anthropic API 返回了无效 JSON');
    }

    const text = extractAnthropicText(parsed).trim();
    return { text, parsed };
}

export async function generateAiPromptWithAnthropic(settings, quietPrompt, deps) {
    const first = await requestAiPromptAnthropic(settings, quietPrompt, {}, deps);
    if (first.text) return first.text;

    const second = await requestAiPromptAnthropic(settings, quietPrompt, { retry: true }, deps);
    if (second.text) return second.text;

    throw new Error(`Anthropic API 没有返回可用文本（${summarizeAIEmptyResponse(second.parsed || first.parsed)}）`);
}
