import { simpleHash } from '../../lib/core/utils.js';

function extractJsonText(text) {
    const raw = String(text || '').trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
    if (raw.startsWith('{') && raw.endsWith('}')) return raw;

    const first = raw.indexOf('{');
    const last = raw.lastIndexOf('}');
    if (first >= 0 && last > first) return raw.slice(first, last + 1);
    return raw;
}

function normalizeString(value) {
    return String(value || '').trim();
}

function normalizePanel(panel, fallbackIndex) {
    const index = Number.parseInt(panel?.index, 10) || fallbackIndex;
    const beat = normalizeString(panel?.beat) || `第 ${index} 格`;
    const prompt = normalizeString(panel?.prompt);
    return {
        id: `panel-${index}-${simpleHash(`${beat}\n${prompt}`).replace(/^comfy-id-/, '')}`,
        index,
        beat,
        prompt,
        negative_prompt: normalizeString(panel?.negative_prompt),
        continuity_note: normalizeString(panel?.continuity_note),
        status: 'idle',
        updated_at: new Date().toISOString(),
    };
}

export function parseStoryboardOutput(rawOutput, { maxPanels = 6 } = {}) {
    let parsed;
    try {
        parsed = JSON.parse(extractJsonText(rawOutput));
    } catch (error) {
        throw new Error(`连环画分镜 JSON 解析失败: ${error.message}`);
    }

    const panels = Array.isArray(parsed?.panels)
        ? parsed.panels.slice(0, maxPanels).map((panel, index) => normalizePanel(panel, index + 1))
        : [];
    const validPanels = panels.filter(panel => panel.prompt);
    if (!validPanels.length) {
        throw new Error('LLM 没有返回可用的分镜提示词');
    }

    return {
        title: normalizeString(parsed?.title) || '连环画分镜',
        continuity: {
            characters: normalizeString(parsed?.continuity?.characters),
            scene: normalizeString(parsed?.continuity?.scene),
            style: normalizeString(parsed?.continuity?.style),
        },
        panels: validPanels.map((panel, index) => ({
            ...panel,
            index: index + 1,
        })),
        raw: String(rawOutput || '').trim(),
        created_at: new Date().toISOString(),
    };
}
