import { renderA1111Prompt } from '../../lib/prompt/a1111-prompt-renderer.js';

const GENERATION_PROFILES = Object.freeze({
    natural_plain: Object.freeze({
        id: 'natural_plain',
        dialect: 'natural_language',
        metadata: 'none',
        renderer: 'plain_text',
    }),
    illustrious_a1111: Object.freeze({
        id: 'illustrious_a1111',
        dialect: 'danbooru',
        metadata: 'illustrious',
        renderer: 'a1111',
    }),
});

function declaresDanbooruPrompt(rules) {
    const source = String(rules || '');
    const matches = source.matchAll(/\bDanbooru\b/gi);

    for (const match of matches) {
        const index = match.index ?? 0;
        const prefix = source.slice(Math.max(0, index - 48), index);
        const hasChineseNegation = /(?:禁止|不得|不要|不使用|不用|避免|不是|并非)[^。.!?\n]{0,36}$/.test(prefix) ||
            /非(?:\s*|(?:基于|采用|使用)[^。.!?\n]{0,20})$/.test(prefix);
        const hasEnglishNegation = /(?:\b(?:without|not|never|avoid|forbid)\b|\bdo not\b|\bdon't\b|\bnon(?:[-\s]+))[^.!?\n]{0,36}$/i.test(prefix);
        if (hasChineseNegation || hasEnglishNegation) {
            continue;
        }

        const context = source.slice(Math.max(0, index - 72), index + 96);
        if (
            /(?:你是|使用|采用|输出|生成|编写|you are|use|using|write|generate|output|return)[^。.!?\n]{0,64}\bDanbooru\b/i.test(context) ||
            /\bDanbooru\b[^。.!?\n]{0,64}(?:绘图提示词分析器|内容标签|标签提示词|tag prompt|tags?\s+(?:only|required))/i.test(context)
        ) {
            return true;
        }
    }

    return false;
}

export function inferImagePromptGenerationProfile(instruction) {
    const rules = String(instruction || '');
    if (
        /MODEL_META_PROFILE\s*=\s*illustrious/i.test(rules) ||
        /PARSER_PROFILE\s*=\s*a1111_weighted_raw/i.test(rules) ||
        declaresDanbooruPrompt(rules)
    ) {
        return 'illustrious_a1111';
    }
    return 'natural_plain';
}

export function resolveImagePromptGenerationProfile(settings) {
    const configured = String(settings?.generationProfile || 'auto').trim();
    const profileId = configured === 'auto'
        ? inferImagePromptGenerationProfile(settings?.instruction)
        : configured;
    return GENERATION_PROFILES[profileId] || GENERATION_PROFILES.natural_plain;
}

export function renderImagePrompt(prompt, generationProfile) {
    const normalized = String(prompt || '').replace(/\r\n?/g, '\n').trim();
    if (generationProfile?.renderer !== 'a1111') return normalized;

    return renderA1111Prompt(normalized);
}
