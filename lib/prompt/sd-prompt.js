class SDPromptParser {
    constructor() {
        this.patterns = {
            lora: /<(lora|lyco):([^:>]+):?([0-9.]*?)>/gi,
            hypernet: /<hypernet:([^:>]+):?([0-9.]*?)>/gi,
            embedding: /\b(embedding:)?([a-zA-Z0-9_-]+)\b/g,
            weight: /(\(+)([^()[\]]+?)(:[\d.]+)?(\)+)|\[([^\[\]]+?)\]/g,
            blend: /\[([^:\[\]]+):([^:\[\]]+):([\d.]+)\]/g,
            alternate: /\[([^|\[\]]+)\|([^|\[\]]+)\]/g,
            special: /\b(BREAK|AND)\b/i,
        };
    }

    parse(prompt) {
        if (!prompt || typeof prompt !== 'string') {
            return { loras: [], hypernets: [], embeddings: [], words: [], specials: [] };
        }

        const result = {
            loras: [],
            hypernets: [],
            embeddings: [],
            words: [],
            specials: [],
            original: prompt.trim(),
        };

        let remaining = prompt;

        remaining = remaining.replace(this.patterns.lora, (match, type, name, weight) => {
            result.loras.push({
                type: type.toLowerCase(),
                name: name.trim(),
                weight: parseFloat(weight) || 1.0,
                raw: match,
            });
            return '';
        });

        remaining = remaining.replace(this.patterns.hypernet, (match, name, weight) => {
            result.hypernets.push({
                name: name.trim(),
                weight: parseFloat(weight) || 1.0,
                raw: match,
            });
            return '';
        });

        const specialMatches = remaining.match(this.patterns.special) || [];
        specialMatches.forEach(s => {
            result.specials.push({ keyword: s, raw: s });
        });

        remaining = remaining
            .replace(/\s*,\s*/g, ',')
            .replace(/,+/g, ',')
            .replace(/^,|,$/g, '');

        if (remaining.trim()) {
            const parts = this.smartSplit(remaining);
            parts.forEach(part => {
                const cleaned = part.trim();
                if (cleaned && !this.patterns.special.test(cleaned)) {
                    result.words.push({
                        text: cleaned,
                        raw: cleaned,
                        hasWeight: /[(\[\])]/.test(cleaned),
                    });
                }
            });
        }

        return result;
    }

    smartSplit(text) {
        const result = [];
        let current = '';
        let depth = 0;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            if (char === '(' || char === '[') {
                depth++;
                current += char;
            } else if (char === ')' || char === ']') {
                depth--;
                current += char;
            } else if (char === ',' && depth === 0) {
                if (current.trim()) {
                    result.push(current.trim());
                }
                current = '';
            } else {
                current += char;
            }
        }

        if (current.trim()) {
            result.push(current.trim());
        }

        return result;
    }
}

const sdPromptParser = new SDPromptParser();

export function fixPromptFormattingOnly(prompt) {
    if (typeof prompt !== 'string' || prompt === '') return '';

    return prompt
        .replace(/[ \t]+,/g, ',')
        .replace(/,([ \t]*,)+/g, ',')
        .replace(/,(?![ \t\r\n,]|$)/g, ', ')
        .replace(/,[ \t]{2,}/g, ', ');
}

export function mergePromptBoundaryPreserveFormat(previous, next) {
    if (!previous || !previous.trim()) return next || '';
    if (!next || !next.trim()) return previous || '';

    const prevTrailingWs = previous.match(/[ \t\r\n]*$/)?.[0] || '';
    const nextLeadingWs = next.match(/^[ \t\r\n]*/)?.[0] || '';

    const prevCore = previous.slice(0, previous.length - prevTrailingWs.length);
    let nextCore = next.slice(nextLeadingWs.length);

    if (!prevCore) return next;
    if (!nextCore) return previous;

    const prevEndsWithComma = prevCore.endsWith(',');
    const nextStartsWithComma = nextCore.startsWith(',');

    if (prevEndsWithComma && nextStartsWithComma) {
        nextCore = nextCore.replace(/^,/, '');
        return previous + nextLeadingWs + nextCore;
    }

    if (prevEndsWithComma || nextStartsWithComma) {
        return previous + next;
    }

    return `${prevCore},${prevTrailingWs}${nextLeadingWs}${nextCore}`;
}

export function smartMergePrompts(...prompts) {
    const validPrompts = prompts.filter(
        p => typeof p === 'string' && p.trim() !== ''
    );

    if (validPrompts.length === 0) return '';

    let result = fixPromptFormattingOnly(validPrompts[0]);

    for (let i = 1; i < validPrompts.length; i++) {
        const next = fixPromptFormattingOnly(validPrompts[i]);
        result = mergePromptBoundaryPreserveFormat(result, next);
    }

    return fixPromptFormattingOnly(result);
}

export function validatePrompt(prompt) {
    const result = {
        valid: true,
        errors: [],
        warnings: [],
    };

    if (!prompt || typeof prompt !== 'string') {
        result.valid = false;
        result.errors.push('提示词为空或格式无效');
        return result;
    }

    const openCount = (prompt.match(/\(/g) || []).length;
    const closeCount = (prompt.match(/\)/g) || []).length;
    if (openCount !== closeCount) {
        result.valid = false;
        result.errors.push(`圆括号不匹配：${openCount} 个 '(' vs ${closeCount} 个 ')'`);
    }

    const openSquare = (prompt.match(/\[/g) || []).length;
    const closeSquare = (prompt.match(/\]/g) || []).length;
    if (openSquare !== closeSquare) {
        result.valid = false;
        result.errors.push(`方括号不匹配：${openSquare} 个 '[' vs ${closeSquare} 个 ']'`);
    }

    const loraMatches = prompt.match(/<(lora|lyco):([^:>]+):?([0-9.]*?)>/gi) || [];
    loraMatches.forEach(match => {
        const parts = match.match(/<(lora|lyco):([^:>]+):?([0-9.]*?)>/i);
        if (parts) {
            const weight = parseFloat(parts[3]);
            if (parts[3] && (Number.isNaN(weight) || weight < 0 || weight > 2)) {
                result.warnings.push(`LoRA权重异常：${match}（建议范围：0-2）`);
            }
        }
    });

    const weightMatches = prompt.match(/\([^)]+:[\d.]+\)/g) || [];
    weightMatches.forEach(match => {
        const weight = parseFloat(match.match(/:([\d.]+)/)?.[1]);
        if (weight && (weight < 0.1 || weight > 2.0)) {
            result.warnings.push(`词权重异常：${match}（建议范围：0.1-2.0）`);
        }
    });

    const approximateTokens = prompt.split(/[,\s]+/).length;
    if (approximateTokens > 75) {
        result.warnings.push(`提示词可能超过75 token限制（约${approximateTokens}个词），建议使用BREAK分割`);
    }

    return result;
}

export function logFinalPrompts(positive, negative, mode) {
    const posValidation = validatePrompt(positive);
    const negValidation = validatePrompt(negative);
    const posParsed = sdPromptParser.parse(positive);
    const negParsed = sdPromptParser.parse(negative);

    console.info(`[AI Gen] ${mode} 最终提示词摘要`, {
        positiveLength: positive.length,
        negativeLength: negative.length,
        positiveWords: posParsed.words.length,
        negativeWords: negParsed.words.length,
        positiveLoras: posParsed.loras.length,
        positiveHypernets: posParsed.hypernets.length,
        positiveSpecials: posParsed.specials.length,
        loras: posParsed.loras.map(l => `${l.name}(${l.weight})`).slice(0, 12),
    });

    if (!posValidation.valid || posValidation.warnings.length > 0) {
        console.warn(`[AI Gen] ${mode} 正向提示词验证问题`, [...posValidation.errors, ...posValidation.warnings]);
    }

    if (!negValidation.valid || negValidation.warnings.length > 0) {
        console.warn(`[AI Gen] ${mode} 负向提示词验证问题`, [...negValidation.errors, ...negValidation.warnings]);
    }
}
