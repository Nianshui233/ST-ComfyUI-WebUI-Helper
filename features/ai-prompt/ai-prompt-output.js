import { decodeHTML } from '../../lib/core/utils.js';

export function extractAnthropicText(payload) {
    const content = Array.isArray(payload?.content) ? payload.content : [];
    return content
        .map(part => {
            if (typeof part === 'string') return part;
            if (part?.type === 'text' && typeof part.text === 'string') return part.text;
            return part?.text || part?.content || part?.value || '';
        })
        .filter(Boolean)
        .join('\n');
}

function extractTextFromContentParts(parts, { includeTypes = ['text'] } = {}) {
    if (!Array.isArray(parts)) return '';
    return parts
        .map(part => {
            if (typeof part === 'string') return includeTypes.includes('text') ? part : '';
            const type = part?.type || '';
            if (includeTypes.length && type && !includeTypes.includes(type)) return '';
            return part?.text || part?.thinking || part?.content || part?.value || part?.summary || '';
        })
        .filter(Boolean)
        .join('\n');
}

export function extractOpenAICompatibleText(payload) {
    const choice = payload?.choices?.[0];
    const content = choice?.message?.content;
    if (Array.isArray(content)) {
        const parts = content
            .map(part => {
                if (typeof part === 'string') return part;
                return part?.text || part?.content || part?.value || '';
            })
            .filter(Boolean);
        if (parts.length) return parts.join('\n');
    }

    if (typeof content === 'string') return content;
    if (typeof choice?.text === 'string') return choice.text;
    if (typeof payload?.output_text === 'string') return payload.output_text;
    if (typeof payload?.response === 'string') return payload.response;

    const output = Array.isArray(payload?.output) ? payload.output : [];
    return output.flatMap(item => Array.isArray(item?.content) ? item.content : [])
        .map(part => part?.text || part?.content || part?.value || '')
        .filter(Boolean)
        .join('\n');
}

export function extractAiPromptReasoning(payload) {
    const choice = payload?.choices?.[0];
    const message = choice?.message || {};
    const direct = [
        message.reasoning,
        message.reasoning_content,
        message.thinking,
        message.thinking_content,
        message.reasoning_text,
        payload?.reasoning,
        payload?.reasoning_content,
        payload?.thinking,
        payload?.thinking_content,
    ].filter(value => typeof value === 'string' && value.trim());
    if (direct.length) return direct.join('\n').trim();

    const messageReasoning = extractTextFromContentParts(message.content, {
        includeTypes: ['reasoning', 'thinking', 'reasoning_text', 'thinking_text'],
    });
    if (messageReasoning) return messageReasoning.trim();

    const anthropicThinking = extractTextFromContentParts(payload?.content, {
        includeTypes: ['thinking', 'redacted_thinking'],
    });
    if (anthropicThinking) return anthropicThinking.trim();

    const responseOutput = Array.isArray(payload?.output) ? payload.output : [];
    const responseReasoning = responseOutput
        .map(item => {
            if (item?.type === 'reasoning') {
                if (typeof item.summary === 'string') return item.summary;
                if (Array.isArray(item.summary)) return item.summary.map(part => part?.text || part?.content || '').filter(Boolean).join('\n');
            }
            return extractTextFromContentParts(item?.content, {
                includeTypes: ['reasoning', 'thinking', 'summary_text'],
            });
        })
        .filter(Boolean)
        .join('\n');

    return responseReasoning.trim();
}

export function summarizeAIEmptyResponse(payload) {
    const choice = payload?.choices?.[0];
    const finishReason = choice?.finish_reason || choice?.finishReason || payload?.finish_reason || '';
    const refusal = choice?.message?.refusal || choice?.message?.content_filter_results || payload?.error?.message || payload?.message || '';
    const parts = [
        finishReason ? `finish_reason=${finishReason}` : '',
        refusal ? `detail=${typeof refusal === 'string' ? refusal : JSON.stringify(refusal).slice(0, 180)}` : '',
    ].filter(Boolean);
    return parts.length ? parts.join('; ') : '返回结构里没有可提取的文本';
}

function stripMarkdownListPrefix(line) {
    return line
        .replace(/^[-*•]\s+/, '')
        .replace(/^\d+[.)、]\s+/, '')
        .trim();
}

export function sanitizeAiPromptOutput(output) {
    let text = decodeHTML(String(output || '')).trim();
    text = text.replace(/^```[\w-]*\s*/i, '').replace(/```\s*$/i, '').trim();

    const imgBlock = text.match(/\[IMG_GEN\]([\s\S]*?)\[\/IMG_GEN\]/i);
    if (imgBlock) {
        text = imgBlock[1].trim();
    }

    text = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line && !/^\[\/?IMG_GEN\]$/i.test(line))
        .map(stripMarkdownListPrefix)
        .join('\n')
        .trim();

    text = text.replace(/^(here is|here's|final prompt|image prompt|drawing prompt)\s*:?\s*/i, '').trim();
    return text;
}
